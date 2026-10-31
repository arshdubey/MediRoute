import { describe, it, expect } from 'vitest';
import {
  classifyExpiryRiskTier,
  analyzeBatchExpiry,
  calculateExpiryOverviewMetrics,
  evaluateCandidateRecipientsForBatch,
  generateFEFORecommendations,
  validateFEFOTransferSafety,
  ExpiryRiskTier,
} from '../services/fefoEngine';
import {
  SEED_CLINICS,
  SEED_MEDICINES,
  INITIAL_STOCK_RECORDS,
} from '../data/seedData';
import { StockRecord } from '../types';

describe('MediRoute Expiry Intelligence - FEFO Engine Suite', () => {
  const refDate = new Date('2026-10-31T00:00:00Z');

  // --------------------------------------------------------------------------
  // 1. Expiry Risk Tier Classification
  // --------------------------------------------------------------------------
  it('1. correctly classifies batches into standardized expiry risk tiers', () => {
    expect(classifyExpiryRiskTier(-5)).toBe('EXPIRED');
    expect(classifyExpiryRiskTier(0)).toBe('EXPIRED');
    expect(classifyExpiryRiskTier(1)).toBe('CRITICAL');
    expect(classifyExpiryRiskTier(7)).toBe('CRITICAL');
    expect(classifyExpiryRiskTier(8)).toBe('HIGH');
    expect(classifyExpiryRiskTier(24)).toBe('HIGH');
    expect(classifyExpiryRiskTier(30)).toBe('HIGH');
    expect(classifyExpiryRiskTier(31)).toBe('MODERATE');
    expect(classifyExpiryRiskTier(60)).toBe('MODERATE');
    expect(classifyExpiryRiskTier(61)).toBe('WATCH');
    expect(classifyExpiryRiskTier(90)).toBe('WATCH');
    expect(classifyExpiryRiskTier(91)).toBe('NORMAL');
    expect(classifyExpiryRiskTier(300)).toBe('NORMAL');
  });

  // --------------------------------------------------------------------------
  // 2. Batch Analysis & Local Consumption Feasibility
  // --------------------------------------------------------------------------
  it('2. accurately evaluates local consumption feasibility and transferable surplus', () => {
    // Pinecrest (c5) Insulin Glargine (m2):
    // Current stock: 90, Safety reserve: 20, Daily burn: 2, Expiry: 24 days
    const pinecrestClinic = SEED_CLINICS.find((c) => c.id === 'c5')!;
    const insulinMed = SEED_MEDICINES.find((m) => m.id === 'm2')!;

    const testStockRecord: StockRecord = {
      id: 'sr-test-pinecrest-insulin',
      clinicId: 'c5',
      medicineId: 'm2',
      currentStock: 90,
      minSafetyStock: 20,
      maxCapacity: 120,
      avgDailyConsumption: 2,
      batchNumber: 'INS-2026-EXP-A',
      expiryDate: '2026-11-24', // 24 days from refDate
      lastRestocked: '2026-08-01',
    };

    const analysis = analyzeBatchExpiry(testStockRecord, pinecrestClinic, insulinMed, refDate);

    expect(analysis.daysToExpiry).toBe(24);
    expect(analysis.riskTier).toBe('HIGH');

    // Local consumption in 24 days: 2 units/day * 24 days = 48 units
    expect(analysis.localProjectedConsumption).toBe(48);

    // Projected unused stock at risk of expiry: 90 - 48 = 42 units
    expect(analysis.projectedUnusedStock).toBe(42);

    // Safety reserve check: stock above safety reserve is 90 - 20 = 70 units
    // Transferable surplus is min(projectedUnused, stockAboveSafety) = min(42, 70) = 42 units
    expect(analysis.transferableSurplus).toBe(42);

    // Potential financial loss: 42 units * $28.50 = $1,197.00
    expect(analysis.potentialWastageExposure).toBe(42 * 28.50);
    expect(analysis.isEligibleForFEFO).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. Strict Rejection of Expired and Near-Expiry Batches (< 48h)
  // --------------------------------------------------------------------------
  it('3. strictly quarantines expired batches and rejects batches with under 48 hours shelf life', () => {
    const clinic = SEED_CLINICS[0];
    const med = SEED_MEDICINES[0];

    // Case A: Expired batch (-3 days)
    const expiredRecord: StockRecord = {
      id: 'sr-exp',
      clinicId: clinic.id,
      medicineId: med.id,
      currentStock: 50,
      minSafetyStock: 10,
      maxCapacity: 100,
      avgDailyConsumption: 2,
      batchNumber: 'EXP-PAST-1',
      expiryDate: '2026-10-28', // expired 3 days ago
      lastRestocked: '2026-01-01',
    };

    const expAnalysis = analyzeBatchExpiry(expiredRecord, clinic, med, refDate);
    expect(expAnalysis.riskTier).toBe('EXPIRED');
    expect(expAnalysis.isEligibleForFEFO).toBe(false);
    expect(expAnalysis.statusNote).toContain('Quarantined for safe disposal');

    // Case B: Expiring in 24 hours (fails 48h clinical transit window)
    const nearExpiryRecord: StockRecord = {
      ...expiredRecord,
      expiryDate: '2026-11-01', // 1 day
    };
    const nearAnalysis = analyzeBatchExpiry(nearExpiryRecord, clinic, med, refDate);
    expect(nearAnalysis.isEligibleForFEFO).toBe(false);
    expect(nearAnalysis.statusNote).toContain('Insufficient remaining shelf life (< 48 hours)');
  });

  // --------------------------------------------------------------------------
  // 4. Candidate Recipient Consumption Feasibility & Scoring
  // --------------------------------------------------------------------------
  it('4. evaluates candidate recipient demand and bounds transfer by recipient burn capacity', () => {
    const donorStock: StockRecord = {
      id: 'sr-donor-ins',
      clinicId: 'c5', // Pinecrest
      medicineId: 'm2',
      currentStock: 90,
      minSafetyStock: 20,
      maxCapacity: 120,
      avgDailyConsumption: 2,
      batchNumber: 'INS-2026-EXP-A',
      expiryDate: '2026-11-24', // 24 days
      lastRestocked: '2026-08-01',
    };

    const insulinMed = SEED_MEDICINES.find((m) => m.id === 'm2')!;

    const candidates = evaluateCandidateRecipientsForBatch(
      donorStock,
      INITIAL_STOCK_RECORDS,
      SEED_CLINICS,
      insulinMed,
      refDate
    );

    expect(candidates.length).toBeGreaterThan(0);

    // Metro Hope General (c1) burns 18 units/day, has shortage (45 stock vs 120 min safety)
    const metroHope = candidates.find((c) => c.recipientClinicId === 'c1');
    expect(metroHope).toBeDefined();
    expect(metroHope!.isEligible).toBe(true);

    // In remaining ~23.9 usable days, Metro Hope can consume ~430 units
    expect(metroHope!.recipientProjectedUsageBeforeExpiry).toBeGreaterThanOrEqual(400);

    // Proposed transfer must absorb the 42 at-risk units
    expect(metroHope!.proposedTransferQuantity).toBe(42);

    // Metro Hope should receive the highest FEFO score due to acute shortage and high consumption
    expect(candidates[0].recipientClinicId).toBe('c1');
    expect(candidates[0].score).toBeGreaterThan(80);
  });

  // --------------------------------------------------------------------------
  // 5. The 24-Day Challenge End-to-End Recommendation Test
  // --------------------------------------------------------------------------
  it('5. resolves The 24-Day Challenge: recommends transferring 42 units of Insulin Glargine to Metro Hope', () => {
    const recs = generateFEFORecommendations(
      INITIAL_STOCK_RECORDS,
      SEED_CLINICS,
      SEED_MEDICINES,
      new Date(),
      []
    );

    // Find the Insulin recommendation
    const insulinRec = recs.find(
      (r) => r.donorClinicId === 'c5' && r.recipientClinicId === 'c1' && r.medicineId === 'm2'
    );

    expect(insulinRec).toBeDefined();
    const rec = insulinRec!;

    // Batch validation
    expect(rec.batchNumber).toBe('INS-2026-EXP-A');
    expect(rec.daysToExpiry).toBe(24);

    // Quantities: exactly 42 units recommended
    expect(rec.recommendedQuantity).toBe(42);
    expect(rec.donorProjectedUnusedStock).toBe(42);
    expect(rec.estimatedWastageUnitsSaved).toBe(42);

    // Preserves donor safety reserve
    expect(rec.donorPostStock).toBe(48); // 90 - 42 = 48
    expect(rec.donorSafetyStock).toBe(20);
    expect(rec.donorPostStock).toBeGreaterThanOrEqual(rec.donorSafetyStock);

    // Recipient absorption
    expect(rec.recipientPreStock).toBe(45);
    expect(rec.recipientPostStock).toBe(87); // 45 + 42 = 87
    expect(rec.recipientDailyConsumption).toBe(18);

    // Financial value avoided: 42 * 28.50 = $1,197.00
    expect(rec.estimatedWastageValueSaved).toBeCloseTo(1197.0, 1);

    // Transparent rationale checks
    expect(rec.rationale.summary).toContain('FEFO Redistribution');
    expect(rec.rationale.expiryAnalysis).toContain('Batch #INS-2026-EXP-A expires in 24 days');
    expect(rec.rationale.donorSafety).toContain('Donor currently holds 90 units');
    expect(rec.rationale.donorSafety).toContain('safety margin: +28 units');
  });

  // --------------------------------------------------------------------------
  // 6. Pre-Execution Safety Validation Checks
  // --------------------------------------------------------------------------
  it('6. strictly validates donor safety invariants, storage headroom, and integer constraints', () => {
    const donorStock: StockRecord = {
      id: 'sr-val-donor',
      clinicId: 'c5',
      medicineId: 'm2',
      currentStock: 90,
      minSafetyStock: 20,
      maxCapacity: 120,
      avgDailyConsumption: 2,
      batchNumber: 'INS-2026-EXP-A',
      expiryDate: '2026-11-24',
      lastRestocked: '2026-08-01',
    };

    const recipientStock: StockRecord = {
      id: 'sr-val-recip',
      clinicId: 'c1',
      medicineId: 'm2',
      currentStock: 45,
      minSafetyStock: 120,
      maxCapacity: 300,
      avgDailyConsumption: 18,
      batchNumber: 'INS-2026-B4',
      expiryDate: '2027-04-01',
      lastRestocked: '2026-09-01',
    };

    // Valid transfer of 42 units
    const validCheck = validateFEFOTransferSafety(donorStock, recipientStock, 42, {
      referenceDate: refDate,
    });
    expect(validCheck.isValid).toBe(true);

    // Unsafe transfer: 75 units violates donor minSafetyStock (90 - 75 = 15 < 20)
    const unsafeDonorCheck = validateFEFOTransferSafety(donorStock, recipientStock, 75, {
      referenceDate: refDate,
    });
    expect(unsafeDonorCheck.isValid).toBe(false);
    expect(unsafeDonorCheck.error).toContain('Safety stock violation');

    // Storage capacity breach: adding 260 units exceeds recipient maxCapacity (45 + 260 = 305 > 300)
    const overCapacityCheck = validateFEFOTransferSafety(
      { ...donorStock, currentStock: 500 },
      recipientStock,
      260,
      { referenceDate: refDate }
    );
    expect(overCapacityCheck.isValid).toBe(false);
    expect(overCapacityCheck.error).toContain('Storage capacity breach');

    // Non-integer unit rejection
    const fracCheck = validateFEFOTransferSafety(donorStock, recipientStock, 15.5);
    expect(fracCheck.isValid).toBe(false);
    expect(fracCheck.error).toContain('whole units');
  });

  // --------------------------------------------------------------------------
  // 7. Network Expiry Risk Overview Metrics
  // --------------------------------------------------------------------------
  it('7. derives accurate overview metrics across all tiers from application inventory', () => {
    const metrics = calculateExpiryOverviewMetrics(
      INITIAL_STOCK_RECORDS,
      SEED_CLINICS,
      SEED_MEDICINES,
      [],
      new Date()
    );

    expect(metrics.totalBatches).toBe(INITIAL_STOCK_RECORDS.length);
    expect(metrics.expiringWithin7Days).toBeGreaterThanOrEqual(1); // OND-2026-EXP-6D
    expect(metrics.expiringWithin30Days).toBeGreaterThanOrEqual(2); // INS-2026-EXP-A (24d), DEX-2026-EXP-18D (18d)
    expect(metrics.expiringWithin60Days).toBeGreaterThanOrEqual(1); // PAR-2026-EXP-45D (45d)
    expect(metrics.expiringWithin90Days).toBeGreaterThanOrEqual(1); // ATV-2026-EXP-75D (75d)
    expect(metrics.expiredBatches).toBeGreaterThanOrEqual(1); // HEP-2026-EXP-0D (-3d)

    // High risk inventory count covers critical (<= 7) + high (8 - 30)
    expect(metrics.highRiskInventoryQuantity).toBeGreaterThan(0);

    // Wastage exposure is calculated from unconsumed stock * unit cost
    expect(metrics.estimatedWastageExposure).toBeGreaterThan(0);

    // Projected preventable units derived from FEFO recommendations
    expect(metrics.projectedUnitsPreventable).toBeGreaterThanOrEqual(42);
    expect(metrics.projectedValuePreventable).toBeGreaterThanOrEqual(1197.0);

    // Clean session starts with 0 confirmed FEFO transfers
    expect(metrics.confirmedSavedUnits).toBe(0);
    expect(metrics.confirmedSavedValue).toBe(0);
  });
});
