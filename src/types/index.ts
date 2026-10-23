export type StaffRole = 'Nurse' | 'Doctor' | 'Admin';

export type TemperatureUnit = 'C' | 'F';

export interface TemperatureRecord {
  id: string;
  patientId: string;
  value: number; // Stored in Celsius
  displayUnit: TemperatureUnit;
  timestamp: string; // ISO string
  recordedBy: string;
  note?: string;
  isRepeat: boolean;
  repeatReason?: string;
}

export interface DoctorVisitRecord {
  id: string;
  patientId: string;
  visitDate: string; // YYYY-MM-DD
  doctorNotes: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  clinicalException?: {
    reason: string;
    confirmedBy: string;
    timestamp: string;
  };
}

export type DischargeStatus =
  | 'not_eligible'
  | 'eligible_clinical_review'
  | 'approved_by_doctor'
  | 'awaiting_admin_discharge'
  | 'discharged';

export interface Patient {
  id: string; // e.g. "CF-0101"
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  admissionDate: string; // YYYY-MM-DD
  bed: string; // e.g. "Bed 14"
  ward: 'Ward A' | 'Ward B' | 'Ward C';
  active: boolean; // true = currently admitted, false = discharged or deceased
  dischargeDate?: string;
  outcome?: 'cured_discharged' | 'deceased' | 'transferred';
  temperatureHistory: TemperatureRecord[];
  doctorVisitHistory: DoctorVisitRecord[];
  todayTempStatus: 'completed' | 'pending';
  todayVisitStatus: 'completed' | 'pending';
  feverFreeStreak: number; // Consecutive full days fever-free
  dischargeStatus: DischargeStatus;
  doctorDischargeApprovedAt?: string;
  doctorDischargeApprovedBy?: string;
  adminDischargedAt?: string;
  adminDischargedBy?: string;
  riskCategory: 'Standard' | 'Elevated' | 'Critical';
}

export interface WaitingListCandidate {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  addedDate: string;
  urgency: 'Standard' | 'Urgent' | 'High';
  contact: string;
  notes: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'temperature' | 'doctor_visit' | 'discharge_review' | 'admin_discharge' | 'admission' | 'exception' | 'system';
  actor: string;
  role: StaffRole;
  description: string;
  patientId?: string;
  patientName?: string;
}

export interface OutcomeRecord {
  id: string;
  patientName: string;
  admissionDate: string;
  outcomeDate: string;
  outcome: 'cured_discharged' | 'deceased';
  daysInQuarantine: number;
  primaryNotes: string;
}

export interface OutcomesCohort {
  completedCases: number; // 25
  deaths: number; // 4
  successes: number; // 21
  mortalityRate: number; // 16% (4/25)
  successRate: number; // 84% (21/25)
  mortalityBenchmark: number; // 15%
  successBenchmark: number; // 85%
  records: OutcomeRecord[];
}
