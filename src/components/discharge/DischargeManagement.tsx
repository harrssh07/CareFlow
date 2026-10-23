'use client';

import React, { useState, useMemo } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient, DischargeStatus } from '@/types';
import { TODAY } from '@/lib/demoData';
import {
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Bed,
  Info,
  Calendar,
  Check,
} from 'lucide-react';

interface DischargeManagementProps {
  onOpenPatientDetail: (patient: Patient) => void;
  onOpenDoctorVisit: (patient: Patient) => void;
}

export function DischargeManagement({
  onOpenPatientDetail,
  onOpenDoctorVisit,
}: DischargeManagementProps) {
  const {
    patients,
    role,
    feverThreshold,
    setFeverThreshold,
    approveClinicalDischarge,
    finalizeAdminDischarge,
    occupiedBedsCount,
    maxCapacity,
    awaitingClinicalReviewCount,
    awaitingAdminDischargeCount,
  } = useCareFlow();

  const [activeStage, setActiveStage] = useState<'all' | 'clinical_review' | 'admin_queue' | 'discharged'>('clinical_review');
  const [confirmAdminId, setConfirmAdminId] = useState<string | null>(null);

  const stageCounts = useMemo(() => {
    return {
      clinical_review: patients.filter((p) => p.active && p.dischargeStatus === 'eligible_clinical_review').length,
      admin_queue: patients.filter((p) => p.active && p.dischargeStatus === 'approved_by_doctor').length,
      discharged: patients.filter((p) => !p.active).length,
      all: patients.filter((p) => p.active).length,
    };
  }, [patients]);

  const displayedPatients = useMemo(() => {
    return patients.filter((p) => {
      if (activeStage === 'clinical_review') {
        return p.active && p.dischargeStatus === 'eligible_clinical_review';
      }
      if (activeStage === 'admin_queue') {
        return p.active && p.dischargeStatus === 'approved_by_doctor';
      }
      if (activeStage === 'discharged') {
        return !p.active;
      }
      return p.active;
    });
  }, [patients, activeStage]);

  const handleAdminDischargeConfirm = (patientId: string) => {
    finalizeAdminDischarge(patientId);
    setConfirmAdminId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Policy and Protocol Explanation Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Quarantine Clinical Discharge Protocol & Evidence Verification
              </h3>
              <p className="text-xs text-gray-500">
                Strict multi-stage workflow: Objective Afebrile Streak &rarr; Attending Physician Clearance &rarr; Administrative Bed Release
              </p>
            </div>
          </div>

          {/* Configurable Fever Threshold Controller */}
          <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
            <span className="text-gray-600 font-semibold">Demo Fever Threshold:</span>
            <select
              value={feverThreshold}
              onChange={(e) => setFeverThreshold(parseFloat(e.target.value))}
              className="bg-white border border-gray-300 font-bold text-gray-900 rounded px-2 py-0.5 focus:ring-1 focus:ring-teal"
            >
              <option value={37.8}>37.8°C (100.0°F)</option>
              <option value={38.0}>38.0°C (100.4°F) [Default]</option>
              <option value={38.2}>38.2°C (100.8°F)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-teal text-white flex items-center justify-center text-[10px]">1</span>
              3-Day Afebrile Criterion
            </span>
            <p className="leading-relaxed text-[11px]">
              Patient must have valid temperature records for 3 consecutive days strictly &lt; {feverThreshold.toFixed(1)}°C. Missing records strictly terminate the streak.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-navy text-white flex items-center justify-center text-[10px]">2</span>
              Physician Clinical Sign-Off
            </span>
            <p className="leading-relaxed text-[11px]">
              Patients meeting afebrile criteria never auto-discharge. The attending Doctor must explicitly evaluate recovery and grant clearance.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
              Administrative Bed Release
            </span>
            <p className="leading-relaxed text-[11px]">
              Admin executes final discharge checkout, updates facility occupancy, and triggers intake for waiting list candidates.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Demonstration Assumption Note:</strong> The 38.0°C threshold is an operational baseline assumption for this assessment. In clinical production, threshold protocols are defined by national quarantine guidelines.
          </span>
        </div>
      </div>

      {/* Stage Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveStage('clinical_review')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeStage === 'clinical_review'
              ? 'border-b-2 border-teal text-teal bg-white font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 text-teal" />
          <span>1. Eligible for Doctor Review</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-light text-teal text-[11px]">
            {stageCounts.clinical_review}
          </span>
        </button>

        <button
          onClick={() => setActiveStage('admin_queue')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeStage === 'admin_queue'
              ? 'border-b-2 border-teal text-teal bg-white font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>2. Awaiting Admin Discharge</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">
            {stageCounts.admin_queue}
          </span>
        </button>

        <button
          onClick={() => setActiveStage('discharged')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeStage === 'discharged'
              ? 'border-b-2 border-teal text-teal bg-white font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          <span>3. Completed Discharges</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px]">
            {stageCounts.discharged}
          </span>
        </button>
      </div>

      {/* Discharge Cards List */}
      <div className="space-y-3">
        {displayedPatients.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No patients in this discharge queue.</p>
            <p className="text-xs text-gray-500 mt-1">
              {activeStage === 'clinical_review'
                ? 'No active patients currently satisfy 3 consecutive fever-free days without prior doctor clearance.'
                : activeStage === 'admin_queue'
                ? 'No clinically approved discharges currently waiting for administrative bed release.'
                : 'No patients have been discharged during this session yet.'}
            </p>
          </div>
        ) : (
          displayedPatients.map((patient) => {
            const tempHistory = patient.temperatureHistory;
            const latest3Temps = tempHistory.slice(0, 3);

            return (
              <div
                key={patient.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-teal/40 transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                      {patient.bed.replace('Bed ', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => onOpenPatientDetail(patient)}
                          className="font-bold text-sm text-gray-900 hover:text-teal cursor-pointer"
                        >
                          {patient.name}
                        </h4>
                        <span className="text-xs font-mono text-gray-400">({patient.id})</span>
                        <span className="text-xs text-gray-500">&bull; {patient.ward}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Admitted: {patient.admissionDate} &bull; Age: {patient.age} ({patient.gender}) &bull;{' '}
                        Streak: <span className="font-bold text-teal">{patient.feverFreeStreak} full days afebrile</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {patient.dischargeStatus === 'eligible_clinical_review' && (
                      <span className="px-3 py-1 bg-teal-light text-teal font-semibold rounded-full text-xs border border-teal/20 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Eligible for Clinical Sign-off
                      </span>
                    )}
                    {patient.dischargeStatus === 'approved_by_doctor' && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full text-xs border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Doctor Approved &bull; Ready for Admin
                      </span>
                    )}
                    {patient.dischargeStatus === 'discharged' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 font-semibold rounded-full text-xs flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5" /> Discharged on {patient.dischargeDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence Panel: 3 Consecutive Days Temperature Readings */}
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Verified Temperature Evidence (Last 3 Days)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {latest3Temps.length === 0 ? (
                      <div className="col-span-3 text-gray-400 text-center py-2">
                        Missing historical reading logs
                      </div>
                    ) : (
                      latest3Temps.map((t, idx) => {
                        const dateStr = t.timestamp.split('T')[0];
                        const isNormal = t.value < feverThreshold;
                        return (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-md border flex items-center justify-between ${
                              isNormal ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-200'
                            }`}
                          >
                            <div>
                              <span className="text-[10px] text-gray-500 font-mono block">
                                Day -{idx}: {dateStr}
                              </span>
                              <span
                                className={`font-bold text-sm ${
                                  isNormal ? 'text-gray-900' : 'text-rose-600'
                                }`}
                              >
                                {t.value.toFixed(1)}°{t.displayUnit}
                              </span>
                            </div>
                            {isNormal ? (
                              <span className="text-emerald-600 font-semibold text-[10px] flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Afebrile
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold text-[10px]">Fever</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-gray-500">
                    {patient.doctorDischargeApprovedBy && (
                      <span>
                        Clinically cleared by <strong>{patient.doctorDischargeApprovedBy}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenPatientDetail(patient)}
                      className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
                    >
                      Inspect Full Chart
                    </button>

                    {/* Stage 1: Doctor approval button */}
                    {patient.dischargeStatus === 'eligible_clinical_review' && (
                      <button
                        onClick={() => approveClinicalDischarge(patient.id)}
                        disabled={role === 'Nurse'}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition flex items-center gap-1.5 ${
                          role === 'Nurse'
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-teal hover:bg-teal-hover'
                        }`}
                        title={role === 'Nurse' ? 'Doctor role required to approve clinical discharge' : 'Sign off clinical clearance'}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Clinical Eligibility</span>
                      </button>
                    )}

                    {/* Stage 2: Admin final discharge button with confirmation */}
                    {patient.dischargeStatus === 'approved_by_doctor' && (
                      <>
                        {confirmAdminId === patient.id ? (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 p-1 rounded-lg border border-emerald-300">
                            <span className="text-[11px] font-bold text-emerald-900 px-1">
                              Release {patient.bed}?
                            </span>
                            <button
                              onClick={() => handleAdminDischargeConfirm(patient.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition"
                            >
                              Yes, Finalize
                            </button>
                            <button
                              onClick={() => setConfirmAdminId(null)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (role !== 'Admin') {
                                finalizeAdminDischarge(patient.id); // triggers unauthorized toast
                              } else {
                                setConfirmAdminId(patient.id);
                              }
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Finalize Administrative Discharge</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
