import { describe, it, expect } from 'vitest';
import {
  calculateImpactMetrics,
  calculateClinicSummaries,
} from '../services/analyticsService';
import {
  SEED_CLINICS,
  SEED_MEDICINES,
  INITIAL_STOCK_RECORDS,
} from '../data/seedData';
import { TransferRecord, RedistributionRecommendation } from '../types';

describe('Analytics & Impact Service Integrity', () => {
  it('correctly aggregates baseline metrics with zero transfers', () => {
    const metrics = calculateImpactMetrics(INITIAL_STOCK_RECORDS, SEED_MEDICINES, [], []);
    expect(metrics.completedTransfersCount).toBe(0);
    expect(metrics.completedUnitsRedistributed).toBe(0);
    expect(metrics.completedEconomicValue).toBe(0);
    expect(metrics.completedEmergencyTransfers).toBe(0);
    expect(metrics.networkSafetyComplianceRate).toBeGreaterThanOrEqual(80);
  });

  it('accurately updates economic value and units upon transfer completion', () => {
    const transfer: TransferRecord = {
      id: 'tr-test-1',
      medicineId: 'm3', // Epinephrine, standardUnitCost: 95.00
      donorClinicId: 'c4',
      recipientClinicId: 'c2',
      quantity: 34,
      urgency: 'HIGH',
      status: 'COMPLETED',
      timestamp: '2026-10-21T10:00:00Z',
      distanceKm: 24.2,
      estimatedTransitMinutes: 32,
      isEmergency: false,
      batchNumber: 'EPI-2026-C8',
      notes: 'Test automated dispatch record',
    };

    const metrics = calculateImpactMetrics(INITIAL_STOCK_RECORDS, SEED_MEDICINES, [transfer], []);
    expect(metrics.completedTransfersCount).toBe(1);
    expect(metrics.completedUnitsRedistributed).toBe(34);
    // 34 units * $95.00 = $3,230.00
    expect(metrics.completedEconomicValue).toBe(3230);
    expect(metrics.avgTransferDistanceKm).toBe(24.2);
    expect(metrics.avgTransitMinutes).toBe(32);
  });

  it('calculates facility inventory summaries accurately for bar charts', () => {
    const summaries = calculateClinicSummaries(SEED_CLINICS, INITIAL_STOCK_RECORDS);
    expect(summaries.length).toBe(5);

    // St. Jude (c2) must have critical shortages in seed
    const stJude = summaries.find((s) => s.clinic.id === 'c2');
    expect(stJude).toBeDefined();
    expect(stJude!.criticalCount).toBeGreaterThan(0);

    // Northside (c4) must have surpluses in seed
    const northside = summaries.find((s) => s.clinic.id === 'c4');
    expect(northside).toBeDefined();
    expect(northside!.surplusCount).toBeGreaterThan(0);
  });
});
