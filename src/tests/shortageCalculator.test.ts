import { describe, it, expect } from 'vitest';
import {
  calculateDaysUntilStockout,
  calculateDaysToExpiry,
  classifyStockStatus,
  calculateStockMetrics,
  generateDemandForecast,
} from '../services/shortageCalculator';
import { StockRecord } from '../types';

describe('Shortage Calculator Service', () => {
  it('correctly calculates days until stockout', () => {
    // Current stock 100, daily burn 20 -> 5.0 days
    expect(calculateDaysUntilStockout(100, 20)).toBe(5);

    // Current stock 0 -> 0 days
    expect(calculateDaysUntilStockout(0, 15)).toBe(0);

    // Negative stock -> 0 days
    expect(calculateDaysUntilStockout(-5, 10)).toBe(0);

    // 0 daily consumption -> safe 999 runway
    expect(calculateDaysUntilStockout(100, 0)).toBe(999);

    // Fractional rounding
    expect(calculateDaysUntilStockout(28, 22)).toBe(1.3);
  });

  it('correctly calculates days to expiry', () => {
    const baseDate = new Date('2026-10-20T00:00:00Z');
    expect(calculateDaysToExpiry('2026-10-30', baseDate)).toBe(10);
    expect(calculateDaysToExpiry('2026-11-19', baseDate)).toBe(30);
  });

  it('classifies stock status tiers correctly', () => {
    const baseDate = new Date('2026-10-20T00:00:00Z');

    // CRITICAL: <= 2.5 days left
    expect(classifyStockStatus(6, 25, 5, '2027-01-01', baseDate)).toBe('CRITICAL');

    // CRITICAL: 0 stock
    expect(classifyStockStatus(0, 50, 10, '2027-01-01', baseDate)).toBe('CRITICAL');

    // LOW_STOCK: stock < minSafetyStock even if days > 2.5
    expect(classifyStockStatus(35, 40, 7, '2027-01-01', baseDate)).toBe('LOW_STOCK');

    // EXPIRING_SOON: within 45 days
    expect(classifyStockStatus(100, 30, 2, '2026-11-10', baseDate)).toBe('EXPIRING_SOON');

    // SURPLUS: > 2x safety stock and > 25 days runway
    expect(classifyStockStatus(500, 100, 5, '2027-01-01', baseDate)).toBe('SURPLUS');

    // OPTIMAL: healthy stock, reasonable runway
    expect(classifyStockStatus(120, 80, 10, '2027-01-01', baseDate)).toBe('OPTIMAL');
  });

  it('generates 14-day demand forecast', () => {
    const sampleRecord: StockRecord = {
      id: 'test-1',
      clinicId: 'c1',
      medicineId: 'm1',
      currentStock: 100,
      minSafetyStock: 30,
      maxCapacity: 200,
      avgDailyConsumption: 10,
      batchNumber: 'TEST-B1',
      expiryDate: '2027-01-01',
      lastRestocked: '2026-10-01',
    };

    const forecast = generateDemandForecast(sampleRecord, 14, 1.0, new Date('2026-10-20'));
    expect(forecast.length).toBe(15); // Day 0 to 14
    expect(forecast[0].projectedStock).toBe(100);
    expect(forecast[14].projectedStock).toBeLessThan(100);
    // Safety check that projected stock never dips below 0
    forecast.forEach((f) => expect(f.projectedStock).toBeGreaterThanOrEqual(0));
  });
});
