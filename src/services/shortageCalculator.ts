import { StockRecord, StockCalculation, StockStatus } from '../types';

/**
 * Calculates estimated days until complete inventory stockout.
 * Formula: currentStock / avgDailyConsumption
 */
export function calculateDaysUntilStockout(currentStock: number, avgDailyConsumption: number): number {
  if (currentStock <= 0) return 0;
  if (avgDailyConsumption <= 0) return 999;
  const days = currentStock / avgDailyConsumption;
  return Math.round(days * 10) / 10;
}

/**
 * Calculates calendar days remaining until product batch expiry.
 */
export function calculateDaysToExpiry(expiryDate: string, referenceDate: Date = new Date()): number {
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Classifies inventory health tier based on safety thresholds, burn rate, and expiry window.
 */
export function classifyStockStatus(
  currentStock: number,
  minSafetyStock: number,
  avgDailyConsumption: number,
  expiryDate: string,
  referenceDate: Date = new Date()
): StockStatus {
  const daysLeft = calculateDaysUntilStockout(currentStock, avgDailyConsumption);
  const daysToExpiry = calculateDaysToExpiry(expiryDate, referenceDate);

  // Critical shortage: immediate danger of stockout (under 2.5 days or zero stock)
  if (currentStock === 0 || daysLeft <= 2.5) {
    return 'CRITICAL';
  }

  // Safety stock violation or acute supply dip (< 7 days)
  if (currentStock < minSafetyStock || daysLeft <= 7.0) {
    return 'LOW_STOCK';
  }

  // Batch expiring within 45 days while holding stock
  if (daysToExpiry > 0 && daysToExpiry <= 45) {
    return 'EXPIRING_SOON';
  }

  // Large surplus: stock exceeds 2.5x safety stock AND runway exceeds 25 days
  if (currentStock >= minSafetyStock * 2.0 && daysLeft >= 25) {
    return 'SURPLUS';
  }

  return 'OPTIMAL';
}

/**
 * Full calculation breakdown for a single stock record.
 */
export function calculateStockMetrics(record: StockRecord, referenceDate: Date = new Date()): StockCalculation {
  const daysUntilStockout = calculateDaysUntilStockout(record.currentStock, record.avgDailyConsumption);
  const daysToExpiry = calculateDaysToExpiry(record.expiryDate, referenceDate);
  const status = classifyStockStatus(
    record.currentStock,
    record.minSafetyStock,
    record.avgDailyConsumption,
    record.expiryDate,
    referenceDate
  );

  const surplusQuantity = Math.max(0, record.currentStock - record.minSafetyStock);
  const deficitQuantity = Math.max(0, record.minSafetyStock - record.currentStock);
  const isBelowSafetyStock = record.currentStock < record.minSafetyStock;
  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 45;

  // Composite health score (0-100)
  let healthScore = 100;
  if (status === 'CRITICAL') healthScore = Math.max(10, Math.round((record.currentStock / (record.minSafetyStock || 1)) * 40));
  else if (status === 'LOW_STOCK') healthScore = Math.min(65, Math.max(40, Math.round((record.currentStock / (record.minSafetyStock || 1)) * 70)));
  else if (status === 'EXPIRING_SOON') healthScore = 55;
  else if (status === 'SURPLUS') healthScore = 90;
  else healthScore = 95;

  return {
    status,
    daysUntilStockout,
    surplusQuantity,
    deficitQuantity,
    isBelowSafetyStock,
    isExpiringSoon,
    daysToExpiry,
    healthScore,
  };
}

export interface DayForecastPoint {
  dayNumber: number;
  dateLabel: string;
  projectedStock: number;
  expectedConsumption: number;
  minSafetyStock: number;
  confidenceLower: number;
  confidenceUpper: number;
  isBreached: boolean;
}

/**
 * Projects a 14-day stock curve taking into account average consumption,
 * weekend/weekday clinical variance (e.g. ±12%), and surge scenarios.
 */
export function generateDemandForecast(
  stockRecord: StockRecord,
  daysToProject = 14,
  surgeMultiplier = 1.0,
  referenceDate: Date = new Date()
): DayForecastPoint[] {
  const points: DayForecastPoint[] = [];
  let remainingStock = stockRecord.currentStock;
  const baseRate = stockRecord.avgDailyConsumption * surgeMultiplier;

  for (let i = 0; i <= daysToProject; i++) {
    const curDate = new Date(referenceDate);
    curDate.setDate(curDate.getDate() + i);
    const dayOfWeek = curDate.getDay(); // 0 is Sun, 6 is Sat

    // Realistic day-of-week demand variance: weekdays +10%, weekends -25% for outpatient
    const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : 1.10;
    const dailyBurn = i === 0 ? 0 : Math.round(baseRate * dayFactor * 10) / 10;

    remainingStock = Math.max(0, Math.round((remainingStock - dailyBurn) * 10) / 10);

    // Simple explainable confidence band (±15% variance based on clinical intake variability)
    const confidenceLower = Math.max(0, Math.round((remainingStock - (i * baseRate * 0.15)) * 10) / 10);
    const confidenceUpper = Math.round((remainingStock + (i * baseRate * 0.15)) * 10) / 10;

    points.push({
      dayNumber: i,
      dateLabel: i === 0 ? 'Today' : `Day +${i} (${curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      projectedStock: remainingStock,
      expectedConsumption: dailyBurn,
      minSafetyStock: stockRecord.minSafetyStock,
      confidenceLower,
      confidenceUpper,
      isBreached: remainingStock < stockRecord.minSafetyStock,
    });
  }

  return points;
}
