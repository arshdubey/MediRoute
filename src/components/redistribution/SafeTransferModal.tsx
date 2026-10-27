import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { validateTransferSafety } from '../../services/redistributionEngine';
import { getRouteInfo } from '../../data/distanceMatrix';
import { AlertCircle, CheckCircle2, Truck, ShieldAlert } from 'lucide-react';

interface SafeTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillMedicineId?: string;
  prefillRecipientClinicId?: string;
}

export const SafeTransferModal: React.FC<SafeTransferModalProps> = ({
  isOpen,
  onClose,
  prefillMedicineId,
  prefillRecipientClinicId,
}) => {
  const { clinics, medicines, stockRecords, executeManualTransfer } = useApp();

  const [donorClinicId, setDonorClinicId] = useState<string>(clinics[0]?.id || 'c1');
  const [recipientClinicId, setRecipientClinicId] = useState<string>(
    prefillRecipientClinicId || clinics[1]?.id || 'c2'
  );
  const [medicineId, setMedicineId] = useState<string>(prefillMedicineId || medicines[0]?.id || 'm1');
  const [quantity, setQuantity] = useState<number>(20);
  const [notes, setNotes] = useState<string>('Routine network balancing reallocation');
  const [error, setError] = useState<string | null>(null);

  // Look up donor stock record
  const donorStock = useMemo(() => {
    return stockRecords.find(
      (sr) => sr.clinicId === donorClinicId && sr.medicineId === medicineId
    );
  }, [stockRecords, donorClinicId, medicineId]);

  // Look up recipient stock record
  const recipientStock = useMemo(() => {
    return stockRecords.find(
      (sr) => sr.clinicId === recipientClinicId && sr.medicineId === medicineId
    );
  }, [stockRecords, recipientClinicId, medicineId]);

  // Route calculation
  const route = useMemo(() => {
    return getRouteInfo(donorClinicId, recipientClinicId);
  }, [donorClinicId, recipientClinicId]);

  // Safety validation
  const safetyStatus = useMemo(() => {
    if (donorClinicId === recipientClinicId) {
      return { isValid: false, message: 'Donor and recipient clinic cannot be identical.' };
    }
    if (!donorStock) {
      return { isValid: false, message: 'Donor facility has no recorded stock for this item.' };
    }
    const check = validateTransferSafety(donorStock, quantity);
    if (!check.isValid) {
      return { isValid: false, message: check.error || 'Donor safety threshold violated.' };
    }
    return {
      isValid: true,
      message: `Safe transfer. Donor will retain ${donorStock.currentStock - quantity} units (exceeds safety threshold of ${donorStock.minSafetyStock}).`,
    };
  }, [donorClinicId, recipientClinicId, donorStock, quantity]);

  const donorMaxAllowed = donorStock ? Math.max(0, donorStock.currentStock - donorStock.minSafetyStock) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyStatus.isValid) {
      setError(safetyStatus.message);
      return;
    }

    const res = executeManualTransfer(
      donorClinicId,
      recipientClinicId,
      medicineId,
      quantity,
      notes
    );

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Transfer failed.');
    }
  };

  const selectedMed = medicines.find((m) => m.id === medicineId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Custom Medicine Transfer"
      subtitle="Safely reallocate inventory with real-time donor safety reserve verification"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-vermilion/5 border border-vermilion/30 text-vermilion text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Medicine Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
            Medicine to Transfer
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

        {/* Donor & Recipient Clinics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Donor Facility (Source)
            </label>
            <select
              value={donorClinicId}
              onChange={(e) => setDonorClinicId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-concrete rounded bg-paper font-medium text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            {donorStock && (
              <p className="text-[11px] font-mono text-muted mt-1.5">
                Stock: <strong className="text-ink">{donorStock.currentStock}</strong> | Safety Min:{' '}
                {donorStock.minSafetyStock} | Safe Surplus:{' '}
                <strong className="text-clinicalGreen">{donorMaxAllowed}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
              Recipient Facility (Destination)
            </label>
            <select
              value={recipientClinicId}
              onChange={(e) => setRecipientClinicId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-concrete rounded bg-paper font-medium text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            {recipientStock && (
              <p className="text-[11px] font-mono text-muted mt-1.5">
                Current: <strong className="text-ink">{recipientStock.currentStock}</strong> | Safety Min:{' '}
                {recipientStock.minSafetyStock}
              </p>
            )}
          </div>
        </div>

        {/* Quantity & Max Surplus Pill */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-graphite font-medium">
              Transfer Quantity ({selectedMed?.unit || 'units'})
            </label>
            {donorStock && (
              <button
                type="button"
                onClick={() => setQuantity(donorMaxAllowed)}
                className="text-xs font-medium text-ink hover:underline cursor-pointer transition-colors"
              >
                Set to Max Safe Surplus ({donorMaxAllowed})
              </button>
            )}
          </div>
          <input
            type="number"
            min="1"
            max={donorStock?.currentStock || 500}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-concrete rounded bg-paper font-mono font-bold text-ink focus:outline-none focus:border-ink"
            required
          />
        </div>

        {/* Live Safety Constraint Banner */}
        <div
          className={`p-3.5 rounded border flex items-start gap-3 text-xs ${
            safetyStatus.isValid
              ? 'bg-clinicalGreen/5 border-clinicalGreen/30 text-clinicalGreen'
              : 'bg-vermilion/5 border-vermilion/30 text-vermilion'
          }`}
        >
          {safetyStatus.isValid ? (
            <CheckCircle2 className="w-4 h-4 text-clinicalGreen flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-vermilion flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block font-sans">
              {safetyStatus.isValid ? 'Safety Protocol Compliant' : 'Safety Constraint Blocked'}
            </span>
            <p className="mt-0.5 leading-relaxed font-sans text-graphite">{safetyStatus.message}</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-paper p-3 rounded border border-concrete flex items-center justify-between text-xs text-graphite font-sans">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-muted" />
            <span>Transit Distance:</span>
            <strong className="text-ink font-mono">{route.distanceKm} km</strong>
          </div>
          <div>
            <span>Estimated Courier Time:</span>{' '}
            <strong className="text-ink font-mono">~{route.transitMinutes} mins</strong>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-graphite mb-1.5 font-medium">
            Clinical Transfer Notes / Justification
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-concrete rounded bg-paper text-ink focus:outline-none focus:border-ink font-sans"
            placeholder="e.g. Alleviating emergency deficit, preventing stockout"
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
            disabled={!safetyStatus.isValid}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 ${
              safetyStatus.isValid
                ? 'bg-ink hover:bg-black text-white shadow-xs'
                : 'bg-concrete text-graphite cursor-not-allowed opacity-60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Confirm &amp; Dispatch Transfer</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
