import {
  Clinic,
  Medicine,
  StockRecord,
  RedistributionRecommendation,
  CandidateEvaluation,
  PriorityLevel,
} from '../types';
import { calculateDaysUntilStockout, calculateDaysToExpiry } from './shortageCalculator';
import { getRouteInfo } from '../data/distanceMatrix';

export interface RedistributionInput {
  clinics: Clinic[];
  medicines: Medicine[];
  stockRecords: StockRecord[];
  existingRecommendations?: RedistributionRecommendation[];
  referenceDate?: Date;
}

/**
 * Deterministically calculates recipient demand and target coverage:
 * 1. Immediate deficit: minSafetyStock - currentStock (restores to safety threshold).
 * 2. Operating buffer: 3 days of average daily consumption to prevent immediate post-transfer deficit.
 * 3. Target coverage: minSafetyStock + operatingBuffer.
 * 4. Bounded by recipient storage capacity limit (maxCapacity - currentStock).
 */
export function calculateRecipientTargetNeed(recipientStock: StockRecord): {
  immediateDeficit: number;
  operatingBuffer: number;
  targetNeed: number;
  targetCoverage: number;
  maxFeasible: number;
} {
  const immediateDeficit = Math.max(0, recipientStock.minSafetyStock - recipientStock.currentStock);
  const operatingBuffer = Math.ceil(recipientStock.avgDailyConsumption * 3);
  const targetCoverage = Math.min(
    recipientStock.maxCapacity,
    recipientStock.minSafetyStock + operatingBuffer
  );
  const rawTargetNeed = Math.max(immediateDeficit, targetCoverage - recipientStock.currentStock);
  const maxFeasible = Math.max(0, recipientStock.maxCapacity - recipientStock.currentStock);
  const targetNeed = Math.min(maxFeasible, rawTargetNeed);

  return {
    immediateDeficit,
    operatingBuffer,
    targetNeed,
    targetCoverage,
    maxFeasible,
  };
}

/**
 * Validates whether a proposed transfer strictly adheres to clinical safety stock invariants,
 * shelf-life constraints, non-negative quantities, and integer units.
 */
export function validateTransferSafety(
  donorStock: StockRecord,
  transferQuantity: number,
  options?: {
    transitMinutes?: number;
    referenceDate?: Date;
    recipientClinicId?: string;
  }
): { isValid: boolean; error?: string } {
  if (!Number.isFinite(transferQuantity) || transferQuantity <= 0) {
    return { isValid: false, error: 'Transfer quantity must be a positive number greater than zero.' };
  }

  if (!Number.isInteger(transferQuantity)) {
    return { isValid: false, error: 'Transfer quantity must be an integer (whole units).' };
  }

  // 1. Strict donor safety stock invariant
  const postStock = donorStock.currentStock - transferQuantity;
  if (postStock < donorStock.minSafetyStock) {
    return {
      isValid: false,
      error: `Safety stock violation! Transfer of ${transferQuantity} units would leave donor with ${postStock} units, strictly below its minimum safety stock of ${donorStock.minSafetyStock}.`,
    };
  }

  // 2. Negative stock prevention
  if (postStock < 0) {
    return {
      isValid: false,
      error: `Insufficient stock! Donor currently holds ${donorStock.currentStock} units. Cannot transfer ${transferQuantity} units.`,
    };
  }

  // 3. Expiry check
  const refDate = options?.referenceDate || new Date();
  const daysToExpiry = calculateDaysToExpiry(donorStock.expiryDate, refDate);
  if (daysToExpiry <= 0) {
    return {
      isValid: false,
      error: `Batch #${donorStock.batchNumber} expired on ${donorStock.expiryDate}. Expired medication cannot be transferred.`,
    };
  }

  // 4. Transit time vs shelf life check
  if (options?.transitMinutes && options.transitMinutes > 0) {
    const transitDays = options.transitMinutes / (24 * 60);
    if (daysToExpiry < transitDays) {
      return {
        isValid: false,
        error: `Transit duration (~${options.transitMinutes} mins) exceeds remaining shelf life (${daysToExpiry} days). Transfer cannot safely arrive before batch expiration.`,
      };
    }
  }

  // 5. Minimum shelf life threshold: med must have at least 2 days shelf life
  if (daysToExpiry < 2) {
    return {
      isValid: false,
      error: `Batch #${donorStock.batchNumber} expires in ${daysToExpiry} days. Minimum clinical shelf life of 48 hours required for transfer.`,
    };
  }

  return { isValid: true };
}

/**
 * Evaluates all candidate donor clinics for a specific recipient clinic and medicine.
 * Returns a list of candidate evaluations with clear eligibility and rejection rationale.
 */
export function evaluateCandidateDonorsForRecipient(
  recipientStock: StockRecord,
  allStockRecords: StockRecord[],
  clinics: Clinic[],
  medicine: Medicine,
  referenceDate: Date = new Date(),
  targetNeed?: number
): CandidateEvaluation[] {
  const clinicMap = new Map(clinics.map((c) => [c.id, c]));
  const evaluations: CandidateEvaluation[] = [];

  const needed = targetNeed ?? calculateRecipientTargetNeed(recipientStock).targetNeed;

  // Find all stock records of the same medicine across other clinics
  const otherClinicsStock = allStockRecords.filter(
    (sr) => sr.medicineId === recipientStock.medicineId && sr.clinicId !== recipientStock.clinicId
  );

  for (const donorStock of otherClinicsStock) {
    const donorClinic = clinicMap.get(donorStock.clinicId);
    if (!donorClinic) continue;

    const route = getRouteInfo(donorStock.clinicId, recipientStock.clinicId);
    const availableSurplus = Math.max(0, donorStock.currentStock - donorStock.minSafetyStock);
    const daysToExpiry = calculateDaysToExpiry(donorStock.expiryDate, referenceDate);

    let isEligible = true;
    let rejectionReason: string | undefined;

    // Check 1: Formulation / Medicine identity
    if (donorStock.medicineId !== recipientStock.medicineId) {
      isEligible = false;
      rejectionReason = 'Incompatible medicine or formulation';
    }
    // Check 2: Expiry
    else if (daysToExpiry <= 0) {
      isEligible = false;
      rejectionReason = `Batch #${donorStock.batchNumber} expired on ${donorStock.expiryDate}`;
    }
    // Check 3: Shelf life vs transit
    else if (daysToExpiry < 2) {
      isEligible = false;
      rejectionReason = `Insufficient shelf life (${daysToExpiry} days remaining; minimum 48h required)`;
    }
    // Check 4: Zero surplus
    else if (availableSurplus <= 0) {
      isEligible = false;
      rejectionReason = `Zero surplus: holds ${donorStock.currentStock} units at safety minimum of ${donorStock.minSafetyStock}`;
    }
    // Check 5: Insufficient surplus to cover target need
    else if (availableSurplus < needed) {
      isEligible = false;
      const deficitAfterTransfer = donorStock.minSafetyStock - (donorStock.currentStock - needed);
      rejectionReason = `Insufficient surplus: holds ${donorStock.currentStock} units with ${donorStock.minSafetyStock} safety reserve (surplus of ${availableSurplus} units; transfer of ${needed} units would leave ${donorStock.currentStock - needed} units, breaching safety reserve by ${deficitAfterTransfer} units)`;
    }

    // Score calculation for eligible donors
    let selectionScore = 0;
    if (isEligible) {
      selectionScore = 500;
      // Bonus for abundant surplus relative to safety reserve
      selectionScore += Math.min(200, (availableSurplus / (donorStock.minSafetyStock || 1)) * 50);
      // Expiry priority (prioritize transferring batch expiring within 45 days if valid)
      if (daysToExpiry <= 45) selectionScore += 250;
      // Proximity penalty (shorter distance preferred)
      selectionScore -= route.distanceKm * 6;
    }

    const projectedPostStock = donorStock.currentStock - needed;

    evaluations.push({
      clinicId: donorClinic.id,
      clinicName: donorClinic.name,
      clinicCode: donorClinic.code,
      currentStock: donorStock.currentStock,
      safetyStock: donorStock.minSafetyStock,
      availableSurplus,
      batchNumber: donorStock.batchNumber,
      expiryDate: donorStock.expiryDate,
      daysToExpiry,
      distanceKm: route.distanceKm,
      transitMinutes: route.transitMinutes,
      isEligible,
      rejectionReason,
      selectionScore,
      avgDailyConsumption: donorStock.avgDailyConsumption,
      projectedPostStock: isEligible ? projectedPostStock : undefined,
    });
  }

  // Sort: eligible first (highest score first), then ineligible
  return evaluations.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return (b.selectionScore || 0) - (a.selectionScore || 0);
  });
}

/**
 * Finds the best donor and creates a single recommendation for a specific recipient stock record.
 * Used by the "Match Donor" modal in Dashboard, Inventory, and Emergency views.
 */
export function findBestDonorRecommendation(
  recipientStock: StockRecord,
  allStockRecords: StockRecord[],
  clinics: Clinic[],
  medicines: Medicine[],
  referenceDate: Date = new Date()
): { recommendation: RedistributionRecommendation | null; candidates: CandidateEvaluation[] } {
  const medicine = medicines.find((m) => m.id === recipientStock.medicineId);
  const recipientClinic = clinics.find((c) => c.id === recipientStock.clinicId);
  if (!medicine || !recipientClinic) {
    return { recommendation: null, candidates: [] };
  }

  const { immediateDeficit, operatingBuffer, targetNeed } = calculateRecipientTargetNeed(recipientStock);

  const candidates = evaluateCandidateDonorsForRecipient(
    recipientStock,
    allStockRecords,
    clinics,
    medicine,
    referenceDate,
    targetNeed
  );

  const bestDonor = candidates.find((c) => c.isEligible);
  if (!bestDonor) {
    return { recommendation: null, candidates };
  }

  const donorStock = allStockRecords.find(
    (sr) => sr.clinicId === bestDonor.clinicId && sr.medicineId === recipientStock.medicineId
  );
  if (!donorStock) {
    return { recommendation: null, candidates };
  }

  const recipientDays = calculateDaysUntilStockout(recipientStock.currentStock, recipientStock.avgDailyConsumption);
  const transferQty = Math.min(bestDonor.availableSurplus, targetNeed);
  if (transferQty <= 0) {
    return { recommendation: null, candidates };
  }

  const donorPreStock = donorStock.currentStock;
  const donorPostStock = donorPreStock - transferQty;
  const recipientPreStock = recipientStock.currentStock;
  const recipientPostStock = recipientPreStock + transferQty;
  const recipientPostDays = calculateDaysUntilStockout(recipientPostStock, recipientStock.avgDailyConsumption);

  let urgency: PriorityLevel = 'MEDIUM';
  if (recipientDays <= 2.5 || recipientStock.currentStock === 0) urgency = 'CRITICAL';
  else if (recipientStock.currentStock < recipientStock.minSafetyStock || medicine.isEmergencyEssential) urgency = 'HIGH';

  const rejectedSummary = candidates
    .filter((c) => !c.isEligible)
    .map((c) => `${c.clinicCode}: ${c.rejectionReason}`)
    .join('; ');

  const quantityRationale = `Transfer quantity of ${transferQty} ${medicine.unit} is preferred over the bare minimum deficit of ${immediateDeficit} ${medicine.unit} because ${immediateDeficit} ${medicine.unit} would leave zero operating buffer above the safety threshold of ${recipientStock.minSafetyStock} ${medicine.unit}, causing the clinic to breach safety levels again within 24 hours (at ${recipientStock.avgDailyConsumption} ${medicine.unit}/day burn). Transferring ${transferQty} ${medicine.unit} establishes a 3-day operating buffer (${operatingBuffer} ${medicine.unit}), achieving ${recipientPostDays} days of total supply while preserving ${donorPostStock} ${medicine.unit} (well above the donor reserve of ${donorStock.minSafetyStock} ${medicine.unit}). Note: This quantity reflects an operational coverage recommendation balancing runway and donor conservation; it is not a mathematically unique global optimum, as alternative feasible quantities exist within the donor's surplus.`;

  const explanation = {
    summary: `Transfer ${transferQty} ${medicine.unit} of ${medicine.name} from ${bestDonor.clinicName} (${bestDonor.distanceKm} km, ~${bestDonor.transitMinutes} mins) to ${recipientClinic.name} to eliminate shortage.`,
    donorRationale: `${bestDonor.clinicName} has ${donorPreStock} ${medicine.unit} (${bestDonor.availableSurplus} ${medicine.unit} above its safety reserve of ${donorStock.minSafetyStock}). Donating ${transferQty} ${medicine.unit} leaves ${donorPostStock} ${medicine.unit} (~${calculateDaysUntilStockout(donorPostStock, donorStock.avgDailyConsumption)} days supply).`,
    recipientRationale: `${recipientClinic.name} has only ${recipientPreStock} ${medicine.unit} (${recipientDays} days supply), below its safety threshold of ${recipientStock.minSafetyStock}. Transfer brings stock to ${recipientPostStock} ${medicine.unit} (~${recipientPostDays} days runway).`,
    safetyCompliance: `100% compliant with Regional Safety Reserve Protocol. Donor reserve remains strictly protected (${donorPostStock} >= ${donorStock.minSafetyStock} units).`,
    quantityRationale,
    rejectedAlternatives: rejectedSummary || 'All alternative candidate facilities evaluated.',
  };

  const recommendation: RedistributionRecommendation = {
    id: `rec-${donorStock.clinicId}-${recipientStock.clinicId}-${medicine.id}`,
    medicineId: medicine.id,
    donorClinicId: donorStock.clinicId,
    recipientClinicId: recipientStock.clinicId,
    recommendedQuantity: transferQty,
    urgency,
    distanceKm: bestDonor.distanceKm,
    estimatedTransitMinutes: bestDonor.transitMinutes,
    explanation,
    donorPreStock,
    donorPostStock,
    donorSafetyStock: donorStock.minSafetyStock,
    recipientPreStock,
    recipientPostStock,
    recipientSafetyStock: recipientStock.minSafetyStock,
    recipientPreDays: recipientDays,
    recipientPostDays,
    status: 'RECOMMENDED',
    createdAt: new Date().toISOString(),
    expiryDate: donorStock.expiryDate,
    batchNumber: donorStock.batchNumber,
    candidatesEvaluated: candidates,
  };

  return { recommendation, candidates };
}

/**
 * Core smart redistribution engine.
 * Computes deterministic, optimal, safe inter-clinic inventory transfers from surplus clinics to shortage clinics.
 */
export function generateRedistributionRecommendations({
  clinics,
  medicines,
  stockRecords,
  existingRecommendations = [],
  referenceDate = new Date(),
}: RedistributionInput): RedistributionRecommendation[] {
  const clinicMap = new Map(clinics.map((c) => [c.id, c]));
  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  const activePairKeys = new Set(
    existingRecommendations
      .filter((r) => r.status === 'RECOMMENDED' || r.status === 'ACCEPTED' || r.status === 'IN_TRANSIT')
      .map((r) => `${r.donorClinicId}-${r.recipientClinicId}-${r.medicineId}`)
  );

  const recommendations: RedistributionRecommendation[] = [];

  const recordsByMedicine = new Map<string, StockRecord[]>();
  for (const record of stockRecords) {
    if (!recordsByMedicine.has(record.medicineId)) {
      recordsByMedicine.set(record.medicineId, []);
    }
    recordsByMedicine.get(record.medicineId)!.push(record);
  }

  for (const [medId, records] of recordsByMedicine.entries()) {
    const medicine = medicineMap.get(medId);
    if (!medicine) continue;

    // 1. Identify recipient clinics in shortage
    const recipients = records
      .filter((rec) => {
        const daysLeft = calculateDaysUntilStockout(rec.currentStock, rec.avgDailyConsumption);
        return rec.currentStock < rec.minSafetyStock || daysLeft <= 5.0;
      })
      .map((rec) => {
        const daysLeft = calculateDaysUntilStockout(rec.currentStock, rec.avgDailyConsumption);
        const { immediateDeficit, operatingBuffer, targetNeed } = calculateRecipientTargetNeed(rec);

        return {
          record: rec,
          daysLeft,
          immediateDeficit,
          operatingBuffer,
          needed: targetNeed,
          isCritical: rec.currentStock === 0 || daysLeft <= 2.5,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (recipients.length === 0) continue;

    // 2. Track donor available surplus in this evaluation round
    const donorSurplusMap = new Map<string, number>();
    for (const rec of records) {
      const daysToExpiry = calculateDaysToExpiry(rec.expiryDate, referenceDate);
      if (daysToExpiry >= 2 && rec.currentStock > rec.minSafetyStock) {
        donorSurplusMap.set(rec.clinicId, rec.currentStock - rec.minSafetyStock);
      } else {
        donorSurplusMap.set(rec.clinicId, 0);
      }
    }

    // 3. Match recipients to optimal donors
    for (const recipient of recipients) {
      let remainingNeed = recipient.needed;

      const candidates = evaluateCandidateDonorsForRecipient(
        recipient.record,
        records,
        clinics,
        medicine,
        referenceDate,
        remainingNeed
      );

      const eligibleCandidates = candidates.filter((c) => {
        const roundSurplus = donorSurplusMap.get(c.clinicId) || 0;
        return c.isEligible && roundSurplus > 0;
      });

      for (const donorCandidate of eligibleCandidates) {
        if (remainingNeed <= 0) break;

        const currentAvailable = donorSurplusMap.get(donorCandidate.clinicId) || 0;
        if (currentAvailable <= 0) continue;

        const pairKey = `${donorCandidate.clinicId}-${recipient.record.clinicId}-${medId}`;
        if (activePairKeys.has(pairKey)) continue;

        const donorStock = records.find((r) => r.clinicId === donorCandidate.clinicId);
        if (!donorStock) continue;

        const transferQty = Math.min(currentAvailable, remainingNeed);
        if (transferQty <= 0) continue;

        if (donorStock.currentStock - transferQty < donorStock.minSafetyStock) {
          continue;
        }

        const donorClinic = clinicMap.get(donorCandidate.clinicId);
        const recipientClinic = clinicMap.get(recipient.record.clinicId);
        if (!donorClinic || !recipientClinic) continue;

        let urgency: PriorityLevel = 'MEDIUM';
        if (recipient.isCritical || medicine.isEmergencyEssential) {
          urgency = recipient.daysLeft <= 2.0 ? 'CRITICAL' : 'HIGH';
        } else if (recipient.record.currentStock < recipient.record.minSafetyStock) {
          urgency = 'HIGH';
        }

        const donorPreStock = donorStock.currentStock;
        const donorPostStock = donorPreStock - transferQty;
        const recipientPreStock = recipient.record.currentStock;
        const recipientPostStock = recipientPreStock + transferQty;

        const recipientPreDays = recipient.daysLeft;
        const recipientPostDays = calculateDaysUntilStockout(recipientPostStock, recipient.record.avgDailyConsumption);

        const daysToExpiry = donorCandidate.daysToExpiry;
        const expiryNotice = daysToExpiry <= 45
          ? ` Rescues batch #${donorCandidate.batchNumber} expiring in ${daysToExpiry} days from spoilage.`
          : '';

        const rejectedSummary = candidates
          .filter((c) => !c.isEligible && c.clinicId !== donorCandidate.clinicId)
          .map((c) => `${c.clinicCode}: ${c.rejectionReason}`)
          .join('; ');

        const quantityRationale = `Transfer quantity of ${transferQty} ${medicine.unit} is preferred over the bare minimum deficit of ${recipient.immediateDeficit} ${medicine.unit} because ${recipient.immediateDeficit} ${medicine.unit} would leave zero operating buffer above the safety threshold of ${recipient.record.minSafetyStock} ${medicine.unit}, causing the clinic to breach safety levels again within 24 hours (at ${recipient.record.avgDailyConsumption} ${medicine.unit}/day burn). Transferring ${transferQty} ${medicine.unit} establishes a 3-day operating buffer (${recipient.operatingBuffer} ${medicine.unit}), achieving ${recipientPostDays} days of total supply while preserving ${donorPostStock} ${medicine.unit} (well above the donor reserve of ${donorStock.minSafetyStock} ${medicine.unit}). Note: This quantity reflects an operational coverage recommendation balancing runway and donor conservation; it is not a mathematically unique global optimum, as alternative feasible quantities exist within the donor's surplus.`;

        const explanation = {
          summary: `Transfer ${transferQty} ${medicine.unit} of ${medicine.name} from ${donorClinic.name} (${donorCandidate.distanceKm} km, ~${donorCandidate.transitMinutes} mins) to ${recipientClinic.name} to alleviate ${recipientPreDays <= 2.5 ? 'critical stockout' : 'inventory deficit'}.${expiryNotice}`,
          donorRationale: `${donorClinic.name} currently holds ${donorPreStock} ${medicine.unit} (${currentAvailable} ${medicine.unit} above its safety minimum of ${donorStock.minSafetyStock}). Reallocating ${transferQty} ${medicine.unit} leaves ${donorPostStock} ${medicine.unit} (${Math.round((donorPostStock / donorStock.minSafetyStock) * 100)}% of safety stock, ~${calculateDaysUntilStockout(donorPostStock, donorStock.avgDailyConsumption)} days supply).`,
          recipientRationale: `${recipientClinic.name} has only ${recipientPreStock} ${medicine.unit} remaining (${recipientPreDays} days supply), below its safety threshold of ${recipient.record.minSafetyStock} ${medicine.unit}. Transfer brings inventory to ${recipientPostStock} ${medicine.unit} (~${recipientPostDays} days runway).`,
          safetyCompliance: `Zero safety violations. Donor retains 100% of required reserve threshold (${donorStock.minSafetyStock} ${medicine.unit}).`,
          quantityRationale,
          rejectedAlternatives: rejectedSummary || 'All alternative candidate facilities evaluated.',
        };

        const recommendationId = `rec-${donorStock.clinicId}-${recipient.record.clinicId}-${medId}`;

        recommendations.push({
          id: recommendationId,
          medicineId: medId,
          donorClinicId: donorStock.clinicId,
          recipientClinicId: recipient.record.clinicId,
          recommendedQuantity: transferQty,
          urgency,
          distanceKm: donorCandidate.distanceKm,
          estimatedTransitMinutes: donorCandidate.transitMinutes,
          explanation,
          donorPreStock,
          donorPostStock,
          donorSafetyStock: donorStock.minSafetyStock,
          recipientPreStock,
          recipientPostStock,
          recipientSafetyStock: recipient.record.minSafetyStock,
          recipientPreDays,
          recipientPostDays,
          status: 'RECOMMENDED',
          createdAt: new Date().toISOString(),
          expiryDate: donorStock.expiryDate,
          batchNumber: donorStock.batchNumber,
          candidatesEvaluated: candidates,
        });

        donorSurplusMap.set(donorCandidate.clinicId, currentAvailable - transferQty);
        remainingNeed -= transferQty;
        activePairKeys.add(pairKey);
      }
    }
  }

  return recommendations.sort((a, b) => {
    const priorityWeight: Record<PriorityLevel, number> = {
      CRITICAL: 3,
      HIGH: 2,
      MEDIUM: 1,
    };
    const diff = priorityWeight[b.urgency] - priorityWeight[a.urgency];
    if (diff !== 0) return diff;
    return a.distanceKm - b.distanceKm;
  });
}
