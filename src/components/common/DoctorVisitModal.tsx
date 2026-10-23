'use client';

import React, { useState } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient } from '@/types';
import { X, Stethoscope, AlertTriangle, CheckCircle, FileText, Lock } from 'lucide-react';

interface DoctorVisitModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordTemp?: (patient: Patient) => void;
}

export function DoctorVisitModal({
  patient,
  isOpen,
  onClose,
  onOpenRecordTemp,
}: DoctorVisitModalProps) {
  const { role, completeDoctorVisit, approveClinicalDischarge } = useCareFlow();
  const [notes, setNotes] = useState<string>('Patient examined during daily rounds. General condition stable, no new acute distress. Continue supportive isolation protocol.');
  const [isException, setIsException] = useState<boolean>(false);
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !patient) return null;

  const isTempMissing = patient.todayTempStatus !== 'completed';
  const isAlreadyVisited = patient.todayVisitStatus === 'completed';
  const latestTemp = patient.temperatureHistory[0];

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === 'Nurse') {
      setError('Nurse role cannot sign off on doctor visits. Please switch role to Doctor.');
      return;
    }

    if (isTempMissing && !isException) {
      setError('Routine doctor visit is blocked until daily temperature is logged.');
      return;
    }

    if (isException && !exceptionReason.trim()) {
      setError('Documented justification is mandatory when conducting a clinical exception visit.');
      return;
    }

    const res = completeDoctorVisit({
      patientId: patient.id,
      notes,
      isException,
      exceptionReason: isException ? exceptionReason : undefined,
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleApproveDischarge = () => {
    const res = approveClinicalDischarge(patient.id);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Stethoscope className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Doctor Rounds & Assessment</h3>
              <p className="text-xs text-slate-300">
                {patient.name} &bull; {patient.bed} ({patient.ward}) &bull; {patient.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleComplete} className="p-6 space-y-4">
          {/* Patient vitals brief */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
            <div>
              <span className="text-gray-500 block">Today's Temperature</span>
              <span className="font-bold text-sm text-gray-900">
                {latestTemp ? `${latestTemp.value.toFixed(1)}°${latestTemp.displayUnit}` : 'Missing'}
              </span>
              <span className="text-[11px] block text-gray-500">
                {patient.todayTempStatus === 'completed' ? 'Logged today' : 'Pending morning vitals'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Fever-Free Streak</span>
              <span className={`font-bold text-sm ${patient.feverFreeStreak >= 3 ? 'text-teal font-extrabold' : 'text-gray-900'}`}>
                {patient.feverFreeStreak} full day(s)
              </span>
              <span className="text-[11px] block text-gray-500">
                {patient.feverFreeStreak >= 3 ? 'Eligible for clearance' : 'Need 3 consecutive days'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Discharge Status</span>
              <span className="font-semibold text-xs text-gray-900 capitalize">
                {patient.dischargeStatus.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] block text-gray-500">
                Admitted {patient.admissionDate}
              </span>
            </div>
          </div>

          {/* Missing Temperature Blocker Warning */}
          {isTempMissing && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Workflow Requirement Blocker: Missing Daily Temperature</span>
              </div>
              <p className="leading-relaxed">
                Standard facility protocol requires that patient vitals be logged before doctor rounds can be marked complete.
                Visiting before vitals are known leads to diagnostic delays and clinical inefficiency.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {onOpenRecordTemp && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecordTemp(patient);
                    }}
                    className="px-3 py-1.5 bg-teal text-white font-medium rounded-md text-xs hover:bg-teal-hover transition shadow-xs"
                  >
                    Record Temperature First
                  </button>
                )}
                {role === 'Doctor' && (
                  <label className="flex items-center gap-2 font-semibold cursor-pointer text-amber-800">
                    <input
                      type="checkbox"
                      checked={isException}
                      onChange={(e) => setIsException(e.target.checked)}
                      className="w-4 h-4 text-teal rounded border-gray-300"
                    />
                    <span>Document Clinical Exception Override</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Documented Clinical Exception Justification Field */}
          {isException && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Clinical Exception Justification (Required)</span>
              </div>
              <textarea
                required
                rows={2}
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="State medical reason for conducting exam prior to temperature recording (e.g. Acute dyspnea, emergency transfer triage)..."
                className="w-full p-2 border border-red-300 rounded-md focus:ring-2 focus:ring-teal bg-white"
              />
            </div>
          )}

          {/* Discharge Eligibility Callout for Doctor */}
          {patient.dischargeStatus === 'eligible_clinical_review' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900">Clinical Discharge Criteria Met</h4>
                  <p className="text-emerald-700">
                    Patient has reached {patient.feverFreeStreak} consecutive afebrile days (&lt; 38.0°C). Ready for physician sign-off.
                  </p>
                </div>
              </div>
              {role === 'Doctor' && (
                <button
                  type="button"
                  onClick={handleApproveDischarge}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition text-xs whitespace-nowrap shadow-xs"
                >
                  Approve Clinical Eligibility
                </button>
              )}
            </div>
          )}

          {/* Already visited today notice */}
          {isAlreadyVisited && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>A doctor visit has already been signed off for today. You may append additional notes below.</span>
            </div>
          )}

          {/* Clinical Visit Notes Input */}
          <div>
            <label htmlFor="doc-notes" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              Physician Examination & Progress Notes *
            </label>
            <textarea
              id="doc-notes"
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal"
              placeholder="Document respiratory effort, constitutional symptoms, therapeutic response, discharge readiness..."
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTempMissing && !isException}
              className={`px-5 py-2 text-xs font-semibold rounded-lg text-white transition shadow-sm ${
                isTempMissing && !isException
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-teal hover:bg-teal-hover'
              }`}
            >
              {isAlreadyVisited ? 'Update Doctor Notes' : 'Complete Doctor Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
