import {
  Clinic,
  Medicine,
  StockRecord,
  TransferRecord,
  RedistributionRecommendation,
} from '../types';
import { calculateStockMetrics } from './shortageCalculator';

export interface ImpactMetrics {
  // Verified Completed Demo Transfers
  completedTransfersCount: number;
  completedUnitsRedistributed: number;
  completedEconomicValue: number;
  completedEmergencyTransfers: number;

  // Projected Model Benefits (clearly labeled as simulated estimates)
  projectedStockoutsPrevented: number;
  projectedUnitsAvailable: number;
  expiringStockRescuedUnits: number;
  expiringStockRescuedValue: number;

  // Network Performance
  avgTransferDistanceKm: number;
  avgTransitMinutes: number;
  networkSafetyComplianceRate: number; // percentage of stock records respecting safety stock
}

export function calculateImpactMetrics(
  stockRecords: StockRecord[],
  medicines: Medicine[],
  transfers: TransferRecord[],
  recommendations: RedistributionRecommendation[]
): ImpactMetrics {
  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  const completedTransfers = transfers.filter((t) => t.status === 'COMPLETED');

  let completedUnitsRedistributed = 0;
  let completedEconomicValue = 0;
  let totalDistance = 0;
  let totalTransitMinutes = 0;
  let completedEmergencyTransfers = 0;

  for (const t of completedTransfers) {
    completedUnitsRedistributed += t.quantity;
    const med = medicineMap.get(t.medicineId);
    const cost = med ? med.standardUnitCost : 10;
    completedEconomicValue += t.quantity * cost;
    totalDistance += t.distanceKm;
    totalTransitMinutes += t.estimatedTransitMinutes;
    if (t.isEmergency) completedEmergencyTransfers++;
  }

  // Projected Stockouts Prevented (Estimated from completed transfers targeting shortages + pending accepted recommendations)
  const projectedStockoutsPrevented =
    transfers.filter((t) => t.urgency === 'CRITICAL' || t.isEmergency).length +
    recommendations.filter((r) => r.status === 'RECOMMENDED' && r.urgency === 'CRITICAL').length;

  // Available Surplus Units in the network
  let projectedUnitsAvailable = 0;
  for (const sr of stockRecords) {
    if (sr.currentStock > sr.minSafetyStock) {
      projectedUnitsAvailable += sr.currentStock - sr.minSafetyStock;
    }
  }

  // Expiring units identified / rescued:
  let expiringStockRescuedUnits = 0;
  let expiringStockRescuedValue = 0;

  for (const r of recommendations) {
    if (r.explanation.summary.includes('Rescues batch') && (r.status === 'ACCEPTED' || r.status === 'COMPLETED')) {
      expiringStockRescuedUnits += r.recommendedQuantity;
      const med = medicineMap.get(r.medicineId);
      expiringStockRescuedValue += r.recommendedQuantity * (med ? med.standardUnitCost : 10);
    }
  }

  // Network safety compliance rate
  let compliantRecords = 0;
  for (const sr of stockRecords) {
    if (sr.currentStock >= sr.minSafetyStock) {
      compliantRecords++;
    }
  }
  const networkSafetyComplianceRate =
    stockRecords.length > 0 ? Math.round((compliantRecords / stockRecords.length) * 100) : 100;

  const count = completedTransfers.length || 1;
  const avgTransferDistanceKm = completedTransfers.length > 0 ? Math.round((totalDistance / count) * 10) / 10 : 0;
  const avgTransitMinutes = completedTransfers.length > 0 ? Math.round(totalTransitMinutes / count) : 0;

  return {
    completedTransfersCount: completedTransfers.length,
    completedUnitsRedistributed,
    completedEconomicValue: Math.round(completedEconomicValue * 100) / 100,
    completedEmergencyTransfers,
    projectedStockoutsPrevented,
    projectedUnitsAvailable,
    expiringStockRescuedUnits,
    expiringStockRescuedValue: Math.round(expiringStockRescuedValue * 100) / 100,
    avgTransferDistanceKm,
    avgTransitMinutes,
    networkSafetyComplianceRate,
  };
}

export interface ClinicHealthSummary {
  clinic: Clinic;
  totalMedicines: number;
  criticalCount: number;
  lowStockCount: number;
  optimalCount: number;
  surplusCount: number;
  expiringCount: number;
  averageHealthScore: number;
}

export function calculateClinicSummaries(
  clinics: Clinic[],
  stockRecords: StockRecord[]
): ClinicHealthSummary[] {
  return clinics.map((clinic) => {
    const records = stockRecords.filter((sr) => sr.clinicId === clinic.id);
    let criticalCount = 0;
    let lowStockCount = 0;
    let optimalCount = 0;
    let surplusCount = 0;
    let expiringCount = 0;
    let totalScore = 0;

    for (const rec of records) {
      const calc = calculateStockMetrics(rec);
      totalScore += calc.healthScore;
      if (calc.status === 'CRITICAL') criticalCount++;
      else if (calc.status === 'LOW_STOCK') lowStockCount++;
      else if (calc.status === 'SURPLUS') surplusCount++;
      else if (calc.status === 'EXPIRING_SOON') expiringCount++;
      else optimalCount++;
    }

    return {
      clinic,
      totalMedicines: records.length,
      criticalCount,
      lowStockCount,
      optimalCount,
      surplusCount,
      expiringCount,
      averageHealthScore: records.length > 0 ? Math.round(totalScore / records.length) : 100,
    };
  });
}
