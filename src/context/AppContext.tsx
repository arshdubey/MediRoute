import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clinic,
  Medicine,
  StockRecord,
  EnrichedStockItem,
  RedistributionRecommendation,
  CandidateEvaluation,
  TransferRecord,
  EmergencyScenario,
  ToastMessage,
} from '../types';
import {
  SEED_CLINICS,
  SEED_MEDICINES,
  INITIAL_STOCK_RECORDS,
  PRESET_EMERGENCY_SCENARIOS,
} from '../data/seedData';
import { calculateStockMetrics } from '../services/shortageCalculator';
import {
  generateRedistributionRecommendations,
  validateTransferSafety,
  findBestDonorRecommendation,
} from '../services/redistributionEngine';
import { calculateImpactMetrics, ImpactMetrics } from '../services/analyticsService';
import { getRouteInfo } from '../data/distanceMatrix';

interface AppContextType {
  clinics: Clinic[];
  medicines: Medicine[];
  stockRecords: StockRecord[];
  enrichedStock: EnrichedStockItem[];
  recommendations: RedistributionRecommendation[];
  activeRecommendations: RedistributionRecommendation[];
  transfers: TransferRecord[];
  activeEmergency: EmergencyScenario | null;
  selectedClinicId: string | 'ALL';
  setSelectedClinicId: (id: string | 'ALL') => void;
  impactMetrics: ImpactMetrics;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  dismissToast: (id: string) => void;
  updateStockRecord: (record: StockRecord) => void;
  addStockRecord: (newRecord: Omit<StockRecord, 'id'>) => void;
  acceptRecommendation: (id: string) => { success: boolean; error?: string };
  rejectRecommendation: (id: string) => void;
  executeManualTransfer: (
    donorClinicId: string,
    recipientClinicId: string,
    medicineId: string,
    quantity: number,
    notes?: string
  ) => { success: boolean; error?: string };
  triggerEmergency: (scenarioId: string) => void;
  triggerCustomEmergency: (
    targetClinicId: string,
    medicineId: string,
    surgeMultiplier: number,
    customTitle?: string
  ) => void;
  resolveEmergency: () => void;
  resetToDemoSeed: () => void;
  refreshRecommendations: () => void;
  // Match Donor Modal state
  inspectingMatchItem: EnrichedStockItem | null;
  openMatchDonorModal: (item: EnrichedStockItem) => void;
  closeMatchDonorModal: () => void;
  matchDonorForRecord: (record: StockRecord) => {
    recommendation: RedistributionRecommendation | null;
    candidates: CandidateEvaluation[];
  };
  // Guided Walkthrough
  runGuidedDemoScenario: () => void;
}

const STORAGE_KEYS = {
  STOCK_RECORDS: 'mediroute_stock_records_v1',
  TRANSFERS: 'mediroute_transfers_v1',
  ACTIVE_EMERGENCY: 'mediroute_active_emergency_v1',
  RECOMMENDATIONS_STATE: 'mediroute_recommendations_v1',
};

const INITIAL_TRANSFERS: TransferRecord[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clinics = SEED_CLINICS;
  const medicines = SEED_MEDICINES;

  // Stock Records with localStorage persistence
  const [stockRecords, setStockRecords] = useState<StockRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STOCK_RECORDS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored stock records', e);
    }
    return INITIAL_STOCK_RECORDS;
  });

  // Transfers audit ledger
  const [transfers, setTransfers] = useState<TransferRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored transfers', e);
    }
    return INITIAL_TRANSFERS;
  });

  // Emergency scenario
  const [activeEmergency, setActiveEmergency] = useState<EmergencyScenario | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse active emergency', e);
    }
    return null;
  });

  // Recommendation status overrides
  const [recOverrides, setRecOverrides] = useState<Record<string, 'ACCEPTED' | 'REJECTED'>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS_STATE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse recommendation overrides', e);
    }
    return {};
  });

  const [selectedClinicId, setSelectedClinicId] = useState<string | 'ALL'>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal state for Match Donor inspection panel
  const [inspectingMatchItem, setInspectingMatchItem] = useState<EnrichedStockItem | null>(null);

  const openMatchDonorModal = useCallback((item: EnrichedStockItem) => {
    setInspectingMatchItem(item);
  }, []);

  const closeMatchDonorModal = useCallback(() => {
    setInspectingMatchItem(null);
  }, []);

  // Toast dispatch
  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, type, title, message, timestamp: Date.now() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_RECORDS, JSON.stringify(stockRecords));
    } catch (e) {
      console.error('Failed to save stock records', e);
    }
  }, [stockRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    } catch (e) {
      console.error('Failed to save transfers', e);
    }
  }, [transfers]);

  useEffect(() => {
    try {
      if (activeEmergency) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_EMERGENCY, JSON.stringify(activeEmergency));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
      }
    } catch (e) {
      console.error('Failed to save emergency scenario', e);
    }
  }, [activeEmergency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_STATE, JSON.stringify(recOverrides));
    } catch (e) {
      console.error('Failed to save rec overrides', e);
    }
  }, [recOverrides]);

  // Enriched stock join
  const enrichedStock: EnrichedStockItem[] = useMemo(() => {
    const clinicMap = new Map(clinics.map((c) => [c.id, c]));
    const medicineMap = new Map(medicines.map((m) => [m.id, m]));

    return stockRecords
      .map((sr) => {
        const clinic = clinicMap.get(sr.clinicId);
        const medicine = medicineMap.get(sr.medicineId);
        if (!clinic || !medicine) return null;

        const calc = calculateStockMetrics(sr);
        return {
          ...sr,
          clinic,
          medicine,
          calc,
        };
      })
      .filter((item): item is EnrichedStockItem => item !== null);
  }, [clinics, medicines, stockRecords]);

  // Compute recommendations
  const rawRecommendations = useMemo(() => {
    return generateRedistributionRecommendations({
      clinics,
      medicines,
      stockRecords,
    });
  }, [clinics, medicines, stockRecords]);

  // Apply overrides
  const recommendations = useMemo(() => {
    return rawRecommendations.map((r) => {
      const override = recOverrides[r.id];
      if (override) {
        return { ...r, status: override };
      }
      return r;
    });
  }, [rawRecommendations, recOverrides]);

  const activeRecommendations = useMemo(() => {
    return recommendations.filter((r) => r.status === 'RECOMMENDED');
  }, [recommendations]);

  // Impact metrics
  const impactMetrics = useMemo(() => {
    return calculateImpactMetrics(stockRecords, medicines, transfers, recommendations);
  }, [stockRecords, medicines, transfers, recommendations]);

  // Update existing stock record
  const updateStockRecord = useCallback((updated: StockRecord) => {
    setStockRecords((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...updated } : item))
    );
    addToast('success', 'Stock Record Updated', `Successfully updated inventory record #${updated.batchNumber}`);
  }, [addToast]);

  // Add new stock record
  const addStockRecord = useCallback((newRec: Omit<StockRecord, 'id'>) => {
    const id = `sr-custom-${Date.now().toString(36)}`;
    const fullRec: StockRecord = { ...newRec, id };
    setStockRecords((prev) => [fullRec, ...prev]);
    addToast('success', 'New Stock Added', `Added batch ${fullRec.batchNumber} to inventory.`);
  }, [addToast]);

  // Helper for matching donor for any specific record
  const matchDonorForRecord = useCallback((record: StockRecord) => {
    return findBestDonorRecommendation(record, stockRecords, clinics, medicines);
  }, [stockRecords, clinics, medicines]);

  // Accept a recommendation with strict atomic verification and duplicate protection
  const acceptRecommendation = useCallback((recId: string): { success: boolean; error?: string } => {
    // 1. Locate recommendation by ID or by corridor tuple
    let rec = recommendations.find((r) => r.id === recId) || rawRecommendations.find((r) => r.id === recId);
    
    if (!rec) {
      // Fallback search by corridor match
      rec = recommendations.find((r) =>
        recId.includes(`${r.donorClinicId}-${r.recipientClinicId}-${r.medicineId}`)
      ) || rawRecommendations.find((r) =>
        recId.includes(`${r.donorClinicId}-${r.recipientClinicId}-${r.medicineId}`)
      );
    }

    if (!rec) {
      // Check on-demand lookup
      const parts = recId.replace('rec-match-', '').replace('rec-', '').split('-');
      if (parts.length >= 3) {
        const donorId = parts[0];
        const recipientId = parts[1];
        const medId = parts[2];
        const recipientStock = stockRecords.find(
          (sr) => sr.clinicId === recipientId && sr.medicineId === medId
        );
        if (recipientStock) {
          const matched = findBestDonorRecommendation(
            recipientStock,
            stockRecords,
            clinics,
            medicines
          );
          if (matched.recommendation && matched.recommendation.donorClinicId === donorId) {
            rec = matched.recommendation;
          }
        }
      }
    }

    if (!rec) {
      const error = 'Recommendation not found or expired.';
      addToast('error', 'Transfer Failed', error);
      return { success: false, error };
    }

    // 2. Guard against duplicate confirmation
    if (
      recOverrides[rec.id] === 'ACCEPTED' ||
      transfers.some(
        (t) =>
          t.recommendationId === rec!.id ||
          (t.donorClinicId === rec!.donorClinicId &&
            t.recipientClinicId === rec!.recipientClinicId &&
            t.medicineId === rec!.medicineId)
      )
    ) {
      const error = 'Transfer has already been confirmed and executed in this session.';
      addToast('warning', 'Duplicate Transfer Blocked', error);
      return { success: false, error };
    }

    if (recOverrides[rec.id] === 'REJECTED') {
      const error = 'This recommendation was previously dismissed.';
      addToast('warning', 'Transfer Blocked', error);
      return { success: false, error };
    }

    // 3. Validate quantity sanity
    if (rec.recommendedQuantity <= 0 || !Number.isInteger(rec.recommendedQuantity)) {
      const error = 'Invalid transfer quantity: must be a positive whole integer.';
      addToast('error', 'Transfer Blocked', error);
      return { success: false, error };
    }

    // 4. Locate donor and recipient stock
    const donorStock = stockRecords.find(
      (sr) => sr.clinicId === rec!.donorClinicId && sr.medicineId === rec!.medicineId
    );
    const recipientStock = stockRecords.find(
      (sr) => sr.clinicId === rec!.recipientClinicId && sr.medicineId === rec!.medicineId
    );

    if (!donorStock || !recipientStock) {
      const error = 'Facility stock records missing from inventory database.';
      addToast('error', 'Transfer Failed', error);
      return { success: false, error };
    }

    // 5. Safety validation check against current donor stock
    const safetyCheck = validateTransferSafety(donorStock, rec.recommendedQuantity, {
      transitMinutes: rec.estimatedTransitMinutes,
    });
    if (!safetyCheck.isValid) {
      const error = safetyCheck.error || 'Donor safety reserve invariant violated.';
      addToast('error', 'Transfer Blocked', error);
      return { success: false, error };
    }

    // 5. Atomic application-level stock update
    setStockRecords((prev) => {
      const freshDonor = prev.find((s) => s.id === donorStock.id);
      const freshRecipient = prev.find((s) => s.id === recipientStock.id);

      // Abort if conditions changed
      if (
        !freshDonor ||
        !freshRecipient ||
        freshDonor.currentStock - rec.recommendedQuantity < freshDonor.minSafetyStock
      ) {
        return prev;
      }

      return prev.map((item) => {
        if (item.id === freshDonor.id) {
          return {
            ...item,
            currentStock: item.currentStock - rec.recommendedQuantity,
          };
        }
        if (item.id === freshRecipient.id) {
          return {
            ...item,
            currentStock: item.currentStock + rec.recommendedQuantity,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      });
    });

    // 6. Append to transfer log
    const newTransfer: TransferRecord = {
      id: `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recommendationId: rec.id,
      medicineId: rec.medicineId,
      donorClinicId: rec.donorClinicId,
      recipientClinicId: rec.recipientClinicId,
      quantity: rec.recommendedQuantity,
      urgency: rec.urgency,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      notes: rec.explanation.summary,
      distanceKm: rec.distanceKm,
      estimatedTransitMinutes: rec.estimatedTransitMinutes,
      isEmergency: rec.urgency === 'CRITICAL' || activeEmergency !== null,
      batchNumber: rec.batchNumber,
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // 7. Lock status to ACCEPTED
    setRecOverrides((prev) => ({
      ...prev,
      [recId]: 'ACCEPTED',
      [rec.id]: 'ACCEPTED',
    }));

    const medName = medicines.find((m) => m.id === rec.medicineId)?.name || 'Medicine';
    addToast(
      'success',
      'Transfer Confirmed & Executed',
      `Redistributed ${rec.recommendedQuantity} units of ${medName} from ${clinics.find((c) => c.id === rec.donorClinicId)?.code} to ${clinics.find((c) => c.id === rec.recipientClinicId)?.code}.`
    );

    return { success: true };
  }, [recOverrides, transfers, recommendations, rawRecommendations, stockRecords, activeEmergency, medicines, clinics, addToast]);

  // Reject recommendation (never alters inventory)
  const rejectRecommendation = useCallback((recId: string) => {
    setRecOverrides((prev) => ({
      ...prev,
      [recId]: 'REJECTED',
    }));
    addToast('info', 'Recommendation Dismissed', 'Recommendation was dismissed for this session.');
  }, [addToast]);

  // Manual safe transfer with atomic guarantees
  const executeManualTransfer = useCallback(
    (
      donorClinicId: string,
      recipientClinicId: string,
      medicineId: string,
      quantity: number,
      notes = 'Manual clinical reallocation'
    ): { success: boolean; error?: string } => {
      if (donorClinicId === recipientClinicId) {
        return { success: false, error: 'Donor and recipient clinic cannot be identical.' };
      }

      if (quantity <= 0 || !Number.isInteger(quantity)) {
        return { success: false, error: 'Transfer quantity must be a positive whole integer.' };
      }

      const donorStock = stockRecords.find(
        (sr) => sr.clinicId === donorClinicId && sr.medicineId === medicineId
      );
      const recipientStock = stockRecords.find(
        (sr) => sr.clinicId === recipientClinicId && sr.medicineId === medicineId
      );

      if (!donorStock) {
        return { success: false, error: 'Donor clinic does not possess this medicine.' };
      }
      if (!recipientStock) {
        return { success: false, error: 'Recipient clinic does not have a record for this medicine.' };
      }

      const route = getRouteInfo(donorClinicId, recipientClinicId);
      const safetyCheck = validateTransferSafety(donorStock, quantity, {
        transitMinutes: route.transitMinutes,
      });
      if (!safetyCheck.isValid) {
        return { success: false, error: safetyCheck.error };
      }

      // Atomic update
      setStockRecords((prev) =>
        prev.map((item) => {
          if (item.id === donorStock.id) {
            return {
              ...item,
              currentStock: item.currentStock - quantity,
            };
          }
          if (item.id === recipientStock.id) {
            return {
              ...item,
              currentStock: item.currentStock + quantity,
              lastRestocked: new Date().toISOString().split('T')[0],
            };
          }
          return item;
        })
      );

      const newTransfer: TransferRecord = {
        id: `tr-manual-${Date.now().toString(36)}`,
        medicineId,
        donorClinicId,
        recipientClinicId,
        quantity,
        urgency: 'HIGH',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        notes,
        distanceKm: route.distanceKm,
        estimatedTransitMinutes: route.transitMinutes,
        isEmergency: activeEmergency !== null,
        batchNumber: donorStock.batchNumber,
      };

      setTransfers((prev) => [newTransfer, ...prev]);

      const med = medicines.find((m) => m.id === medicineId);
      addToast(
        'success',
        'Manual Transfer Complete',
        `Dispatched ${quantity} ${med?.unit || 'units'} safely. Donor safety reserve fully maintained.`
      );

      return { success: true };
    },
    [stockRecords, activeEmergency, medicines, addToast]
  );

  // Trigger emergency scenario
  const triggerEmergency = useCallback(
    (scenarioId: string) => {
      const scenario = PRESET_EMERGENCY_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) return;

      setActiveEmergency(scenario);

      setStockRecords((prev) =>
        prev.map((rec) => {
          if (
            rec.clinicId === scenario.targetClinicId &&
            scenario.affectedMedicineIds.includes(rec.medicineId)
          ) {
            const deduction = Math.round(rec.currentStock * (scenario.stockDeductionPercent / 100));
            const newStock = Math.max(1, rec.currentStock - deduction);
            const surgeRate = Math.round(rec.avgDailyConsumption * scenario.surgeMultiplier);

            return {
              ...rec,
              currentStock: newStock,
              avgDailyConsumption: surgeRate,
            };
          }
          return rec;
        })
      );

      setRecOverrides({});

      addToast(
        'warning',
        `EMERGENCY SIMULATION: ${scenario.title}`,
        'High-urgency prioritization active. Algorithmic redistribution re-aligned for emergency dispatch.'
      );
    },
    [addToast]
  );

  // Trigger custom interactive emergency simulation (Requirement 6)
  const triggerCustomEmergency = useCallback(
    (
      targetClinicId: string,
      medicineId: string,
      surgeMultiplier: number,
      customTitle?: string
    ) => {
      const targetClinic = clinics.find((c) => c.id === targetClinicId);
      const targetMed = medicines.find((m) => m.id === medicineId);

      const scenario: EmergencyScenario = {
        id: `sc-custom-${Date.now().toString(36)}`,
        title: customTitle || `Urgent Outbreak Spike: ${targetMed?.name} at ${targetClinic?.code}`,
        targetClinicId,
        description: `Synthetic emergency simulation: Sudden acute intake surge of ${targetMed?.name} at ${targetClinic?.name}.`,
        severity: 'CRITICAL',
        affectedCategories: targetMed ? [targetMed.category] : [],
        affectedMedicineIds: [medicineId],
        surgeMultiplier,
        stockDeductionPercent: 75,
      };

      setActiveEmergency(scenario);

      setStockRecords((prev) =>
        prev.map((rec) => {
          if (rec.clinicId === targetClinicId && rec.medicineId === medicineId) {
            const deduction = Math.round(rec.currentStock * 0.75);
            const newStock = Math.max(1, rec.currentStock - deduction);
            const surgeRate = Math.round(rec.avgDailyConsumption * surgeMultiplier);

            return {
              ...rec,
              currentStock: newStock,
              avgDailyConsumption: surgeRate,
            };
          }
          return rec;
        })
      );

      setRecOverrides({});

      addToast(
        'warning',
        `EMERGENCY ACTIVATED: ${scenario.title}`,
        `Synthetic shortage simulated. Stock dropped by 75% and daily demand spiked to ${surgeMultiplier}x.`
      );
    },
    [clinics, medicines, addToast]
  );

  // Resolve emergency
  const resolveEmergency = useCallback(() => {
    setActiveEmergency(null);
    addToast('info', 'Emergency Mode Deactivated', 'Network returned to standard supply chain monitoring.');
  }, [addToast]);

  // Reset to initial demo seed
  const resetToDemoSeed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.STOCK_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
    localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS_STATE);

    setStockRecords(INITIAL_STOCK_RECORDS);
    setTransfers(INITIAL_TRANSFERS);
    setActiveEmergency(null);
    setRecOverrides({});
    setSelectedClinicId('ALL');
    setInspectingMatchItem(null);

    addToast(
      'info',
      'Demo Data Reset',
      'Synthetic inventory, clinics, and transfers restored to original baseline.'
    );
  }, [addToast]);

  // Run Guided Walkthrough Demo Scenario (Requirement 7)
  const runGuidedDemoScenario = useCallback(() => {
    // Reset to clean seed baseline first
    localStorage.removeItem(STORAGE_KEYS.STOCK_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
    localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS_STATE);

    setStockRecords(INITIAL_STOCK_RECORDS);
    setTransfers(INITIAL_TRANSFERS);
    setActiveEmergency(null);
    setRecOverrides({});
    setSelectedClinicId('ALL');

    // Find St. Jude's Epinephrine record (sr-c2-m3)
    const stJudeEpi = INITIAL_STOCK_RECORDS.find(
      (sr) => sr.clinicId === 'c2' && sr.medicineId === 'm3'
    );

    if (stJudeEpi) {
      const clinic = clinics.find((c) => c.id === 'c2')!;
      const medicine = medicines.find((m) => m.id === 'm3')!;
      const calc = calculateStockMetrics(stJudeEpi);

      const enriched: EnrichedStockItem = {
        ...stJudeEpi,
        clinic,
        medicine,
        calc,
      };

      setInspectingMatchItem(enriched);
    }

    addToast(
      'info',
      'Guided Demo Active: Epinephrine Shortage',
      'Examining St. Jude acute shortage (holds 6 units, deficit 19 units, need 34 units). Demonstrates selecting Northside (115 units, safe surplus) and refusing Metro Hope (unsafe alternative).'
    );
  }, [clinics, medicines, addToast]);

  const refreshRecommendations = useCallback(() => {
    setRecOverrides({});
    addToast('info', 'Recommendations Refreshed', 'Recalculated regional surplus and shortage pairings.');
  }, [addToast]);

  const value: AppContextType = {
    clinics,
    medicines,
    stockRecords,
    enrichedStock,
    recommendations,
    activeRecommendations,
    transfers,
    activeEmergency,
    selectedClinicId,
    setSelectedClinicId,
    impactMetrics,
    toasts,
    addToast,
    dismissToast,
    updateStockRecord,
    addStockRecord,
    acceptRecommendation,
    rejectRecommendation,
    executeManualTransfer,
    triggerEmergency,
    triggerCustomEmergency,
    resolveEmergency,
    resetToDemoSeed,
    refreshRecommendations,
    inspectingMatchItem,
    openMatchDonorModal,
    closeMatchDonorModal,
    matchDonorForRecord,
    runGuidedDemoScenario,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
