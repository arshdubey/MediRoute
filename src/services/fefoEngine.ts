import {
  Clinic,
  Medicine,
  StockRecord,
  PriorityLevel,
  TransferRecord,
} from '../types';
import { calculateDaysToExpiry } from './shortageCalculator';
import { getRouteInfo } from '../data/distanceMatrix';
import { validateTransferSafety } from './redistributionEngine';

export type ExpiryRiskTier =
  | 'EXPIRED'
  | 'CRITICAL'   // 1 to 7 days
  | 'HIGH'       // 8 to 30 days
  | 'MODERATE'   // 31 to 60 days
  | 'WATCH'      // 61 to 90 days
  | 'NORMAL';     // > 90 days

export interface ExpiryBatchAnalysis {
  stockRecordId: string;
  clinicId: string;
  clinicName: string;
  clinicCode: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  standardUnitCost: number;
  batchNumber: string;
  expiryDate: string;
  currentStock: number;
  minSafetyStock: number;
  maxCapacity: number;
  avgDailyConsumption: number;
  daysToExpiry: number;
  riskTier: ExpiryRiskTier;
  localProjectedConsumption: number;
  projectedUnusedStock: number;
  transferableSurplus: number;
  potentialWastageExposure: number;
  isEligibleForFEFO: boolean;
  statusNote: string;
}

export interface FEFORecipientEvaluation {
  recipientClinicId: string;
  recipientClinicName: string;
  recipientClinicCode: string;
  currentStock: number;
  minSafetyStock: number;
  maxCapacity: number;
  avgDailyConsumption: number;
  daysUntilStockout: number;
  distanceKm: number;
  transitMinutes: number;
  remainingUsableDays: number;
  recipientProjectedUsageBeforeExpiry: number;
  storageHeadroom: number;
  isEligible: boolean;
  rejectionReason?: string;
  proposedTransferQuantity: number;
  recipientPostStock: number;
  recipientPostDays: number;
  score: number;
}

export interface FEFORedistributionRecommendation {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosageForm: string;
  category: string;
  standardUnitCost: number;
  donorClinicId: string;
  donorClinicName: string;
  donorClinicCode: string;
  recipientClinicId: string;
  recipientClinicName: string;
  recipientClinicCode: string;
  batchNumber: string;
  expiryDate: string;
  daysToExpiry: number;
  remainingUsableDays: number;
  donorAvailableStock: number;
  donorSafetyStock: number;
  donorProjectedLocalBurn: number;
  donorProjectedUnusedStock: number;
  recommendedQuantity: number;
  donorPostStock: number;
  recipientPreStock: number;
  recipientPostStock: number;
  recipientPreDays: number;
  recipientPostDays: number;
  recipientDailyConsumption: number;
  recipientProjectedUsageBeforeExpiry: number;
  estimatedWastageUnitsSaved: number;
  estimatedWastageValueSaved: number;
  distanceKm: number;
  estimatedTransitMinutes: number;
  urgency: PriorityLevel;
  fefoScore: number;
  rationale: {
    summary: string;
    expiryAnalysis: string;
    recipientCapacity: string;
    donorSafety: string;
    refusedCandidates?: string;
  };
  candidatesEvaluated: FEFORecipientEvaluation[];
  status: 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED';
}

export interface ExpiryOverviewMetrics {
  totalBatches: number;
  expiringWithin7Days: number;   // 1 - 7 days (Critical)
  expiringWithin30Days: number;  // 8 - 30 days (High)
  expiringWithin60Days: number;  // 31 - 60 days (Moderate)
  expiringWithin90Days: number;  // 61 - 90 days (Watch)
  expiredBatches: number;        // <= 0 days
  highRiskInventoryQuantity: number; // units in Critical + High (<= 30 days)
  estimatedWastageExposure: number;  // total potential dollar value of unused stock
  projectedUnitsPreventable: number; // units that can be saved through FEFO redistribution
  projectedValuePreventable: number; // dollar value of preventable wastage
  confirmedSavedUnits: number;       // session executed FEFO transfers
  confirmedSavedValue: number;       // session executed dollar value
}

/**
 * Classifies a batch into standardized MediRoute expiry risk tiers.
 */
export function classifyExpiryRiskTier(daysToExpiry: number): ExpiryRiskTier {
  if (daysToExpiry <= 0) return 'EXPIRED';
  if (daysToExpiry <= 7) return 'CRITICAL';
  if (daysToExpiry <= 30) return 'HIGH';
  if (daysToExpiry <= 60) return 'MODERATE';
  if (daysToExpiry <= 90) return 'WATCH';
  return 'NORMAL';
}

/**
 * Performs detailed FEFO batch analysis on a single stock record.
 */
export function analyzeBatchExpiry(
  stockRecord: StockRecord,
  clinic: Clinic,
  medicine: Medicine,
  referenceDate: Date = new Date()
): ExpiryBatchAnalysis {
  const daysToExpiry = calculateDaysToExpiry(stockRecord.expiryDate, referenceDate);
  const riskTier = classifyExpiryRiskTier(daysToExpiry);

  const usableDays = Math.max(0, daysToExpiry);
  const localProjectedConsumption = Math.round(stockRecord.avgDailyConsumption * usableDays);
  const projectedUnusedStock = Math.max(0, stockRecord.currentStock - localProjectedConsumption);
  
  // Donor must preserve minimum safety reserve
  const transferableAboveSafety = Math.max(0, stockRecord.currentStock - stockRecord.minSafetyStock);
  const transferableSurplus = Math.min(projectedUnusedStock, transferableAboveSafety);

  const potentialWastageExposure = Math.round(projectedUnusedStock * medicine.standardUnitCost * 100) / 100;

  let isEligibleForFEFO = true;
  let statusNote = 'Batch monitored in normal rotation.';

  if (riskTier === 'EXPIRED') {
    isEligibleForFEFO = false;
    statusNote = 'Batch has passed expiration date. Quarantined for safe disposal.';
  } else if (daysToExpiry < 2) {
    isEligibleForFEFO = false;
    statusNote = 'Insufficient remaining shelf life (< 48 hours) for safe transit.';
  } else if (projectedUnusedStock <= 0) {
    isEligibleForFEFO = false;
    statusNote = 'Local clinic demand is projected to consume 100% of stock prior to expiry.';
  } else if (transferableSurplus <= 0) {
    isEligibleForFEFO = false;
    statusNote = 'Stock is at or below clinic safety reserve; redistribution is restricted.';
  } else {
    statusNote = `Surplus of ${transferableSurplus} units projected to expire unused. Eligible for FEFO redistribution.`;
  }

  return {
    stockRecordId: stockRecord.id,
    clinicId: clinic.id,
    clinicName: clinic.name,
    clinicCode: clinic.code,
    medicineId: medicine.id,
    medicineName: medicine.name,
    genericName: medicine.genericName,
    category: medicine.category,
    dosageForm: medicine.dosageForm,
    standardUnitCost: medicine.standardUnitCost,
    batchNumber: stockRecord.batchNumber,
    expiryDate: stockRecord.expiryDate,
    currentStock: stockRecord.currentStock,
    minSafetyStock: stockRecord.minSafetyStock,
    maxCapacity: stockRecord.maxCapacity,
    avgDailyConsumption: stockRecord.avgDailyConsumption,
    daysToExpiry,
    riskTier,
    localProjectedConsumption,
    projectedUnusedStock,
    transferableSurplus,
    potentialWastageExposure,
    isEligibleForFEFO,
    statusNote,
  };
}

/**
 * Calculates network-wide Expiry Risk Overview metrics from live application inventory.
 */
export function calculateExpiryOverviewMetrics(
  stockRecords: StockRecord[],
  clinics: Clinic[],
  medicines: Medicine[],
  transfers: TransferRecord[] = [],
  referenceDate: Date = new Date()
): ExpiryOverviewMetrics {
  const clinicMap = new Map(clinics.map((c) => [c.id, c]));
  const medMap = new Map(medicines.map((m) => [m.id, m]));

  let expiringWithin7Days = 0;
  let expiringWithin30Days = 0;
  let expiringWithin60Days = 0;
  let expiringWithin90Days = 0;
  let expiredBatches = 0;
  let highRiskInventoryQuantity = 0;
  let estimatedWastageExposure = 0;

  for (const sr of stockRecords) {
    const med = medMap.get(sr.medicineId);
    const days = calculateDaysToExpiry(sr.expiryDate, referenceDate);
    const tier = classifyExpiryRiskTier(days);

    if (tier === 'EXPIRED') {
      expiredBatches++;
      if (med) {
        estimatedWastageExposure += sr.currentStock * med.standardUnitCost;
      }
    } else if (tier === 'CRITICAL') {
      expiringWithin7Days++;
      highRiskInventoryQuantity += sr.currentStock;
      if (med) {
        const burn = Math.round(sr.avgDailyConsumption * days);
        const unused = Math.max(0, sr.currentStock - burn);
        estimatedWastageExposure += unused * med.standardUnitCost;
      }
    } else if (tier === 'HIGH') {
      expiringWithin30Days++;
      highRiskInventoryQuantity += sr.currentStock;
      if (med) {
        const burn = Math.round(sr.avgDailyConsumption * days);
        const unused = Math.max(0, sr.currentStock - burn);
        estimatedWastageExposure += unused * med.standardUnitCost;
      }
    } else if (tier === 'MODERATE') {
      expiringWithin60Days++;
      if (med) {
        const burn = Math.round(sr.avgDailyConsumption * days);
        const unused = Math.max(0, sr.currentStock - burn);
        estimatedWastageExposure += unused * med.standardUnitCost;
      }
    } else if (tier === 'WATCH') {
      expiringWithin90Days++;
      if (med) {
        const burn = Math.round(sr.avgDailyConsumption * days);
        const unused = Math.max(0, sr.currentStock - burn);
        estimatedWastageExposure += unused * med.standardUnitCost;
      }
    }
  }

  // Calculate confirmed FEFO transfers from actual session audit ledger
  let confirmedSavedUnits = 0;
  let confirmedSavedValue = 0;
  for (const tr of transfers) {
    if (tr.status === 'COMPLETED' && tr.notes && tr.notes.toLowerCase().includes('fefo')) {
      const med = medMap.get(tr.medicineId);
      confirmedSavedUnits += tr.quantity;
      if (med) {
        confirmedSavedValue += tr.quantity * med.standardUnitCost;
      }
    }
  }

  // Generate potential FEFO recommendations to determine projected preventable wastage
  const recs = generateFEFORecommendations(stockRecords, clinics, medicines, referenceDate, transfers);
  const projectedUnitsPreventable = recs.reduce((acc, r) => acc + r.recommendedQuantity, 0);
  const projectedValuePreventable = Math.round(
    recs.reduce((acc, r) => acc + r.estimatedWastageValueSaved, 0) * 100
  ) / 100;

  return {
    totalBatches: stockRecords.length,
    expiringWithin7Days,
    expiringWithin30Days,
    expiringWithin60Days,
    expiringWithin90Days,
    expiredBatches,
    highRiskInventoryQuantity,
    estimatedWastageExposure: Math.round(estimatedWastageExposure * 100) / 100,
    projectedUnitsPreventable,
    projectedValuePreventable,
    confirmedSavedUnits,
    confirmedSavedValue: Math.round(confirmedSavedValue * 100) / 100,
  };
}

/**
 * Evaluates candidate recipient facilities for a specific expiring donor batch.
 */
export function evaluateCandidateRecipientsForBatch(
  donorStock: StockRecord,
  allStockRecords: StockRecord[],
  clinics: Clinic[],
  medicine: Medicine,
  referenceDate: Date = new Date()
): FEFORecipientEvaluation[] {
  const clinicMap = new Map(clinics.map((c) => [c.id, c]));
  const evaluations: FEFORecipientEvaluation[] = [];

  const daysToExpiry = calculateDaysToExpiry(donorStock.expiryDate, referenceDate);
  const usableDays = Math.max(0, daysToExpiry);
  const localProjectedConsumption = Math.round(donorStock.avgDailyConsumption * usableDays);
  const projectedUnusedStock = Math.max(0, donorStock.currentStock - localProjectedConsumption);
  const transferableSurplus = Math.min(
    projectedUnusedStock,
    Math.max(0, donorStock.currentStock - donorStock.minSafetyStock)
  );

  // Check all other facilities with the same medicine
  const recipientRecords = allStockRecords.filter(
    (sr) => sr.medicineId === donorStock.medicineId && sr.clinicId !== donorStock.clinicId
  );

  for (const recipientStock of recipientRecords) {
    const recipientClinic = clinicMap.get(recipientStock.clinicId);
    if (!recipientClinic) continue;

    const route = getRouteInfo(donorStock.clinicId, recipientStock.clinicId);
    const transitDays = route.transitMinutes / (24 * 60);
    const remainingUsableDays = Math.max(0, daysToExpiry - transitDays);
    const storageHeadroom = Math.max(0, recipientStock.maxCapacity - recipientStock.currentStock);

    // Consumption Feasibility: How many units can recipient realistically use before expiry?
    const recipientProjectedUsageBeforeExpiry = Math.floor(
      recipientStock.avgDailyConsumption * remainingUsableDays
    );

    const daysUntilStockout =
      recipientStock.avgDailyConsumption > 0
        ? Math.round((recipientStock.currentStock / recipientStock.avgDailyConsumption) * 10) / 10
        : 999;

    let isEligible = true;
    let rejectionReason: string | undefined;

    // Check 1: Expiry validation
    if (daysToExpiry <= 0) {
      isEligible = false;
      rejectionReason = `Batch #${donorStock.batchNumber} has expired. Expired medicines cannot be transferred.`;
    } else if (remainingUsableDays < 2) {
      isEligible = false;
      rejectionReason = `Transit duration (${route.transitMinutes} mins) leaves only ${remainingUsableDays.toFixed(1)} days shelf life (minimum 48h required).`;
    }
    // Check 2: Zero transferable surplus at donor
    else if (transferableSurplus <= 0) {
      isEligible = false;
      rejectionReason = `Donor holds ${donorStock.currentStock} units with ${donorStock.minSafetyStock} safety reserve; zero surplus available for transfer.`;
    }
    // Check 3: Recipient storage capacity limit
    else if (storageHeadroom <= 0) {
      isEligible = false;
      rejectionReason = `Recipient is at maximum capacity (${recipientStock.currentStock}/${recipientStock.maxCapacity} units). Cannot accept additional inventory.`;
    }
    // Check 4: Recipient consumption feasibility
    else if (recipientProjectedUsageBeforeExpiry <= 0) {
      isEligible = false;
      rejectionReason = `Recipient burn rate is zero; transferred stock would remain unused and expire at destination facility.`;
    }

    // Feasible Transfer Quantity Calculation
    // Allocate what recipient can safely consume, bounded by donor transferable surplus and recipient storage limit
    let proposedTransferQuantity = 0;
    if (isEligible) {
      // Calculate target need based on shortage deficit and 14-day consumption buffer
      const deficit = Math.max(0, recipientStock.minSafetyStock - recipientStock.currentStock);
      const operatingBuffer = Math.round(recipientStock.avgDailyConsumption * 7);
      const targetAbsorbNeed = Math.max(deficit, deficit + operatingBuffer);

      // Quantities allowed
      proposedTransferQuantity = Math.min(
        transferableSurplus,
        recipientProjectedUsageBeforeExpiry,
        storageHeadroom,
        Math.max(targetAbsorbNeed, recipientProjectedUsageBeforeExpiry)
      );

      if (proposedTransferQuantity <= 0) {
        isEligible = false;
        rejectionReason = `Recipient demand analysis indicates current stock is sufficient; absorption would lead to secondary expiry.`;
      }
    }

    // FEFO Scoring Formula
    let score = 0;
    if (isEligible && proposedTransferQuantity > 0) {
      // 1. Expiry Urgency Factor: earlier expiry gets higher score
      const urgencyScore = (90 - Math.min(90, daysToExpiry)) * 1.5;

      // 2. Shortage Severity Factor: if recipient is in acute shortage, boost priority
      const shortageScore = daysUntilStockout <= 2.5 ? 50 : daysUntilStockout <= 7 ? 25 : 10;

      // 3. Absorption Efficiency Factor: percentage of transferable surplus absorbed
      const absorptionScore = (proposedTransferQuantity / transferableSurplus) * 30;

      // 4. Logistics Distance Penalty: closer facilities are prioritized
      const logisticsScore = Math.max(0, 30 - route.distanceKm * 0.8);

      score = Math.round(urgencyScore + shortageScore + absorptionScore + logisticsScore);
    }

    const recipientPostStock = recipientStock.currentStock + proposedTransferQuantity;
    const recipientPostDays =
      recipientStock.avgDailyConsumption > 0
        ? Math.round((recipientPostStock / recipientStock.avgDailyConsumption) * 10) / 10
        : 999;

    evaluations.push({
      recipientClinicId: recipientClinic.id,
      recipientClinicName: recipientClinic.name,
      recipientClinicCode: recipientClinic.code,
      currentStock: recipientStock.currentStock,
      minSafetyStock: recipientStock.minSafetyStock,
      maxCapacity: recipientStock.maxCapacity,
      avgDailyConsumption: recipientStock.avgDailyConsumption,
      daysUntilStockout,
      distanceKm: route.distanceKm,
      transitMinutes: route.transitMinutes,
      remainingUsableDays: Math.round(remainingUsableDays * 10) / 10,
      recipientProjectedUsageBeforeExpiry,
      storageHeadroom,
      isEligible,
      rejectionReason,
      proposedTransferQuantity,
      recipientPostStock,
      recipientPostDays,
      score,
    });
  }

  // Sort descending by score, eligible first
  return evaluations.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.score - a.score;
  });
}

/**
 * Deterministic FEFO Redistribution Engine:
 * Generates ranked, explainable redistribution proposals for all expiring batches.
 */
export function generateFEFORecommendations(
  stockRecords: StockRecord[],
  clinics: Clinic[],
  medicines: Medicine[],
  referenceDate: Date = new Date(),
  existingTransfers: TransferRecord[] = []
): FEFORedistributionRecommendation[] {
  const clinicMap = new Map(clinics.map((c) => [c.id, c]));
  const medMap = new Map(medicines.map((m) => [m.id, m]));

  const recommendations: FEFORedistributionRecommendation[] = [];

  // 1. Identify all candidate batches with shelf life <= 90 days and > 2 days
  const eligibleBatches = stockRecords.filter((sr) => {
    const days = calculateDaysToExpiry(sr.expiryDate, referenceDate);
    return days > 2 && days <= 90;
  });

  // Sort batches by earliest expiry first (FEFO)
  eligibleBatches.sort((a, b) => {
    const daysA = calculateDaysToExpiry(a.expiryDate, referenceDate);
    const daysB = calculateDaysToExpiry(b.expiryDate, referenceDate);
    return daysA - daysB;
  });

  for (const donorStock of eligibleBatches) {
    const donorClinic = clinicMap.get(donorStock.clinicId);
    const medicine = medMap.get(donorStock.medicineId);
    if (!donorClinic || !medicine) continue;

    const daysToExpiry = calculateDaysToExpiry(donorStock.expiryDate, referenceDate);
    const usableDays = Math.max(0, daysToExpiry);
    const donorProjectedLocalBurn = Math.round(donorStock.avgDailyConsumption * usableDays);
    const donorProjectedUnusedStock = Math.max(0, donorStock.currentStock - donorProjectedLocalBurn);
    const donorTransferableSurplus = Math.min(
      donorProjectedUnusedStock,
      Math.max(0, donorStock.currentStock - donorStock.minSafetyStock)
    );

    // If no surplus at risk of expiry, skip
    if (donorTransferableSurplus <= 0) continue;

    // Evaluate candidate recipients
    const candidates = evaluateCandidateRecipientsForBatch(
      donorStock,
      stockRecords,
      clinics,
      medicine,
      referenceDate
    );

    const bestRecipient = candidates.find((c) => c.isEligible && c.proposedTransferQuantity > 0);
    if (!bestRecipient) continue;

    const recipientClinic = clinicMap.get(bestRecipient.recipientClinicId);
    if (!recipientClinic) continue;

    const route = getRouteInfo(donorClinic.id, recipientClinic.id);
    const recommendedQty = bestRecipient.proposedTransferQuantity;
    const donorPostStock = donorStock.currentStock - recommendedQty;

    // Ensure donor safety invariant holds strictly: donorPostStock >= donorSafetyStock
    if (donorPostStock < donorStock.minSafetyStock) continue;

    // Check if this transfer or corridor has already been confirmed in session
    const isAlreadyExecuted = existingTransfers.some(
      (t) =>
        t.status === 'COMPLETED' &&
        t.donorClinicId === donorClinic.id &&
        t.recipientClinicId === recipientClinic.id &&
        t.medicineId === medicine.id &&
        t.batchNumber === donorStock.batchNumber
    );

    const recId = `fefo-rec-${donorClinic.id}-${recipientClinic.id}-${medicine.id}-${donorStock.batchNumber}`;

    // Determine clinical priority
    let urgency: PriorityLevel = 'MEDIUM';
    if (daysToExpiry <= 14 || bestRecipient.daysUntilStockout <= 2.5) {
      urgency = 'CRITICAL';
    } else if (daysToExpiry <= 30 || bestRecipient.daysUntilStockout <= 7) {
      urgency = 'HIGH';
    }

    const estimatedWastageUnitsSaved = recommendedQty;
    const estimatedWastageValueSaved = Math.round(recommendedQty * medicine.standardUnitCost * 100) / 100;

    const rejectedCount = candidates.filter((c) => !c.isEligible).length;
    const rejectedSummary = candidates
      .filter((c) => !c.isEligible)
      .slice(0, 2)
      .map((c) => `${c.recipientClinicCode}: ${c.rejectionReason}`)
      .join('; ');

    const rationale = {
      summary: `FEFO Redistribution: Reallocate ${recommendedQty} units of ${medicine.name} (Batch #${donorStock.batchNumber}) from ${donorClinic.name} to ${recipientClinic.name}. Prevents projected wastage of $${estimatedWastageValueSaved.toFixed(2)} while preserving donor minimum reserve.`,
      expiryAnalysis: `Batch #${donorStock.batchNumber} expires in ${daysToExpiry} days. ${donorClinic.code} burns ${donorStock.avgDailyConsumption} units/day, consuming only ${donorProjectedLocalBurn} units locally before expiration. Without redistribution, ${donorProjectedUnusedStock} units would become expired medical waste.`,
      recipientCapacity: `${recipientClinic.code} consumes ${bestRecipient.avgDailyConsumption} units/day (current runway: ${bestRecipient.daysUntilStockout}d). In remaining ${bestRecipient.remainingUsableDays} usable days post-transit, recipient will consume ~${bestRecipient.recipientProjectedUsageBeforeExpiry} units, fully absorbing the ${recommendedQty} unit transfer without secondary expiry.`,
      donorSafety: `Donor currently holds ${donorStock.currentStock} units with ${donorStock.minSafetyStock} safety reserve. Post-transfer stock will be ${donorPostStock} units (safety margin: +${donorPostStock - donorStock.minSafetyStock} units above threshold).`,
      refusedCandidates: rejectedCount > 0 ? `${rejectedCount} other facilities refused: ${rejectedSummary}` : undefined,
    };

    recommendations.push({
      id: recId,
      medicineId: medicine.id,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      dosageForm: medicine.dosageForm,
      category: medicine.category,
      standardUnitCost: medicine.standardUnitCost,
      donorClinicId: donorClinic.id,
      donorClinicName: donorClinic.name,
      donorClinicCode: donorClinic.code,
      recipientClinicId: recipientClinic.id,
      recipientClinicName: recipientClinic.name,
      recipientClinicCode: recipientClinic.code,
      batchNumber: donorStock.batchNumber,
      expiryDate: donorStock.expiryDate,
      daysToExpiry,
      remainingUsableDays: bestRecipient.remainingUsableDays,
      donorAvailableStock: donorStock.currentStock,
      donorSafetyStock: donorStock.minSafetyStock,
      donorProjectedLocalBurn,
      donorProjectedUnusedStock,
      recommendedQuantity: recommendedQty,
      donorPostStock,
      recipientPreStock: bestRecipient.currentStock,
      recipientPostStock: bestRecipient.recipientPostStock,
      recipientPreDays: bestRecipient.daysUntilStockout,
      recipientPostDays: bestRecipient.recipientPostDays,
      recipientDailyConsumption: bestRecipient.avgDailyConsumption,
      recipientProjectedUsageBeforeExpiry: bestRecipient.recipientProjectedUsageBeforeExpiry,
      estimatedWastageUnitsSaved,
      estimatedWastageValueSaved,
      distanceKm: route.distanceKm,
      estimatedTransitMinutes: route.transitMinutes,
      urgency,
      fefoScore: bestRecipient.score,
      rationale,
      candidatesEvaluated: candidates,
      status: isAlreadyExecuted ? 'ACCEPTED' : 'RECOMMENDED',
    });
  }

  // Sort recommendations by FEFO score (highest urgency and wastage avoidance first)
  return recommendations.sort((a, b) => b.fefoScore - a.fefoScore);
}

/**
 * Validates a FEFO transfer before execution.
 * Revalidates donor stock, minimum safety reserve, expiry eligibility,
 * recipient capacity, and whole-unit integer constraints.
 */
export function validateFEFOTransferSafety(
  donorStock: StockRecord,
  recipientStock: StockRecord,
  quantity: number,
  options?: { transitMinutes?: number; referenceDate?: Date }
): { isValid: boolean; error?: string } {
  // Use existing core safety validation
  const baseCheck = validateTransferSafety(donorStock, quantity, options);
  if (!baseCheck.isValid) {
    return baseCheck;
  }

  // Recipient physical capacity validation
  if (recipientStock.currentStock + quantity > recipientStock.maxCapacity) {
    return {
      isValid: false,
      error: `Storage capacity breach! Recipient holds ${recipientStock.currentStock}/${recipientStock.maxCapacity} units. Adding ${quantity} units would exceed maximum storage capacity.`,
    };
  }

  // Recipient consumption feasibility revalidation
  const refDate = options?.referenceDate || new Date();
  const daysToExpiry = calculateDaysToExpiry(donorStock.expiryDate, refDate);
  const transitDays = (options?.transitMinutes || 30) / (24 * 60);
  const usableDays = Math.max(0, daysToExpiry - transitDays);
  const maxProjectedIntake = Math.ceil(recipientStock.avgDailyConsumption * usableDays);

  if (recipientStock.avgDailyConsumption <= 0) {
    return {
      isValid: false,
      error: 'Recipient has zero average daily consumption for this medicine. Stock would expire unused at destination.',
    };
  }

  if (quantity > maxProjectedIntake * 1.5) {
    return {
      isValid: false,
      error: `Consumption feasibility warning! Transferred quantity (${quantity}) significantly exceeds projected recipient usage before expiry (~${maxProjectedIntake} units in ${usableDays.toFixed(1)} days).`,
    };
  }

  return { isValid: true };
}
