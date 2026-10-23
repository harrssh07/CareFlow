'use client';

import React, { useState } from 'react';
import { CareFlowProvider, useCareFlow } from '@/context/CareFlowContext';
import { Shell } from '@/components/layout/Shell';
import { OverviewDashboard } from '@/components/overview/OverviewDashboard';
import { PatientDirectory } from '@/components/patients/PatientDirectory';
import { NurseMonitoring } from '@/components/nurse/NurseMonitoring';
import { DoctorRounds } from '@/components/doctor/DoctorRounds';
import { DischargeManagement } from '@/components/discharge/DischargeManagement';
import { OutcomesQuality } from '@/components/outcomes/OutcomesQuality';
import { ToastContainer } from '@/components/common/ToastContainer';
import { RecordTempModal } from '@/components/common/RecordTempModal';
import { DoctorVisitModal } from '@/components/common/DoctorVisitModal';
import { PatientDrawer } from '@/components/common/PatientDrawer';
import { AdmissionModal } from '@/components/common/AdmissionModal';
import { ResetModal } from '@/components/common/ResetModal';
import { Patient } from '@/types';

function CareFlowApp() {
  const { activeSection, selectedPatientId, setSelectedPatientId, patients } = useCareFlow();

  // Active modals state
  const [recordTempPatient, setRecordTempPatient] = useState<Patient | null>(null);
  const [doctorVisitPatient, setDoctorVisitPatient] = useState<Patient | null>(null);
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [admissionTab, setAdmissionTab] = useState<'new' | 'waiting'>('new');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Selected patient for detail drawer
  const drawerPatient = patients.find((p) => p.id === selectedPatientId) || null;

  const handleOpenRecordTemp = (patient: Patient) => {
    setRecordTempPatient(patient);
  };

  const handleOpenDoctorVisit = (patient: Patient) => {
    setDoctorVisitPatient(patient);
  };

  const handleOpenPatientDetail = (patient: Patient) => {
    setSelectedPatientId(patient.id);
  };

  const handleOpenAdmissionModal = (tab: 'new' | 'waiting' = 'new') => {
    setAdmissionTab(tab);
    setAdmissionModalOpen(true);
  };

  return (
    <Shell
      onOpenResetModal={() => setResetModalOpen(true)}
      onOpenAdmissionModal={handleOpenAdmissionModal}
    >
      {/* Route according to active section */}
      {activeSection === 'overview' && (
        <OverviewDashboard
          onOpenRecordTemp={handleOpenRecordTemp}
          onOpenDoctorVisit={handleOpenDoctorVisit}
          onOpenPatientDetail={handleOpenPatientDetail}
        />
      )}

      {activeSection === 'patients' && (
        <PatientDirectory
          onOpenRecordTemp={handleOpenRecordTemp}
          onOpenDoctorVisit={handleOpenDoctorVisit}
          onOpenPatientDetail={handleOpenPatientDetail}
          onOpenAdmissionModal={handleOpenAdmissionModal}
        />
      )}

      {activeSection === 'nurse' && (
        <NurseMonitoring
          onOpenRecordTemp={handleOpenRecordTemp}
          onOpenPatientDetail={handleOpenPatientDetail}
        />
      )}

      {activeSection === 'doctor' && (
        <DoctorRounds
          onOpenDoctorVisit={handleOpenDoctorVisit}
          onOpenRecordTemp={handleOpenRecordTemp}
          onOpenPatientDetail={handleOpenPatientDetail}
        />
      )}

      {activeSection === 'discharge' && (
        <DischargeManagement
          onOpenPatientDetail={handleOpenPatientDetail}
          onOpenDoctorVisit={handleOpenDoctorVisit}
        />
      )}

      {activeSection === 'outcomes' && <OutcomesQuality />}

      {/* Global Modals & Drawers */}
      <PatientDrawer
        patient={drawerPatient}
        isOpen={!!drawerPatient}
        onClose={() => setSelectedPatientId(null)}
        onOpenRecordTemp={handleOpenRecordTemp}
        onOpenDoctorVisit={handleOpenDoctorVisit}
      />

      <RecordTempModal
        patient={recordTempPatient}
        isOpen={!!recordTempPatient}
        onClose={() => setRecordTempPatient(null)}
      />

      <DoctorVisitModal
        patient={doctorVisitPatient}
        isOpen={!!doctorVisitPatient}
        onClose={() => setDoctorVisitPatient(null)}
        onOpenRecordTemp={handleOpenRecordTemp}
      />

      <AdmissionModal
        isOpen={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
        initialTab={admissionTab}
      />

      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </Shell>
  );
}

export default function Home() {
  return (
    <CareFlowProvider>
      <CareFlowApp />
    </CareFlowProvider>
  );
}
