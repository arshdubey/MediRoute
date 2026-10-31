import { describe, it, expect } from 'vitest';
import {
  generateFEFORecommendations,
  validateFEFOTransferSafety,
  calculateExpiryOverviewMetrics,
  analyzeBatchExpiry,
} from '../services/fefoEngine';
import {
  SEED_CLINICS,
  SEED_MEDICINES,
  INITIAL_STOCK_RECORDS,
} from '../data/seedData';
import { StockRecord, TransferRecord } from '../types';

describe('MediRoute Expiry Intelligence - Integration & End-to-End Workflow', () => {
  it('executes the complete FEFO operational workflow: discover, evaluate, confirm, update stock, and block duplicate', () => {
    // 1. Initial State: Discover Pinecrest Insulin expiring in 24 days
    let workingStock: StockRecord[] = [...INITIAL_STOCK_RECORDS];
    let workingTransfers: TransferRecord[] = [];

    const pinecrestInsulin = workingStock.find(
      (s) => s.clinicId === 'c5' && s.medicineId === 'm2'
    )!;
    expect(pinecrestInsulin).toBeDefined();
    expect(pinecrestInsulin.currentStock).toBe(90);
    expect(pinecrestInsulin.minSafetyStock).toBe(20);
    expect(pinecrestInsulin.batchNumber).toBe('INS-2026-EXP-A');

    const metroHopeInsulin = workingStock.find(
      (s) => s.clinicId === 'c1' && s.medicineId === 'm2'
    )!;
    expect(metroHopeInsulin).toBeDefined();
    expect(metroHopeInsulin.currentStock).toBe(45);
    expect(metroHopeInsulin.minSafetyStock).toBe(120);

    // 2. Generate FEFO Recommendations
    const recs = generateFEFORecommendations(
      workingStock,
      SEED_CLINICS,
      SEED_MEDICINES,
      new Date(),
      workingTransfers
    );

    const challengeRec = recs.find(
      (r) => r.donorClinicId === 'c5' && r.recipientClinicId === 'c1' && r.medicineId === 'm2'
    );
    expect(challengeRec).toBeDefined();
    const rec = challengeRec!;

    // Recommended quantity must be exactly 42 units
    expect(rec.recommendedQuantity).toBe(42);
    expect(rec.estimatedWastageUnitsSaved).toBe(42);
    expect(rec.estimatedWastageValueSaved).toBe(42 * 28.50);

    // 3. Safety Check before execution
    const safetyCheck = validateFEFOTransferSafety(
      pinecrestInsulin,
      metroHopeInsulin,
      rec.recommendedQuantity,
      { transitMinutes: rec.estimatedTransitMinutes }
    );
    expect(safetyCheck.isValid).toBe(true);

    // 4. Simulate confirmation and atomic mutation
    const donorBefore = pinecrestInsulin.currentStock;
    const recipientBefore = metroHopeInsulin.currentStock;

    workingStock = workingStock.map((s) => {
      if (s.id === pinecrestInsulin.id) {
        return { ...s, currentStock: s.currentStock - rec.recommendedQuantity };
      }
      if (s.id === metroHopeInsulin.id) {
        return {
          ...s,
          currentStock: s.currentStock + rec.recommendedQuantity,
          lastRestocked: new Date().toISOString().split('T')[0],
        };
      }
      return s;
    });

    const donorAfter = workingStock.find((s) => s.id === pinecrestInsulin.id)!;
    const recipientAfter = workingStock.find((s) => s.id === metroHopeInsulin.id)!;

    // Donor must retain exactly 48 units (90 - 42)
    expect(donorAfter.currentStock).toBe(48);
    // Donor safety reserve must be preserved: 48 >= 20
    expect(donorAfter.currentStock).toBeGreaterThanOrEqual(donorAfter.minSafetyStock);
    expect(donorAfter.currentStock - donorAfter.minSafetyStock).toBe(28);

    // Recipient must be incremented to 87 units (45 + 42)
    expect(recipientAfter.currentStock).toBe(87);

    // 5. Append confirmed transfer to audit ledger
    const transferRecord: TransferRecord = {
      id: `tr-fefo-test-1`,
      recommendationId: rec.id,
      medicineId: rec.medicineId,
      donorClinicId: rec.donorClinicId,
      recipientClinicId: rec.recipientClinicId,
      quantity: rec.recommendedQuantity,
      urgency: rec.urgency,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      notes: `[FEFO Expiry Protection] Dispatched ${rec.recommendedQuantity} units of Batch #${rec.batchNumber}`,
      distanceKm: rec.distanceKm,
      estimatedTransitMinutes: rec.estimatedTransitMinutes,
      isEmergency: false,
      batchNumber: rec.batchNumber,
    };
    workingTransfers.push(transferRecord);

    // 6. Recalculate metrics: confirmed saved units must now reflect the executed transfer
    const updatedMetrics = calculateExpiryOverviewMetrics(
      workingStock,
      SEED_CLINICS,
      SEED_MEDICINES,
      workingTransfers,
      new Date()
    );

    expect(updatedMetrics.confirmedSavedUnits).toBe(42);
    expect(updatedMetrics.confirmedSavedValue).toBe(42 * 28.50);

    // 7. Verify Duplicate Transfer Block: regenerating recommendations marks this corridor as ACCEPTED or omitted
    const subsequentRecs = generateFEFORecommendations(
      workingStock,
      SEED_CLINICS,
      SEED_MEDICINES,
      new Date(),
      workingTransfers
    );

    const dupRec = subsequentRecs.find(
      (r) => r.donorClinicId === 'c5' && r.recipientClinicId === 'c1' && r.medicineId === 'm2'
    );
    // Since donor now has only 48 units and in 24 days burns 48 units, projected unused stock is 0!
    // Therefore, no new duplicate recommendation can be generated for this batch!
    expect(dupRec).toBeUndefined();
  });
});
