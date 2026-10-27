import React, { useState, useEffect } from 'react';
import { StockRecord, EnrichedStockItem } from '../../types';
import { Modal } from '../common/Modal';
import { calculateDaysUntilStockout, classifyStockStatus } from '../../services/shortageCalculator';
import { StatusBadge } from '../common/StatusBadge';
import { AlertCircle } from 'lucide-react';

interface StockEditModalProps {
  item: EnrichedStockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: StockRecord) => void;
}

export const StockEditModal: React.FC<StockEditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minSafetyStock, setMinSafetyStock] = useState<number>(0);
  const [avgDailyConsumption, setAvgDailyConsumption] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setCurrentStock(item.currentStock);
      setMinSafetyStock(item.minSafetyStock);
      setAvgDailyConsumption(item.avgDailyConsumption);
      setBatchNumber(item.batchNumber);
      setExpiryDate(item.expiryDate);
      setError(null);
    }
  }, [item]);

  if (!item) return null;

  // Live preview calculation
  const previewDaysLeft = calculateDaysUntilStockout(currentStock, avgDailyConsumption);
  const previewStatus = classifyStockStatus(
    currentStock,
    minSafetyStock,
    avgDailyConsumption,
    expiryDate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStock < 0 || minSafetyStock < 0 || avgDailyConsumption < 0) {
      setError('Quantities cannot be negative.');
      return;
    }
    if (!batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required.');
      return;
    }

    onSave({
      ...item,
      currentStock: Number(currentStock),
      minSafetyStock: Number(minSafetyStock),
      avgDailyConsumption: Number(avgDailyConsumption),
      batchNumber: batchNumber.trim(),
      expiryDate,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Stock: ${item.medicine.name}`}
      subtitle={`${item.clinic.name} (${item.clinic.code}) • Batch #${item.batchNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-vermilion/5 border border-vermilion/30 text-vermilion text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Status Calculation Preview */}
        <div className="bg-paper p-3.5 rounded border border-concrete flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Projected Status
            </span>
            <div className="mt-1">
              <StatusBadge status={previewStatus} size="sm" />
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-[10px] text-muted block font-sans">Projected Runway</span>
            <strong className="text-sm font-bold text-ink tabular-nums">{previewDaysLeft} days</strong>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Current On-Hand
            </label>
            <input
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Safety Minimum
            </label>
            <input
              type="number"
              min="0"
              value={minSafetyStock}
              onChange={(e) => setMinSafetyStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Avg Daily Burn
            </label>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={avgDailyConsumption}
              onChange={(e) => setAvgDailyConsumption(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Batch Lot Code
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
            Batch Expiration Date
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-medium text-ink focus:outline-none focus:border-ink"
            required
          />
        </div>

        <div className="pt-3 border-t border-concrete flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-graphite hover:text-ink bg-white hover:bg-concrete/40 border border-concrete rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-ink hover:bg-black rounded transition-colors cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
          >
            Update Inventory Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
