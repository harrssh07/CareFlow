'use client';

import React from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient } from '@/types';
import { TODAY } from '@/lib/demoData';
import {
  X,
  User,
  Thermometer,
  Stethoscope,
  Calendar,
  CheckCircle,
  AlertTriangle,
  History,
  ShieldAlert,
  ArrowRight,
  Bed,
} from 'lucide-react';

interface PatientDrawerProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordTemp: (patient: Patient) => void;
  onOpenDoctorVisit: (patient: Patient) => void;
}

export function PatientDrawer({
  patient,
  isOpen,
  onClose,
  onOpenRecordTemp,
  onOpenDoctorVisit,
}: PatientDrawerProps) {
  const { role, feverThreshold, approveClinicalDischarge, finalizeAdminDischarge } = useCareFlow();

  if (!isOpen || !patient) return null;

  const latestTemp = patient.temperatureHistory[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="bg-navy px-6 py-5 text-white flex items-center justify-between border-b border-navy-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/20 text-teal flex items-center justify-center font-bold text-base border border-teal/40">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{patient.name}</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-teal">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{patient.bed}</span> &bull; <span>{patient.ward}</span> &bull;{' '}
                <span>{patient.age} yrs ({patient.gender})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-[11px] text-gray-500 block">Today's Temp</span>
              <span
                className={`font-semibold text-xs inline-flex items-center gap-1 mt-1 ${
                  patient.todayTempStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {patient.todayTempStatus === 'completed' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Logged
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-[11px] text-gray-500 block">Today's Visit</span>
              <span
                className={`font-semibold text-xs inline-flex items-center gap-1 mt-1 ${
                  patient.todayVisitStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {patient.todayVisitStatus === 'completed' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-[11px] text-gray-500 block">Fever-Free Streak</span>
              <span className="font-bold text-xs text-navy mt-1 block">
                {patient.feverFreeStreak} consecutive day(s)
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-[11px] text-gray-500 block">Risk Category</span>
              <span
                className={`font-bold text-xs mt-1 block ${
                  patient.riskCategory === 'Critical'
                    ? 'text-rose-600'
                    : patient.riskCategory === 'Elevated'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {patient.riskCategory}
              </span>
            </div>
          </div>

          {/* Discharge Eligibility Status Box */}
          <div className="p-4 rounded-xl border border-teal/30 bg-teal-light/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Discharge Workflow Stage
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-teal shadow-xs border border-teal/20 capitalize">
                {patient.dischargeStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              <strong>Clinical Benchmark:</strong> Requires 3 full consecutive days with temperatures strictly below{' '}
              {feverThreshold.toFixed(1)}°C. Missing days explicitly terminate the qualification streak.
            </p>

            <div className="pt-2 text-xs flex items-center justify-between">
              <span className="text-gray-600">
                Evaluation: {patient.feverFreeStreak >= 3 ? 'Eligible for physician discharge approval' : `${3 - patient.feverFreeStreak} more afebrile day(s) required`}
              </span>
              {role === 'Doctor' && patient.dischargeStatus === 'eligible_clinical_review' && (
                <button
                  onClick={() => approveClinicalDischarge(patient.id)}
                  className="px-3 py-1 bg-teal hover:bg-teal-hover text-white rounded font-semibold text-xs shadow-xs transition"
                >
                  Approve Clinical Eligibility
                </button>
              )}
              {role === 'Admin' && patient.dischargeStatus === 'approved_by_doctor' && (
                <button
                  onClick={() => finalizeAdminDischarge(patient.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-xs transition"
                >
                  Finalize Admin Discharge
                </button>
              )}
            </div>
          </div>

          {/* Role-Specific Action Bar */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Available Actions ({role} View)</span>
              <span>Demo Staff Role: {role}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onOpenRecordTemp(patient)}
                className="px-3.5 py-2 rounded-lg bg-teal hover:bg-teal-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Thermometer className="w-3.5 h-3.5" /> Record Temperature
              </button>

              <button
                onClick={() => onOpenDoctorVisit(patient)}
                className="px-3.5 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal" /> Doctor Rounds
              </button>
            </div>
          </div>

          {/* Temperature Measurement History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-teal" /> Temperature Measurement History ({patient.temperatureHistory.length})
              </h4>
              <span className="text-[11px] text-gray-500">Threshold: {feverThreshold.toFixed(1)}°C</span>
            </div>

            {patient.temperatureHistory.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-lg text-xs text-gray-400">
                No temperature readings recorded yet.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-xs">
                {patient.temperatureHistory.map((rec) => {
                  const isFever = rec.value >= feverThreshold;
                  return (
                    <div key={rec.id} className="p-3 flex items-start justify-between hover:bg-gray-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              isFever ? 'text-rose-600' : 'text-gray-900'
                            }`}
                          >
                            {rec.value.toFixed(1)}°{rec.displayUnit}
                          </span>
                          {isFever ? (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                              FEVER
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded">
                              Normal
                            </span>
                          )}
                          {rec.isRepeat && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                              REPEAT READING
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Logged by <span className="font-medium text-gray-700">{rec.recordedBy}</span>
                          {rec.repeatReason ? ` &bull; Reason: ${rec.repeatReason}` : ''}
                        </p>
                        {rec.note && <p className="text-gray-600 mt-1 italic">"{rec.note}"</p>}
                      </div>
                      <span className="text-gray-400 text-[11px] font-mono whitespace-nowrap">
                        {new Date(rec.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Doctor Visit History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal" /> Doctor Clinical Visit History ({patient.doctorVisitHistory.length})
            </h4>

            {patient.doctorVisitHistory.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-lg text-xs text-gray-400">
                No doctor visits recorded yet.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-xs">
                {patient.doctorVisitHistory.map((visit) => (
                  <div key={visit.id} className="p-3 space-y-1 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {visit.completedBy || 'Attending Physician'}
                      </span>
                      <span className="text-gray-400 text-[11px] font-mono">
                        {visit.visitDate}
                      </span>
                    </div>
                    {visit.clinicalException && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[11px] font-semibold">
                        Clinical Exception: {visit.clinicalException.reason}
                      </div>
                    )}
                    <p className="text-gray-700 leading-relaxed">{visit.doctorNotes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Admitted on {patient.admissionDate}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
