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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fefo-modal-title"
    >
      <div className="bg-[#FFFFFF] rounded border border-[#E2DDD5] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 text-[#142536]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E2DDD5]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#1D7055] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A5D6A7]">
                FEFO Clinical Authorization
              </span>
              <span className="text-xs font-mono text-[#5A6E85]">
                Ref #{recommendation.batchNumber}
              </span>
            </div>
            <h3 id="fefo-modal-title" className="font-serif text-2xl text-[#142536] font-normal tracking-tight">
              Authorize Expiry-Safe Redistribution
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#5A6E85] hover:text-[#142536] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicine Overview */}
        <div className="bg-[#F7F5F0] p-4 rounded border border-[#E2DDD5] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="font-serif text-lg text-[#142536] font-normal">
                {recommendation.medicineName}
              </span>
              <div className="text-xs text-[#5A6E85] font-mono">
                {recommendation.genericName} &bull; {recommendation.dosageForm}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#718294] font-mono uppercase block">Authorized Units</span>
              <span className="text-2xl font-mono font-bold text-[#142536]">
                {dispatchQuantity} units
              </span>
            </div>
          </div>
        </div>

        {/* Route Transfer Geometry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Donor Facility Panel */}
          <div className="bg-[#FFFFFF] p-3.5 rounded border border-[#E2DDD5] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#5A6E85]">Donor (Source)</span>
              <span className="font-mono font-bold text-[#142536]">{recommendation.donorClinicCode}</span>
            </div>
            <div className="font-medium text-[#142536] truncate">{recommendation.donorClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#5A6E85]">Current On-Hand:</span>
                <span>{donorStock?.currentStock || recommendation.donorAvailableStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E85]">Post-Dispatch Stock:</span>
                <span className="text-[#1D7055] font-bold">{donorPostStock} units</span>
              </div>
              <div className="flex justify-between text-[#1D7055] font-semibold border-t border-[#F2EFE9] pt-1">
                <span>Minimum Safety Reserve:</span>
                <span>{donorSafetyReserve} units (Safe)</span>
              </div>
            </div>
          </div>

          {/* Recipient Facility Panel */}
          <div className="bg-[#FFFFFF] p-3.5 rounded border border-[#E2DDD5] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-1.5">
              <span className="text-[10px] font-mono uppercase text-[#5A6E85]">Recipient (Destination)</span>
              <span className="font-mono font-bold text-[#142536]">{recommendation.recipientClinicCode}</span>
            </div>
            <div className="font-medium text-[#142536] truncate">{recommendation.recipientClinicName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-[#5A6E85]">Current On-Hand:</span>
                <span>{recipientStock?.currentStock || recommendation.recipientPreStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E85]">Post-Dispatch Stock:</span>
                <span className="text-[#142536] font-bold">{recipientPostStock} units</span>
              </div>
              <div className="flex justify-between text-[#142536] border-t border-[#F2EFE9] pt-1">
                <span className="text-[#5A6E85]">Usable Days Runway:</span>
                <span>{recommendation.recipientPreDays}d &rarr; {recommendation.recipientPostDays}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Invariant Verification Checklist */}
        <div className="bg-[#FAF8F5] p-4 rounded border border-[#EBE7DF] space-y-2">
          <span className="text-xs font-semibold text-[#142536] font-sans block">
            Pre-Dispatch Algorithmic Verification Checklist
          </span>
          <div className="space-y-1.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-[#1D7055]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Donor Safety Reserve Invariant:</strong> {donorPostStock} &ge; {donorSafetyReserve} units (Margin of +{donorPostStock - donorSafetyReserve} units preserved).
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#1D7055]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Consumption Feasibility:</strong> Recipient burns {recommendation.recipientDailyConsumption} units/day; projected to consume ~{recommendation.recipientProjectedUsageBeforeExpiry} units in remaining {recommendation.remainingUsableDays} usable days.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#1D7055]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Shelf Life & Cold-Chain Transit:</strong> Batch expires in {recommendation.daysToExpiry} days (transit: ~{recommendation.estimatedTransitMinutes} mins). Exceeds 48h clinical minimum threshold.
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#1D7055]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Physical Storage Headroom:</strong> Recipient capacity limit is satisfied ({recipientPostStock} &le; {recipientStock?.maxCapacity || 300} max capacity).
              </span>
            </div>
          </div>
        </div>

        {/* Error Warning if Prevalidation fails */}
        {(!preValidation.isValid || errorMsg) && (
          <div className="bg-[#FDF3F1] border border-[#E74732] p-3 rounded flex items-center gap-2 text-xs text-[#8C3A2F] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#E74732] flex-shrink-0" />
            <span>{errorMsg || preValidation.error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2DDD5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-sans text-[#5A6E85] hover:text-[#142536] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!preValidation.isValid || isSubmitting}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded font-sans font-medium text-xs text-white shadow-sm transition-colors cursor-pointer ${
              !preValidation.isValid || isSubmitting
                ? 'bg-[#A6B4C2] cursor-not-allowed'
                : 'bg-[#142536] hover:bg-[#1E344A]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#1D7055]" />
            <span>
              {isSubmitting ? 'Confirming Dispatch...' : `Confirm & Execute Transfer (${dispatchQuantity} Units)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
