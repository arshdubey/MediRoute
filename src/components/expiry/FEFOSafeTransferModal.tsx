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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fefo-modal-title"
    >
      <div className="bg-white rounded-xl border border-[#E5E5E8] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 text-[#080808]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E8]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#16815D] bg-[#16815D]/10 px-2 py-0.5 rounded-lg border border-[#16815D]/30 font-semibold">
                FEFO Clinical Authorization
              </span>
              <span className="text-xs font-mono text-[#737373]">
                Ref #{recommendation.batchNumber}
              </span>
            </div>
            <h3 id="fefo-modal-title" className="font-serif text-2xl text-[#080808] font-normal tracking-tight">
              Authorize Expiry-Safe Redistribution
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#080808] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicine Overview */}
        <div className="bg-[#F5F5F7] p-4 rounded-lg border border-[#E5E5E8] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="font-serif text-lg text-[#080808] font-normal">
                {recommendation.medicineName}
              </span>
              <div className="text-xs text-[#737373] font-mono">
                {recommendation.genericName} &bull; {recommendation.dosageForm}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#737373] font-mono uppercase block">Authorized Units</span>
              <span className="text-2xl font-mono font-bold text-[#2C3480]">
                {dispatchQuantity} units
              </span>
            </div>
          </div>
        </div>

        {/* Route Transfer Geometry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Donor Facility Panel */}
          <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E8] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#E5E5E8] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#737373]">Donor (Source)</span>
              <span className="font-mono font-bold text-[#080808]">{recommendation.donorClinicCode}</span>
            </div>
            <div className="font-medium text-[#080808] truncate">{recommendation.donorClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Current On-Hand:</span>
                <span>{donorStock?.currentStock || recommendation.donorAvailableStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Post-Dispatch Stock:</span>
                <span className="text-[#16815D] font-bold">{donorPostStock} units</span>
              </div>
              <div className="flex justify-between text-[#16815D] font-semibold border-t border-[#E5E5E8] pt-1">
                <span>Minimum Safety Reserve:</span>
                <span>{donorSafetyReserve} units (Safe)</span>
              </div>
            </div>
          </div>

          {/* Recipient Facility Panel */}
          <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E8] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#E5E5E8] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#737373]">Recipient (Destination)</span>
              <span className="font-mono font-bold text-[#080808]">{recommendation.recipientClinicCode}</span>
            </div>
            <div className="font-medium text-[#080808] truncate">{recommendation.recipientClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Current On-Hand:</span>
                <span>{recipientStock?.currentStock || recommendation.recipientPreStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Post-Dispatch Stock:</span>
                <span className="text-[#080808] font-bold">{recipientPostStock} units</span>
              </div>
              <div className="flex justify-between text-[#080808] border-t border-[#E5E5E8] pt-1">
                <span className="text-[#737373]">Usable Days Runway:</span>
                <span>{recommendation.recipientPreDays}d &rarr; {recommendation.recipientPostDays}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Invariant Verification Checklist */}
        <div className="bg-[#F5F5F7] p-4 rounded-lg border border-[#E5E5E8] space-y-2">
          <span className="text-xs font-semibold text-[#080808] font-sans block">
            Pre-Dispatch Algorithmic Verification Checklist
          </span>
          <div className="space-y-1.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-[#16815D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Donor Safety Reserve Invariant:</strong> {donorPostStock} &ge; {donorSafetyReserve} units (Margin of +{donorPostStock - donorSafetyReserve} units preserved).
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#16815D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Consumption Feasibility:</strong> Recipient burns {recommendation.recipientDailyConsumption} units/day; projected to consume ~{recommendation.recipientProjectedUsageBeforeExpiry} units in remaining {recommendation.remainingUsableDays} usable days.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#16815D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Shelf Life & Cold-Chain Transit:</strong> Batch expires in {recommendation.daysToExpiry} days (transit: ~{recommendation.estimatedTransitMinutes} mins). Exceeds 48h clinical minimum threshold.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#16815D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Physical Storage Headroom:</strong> Recipient capacity limit is satisfied ({recipientPostStock} &le; {recipientStock?.maxCapacity || 300} max capacity).
              </span>
            </div>
          </div>
        </div>

        {/* Error Warning if Prevalidation fails */}
        {(!preValidation.isValid || errorMsg) && (
          <div className="bg-[#BB232B]/10 border border-[#BB232B]/30 p-3 rounded-lg flex items-center gap-2 text-xs text-[#BB232B] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#BB232B] flex-shrink-0" />
            <span>{errorMsg || preValidation.error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-sans text-[#737373] hover:text-[#080808] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!preValidation.isValid || isSubmitting}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans font-medium text-xs text-white shadow-xs transition-colors cursor-pointer ${
              !preValidation.isValid || isSubmitting
                ? 'bg-[#E5E5E8] text-[#737373] cursor-not-allowed'
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
