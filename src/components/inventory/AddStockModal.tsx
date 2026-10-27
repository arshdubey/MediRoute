import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { AlertCircle } from 'lucide-react';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose }) => {
  const { clinics, medicines, addStockRecord } = useApp();

  const [clinicId, setClinicId] = useState<string>(clinics[0]?.id || 'c1');
  const [medicineId, setMedicineId] = useState<string>(medicines[0]?.id || 'm1');
  const [currentStock, setCurrentStock] = useState<number>(100);
  const [minSafetyStock, setMinSafetyStock] = useState<number>(40);
  const [maxCapacity, setMaxCapacity] = useState<number>(300);
  const [avgDailyConsumption, setAvgDailyConsumption] = useState<number>(5);
  const [batchNumber, setBatchNumber] = useState<string>(`LOT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Default expiry 180 days out
  const defaultExp = new Date();
  defaultExp.setDate(defaultExp.getDate() + 180);
  const [expiryDate, setExpiryDate] = useState<string>(defaultExp.toISOString().split('T')[0]);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStock < 0 || minSafetyStock < 0 || avgDailyConsumption <= 0) {
      setError('Please enter valid positive quantities.');
      return;
    }
    if (!batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }

    addStockRecord({
      clinicId,
      medicineId,
      currentStock: Number(currentStock),
      minSafetyStock: Number(minSafetyStock),
      maxCapacity: Number(maxCapacity),
      avgDailyConsumption: Number(avgDailyConsumption),
      batchNumber: batchNumber.trim().toUpperCase(),
      expiryDate,
      lastRestocked: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  const selectedMed = medicines.find((m) => m.id === medicineId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Medicine Stock Batch"
      subtitle="Register an incoming batch or supplement clinical inventory"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-vermilion/5 border border-vermilion/30 text-vermilion text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Facility / Clinic
            </label>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-concrete rounded bg-paper font-medium text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Pharmaceutical Agent
            </label>
            <select
              value={medicineId}
              onChange={(e) => setMedicineId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-concrete rounded bg-paper font-medium text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.dosageForm})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Current Stock ({selectedMed?.unit || 'units'})
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
              Min Safety Stock
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

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Max Capacity
            </label>
            <input
              type="number"
              min="0"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              Batch Lot Number
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-medium text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>
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
            Save Stock Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
