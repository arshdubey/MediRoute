export type StockStatus = 'OPTIMAL' | 'SURPLUS' | 'LOW_STOCK' | 'CRITICAL' | 'EXPIRING_SOON';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type TransferStatus = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED' | 'IN_TRANSIT' | 'COMPLETED';

export type MedicineCategory =
  | 'Antibiotics'
  | 'Emergency & Resuscitation'
  | 'Endocrine & Metabolic'
  | 'Respiratory'
  | 'Cardiovascular'
  | 'Analgesics & Pain'
  | 'Critical Care & Fluids';

export interface Clinic {
  id: string;
  name: string;
  code: string;
  type: 'General Hospital' | 'Community Health Center' | 'Pediatric Clinic' | 'Urgent Care' | 'Family Medical Center';
  address: string;
  contactPhone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  inventoryManager: string;
  bedsCapacity: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  dosageForm: string;
  unit: string;
  standardUnitCost: number;
  isEmergencyEssential: boolean;
  storageCondition: 'Room Temp (15-25°C)' | 'Refrigerated (2-8°C)' | 'Controlled Cold-Chain';
  description: string;
}

export interface StockRecord {
  id: string;
  clinicId: string;
  medicineId: string;
  currentStock: number;
  minSafetyStock: number;
  maxCapacity: number;
  avgDailyConsumption: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  lastRestocked: string; // YYYY-MM-DD
}

export interface StockCalculation {
  status: StockStatus;
  daysUntilStockout: number;
  surplusQuantity: number;
  deficitQuantity: number;
  isBelowSafetyStock: boolean;
  isExpiringSoon: boolean; // within 45 days
  daysToExpiry: number;
  healthScore: number; // 0 to 100
}

export interface EnrichedStockItem extends StockRecord {
  clinic: Clinic;
  medicine: Medicine;
  calc: StockCalculation;
}

export interface CandidateEvaluation {
  clinicId: string;
  clinicName: string;
  clinicCode: string;
  currentStock: number;
  safetyStock: number;
  availableSurplus: number;
  batchNumber: string;
  expiryDate: string;
  daysToExpiry: number;
  distanceKm: number;
  transitMinutes: number;
  isEligible: boolean;
  rejectionReason?: string;
  selectionScore?: number;
  avgDailyConsumption?: number;
  projectedPostStock?: number;
}

export interface RedistributionRecommendation {
  id: string;
  medicineId: string;
  donorClinicId: string;
  recipientClinicId: string;
  recommendedQuantity: number;
  urgency: PriorityLevel;
  distanceKm: number;
  estimatedTransitMinutes: number;
  explanation: {
    summary: string;
    donorRationale: string;
    recipientRationale: string;
    safetyCompliance: string;
    quantityRationale?: string;
    rejectedAlternatives?: string;
  };
  donorPreStock: number;
  donorPostStock: number;
  donorSafetyStock: number;
  recipientPreStock: number;
  recipientPostStock: number;
  recipientSafetyStock: number;
  recipientPreDays: number;
  recipientPostDays: number;
  status: TransferStatus;
  createdAt: string;
  expiryDate: string;
  batchNumber: string;
  candidatesEvaluated?: CandidateEvaluation[];
}

export interface TransferRecord {
  id: string;
  recommendationId?: string;
  medicineId: string;
  donorClinicId: string;
  recipientClinicId: string;
  quantity: number;
  urgency: PriorityLevel;
  status: 'COMPLETED' | 'IN_TRANSIT';
  timestamp: string;
  notes: string;
  distanceKm: number;
  estimatedTransitMinutes: number;
  isEmergency: boolean;
  batchNumber: string;
}

export interface EmergencyScenario {
  id: string;
  title: string;
  targetClinicId: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH';
  affectedCategories: MedicineCategory[];
  affectedMedicineIds: string[];
  surgeMultiplier: number; // e.g. 3.5x consumption
  stockDeductionPercent: number; // e.g. sudden drop or massive intake
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}
