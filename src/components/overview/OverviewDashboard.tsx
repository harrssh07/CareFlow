'use client';

import React from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient } from '@/types';
import {
  Bed,
  Thermometer,
  Stethoscope,
  LogOut,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface OverviewDashboardProps {
  onOpenRecordTemp: (patient: Patient) => void;
  onOpenDoctorVisit: (patient: Patient) => void;
  onOpenPatientDetail: (patient: Patient) => void;
}

export function OverviewDashboard({
  onOpenRecordTemp,
  onOpenDoctorVisit,
  onOpenPatientDetail,
}: OverviewDashboardProps) {
  const {
    patients,
    occupiedBedsCount,
    maxCapacity,
    todayTempsCompletedCount,
    todayTempsPendingCount,
    todayVisitsCompletedCount,
    todayVisitsPendingCount,
    awaitingClinicalReviewCount,
    awaitingAdminDischargeCount,
    outcomesCohort,
    activityLog,
    setActiveSection,
    role,
  } = useCareFlow();

  const tempCompletionPct = Math.round((todayTempsCompletedCount / (occupiedBedsCount || 1)) * 100);
  const visitCompletionPct = Math.round((todayVisitsCompletedCount / (occupiedBedsCount || 1)) * 100);

  // Identify prioritized Action Required items
  const activePatients = patients.filter((p) => p.active);
  const patientsNeedingTemp = activePatients.filter((p) => p.todayTempStatus === 'pending');
  const patientsBlockedVisits = activePatients.filter(
    (p) => p.todayVisitStatus === 'pending' && p.todayTempStatus === 'pending'
  );
  const patientsReadyForVisit = activePatients.filter(
    (p) => p.todayVisitStatus === 'pending' && p.todayTempStatus === 'completed'
  );
  const patientsAwaitingAdmin = activePatients.filter((p) => p.dischargeStatus === 'approved_by_doctor');
  const febrilePatients = activePatients.filter((p) => {
    const latest = p.temperatureHistory[0];
    return latest && latest.value >= 38.0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Alert if Capacity Full or Benchmark Breach */}
      <div className="space-y-2">
        {occupiedBedsCount >= maxCapacity && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Quarantine Facility at Full Bed Capacity ({occupiedBedsCount}/{maxCapacity}):</strong> Direct admissions are restricted. Prioritize processing eligible clinical discharges to release beds.
              </span>
            </div>
            <button
              onClick={() => setActiveSection('discharge')}
              className="text-amber-800 hover:text-amber-950 font-bold underline text-xs whitespace-nowrap ml-2"
            >
              Review Discharges &rarr;
            </button>
          </div>
        )}

        {/* Benchmark Breaches Alert */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Clinical Outcome Benchmark Breaches:</strong> Completed cohort mortality is {outcomesCohort.mortalityRate}% (benchmark &le; {outcomesCohort.mortalityBenchmark}%), and treatment success is {outcomesCohort.successRate}% (benchmark &ge; {outcomesCohort.successBenchmark}%).
            </span>
          </div>
          <button
            onClick={() => setActiveSection('outcomes')}
            className="text-rose-800 hover:text-rose-950 font-bold underline text-xs whitespace-nowrap ml-2"
          >
            Inspect Cohort &rarr;
          </button>
        </div>
      </div>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {/* 1. Bed Occupancy */}
        <div
          onClick={() => setActiveSection('patients')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-teal/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bed Occupancy</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-teal group-hover:text-white transition">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {occupiedBedsCount}/{maxCapacity}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              {Math.round((occupiedBedsCount / maxCapacity) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {maxCapacity - occupiedBedsCount === 0 ? 'No vacant beds' : `${maxCapacity - occupiedBedsCount} vacant beds`}
          </p>
        </div>

        {/* 2. Today Temp Completed */}
        <div
          onClick={() => setActiveSection('nurse')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-teal/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Temps Done</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {todayTempsCompletedCount}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              / {occupiedBedsCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{tempCompletionPct}% completion rate</p>
        </div>

        {/* 3. Today Temp Pending */}
        <div
          onClick={() => setActiveSection('nurse')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-amber-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Temps Pending</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {todayTempsPendingCount}
            </span>
            <span className="text-xs font-semibold text-gray-500">patients</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Outstanding morning vitals</p>
        </div>

        {/* 4. Doctor Visits Done */}
        <div
          onClick={() => setActiveSection('doctor')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-teal/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Visits Done</span>
            <div className="p-1.5 rounded-lg bg-teal-light text-teal group-hover:bg-teal group-hover:text-white transition">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal">
              {todayVisitsCompletedCount}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              / {occupiedBedsCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{visitCompletionPct}% clinical rounds completed</p>
        </div>

        {/* 5. Doctor Visits Pending */}
        <div
          onClick={() => setActiveSection('doctor')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-teal/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Visits Pending</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-navy">
              {todayVisitsPendingCount}
            </span>
            <span className="text-xs font-semibold text-gray-500">patients</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {patientsBlockedVisits.length} blocked by missing temp
          </p>
        </div>

        {/* 6. Awaiting Discharge */}
        <div
          onClick={() => setActiveSection('discharge')}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-teal/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Discharge</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">
              {awaitingClinicalReviewCount + awaitingAdminDischargeCount}
            </span>
            <span className="text-xs font-semibold text-gray-500">cases</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {awaitingClinicalReviewCount} Doctor &bull; {awaitingAdminDischargeCount} Admin
          </p>
        </div>

        {/* 7. Mortality Rate */}
        <div
          onClick={() => setActiveSection('outcomes')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs hover:border-rose-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Mortality Rate</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">
              {outcomesCohort.mortalityRate}%
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
              Above 15% Max
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {outcomesCohort.deaths}/{outcomesCohort.completedCases} completed cases
          </p>
        </div>

        {/* 8. Success Rate */}
        <div
          onClick={() => setActiveSection('outcomes')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Treatment Success</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">
              {outcomesCohort.successRate}%
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
              Below 85% Target
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {outcomesCohort.successes}/{outcomesCohort.completedCases} cured cases
          </p>
        </div>
      </div>

      {/* Progress Bars: Monitoring & Doctor Visits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Monitoring Completion */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Daily Temperature Monitoring Progress
              </h3>
            </div>
            <span className="text-xs font-bold text-teal">{tempCompletionPct}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal transition-all duration-500 rounded-full"
              style={{ width: `${tempCompletionPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{todayTempsCompletedCount} of {occupiedBedsCount} patients measured today</span>
            <button
              onClick={() => setActiveSection('nurse')}
              className="text-teal hover:underline font-semibold flex items-center gap-1"
            >
              Open Nurse Queue &rarr;
            </button>
          </div>
        </div>

        {/* Daily Doctor Visit Progress */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-navy" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Daily Doctor Rounds Progress
              </h3>
            </div>
            <span className="text-xs font-bold text-navy">{visitCompletionPct}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy transition-all duration-500 rounded-full"
              style={{ width: `${visitCompletionPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{todayVisitsCompletedCount} of {occupiedBedsCount} doctor visits signed off</span>
            <button
              onClick={() => setActiveSection('doctor')}
              className="text-navy hover:underline font-semibold flex items-center gap-1"
            >
              Open Doctor Queue &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Action Required & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prioritized Action Required Panel (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-gray-900">Prioritized Action Required</h3>
                <p className="text-xs text-gray-500">
                  Critical operational bottlenecks and pending clinical actions
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {patientsBlockedVisits.length + patientsAwaitingAdmin.length + febrilePatients.length} Active Items
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. Missing Temperatures Blocking Doctor Visits */}
            {patientsBlockedVisits.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{patientsBlockedVisits.length} Routine Doctor Visits Blocked by Missing Temperatures</span>
                  </div>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    Physician rounds cannot be signed off until morning vitals are captured. Logging temperatures resolves this blocker immediately.
                  </p>
                  <p className="text-amber-700 text-[11px] mt-1">
                    Affected: {patientsBlockedVisits.slice(0, 4).map((p) => `${p.name} (${p.bed})`).join(', ')}
                    {patientsBlockedVisits.length > 4 ? ` +${patientsBlockedVisits.length - 4} more` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('nurse')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs whitespace-nowrap shadow-xs transition"
                >
                  Record Temps &rarr;
                </button>
              </div>
            )}

            {/* 2. Discharges awaiting Admin completion */}
            {patientsAwaitingAdmin.length > 0 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{patientsAwaitingAdmin.length} Clinically Approved Patient(s) Ready for Admin Discharge</span>
                  </div>
                  <p className="text-emerald-800 mt-1 leading-relaxed">
                    Doctor Lin has approved 3-day afebrile criteria. Completing administrative discharge will release occupied beds for waiting candidates.
                  </p>
                  <p className="text-emerald-700 text-[11px] mt-1">
                    Ready: {patientsAwaitingAdmin.map((p) => `${p.name} (${p.bed})`).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('discharge')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs whitespace-nowrap shadow-xs transition"
                >
                  Process Discharge &rarr;
                </button>
              </div>
            )}

            {/* 3. Patients with Acute Fever */}
            {febrilePatients.length > 0 && (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{febrilePatients.length} Patient(s) Presenting with Fever (&ge; 38.0°C)</span>
                  </div>
                  <p className="text-rose-800 mt-1 leading-relaxed">
                    Fever excursion detected. Consecutive fever-free streak has reset. Requires attending physician clinical assessment and antipyretic evaluation.
                  </p>
                  <p className="text-rose-700 text-[11px] mt-1">
                    Beds: {febrilePatients.slice(0, 3).map((p) => `${p.name} (${p.bed}: ${p.temperatureHistory[0]?.value.toFixed(1)}°C)`).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('doctor')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs whitespace-nowrap shadow-xs transition"
                >
                  Doctor Review &rarr;
                </button>
              </div>
            )}

            {/* 4. Ready for Doctor Visits */}
            {patientsReadyForVisit.length > 0 && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sky-900">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    <span>{patientsReadyForVisit.length} Patients with Vitals Complete Awaiting Doctor Review</span>
                  </div>
                  <p className="text-sky-800 mt-1">
                    Morning temperatures recorded and available in chart. Ready for clinical sign-off.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('doctor')}
                  className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white rounded font-semibold text-xs whitespace-nowrap shadow-xs transition"
                >
                  Start Rounds &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Log Feed (1 column) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal" /> Recent Facility Activity
            </h3>
            <span className="text-[11px] text-gray-400">Live operational log</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1 text-xs">
            {activityLog.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No activity logged yet.</p>
            ) : (
              activityLog.slice(0, 10).map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-[11px]">{act.actor}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed">{act.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
