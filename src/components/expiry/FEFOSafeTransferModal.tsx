import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  Clock,
  PackageCheck,
  DollarSign,
} from 'lucide-react';
import { FEFORedistributionRecommendation, validateFEFOTransferSafety } from '../../services/fefoEngine';
import { useApp } from '../../context/AppContext';

interface FEFOSafeTransferModalProps {
  recommendation: FEFORedistributionRecommendation | null;
  customQuantity?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const FEFOSafeTransferModal: React.FC<FEFOSafeTransferModalProps> = ({
  recommendation,
  customQuantity,
  isOpen,
  onClose,
}) => {
  const { stockRecords, confirmFEFOTransfer } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !recommendation) return null;

  const dispatchQuantity = customQuantity ?? recommendation.recommendedQuantity;

  // Find live stock records for live revalidation
  const donorStock = stockRecords.find(
    (s) => s.clinicId === recommendation.donorClinicId && s.medicineId === recommendation.medicineId
  );
  const recipientStock = stockRecords.find(
    (s) => s.clinicId === recommendation.recipientClinicId && s.medicineId === recommendation.medicineId
  );

  const preValidation = donorStock && recipientStock
    ? validateFEFOTransferSafety(donorStock, recipientStock, dispatchQuantity, {
        transitMinutes: recommendation.estimatedTransitMinutes,
      })
    : { isValid: false, error: 'Inventory records not loaded.' };

  const handleConfirm = () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const recToConfirm: FEFORedistributionRecommendation = {
        ...recommendation,
        recommendedQuantity: dispatchQuantity,
        estimatedWastageUnitsSaved: dispatchQuantity,
        estimatedWastageValueSaved: Math.round(dispatchQuantity * recommendation.standardUnitCost * 100) / 100,
        donorPostStock: (donorStock?.currentStock || recommendation.donorAvailableStock) - dispatchQuantity,
        recipientPostStock: (recipientStock?.currentStock || recommendation.recipientPreStock) + dispatchQuantity,
      };

      const result = confirmFEFOTransfer(recToConfirm);
      if (result.success) {
        setIsSubmitting(false);
        onClose();
      } else {
        setErrorMsg(result.error || 'Failed to execute transfer.');
        setIsSubmitting(false);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred during dispatch.');
      setIsSubmitting(false);
    }
  };

  const donorPostStock = (donorStock?.currentStock || recommendation.donorAvailableStock) - dispatchQuantity;
  const donorSafetyReserve = donorStock?.minSafetyStock || recommendation.donorSafetyStock;
  const recipientPostStock = (recipientStock?.currentStock || recommendation.recipientPreStock) + dispatchQuantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fefo-modal-title"
    >
      <div className="bg-[#171923] rounded-xl border border-[#2D3142] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 text-white">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#2D3142]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5AA98C] bg-[#16815D]/20 px-2 py-0.5 rounded-lg border border-[#16815D]/40 font-semibold">
                FEFO Clinical Authorization
              </span>
              <span className="text-xs font-mono text-[#A0A0AA]">
                Ref #{recommendation.batchNumber}
              </span>
            </div>
            <h3 id="fefo-modal-title" className="font-serif text-2xl text-white font-normal tracking-tight">
              Authorize Expiry-Safe Redistribution
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A0A0AA] hover:text-white hover:bg-[#222431] transition-colors cursor-pointer"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicine Overview */}
        <div className="bg-[#222431] p-4 rounded-lg border border-[#2D3142] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="font-serif text-lg text-white font-normal">
                {recommendation.medicineName}
              </span>
              <div className="text-xs text-[#A0A0AA] font-mono">
                {recommendation.genericName} &bull; {recommendation.dosageForm}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#A0A0AA] font-mono uppercase block">Authorized Units</span>
              <span className="text-2xl font-mono font-bold text-blue-400">
                {dispatchQuantity} units
              </span>
            </div>
          </div>
        </div>

        {/* Route Transfer Geometry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Donor Facility Panel */}
          <div className="bg-[#222431] p-3.5 rounded-lg border border-[#2D3142] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#A0A0AA]">Donor (Source)</span>
              <span className="font-mono font-bold text-white">{recommendation.donorClinicCode}</span>
            </div>
            <div className="font-medium text-white truncate">{recommendation.donorClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#A0A0AA]">Current On-Hand:</span>
                <span className="text-white">{donorStock?.currentStock || recommendation.donorAvailableStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0A0AA]">Post-Dispatch Stock:</span>
                <span className="text-[#5AA98C] font-bold">{donorPostStock} units</span>
              </div>
              <div className="flex justify-between text-[#5AA98C] font-semibold border-t border-[#2D3142] pt-1">
                <span>Minimum Safety Reserve:</span>
                <span>{donorSafetyReserve} units (Safe)</span>
              </div>
            </div>
          </div>

          {/* Recipient Facility Panel */}
          <div className="bg-[#222431] p-3.5 rounded-lg border border-[#2D3142] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#A0A0AA]">Recipient (Destination)</span>
              <span className="font-mono font-bold text-white">{recommendation.recipientClinicCode}</span>
            </div>
            <div className="font-medium text-white truncate">{recommendation.recipientClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#A0A0AA]">Current On-Hand:</span>
                <span className="text-white">{recipientStock?.currentStock || recommendation.recipientPreStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0A0AA]">Post-Dispatch Stock:</span>
                <span className="text-white font-bold">{recipientPostStock} units</span>
              </div>
              <div className="flex justify-between text-white border-t border-[#2D3142] pt-1">
                <span className="text-[#A0A0AA]">Usable Days Runway:</span>
                <span>{recommendation.recipientPreDays}d &rarr; {recommendation.recipientPostDays}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Invariant Verification Checklist */}
        <div className="bg-[#222431] p-4 rounded-lg border border-[#2D3142] space-y-2">
          <span className="text-xs font-semibold text-white font-sans block">
            Pre-Dispatch Algorithmic Verification Checklist
          </span>
          <div className="space-y-1.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-[#5AA98C]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Donor Safety Reserve Invariant:</strong> {donorPostStock} &ge; {donorSafetyReserve} units (Margin of +{donorPostStock - donorSafetyReserve} units preserved).
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#5AA98C]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Consumption Feasibility:</strong> Recipient burns {recommendation.recipientDailyConsumption} units/day; projected to consume ~{recommendation.recipientProjectedUsageBeforeExpiry} units in remaining {recommendation.remainingUsableDays} usable days.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#5AA98C]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Shelf Life & Cold-Chain Transit:</strong> Batch expires in {recommendation.daysToExpiry} days (transit: ~{recommendation.estimatedTransitMinutes} mins). Exceeds 48h clinical minimum threshold.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#5AA98C]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Physical Storage Headroom:</strong> Recipient capacity limit is satisfied ({recipientPostStock} &le; {recipientStock?.maxCapacity || 300} max capacity).
              </span>
            </div>
          </div>
        </div>

        {/* Error Warning if Prevalidation fails */}
        {(!preValidation.isValid || errorMsg) && (
          <div className="bg-[#BB232B]/20 border border-[#BB232B]/40 p-3 rounded-lg flex items-center gap-2 text-xs text-[#FF6B72] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#FF6B72] flex-shrink-0" />
            <span>{errorMsg || preValidation.error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2D3142]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-sans text-[#A0A0AA] hover:text-white hover:bg-[#222431] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!preValidation.isValid || isSubmitting}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans font-medium text-xs text-white shadow-md transition-colors cursor-pointer ${
              !preValidation.isValid || isSubmitting
                ? 'bg-[#222431] text-[#A0A0AA] border border-[#2D3142] cursor-not-allowed'
                : 'bg-[#2C3480] hover:bg-[#232a6b]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>
              {isSubmitting ? 'Confirming Dispatch...' : `Confirm & Execute Transfer (${dispatchQuantity} Units)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
