'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  StaffRole,
  Patient,
  WaitingListCandidate,
  ActivityItem,
  OutcomesCohort,
  TemperatureRecord,
  DoctorVisitRecord,
  DischargeStatus,
  TemperatureUnit,
} from '@/types';
import {
  generateInitialPatients,
  INITIAL_WAITING_LIST,
  INITIAL_ACTIVITY_LOG,
  INITIAL_OUTCOMES_COHORT,
  FEVER_THRESHOLD_CELSIUS,
  MAX_CAPACITY,
  TODAY,
} from '@/lib/demoData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface RecordTempParams {
  patientId: string;
  value: number; // in Celsius or converted
  inputUnit: TemperatureUnit;
  note?: string;
  allowRepeat?: boolean;
  repeatReason?: string;
}

interface CompleteDoctorVisitParams {
  patientId: string;
  notes: string;
  isException?: boolean;
  exceptionReason?: string;
}

interface CareFlowContextType {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
  patients: Patient[];
  waitingList: WaitingListCandidate[];
  activityLog: ActivityItem[];
  outcomesCohort: OutcomesCohort;
  feverThreshold: number;
  setFeverThreshold: (temp: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Actions
  recordTemperature: (params: RecordTempParams) => { success: boolean; duplicateWarning?: boolean; message: string; existingRecord?: TemperatureRecord };
  completeDoctorVisit: (params: CompleteDoctorVisitParams) => { success: boolean; message: string };
  approveClinicalDischarge: (patientId: string) => { success: boolean; message: string };
  finalizeAdminDischarge: (patientId: string) => { success: boolean; message: string };
  admitFromWaitingList: (candidateId: string, targetBed?: string) => { success: boolean; message: string };
  admitNewPatient: (patientData: { name: string; age: number; gender: 'M' | 'F' | 'Other'; ward?: 'Ward A' | 'Ward B' | 'Ward C' }) => { success: boolean; message: string };
  resetDemoData: () => void;

  // Computed metrics
  occupiedBedsCount: number;
  maxCapacity: number;
  todayTempsCompletedCount: number;
  todayTempsPendingCount: number;
  todayVisitsCompletedCount: number;
  todayVisitsPendingCount: number;
  awaitingClinicalReviewCount: number;
  awaitingAdminDischargeCount: number;
  vacantBeds: string[];
}

const CareFlowContext = createContext<CareFlowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PATIENTS = 'careflow_patients_v1';
const LOCAL_STORAGE_KEY_WAITING = 'careflow_waiting_v1';
const LOCAL_STORAGE_KEY_ACTIVITY = 'careflow_activity_v1';
const LOCAL_STORAGE_KEY_THRESHOLD = 'careflow_fever_threshold_v1';

export function CareFlowProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<StaffRole>('Doctor');
  const [patients, setPatients] = useState<Patient[]>(generateInitialPatients);
  const [waitingList, setWaitingList] = useState<WaitingListCandidate[]>(INITIAL_WAITING_LIST);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>(INITIAL_ACTIVITY_LOG);
  const [outcomesCohort] = useState<OutcomesCohort>(INITIAL_OUTCOMES_COHORT);
  const [feverThreshold, setFeverThreshold] = useState<number>(FEVER_THRESHOLD_CELSIUS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Safe client hydration from localStorage
  useEffect(() => {
    try {
      const storedPatients = localStorage.getItem(LOCAL_STORAGE_KEY_PATIENTS);
      const storedWaiting = localStorage.getItem(LOCAL_STORAGE_KEY_WAITING);
      const storedActivity = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITY);
      const storedThreshold = localStorage.getItem(LOCAL_STORAGE_KEY_THRESHOLD);

      if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
      }
      if (storedWaiting) {
        setWaitingList(JSON.parse(storedWaiting));
      }
      if (storedActivity) {
        setActivityLog(JSON.parse(storedActivity));
      }
      if (storedThreshold) {
        setFeverThreshold(Number(storedThreshold));
      }
    } catch (e) {
      console.error('Failed to parse localStorage', e);
    }
  }, []);

  // Sync state changes to localStorage
  const savePatients = (updated: Patient[]) => {
    setPatients(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_PATIENTS, JSON.stringify(updated));
    }
  };

  const saveWaitingList = (updated: WaitingListCandidate[]) => {
    setWaitingList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_WAITING, JSON.stringify(updated));
    }
  };

  const saveActivityLog = (updated: ActivityItem[]) => {
    setActivityLog(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITY, JSON.stringify(updated));
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to re-evaluate streak & eligibility for a patient
  const evaluateDischargeEligibility = (patient: Patient, threshold: number): { streak: number; status: DischargeStatus } => {
    if (!patient.active) return { streak: patient.feverFreeStreak, status: 'discharged' };
    if (patient.dischargeStatus === 'approved_by_doctor') {
      return { streak: patient.feverFreeStreak, status: 'approved_by_doctor' };
    }

    // Group valid daily temperature readings by day (YYYY-MM-DD)
    const dailyReadings = new Map<string, number[]>();
    for (const rec of patient.temperatureHistory) {
      const day = rec.timestamp.split('T')[0];
      const list = dailyReadings.get(day) || [];
      list.push(rec.value);
      dailyReadings.set(day, list);
    }

    // Calculate streak backwards from today
    let streak = 0;
    const now = new Date(TODAY);

    for (let offset = 0; offset < 14; offset++) {
      const targetDate = new Date(now.getTime() - offset * 86400000).toISOString().split('T')[0];
      const temps = dailyReadings.get(targetDate);

      // If missing a required day, streak strictly breaks and terminates!
      if (!temps || temps.length === 0) {
        break;
      }

      // Check max temperature recorded on this day
      const maxTemp = Math.max(...temps);
      if (maxTemp >= threshold) {
        // Fever breaks streak!
        break;
      }

      streak++;
    }

    let status: DischargeStatus = patient.dischargeStatus;
    if (streak >= 3) {
      if (status !== 'awaiting_admin_discharge') {
        status = 'eligible_clinical_review';
      }
    } else {
      if (status === 'eligible_clinical_review') {
        status = 'not_eligible';
      }
    }

    return { streak, status };
  };

  // Calculate metrics
  const activePatients = useMemo(() => patients.filter((p) => p.active), [patients]);
  const occupiedBedsCount = activePatients.length;

  const vacantBeds = useMemo(() => {
    const occupied = new Set(activePatients.map((p) => p.bed));
    const allBeds = Array.from({ length: MAX_CAPACITY }, (_, idx) => `Bed ${(idx + 1).toString().padStart(2, '0')}`);
    return allBeds.filter((b) => !occupied.has(b));
  }, [activePatients]);

  const todayTempsCompletedCount = useMemo(
    () => activePatients.filter((p) => p.todayTempStatus === 'completed').length,
    [activePatients]
  );
  const todayTempsPendingCount = activePatients.length - todayTempsCompletedCount;

  const todayVisitsCompletedCount = useMemo(
    () => activePatients.filter((p) => p.todayVisitStatus === 'completed').length,
    [activePatients]
  );
  const todayVisitsPendingCount = activePatients.length - todayVisitsCompletedCount;

  const awaitingClinicalReviewCount = useMemo(
    () => activePatients.filter((p) => p.dischargeStatus === 'eligible_clinical_review').length,
    [activePatients]
  );

  const awaitingAdminDischargeCount = useMemo(
    () => activePatients.filter((p) => p.dischargeStatus === 'approved_by_doctor').length,
    [activePatients]
  );

  // ACTION: Record Temperature
  const recordTemperature = ({
    patientId,
    value,
    inputUnit,
    note,
    allowRepeat,
    repeatReason,
  }: RecordTempParams) => {
    const patientIndex = patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) {
      return { success: false, message: 'Patient not found' };
    }

    const patient = patients[patientIndex];
    const todayStr = TODAY;

    // Check for existing reading today
    const existingToday = patient.temperatureHistory.find((rec) => rec.timestamp.startsWith(todayStr));
    if (existingToday && !allowRepeat) {
      return {
        success: false,
        duplicateWarning: true,
        message: `Existing reading of ${existingToday.value.toFixed(1)}°${existingToday.displayUnit} was recorded at ${new Date(existingToday.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${existingToday.recordedBy}.`,
        existingRecord: existingToday,
      };
    }

    // Convert to Celsius for internal storage if entered in F
    const celsiusValue = inputUnit === 'F' ? Number((((value - 32) * 5) / 9).toFixed(1)) : Number(value.toFixed(1));

    const newRecord: TemperatureRecord = {
      id: `TR-${patient.id}-${Date.now()}`,
      patientId: patient.id,
      value: celsiusValue,
      displayUnit: inputUnit,
      timestamp: new Date().toISOString(),
      recordedBy: role === 'Nurse' ? 'Nurse Clara Vance' : role === 'Doctor' ? 'Dr. Sarah Lin, MD' : 'Admin Taylor Hayes',
      note,
      isRepeat: !!existingToday,
      repeatReason: existingToday ? repeatReason || 'Clinical verification requested' : undefined,
    };

    const updatedHistory = [newRecord, ...patient.temperatureHistory];
    const updatedPatient: Patient = {
      ...patient,
      temperatureHistory: updatedHistory,
      todayTempStatus: 'completed',
    };

    // Re-evaluate streak and discharge eligibility
    const { streak, status } = evaluateDischargeEligibility(updatedPatient, feverThreshold);
    updatedPatient.feverFreeStreak = streak;
    updatedPatient.dischargeStatus = status;

    if (celsiusValue >= feverThreshold) {
      updatedPatient.riskCategory = 'Critical';
    }

    const updatedPatients = [...patients];
    updatedPatients[patientIndex] = updatedPatient;
    savePatients(updatedPatients);

    // Activity log
    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'temperature',
      actor: newRecord.recordedBy,
      role,
      description: `Recorded temperature ${celsiusValue}°C (${value}°${inputUnit}) for ${patient.name} (${patient.bed})${existingToday ? ' [Repeat Reading]' : ''}.`,
      patientId: patient.id,
      patientName: patient.name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: existingToday ? 'Repeat Temperature Logged' : 'Temperature Recorded',
      message: `${patient.name} (${patient.bed}): ${celsiusValue.toFixed(1)}°C recorded successfully.`,
    });

    return { success: true, message: 'Temperature recorded successfully' };
  };

  // ACTION: Complete Doctor Visit
  const completeDoctorVisit = ({
    patientId,
    notes,
    isException,
    exceptionReason,
  }: CompleteDoctorVisitParams) => {
    if (role === 'Nurse') {
      addToast({
        type: 'error',
        title: 'Action Unauthorized',
        message: 'Nurses cannot complete doctor rounds. Please switch to Doctor role in demo.',
      });
      return { success: false, message: 'Unauthorized: Nurse role cannot complete doctor rounds' };
    }

    const patientIndex = patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) {
      return { success: false, message: 'Patient not found' };
    }

    const patient = patients[patientIndex];

    // ROUTINE COMPLETION BLOCKED if daily temperature is missing!
    if (patient.todayTempStatus !== 'completed' && !isException) {
      addToast({
        type: 'warning',
        title: 'Temperature Required First',
        message: `Routine visit blocked: ${patient.name} does not have today's temperature recorded yet. Recording vital signs is required before doctor review.`,
      });
      return {
        success: false,
        message: "Routine visit blocked: Today's temperature is missing. Record temperature first or document clinical exception.",
      };
    }

    const doctorName = role === 'Doctor' ? 'Dr. Sarah Lin, MD' : 'Dr. Medical Officer (Admin override)';

    const visitRecord: DoctorVisitRecord = {
      id: `VR-${patient.id}-${Date.now()}`,
      patientId: patient.id,
      visitDate: TODAY,
      doctorNotes: notes || 'Daily clinical assessment completed. Patient stable.',
      isCompleted: true,
      completedAt: new Date().toISOString(),
      completedBy: doctorName,
      clinicalException: isException
        ? {
          reason: exceptionReason || 'Emergency clinical review conducted prior to temperature log',
          confirmedBy: doctorName,
          timestamp: new Date().toISOString(),
        }
        : undefined,
    };

    const updatedPatient: Patient = {
      ...patient,
      todayVisitStatus: 'completed',
      doctorVisitHistory: [visitRecord, ...patient.doctorVisitHistory],
    };

    const updatedPatients = [...patients];
    updatedPatients[patientIndex] = updatedPatient;
    savePatients(updatedPatients);

    // Activity log
    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: isException ? 'exception' : 'doctor_visit',
      actor: doctorName,
      role: 'Doctor',
      description: isException
        ? `Completed CLINICAL EXCEPTION visit for ${patient.name} (${patient.bed}): ${exceptionReason}`
        : `Completed daily clinical visit for ${patient.name} (${patient.bed}).`,
      patientId: patient.id,
      patientName: patient.name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: 'Doctor Visit Completed',
      message: `Rounds completed for ${patient.name} (${patient.bed}).`,
    });

    return { success: true, message: 'Visit completed successfully' };
  };

  // ACTION: Doctor approves clinical eligibility
  const approveClinicalDischarge = (patientId: string) => {
    if (role === 'Nurse') {
      addToast({
        type: 'error',
        title: 'Action Unauthorized',
        message: 'Nurses cannot approve clinical discharge eligibility.',
      });
      return { success: false, message: 'Unauthorized role' };
    }

    const patientIndex = patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) return { success: false, message: 'Patient not found' };

    const patient = patients[patientIndex];
    if (patient.feverFreeStreak < 3) {
      addToast({
        type: 'error',
        title: 'Eligibility Criteria Not Met',
        message: `Patient requires 3 consecutive fever-free days. Current streak is ${patient.feverFreeStreak} day(s).`,
      });
      return { success: false, message: 'Eligibility criteria not met' };
    }

    const doctorName = 'Dr. Sarah Lin, MD';
    const updatedPatient: Patient = {
      ...patient,
      dischargeStatus: 'approved_by_doctor',
      doctorDischargeApprovedAt: new Date().toISOString(),
      doctorDischargeApprovedBy: doctorName,
    };

    const updatedPatients = [...patients];
    updatedPatients[patientIndex] = updatedPatient;
    savePatients(updatedPatients);

    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'discharge_review',
      actor: doctorName,
      role: 'Doctor',
      description: `Doctor approved clinical discharge eligibility for ${patient.name} (${patient.bed}) based on ${patient.feverFreeStreak} fever-free days. Sent to Admin Discharge queue.`,
      patientId: patient.id,
      patientName: patient.name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: 'Clinical Eligibility Approved',
      message: `${patient.name} approved for discharge. Admin role can now complete final processing.`,
    });

    return { success: true, message: 'Approved by doctor' };
  };

  // ACTION: Admin finalizes administrative discharge
  const finalizeAdminDischarge = (patientId: string) => {
    if (role !== 'Admin') {
      addToast({
        type: 'error',
        title: 'Admin Role Required',
        message: 'Final administrative discharge requires Admin role permissions.',
      });
      return { success: false, message: 'Requires Admin role' };
    }

    const patientIndex = patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) return { success: false, message: 'Patient not found' };

    const patient = patients[patientIndex];
    if (patient.dischargeStatus !== 'approved_by_doctor') {
      addToast({
        type: 'warning',
        title: 'Doctor Approval Missing',
        message: 'Administrative discharge cannot proceed without Doctor clinical approval.',
      });
      return { success: false, message: 'Doctor clinical approval required' };
    }

    const freedBed = patient.bed;
    const adminName = 'Admin Taylor Hayes';

    const updatedPatient: Patient = {
      ...patient,
      active: false,
      dischargeStatus: 'discharged',
      dischargeDate: TODAY,
      outcome: 'cured_discharged',
      adminDischargedAt: new Date().toISOString(),
      adminDischargedBy: adminName,
    };

    const updatedPatients = [...patients];
    updatedPatients[patientIndex] = updatedPatient;
    savePatients(updatedPatients);

    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'admin_discharge',
      actor: adminName,
      role: 'Admin',
      description: `Finalized administrative discharge for ${patient.name}. ${freedBed} is now VACANT. Facility occupancy: ${occupiedBedsCount - 1}/${MAX_CAPACITY}.`,
      patientId: patient.id,
      patientName: patient.name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: 'Patient Discharged Successfully',
      message: `${patient.name} discharged. ${freedBed} is now released and available for waiting list admission.`,
    });

    return { success: true, message: 'Discharge complete' };
  };

  // ACTION: Admit from waiting list
  const admitFromWaitingList = (candidateId: string, targetBed?: string) => {
    if (role !== 'Admin') {
      addToast({
        type: 'error',
        title: 'Unauthorized Action',
        message: 'Only Administrators can admit patients from the waiting list.',
      });
      return { success: false, message: 'Admin role required' };
    }

    if (occupiedBedsCount >= MAX_CAPACITY) {
      addToast({
        type: 'warning',
        title: 'Facility at Maximum Capacity',
        message: `Cannot admit: Facility is at maximum capacity (74/74 beds occupied). Discharge a patient first to free a bed.`,
      });
      return { success: false, message: 'Facility at maximum capacity (74/74)' };
    }

    const candidateIndex = waitingList.findIndex((w) => w.id === candidateId);
    if (candidateIndex === -1) return { success: false, message: 'Candidate not found' };

    const candidate = waitingList[candidateIndex];
    const assignedBed = targetBed || vacantBeds[0];

    if (!assignedBed) {
      return { success: false, message: 'No vacant beds available' };
    }

    const bedNum = parseInt(assignedBed.replace(/\D/g, ''), 10);
    const ward: Patient['ward'] = bedNum <= 25 ? 'Ward A' : bedNum <= 50 ? 'Ward B' : 'Ward C';

    const newPatient: Patient = {
      id: `CF-${2000 + patients.length + 1}`,
      name: candidate.name,
      age: candidate.age,
      gender: candidate.gender,
      admissionDate: TODAY,
      bed: assignedBed,
      ward,
      active: true,
      temperatureHistory: [],
      doctorVisitHistory: [],
      todayTempStatus: 'pending',
      todayVisitStatus: 'pending',
      feverFreeStreak: 0,
      dischargeStatus: 'not_eligible',
      riskCategory: candidate.urgency === 'High' ? 'Elevated' : 'Standard',
    };

    const updatedPatients = [newPatient, ...patients];
    const updatedWaiting = waitingList.filter((_, idx) => idx !== candidateIndex);

    savePatients(updatedPatients);
    saveWaitingList(updatedWaiting);

    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'admission',
      actor: 'Admin Taylor Hayes',
      role: 'Admin',
      description: `Admitted waiting list candidate ${candidate.name} into ${assignedBed} (${ward}). Facility occupancy: ${occupiedBedsCount + 1}/${MAX_CAPACITY}.`,
      patientId: newPatient.id,
      patientName: newPatient.name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: 'Patient Admitted from Waiting List',
      message: `${candidate.name} assigned to ${assignedBed} (${ward}).`,
    });

    return { success: true, message: 'Admitted from waiting list' };
  };

  // ACTION: Direct Admission
  const admitNewPatient = ({
    name,
    age,
    gender,
    ward,
  }: {
    name: string;
    age: number;
    gender: 'M' | 'F' | 'Other';
    ward?: 'Ward A' | 'Ward B' | 'Ward C';
  }) => {
    if (role !== 'Admin') {
      addToast({
        type: 'error',
        title: 'Admin Role Required',
        message: 'Patient admission requires Admin privileges.',
      });
      return { success: false, message: 'Admin role required' };
    }

    if (occupiedBedsCount >= MAX_CAPACITY) {
      addToast({
        type: 'warning',
        title: 'Maximum Capacity Reached (74/74)',
        message: 'Normal admission blocked because all 74 beds are occupied. Candidate should be registered on the Waiting List.',
      });
      return { success: false, message: 'All beds occupied. Use waiting list registration.' };
    }

    const assignedBed = vacantBeds[0];
    const bedNum = parseInt(assignedBed.replace(/\D/g, ''), 10);
    const assignedWard = ward || (bedNum <= 25 ? 'Ward A' : bedNum <= 50 ? 'Ward B' : 'Ward C');

    const newPatient: Patient = {
      id: `CF-${2000 + patients.length + 1}`,
      name,
      age,
      gender,
      admissionDate: TODAY,
      bed: assignedBed,
      ward: assignedWard,
      active: true,
      temperatureHistory: [],
      doctorVisitHistory: [],
      todayTempStatus: 'pending',
      todayVisitStatus: 'pending',
      feverFreeStreak: 0,
      dischargeStatus: 'not_eligible',
      riskCategory: 'Standard',
    };

    savePatients([newPatient, ...patients]);

    const activity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'admission',
      actor: 'Admin Taylor Hayes',
      role: 'Admin',
      description: `Directly admitted ${name} into ${assignedBed} (${assignedWard}).`,
      patientId: newPatient.id,
      patientName: name,
    };
    saveActivityLog([activity, ...activityLog]);

    addToast({
      type: 'success',
      title: 'Patient Admitted',
      message: `${name} admitted to ${assignedBed}.`,
    });

    return { success: true, message: 'Patient admitted successfully' };
  };

  // ACTION: Reset Demo Data
  const resetDemoData = () => {
    const initialPatients = generateInitialPatients();
    setPatients(initialPatients);
    setWaitingList(INITIAL_WAITING_LIST);
    setActivityLog(INITIAL_ACTIVITY_LOG);
    setFeverThreshold(FEVER_THRESHOLD_CELSIUS);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_PATIENTS, JSON.stringify(initialPatients));
      localStorage.setItem(LOCAL_STORAGE_KEY_WAITING, JSON.stringify(INITIAL_WAITING_LIST));
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITY, JSON.stringify(INITIAL_ACTIVITY_LOG));
      localStorage.setItem(LOCAL_STORAGE_KEY_THRESHOLD, FEVER_THRESHOLD_CELSIUS.toString());
    }

    addToast({
      type: 'info',
      title: 'Demo Data Reset',
      message: 'Restored initial 74/74 beds, pending/completed workflows, and queues.',
    });
  };

  return (
    <CareFlowContext.Provider
      value={{
        role,
        setRole,
        patients,
        waitingList,
        activityLog,
        outcomesCohort,
        feverThreshold,
        setFeverThreshold,
        searchQuery,
        setSearchQuery,
        selectedPatientId,
        setSelectedPatientId,
        activeSection,
        setActiveSection,
        toasts,
        addToast,
        removeToast,
        recordTemperature,
        completeDoctorVisit,
        approveClinicalDischarge,
        finalizeAdminDischarge,
        admitFromWaitingList,
        admitNewPatient,
        resetDemoData,
        occupiedBedsCount,
        maxCapacity: MAX_CAPACITY,
        todayTempsCompletedCount,
        todayTempsPendingCount,
        todayVisitsCompletedCount,
        todayVisitsPendingCount,
        awaitingClinicalReviewCount,
        awaitingAdminDischargeCount,
        vacantBeds,
      }}
    >
      {children}
    </CareFlowContext.Provider>
  );
}

export function useCareFlow() {
  const context = useContext(CareFlowContext);
  if (!context) {
    throw new Error('useCareFlow must be used within a CareFlowProvider');
  }
  return context;
}
