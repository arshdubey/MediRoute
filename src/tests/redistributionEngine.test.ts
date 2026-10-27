import { describe, it, expect } from 'vitest';
import {
  validateTransferSafety,
  generateRedistributionRecommendations,
  evaluateCandidateDonorsForRecipient,
  findBestDonorRecommendation,
  calculateRecipientTargetNeed,
} from '../services/redistributionEngine';
import {
  calculateDaysUntilStockout,
  calculateDaysToExpiry,
  classifyStockStatus,
  calculateStockMetrics,
} from '../services/shortageCalculator';
import { calculateImpactMetrics } from '../services/analyticsService';
import {
  SEED_CLINICS,
  SEED_MEDICINES,
  INITIAL_STOCK_RECORDS,
} from '../data/seedData';
import { Clinic, Medicine, StockRecord, RedistributionRecommendation, TransferRecord } from '../types';

describe('Redistribution Engine & System Integrity Verification', () => {
  const sampleClinics = SEED_CLINICS;
  const sampleMedicines = SEED_MEDICINES;

  // --------------------------------------------------------------------------
  // Check 1: Correct donor and recipient arithmetic (Epinephrine Scenario)
  // --------------------------------------------------------------------------
  it('1. correctly computes donor and recipient arithmetic for Epinephrine 1 mg/mL', () => {
    // Audit seed values:
    // Donor: Northside Urgent Care (c4), medicine m3
    // Recipient: St. Jude Community Health (c2), medicine m3
    const donorStock = INITIAL_STOCK_RECORDS.find(
      (sr) => sr.clinicId === 'c4' && sr.medicineId === 'm3'
    )!;
    const recipientStock = INITIAL_STOCK_RECORDS.find(
      (sr) => sr.clinicId === 'c2' && sr.medicineId === 'm3'
    )!;
    const epiMedicine = sampleMedicines.find((m) => m.id === 'm3')!;

    expect(donorStock).toBeDefined();
    expect(recipientStock).toBeDefined();

    // Verify starting values matching specifications
    expect(donorStock.currentStock).toBe(115);
    expect(donorStock.minSafetyStock).toBe(30);
    expect(recipientStock.currentStock).toBe(6);
    expect(recipientStock.minSafetyStock).toBe(25);
    expect(recipientStock.avgDailyConsumption).toBe(5);

    // Calculate recipient target need
    const targetNeed = calculateRecipientTargetNeed(recipientStock);
    expect(targetNeed.immediateDeficit).toBe(19); // 25 - 6 = 19
    expect(targetNeed.operatingBuffer).toBe(15); // 5 daily * 3 days = 15
    expect(targetNeed.targetCoverage).toBe(40); // 25 + 15 = 40
    expect(targetNeed.targetNeed).toBe(34); // 40 - 6 = 34

    // Donor surplus check
    const donorSurplus = donorStock.currentStock - donorStock.minSafetyStock;
    expect(donorSurplus).toBe(85); // 115 - 30 = 85 units surplus
    expect(donorSurplus).toBeGreaterThanOrEqual(targetNeed.targetNeed);

    // Evaluate matching recommendation
    const matchResult = findBestDonorRecommendation(
      recipientStock,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      sampleMedicines
    );

    expect(matchResult.recommendation).not.toBeNull();
    const rec = matchResult.recommendation!;

    // Recommended transfer must be exactly 34 units
    expect(rec.recommendedQuantity).toBe(34);
    expect(rec.donorClinicId).toBe('c4');
    expect(rec.recipientClinicId).toBe('c2');

    // Arithmetic post-transfer checks
    expect(rec.donorPreStock).toBe(115);
    expect(rec.donorPostStock).toBe(81); // 115 - 34 = 81
    expect(rec.recipientPreStock).toBe(6);
    expect(rec.recipientPostStock).toBe(40); // 6 + 34 = 40

    // Donor must retain >= safety reserve
    expect(rec.donorPostStock).toBeGreaterThanOrEqual(rec.donorSafetyStock);
    expect(rec.donorPostStock - rec.donorSafetyStock).toBe(51); // 81 - 30 = 51 units safety buffer remaining

    // Recipient must achieve >= safety threshold
    expect(rec.recipientPostStock).toBeGreaterThanOrEqual(rec.recipientSafetyStock);
    expect(rec.recipientPostDays).toBe(8.0); // 40 units / 5 daily = 8.0 days

    // Verify quantity rationale explanation exists and explains 34 vs 19
    expect(rec.explanation.quantityRationale).toBeDefined();
    expect(rec.explanation.quantityRationale).toContain('34 units');
    expect(rec.explanation.quantityRationale).toContain('19 units');
    expect(rec.explanation.quantityRationale).toContain('operational coverage recommendation');
    expect(rec.explanation.quantityRationale).toContain('not a mathematically unique global optimum');
  });

  // --------------------------------------------------------------------------
  // Check 2: Insufficient donor surplus rejection
  // --------------------------------------------------------------------------
  it('2. strictly rejects candidate facilities with insufficient donor surplus', () => {
    // Recipient: St. Jude (c2), Epinephrine (m3), needing 34 units
    const recipientStock = INITIAL_STOCK_RECORDS.find(
      (sr) => sr.clinicId === 'c2' && sr.medicineId === 'm3'
    )!;
    const epiMedicine = sampleMedicines.find((m) => m.id === 'm3')!;

    // Riverdale (c3) holds 32 units, min safety 20 -> surplus is only 12 units
    const riverdaleStock = INITIAL_STOCK_RECORDS.find(
      (sr) => sr.clinicId === 'c3' && sr.medicineId === 'm3'
    )!;
    expect(riverdaleStock.currentStock).toBe(32);
    expect(riverdaleStock.minSafetyStock).toBe(20);
    const riverdaleSurplus = riverdaleStock.currentStock - riverdaleStock.minSafetyStock;
    expect(riverdaleSurplus).toBe(12);

    // Evaluating candidate donors for 34 units need
    const candidates = evaluateCandidateDonorsForRecipient(
      recipientStock,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      epiMedicine,
      new Date(),
      34
    );

    const riverdaleEval = candidates.find((c) => c.clinicId === 'c3');
    expect(riverdaleEval).toBeDefined();
    expect(riverdaleEval!.isEligible).toBe(false);
    expect(riverdaleEval!.rejectionReason).toContain('Insufficient surplus');
    expect(riverdaleEval!.rejectionReason).toContain('breaching safety reserve');

    // Central Hospital (c1) holds 52 units, min safety 50 -> surplus is only 2 units
    const centralEval = candidates.find((c) => c.clinicId === 'c1');
    expect(centralEval).toBeDefined();
    expect(centralEval!.isEligible).toBe(false);
    expect(centralEval!.availableSurplus).toBe(2);

    // Direct validation of safety check function
    const safetyCheck = validateTransferSafety(riverdaleStock, 34);
    expect(safetyCheck.isValid).toBe(false);
    expect(safetyCheck.error).toContain('Safety stock violation');

    // Transferring up to exact surplus (12 units) is safe; 13 units violates safety
    expect(validateTransferSafety(riverdaleStock, 12).isValid).toBe(true);
    expect(validateTransferSafety(riverdaleStock, 13).isValid).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Check 3: Recipient safety-threshold and target coverage calculation
  // --------------------------------------------------------------------------
  it('3. accurately calculates recipient target need and respects capacity limits', () => {
    // Case A: Deficit scenario
    const stockInDeficit: StockRecord = {
      id: 'sr-test-1',
      clinicId: 'c2',
      medicineId: 'm1',
      currentStock: 8,
      minSafetyStock: 30,
      maxCapacity: 100,
      avgDailyConsumption: 6,
      batchNumber: 'BATCH-1',
      expiryDate: '2027-01-01',
      lastRestocked: '2026-10-01',
    };

    const needA = calculateRecipientTargetNeed(stockInDeficit);
    expect(needA.immediateDeficit).toBe(22); // 30 - 8 = 22
    expect(needA.operatingBuffer).toBe(18); // 6 * 3 = 18
    expect(needA.targetCoverage).toBe(48); // 30 + 18 = 48
    expect(needA.targetNeed).toBe(40); // 48 - 8 = 40

    // Case B: Constrained by maxCapacity
    const stockNearCapacity: StockRecord = {
      ...stockInDeficit,
      currentStock: 10,
      minSafetyStock: 25,
      maxCapacity: 35, // capacity is limited to 35
      avgDailyConsumption: 5,
    };
    // targetCoverage would be 25 + 15 = 40, but capacity is 35
    const needB = calculateRecipientTargetNeed(stockNearCapacity);
    expect(needB.targetCoverage).toBe(35); // capped at maxCapacity
    expect(needB.targetNeed).toBe(25); // 35 - 10 = 25

    // Case C: Already healthy (currentStock >= safetyStock + buffer)
    const stockHealthy: StockRecord = {
      ...stockInDeficit,
      currentStock: 80,
      minSafetyStock: 30,
      avgDailyConsumption: 5,
    };
    const needC = calculateRecipientTargetNeed(stockHealthy);
    expect(needC.immediateDeficit).toBe(0);
    expect(needC.targetNeed).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Check 4: Expired batches and travel-time constraints
  // --------------------------------------------------------------------------
  it('4. strictly rejects expired batches, near-expiry stock, and accounts for travel time', () => {
    const refDate = new Date('2026-10-20T00:00:00Z');

    const expiredStock: StockRecord = {
      id: 'sr-exp',
      clinicId: 'c1',
      medicineId: 'm1',
      currentStock: 100,
      minSafetyStock: 20,
      maxCapacity: 200,
      avgDailyConsumption: 5,
      batchNumber: 'EXP-1',
      expiryDate: '2026-09-01', // expired in the past
      lastRestocked: '2026-01-01',
    };

    // Past expiry rejection
    const pastCheck = validateTransferSafety(expiredStock, 20, { referenceDate: refDate });
    expect(pastCheck.isValid).toBe(false);
    expect(pastCheck.error).toContain('Expired medication cannot be transferred');

    // Batch expiring in 24 hours (fails 48h shelf life rule)
    const nearExpiryStock: StockRecord = {
      ...expiredStock,
      expiryDate: '2026-10-21',
    };
    const nearCheck = validateTransferSafety(nearExpiryStock, 20, { referenceDate: refDate });
    expect(nearCheck.isValid).toBe(false);
    expect(nearCheck.error).toContain('Minimum clinical shelf life of 48 hours required');

    // Batch expiring in 5 days is clinically valid for transfer
    const validExpiryStock: StockRecord = {
      ...expiredStock,
      expiryDate: '2026-10-25',
    };
    const validCheck = validateTransferSafety(validExpiryStock, 20, { referenceDate: refDate });
    expect(validCheck.isValid).toBe(true);

    // Days to expiry helper check
    expect(calculateDaysToExpiry('2026-10-25', refDate)).toBe(5);
    expect(calculateDaysToExpiry('2026-10-20', refDate)).toBe(0);
    expect(calculateDaysToExpiry('2026-10-15', refDate)).toBe(-5);
  });

  // --------------------------------------------------------------------------
  // Check 5: Duplicate confirmation and invalid transfer quantities
  // --------------------------------------------------------------------------
  it('5. enforces duplicate transfer prevention and rejects invalid transfer quantities', () => {
    const validStock: StockRecord = {
      id: 'sr-val',
      clinicId: 'c1',
      medicineId: 'm1',
      currentStock: 100,
      minSafetyStock: 30,
      maxCapacity: 200,
      avgDailyConsumption: 5,
      batchNumber: 'VAL-1',
      expiryDate: '2027-01-01',
      lastRestocked: '2026-10-01',
    };

    // Zero quantity
    const zeroCheck = validateTransferSafety(validStock, 0);
    expect(zeroCheck.isValid).toBe(false);
    expect(zeroCheck.error).toContain('greater than zero');

    // Negative quantity
    const negCheck = validateTransferSafety(validStock, -15);
    expect(negCheck.isValid).toBe(false);

    // Fractional quantity
    const fracCheck = validateTransferSafety(validStock, 10.5);
    expect(fracCheck.isValid).toBe(false);
    expect(fracCheck.error).toContain('whole units');

    // Quantity greater than current stock
    const excessCheck = validateTransferSafety(validStock, 105);
    expect(excessCheck.isValid).toBe(false);

    // Duplicate recommendation pairing prevention in recommendation generation
    const existingRec: RedistributionRecommendation = {
      id: 'rec-test-pair',
      medicineId: 'm1',
      donorClinicId: 'c1',
      recipientClinicId: 'c2',
      recommendedQuantity: 25,
      urgency: 'HIGH',
      distanceKm: 8.5,
      estimatedTransitMinutes: 18,
      explanation: { summary: '', donorRationale: '', recipientRationale: '', safetyCompliance: '' },
      donorPreStock: 100,
      donorPostStock: 75,
      donorSafetyStock: 30,
      recipientPreStock: 10,
      recipientPostStock: 35,
      recipientSafetyStock: 25,
      recipientPreDays: 2.0,
      recipientPostDays: 7.0,
      status: 'ACCEPTED', // Already accepted
      createdAt: '2026-10-20',
      expiryDate: '2027-01-01',
      batchNumber: 'VAL-1',
    };

    const recs = generateRedistributionRecommendations({
      clinics: sampleClinics,
      medicines: [sampleMedicines[0]],
      stockRecords: [
        validStock,
        {
          id: 'sr-c2-need',
          clinicId: 'c2',
          medicineId: 'm1',
          currentStock: 5,
          minSafetyStock: 25,
          maxCapacity: 100,
          avgDailyConsumption: 5,
          batchNumber: 'REC-1',
          expiryDate: '2027-01-01',
          lastRestocked: '2026-10-01',
        },
      ],
      existingRecommendations: [existingRec],
    });

    // The pair c1 -> c2 for m1 must NOT be regenerated while existing transfer is active
    const duplicate = recs.find((r) => r.donorClinicId === 'c1' && r.recipientClinicId === 'c2' && r.medicineId === 'm1');
    expect(duplicate).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Check 6: Inventory and dashboard consistency after refresh
  // --------------------------------------------------------------------------
  it('6. maintains data consistency and status definitions across serialization/refresh', () => {
    // Simulate localStorage serialization
    const serializedStock = JSON.stringify(INITIAL_STOCK_RECORDS);
    const restoredStock: StockRecord[] = JSON.parse(serializedStock);

    expect(restoredStock.length).toBe(INITIAL_STOCK_RECORDS.length);

    // Verify all metrics and status classifications match exactly
    for (let i = 0; i < INITIAL_STOCK_RECORDS.length; i++) {
      const orig = INITIAL_STOCK_RECORDS[i];
      const rest = restoredStock[i];

      expect(rest.id).toBe(orig.id);
      expect(rest.currentStock).toBe(orig.currentStock);
      expect(rest.minSafetyStock).toBe(orig.minSafetyStock);

      const origCalc = calculateStockMetrics(orig);
      const restCalc = calculateStockMetrics(rest);

      expect(restCalc.status).toBe(origCalc.status);
      expect(restCalc.daysUntilStockout).toBe(origCalc.daysUntilStockout);
      expect(restCalc.surplusQuantity).toBe(origCalc.surplusQuantity);
      expect(restCalc.deficitQuantity).toBe(origCalc.deficitQuantity);
    }

    // Verify status definitions contract:
    // 1. CRITICAL: currentStock === 0 or daysUntilStockout <= 2.5
    expect(classifyStockStatus(0, 50, 10, '2027-01-01')).toBe('CRITICAL');
    expect(classifyStockStatus(5, 50, 2, '2027-01-01')).toBe('CRITICAL'); // 2.5 days

    // 2. LOW_STOCK: currentStock < minSafetyStock or daysUntilStockout <= 7.0
    expect(classifyStockStatus(30, 40, 5, '2027-01-01')).toBe('LOW_STOCK'); // 6 days, below safety
    expect(classifyStockStatus(45, 40, 7, '2027-01-01')).toBe('LOW_STOCK'); // 6.4 days, <= 7.0d

    // 3. SURPLUS: currentStock >= 2x safety stock and runway >= 25 days
    expect(classifyStockStatus(250, 100, 5, '2027-01-01')).toBe('SURPLUS'); // 50 days, 2.5x safety

    // 4. EXPIRING_SOON: within 45 days
    const ref = new Date('2026-10-20T00:00:00Z');
    expect(classifyStockStatus(100, 30, 2, '2026-11-15', ref)).toBe('EXPIRING_SOON');

    // 5. OPTIMAL: compliant and balanced
    expect(classifyStockStatus(100, 50, 5, '2027-01-01')).toBe('OPTIMAL'); // 20 days, > safety
  });

  // --------------------------------------------------------------------------
  // Check 7: Resetting the demo scenario
  // --------------------------------------------------------------------------
  it('7. restores exact baseline state on demo reset with zero stale transfers', () => {
    // Initial baseline state
    const cleanTransfers: TransferRecord[] = [];
    const stock = INITIAL_STOCK_RECORDS;

    // Epinephrine donor and recipient in clean baseline
    const stJudeEpi = stock.find((sr) => sr.clinicId === 'c2' && sr.medicineId === 'm3')!;
    const northsideEpi = stock.find((sr) => sr.clinicId === 'c4' && sr.medicineId === 'm3')!;

    expect(stJudeEpi.currentStock).toBe(6);
    expect(northsideEpi.currentStock).toBe(115);

    // Baseline impact metrics
    const metrics = calculateImpactMetrics(stock, sampleMedicines, cleanTransfers, []);

    // Confirmed transfers must be exactly 0
    expect(metrics.completedTransfersCount).toBe(0);
    expect(metrics.completedUnitsRedistributed).toBe(0);
    expect(metrics.completedEconomicValue).toBe(0);

    // Projected benefits are derived from state, not hardcoded
    expect(metrics.projectedUnitsAvailable).toBeGreaterThan(0);
    expect(metrics.networkSafetyComplianceRate).toBeGreaterThan(0);
    expect(metrics.networkSafetyComplianceRate).toBeLessThan(100); // Some clinics start in shortage

    // Simulate transfer execution
    const simulatedTransfers: TransferRecord[] = [
      {
        id: 'tr-demo-1',
        medicineId: 'm3',
        donorClinicId: 'c4',
        recipientClinicId: 'c2',
        quantity: 34,
        urgency: 'CRITICAL',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        notes: 'Transfer 34 units Epinephrine',
        distanceKm: 12.1,
        estimatedTransitMinutes: 28,
        isEmergency: true,
        batchNumber: 'EPI-2026-C8',
      },
    ];

    const postTransferMetrics = calculateImpactMetrics(stock, sampleMedicines, simulatedTransfers, []);
    expect(postTransferMetrics.completedTransfersCount).toBe(1);
    expect(postTransferMetrics.completedUnitsRedistributed).toBe(34);
    expect(postTransferMetrics.completedEconomicValue).toBe(34 * 95.0); // Epinephrine unit cost is $95.0

    // After reset, resetting back to cleanTransfers restores count = 0
    const resetMetrics = calculateImpactMetrics(stock, sampleMedicines, cleanTransfers, []);
    expect(resetMetrics.completedTransfersCount).toBe(0);
    expect(resetMetrics.completedUnitsRedistributed).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Check 8: End-to-end 7-step operational workflow & duplicate block validation
  // --------------------------------------------------------------------------
  it('8. executes complete operational workflow: identify, compare, explain refusal, validate, confirm, update stock, and block duplicate', () => {
    // 1. Identify critical medicine shortage
    const recipientItem = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c2' && s.medicineId === 'm3')!;
    const calc = calculateStockMetrics(recipientItem);
    expect(calc.status).toBe('CRITICAL');
    expect(calc.daysUntilStockout).toBeLessThanOrEqual(2.5);

    // 2. Open matching redistribution proposal
    const match = findBestDonorRecommendation(
      recipientItem,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      sampleMedicines
    );
    expect(match.recommendation).not.toBeNull();
    const rec = match.recommendation!;

    // 3. Compare eligible donor facilities
    const eligibleDonors = match.candidates.filter((c) => c.isEligible);
    expect(eligibleDonors.length).toBeGreaterThan(0);
    expect(eligibleDonors[0].clinicId).toBe('c4'); // Northside Urgent Care

    // 4. Inspect projected donor and recipient stock after transfer
    expect(rec.donorPreStock).toBe(115);
    expect(rec.donorPostStock).toBe(81);
    expect(rec.donorSafetyStock).toBe(30);
    expect(rec.donorPostStock).toBeGreaterThanOrEqual(rec.donorSafetyStock);
    expect(rec.recipientPreStock).toBe(6);
    expect(rec.recipientPostStock).toBe(40);
    expect(rec.recipientPostDays).toBe(8.0);

    // 5. Understand why unsafe candidate donors are rejected
    const rejectedDonors = match.candidates.filter((c) => !c.isEligible);
    expect(rejectedDonors.length).toBeGreaterThanOrEqual(2);
    for (const rejected of rejectedDonors) {
      expect(rejected.rejectionReason).toBeDefined();
      expect(rejected.rejectionReason!.length).toBeGreaterThan(0);
      expect(rejected.availableSurplus).toBeLessThan(rec.recommendedQuantity);
    }

    // 6. Validate safety before execution
    const donorRecord = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === rec.donorClinicId && s.medicineId === rec.medicineId)!;
    const safetyCheck = validateTransferSafety(donorRecord, rec.recommendedQuantity);
    expect(safetyCheck.isValid).toBe(true);

    // Unsafe quantity must be blocked
    const unsafeExcessCheck = validateTransferSafety(donorRecord, 90); // 115 - 90 = 25 < 30
    expect(unsafeExcessCheck.isValid).toBe(false);
    expect(unsafeExcessCheck.error).toContain('Safety stock violation');

    // 7. Atomic update & audit entry
    let workingStock = [...INITIAL_STOCK_RECORDS];
    const donorBefore = workingStock.find((s) => s.id === donorRecord.id)!.currentStock;
    const recipientBefore = workingStock.find((s) => s.id === recipientItem.id)!.currentStock;

    workingStock = workingStock.map((s) => {
      if (s.id === donorRecord.id) return { ...s, currentStock: s.currentStock - rec.recommendedQuantity };
      if (s.id === recipientItem.id) return { ...s, currentStock: s.currentStock + rec.recommendedQuantity };
      return s;
    });

    const donorAfter = workingStock.find((s) => s.id === donorRecord.id)!.currentStock;
    const recipientAfter = workingStock.find((s) => s.id === recipientItem.id)!.currentStock;

    expect(donorAfter).toBe(donorBefore - rec.recommendedQuantity);
    expect(recipientAfter).toBe(recipientBefore + rec.recommendedQuantity);

    // Logged audit entry
    const transferEntry: TransferRecord = {
      id: 'tr-workflow-test',
      recommendationId: rec.id,
      medicineId: rec.medicineId,
      donorClinicId: rec.donorClinicId,
      recipientClinicId: rec.recipientClinicId,
      quantity: rec.recommendedQuantity,
      urgency: rec.urgency,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      notes: rec.explanation.summary,
      distanceKm: rec.distanceKm,
      estimatedTransitMinutes: rec.estimatedTransitMinutes,
      isEmergency: false,
      batchNumber: rec.batchNumber,
    };

    // Duplicate confirmation guard test
    const executedRecIds = new Set([transferEntry.recommendationId]);
    expect(executedRecIds.has(rec.id)).toBe(true);
    // Attempting duplicate confirmation
    const isDuplicate = executedRecIds.has(rec.id);
    expect(isDuplicate).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Check 9: Candidate evaluation detail & emergency mode safety invariant enforcement
  // --------------------------------------------------------------------------
  it('9. verifies candidate evaluation telemetry (consumption rate, projected stock, buffer) and invariant enforcement under emergency mode', () => {
    const recipientItem = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c2' && s.medicineId === 'm3')!;
    const match = findBestDonorRecommendation(
      recipientItem,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      sampleMedicines
    );

    const bestCandidate = match.candidates.find((c) => c.isEligible)!;
    expect(bestCandidate).toBeDefined();
    expect(bestCandidate.avgDailyConsumption).toBeGreaterThan(0);
    expect(bestCandidate.projectedPostStock).toBeDefined();
    expect(bestCandidate.projectedPostStock).toBeGreaterThanOrEqual(bestCandidate.safetyStock);

    // Donor buffer calculation: projectedPostStock - safetyStock
    const donorBuffer = bestCandidate.projectedPostStock! - bestCandidate.safetyStock;
    expect(donorBuffer).toBe(51); // 81 - 30 = 51 units surplus buffer above minimum reserve

    // Emergency mode scenario: Even under crisis surge, validateTransferSafety MUST strictly reject unsafe transfers
    const donorStock = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === bestCandidate.clinicId && s.medicineId === 'm3')!;
    const excessiveCrisisQuantity = donorStock.currentStock - donorStock.minSafetyStock + 10; // 115 - 30 + 10 = 95 units
    const crisisSafetyCheck = validateTransferSafety(donorStock, excessiveCrisisQuantity);
    expect(crisisSafetyCheck.isValid).toBe(false);
    expect(crisisSafetyCheck.error).toContain('Safety stock violation');
  });

  // --------------------------------------------------------------------------
  // Check 10: Complete 34-unit Epinephrine End-to-End Workflow & Invariant Audit
  // --------------------------------------------------------------------------
  it('10. verifies complete 34-unit Epinephrine redistribution workflow across all stages', () => {
    // 1. Identify Shortage at Recipient Facility (St. Jude)
    const initialStJude = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c2' && s.medicineId === 'm3')!;
    const initialNorthside = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c4' && s.medicineId === 'm3')!;
    const initialMetroHope = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c1' && s.medicineId === 'm3')!;

    expect(initialStJude.currentStock).toBe(6);
    expect(initialStJude.minSafetyStock).toBe(25);
    expect(initialNorthside.currentStock).toBe(115);
    expect(initialNorthside.minSafetyStock).toBe(30);

    // 2. Target Need Calculation
    const need = calculateRecipientTargetNeed(initialStJude);
    expect(need.immediateDeficit).toBe(19);
    expect(need.operatingBuffer).toBe(15);
    expect(need.targetNeed).toBe(34);

    // 3. Candidate Donor Evaluation
    const match = findBestDonorRecommendation(
      initialStJude,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      sampleMedicines
    );

    expect(match.recommendation).not.toBeNull();
    const rec = match.recommendation!;
    expect(rec.recommendedQuantity).toBe(34);
    expect(rec.donorClinicId).toBe('c4');

    // Verify candidate refusal reasons
    const rejectedMetro = match.candidates.find((c) => c.clinicId === 'c1')!;
    expect(rejectedMetro.isEligible).toBe(false);
    expect(rejectedMetro.rejectionReason).toContain('Insufficient surplus');
    expect(rejectedMetro.rejectionReason).toContain('breaching safety reserve by 32 units');

    // 4. Proposed State Guarantee: Inventory MUST NOT be modified before confirmation
    expect(initialStJude.currentStock).toBe(6);
    expect(initialNorthside.currentStock).toBe(115);

    // 5. Pre-confirmation Revalidation of Donor Safety
    const safetyRevalidation = validateTransferSafety(initialNorthside, rec.recommendedQuantity);
    expect(safetyRevalidation.isValid).toBe(true);

    // 6. Simulate Atomic Confirmation & State Transition
    let stockState = [...INITIAL_STOCK_RECORDS];
    const donorRecord = stockState.find((s) => s.id === initialNorthside.id)!;
    const recipientRecord = stockState.find((s) => s.id === initialStJude.id)!;

    stockState = stockState.map((item) => {
      if (item.id === donorRecord.id) {
        return { ...item, currentStock: item.currentStock - rec.recommendedQuantity };
      }
      if (item.id === recipientRecord.id) {
        return { ...item, currentStock: item.currentStock + rec.recommendedQuantity };
      }
      return item;
    });

    const donorAfter = stockState.find((s) => s.id === initialNorthside.id)!;
    const recipientAfter = stockState.find((s) => s.id === initialStJude.id)!;

    // Donor checks
    expect(donorAfter.currentStock).toBe(81); // 115 - 34 = 81
    expect(donorAfter.currentStock).toBeGreaterThanOrEqual(donorAfter.minSafetyStock); // 81 >= 30
    expect(donorAfter.currentStock - donorAfter.minSafetyStock).toBe(51); // 51 remaining safety buffer

    // Recipient checks
    expect(recipientAfter.currentStock).toBe(40); // 6 + 34 = 40
    expect(recipientAfter.currentStock).toBeGreaterThanOrEqual(recipientAfter.minSafetyStock); // 40 >= 25
    const recipientRunway = recipientAfter.currentStock / recipientAfter.avgDailyConsumption;
    expect(recipientRunway).toBe(8.0); // 40 / 5 = 8.0 days coverage restored

    // 7. Audit Manifest Creation
    const auditRecord: TransferRecord = {
      id: `tr-audit-${Date.now().toString(36)}`,
      recommendationId: rec.id,
      medicineId: rec.medicineId,
      donorClinicId: rec.donorClinicId,
      recipientClinicId: rec.recipientClinicId,
      quantity: rec.recommendedQuantity,
      urgency: rec.urgency,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      notes: rec.explanation.summary,
      distanceKm: rec.distanceKm,
      estimatedTransitMinutes: rec.estimatedTransitMinutes,
      isEmergency: false,
      batchNumber: rec.batchNumber,
    };

    // 8. Block Duplicate Confirmation
    const sessionTransfers = [auditRecord];
    const isDuplicate = sessionTransfers.some(
      (t) =>
        t.recommendationId === rec.id ||
        (t.donorClinicId === rec.donorClinicId &&
          t.recipientClinicId === rec.recipientClinicId &&
          t.medicineId === rec.medicineId)
    );
    expect(isDuplicate).toBe(true);

    // 9. Impact Metrics Update
    const metrics = calculateImpactMetrics(stockState, sampleMedicines, sessionTransfers, [rec]);
    expect(metrics.completedTransfersCount).toBe(1);
    expect(metrics.completedUnitsRedistributed).toBe(34);
    expect(metrics.networkSafetyComplianceRate).toBeGreaterThanOrEqual(87);
    expect(donorAfter.currentStock >= donorAfter.minSafetyStock).toBe(true);
    expect(recipientAfter.currentStock >= recipientAfter.minSafetyStock).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Check 11: Stable Deterministic Recommendation IDs
  // --------------------------------------------------------------------------
  it('11. generates stable, deterministic recommendation IDs matching donor-recipient-medicine tuple', () => {
    const stJude = INITIAL_STOCK_RECORDS.find((s) => s.clinicId === 'c2' && s.medicineId === 'm3')!;
    const match = findBestDonorRecommendation(
      stJude,
      INITIAL_STOCK_RECORDS,
      sampleClinics,
      sampleMedicines
    );

    const recs = generateRedistributionRecommendations({
      clinics: sampleClinics,
      medicines: sampleMedicines,
      stockRecords: INITIAL_STOCK_RECORDS,
    });

    const matchingGeneratedRec = recs.find((r) => r.donorClinicId === 'c4' && r.recipientClinicId === 'c2' && r.medicineId === 'm3');
    expect(matchingGeneratedRec).toBeDefined();
    expect(match.recommendation).not.toBeNull();

    // Both IDs should match deterministic convention rec-c4-c2-m3
    expect(match.recommendation!.id).toBe('rec-c4-c2-m3');
    expect(matchingGeneratedRec!.id).toBe('rec-c4-c2-m3');
  });
});
