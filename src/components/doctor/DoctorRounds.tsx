'use client';

import React, { useState, useMemo } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient } from '@/types';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  Check,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

interface DoctorRoundsProps {
  onOpenDoctorVisit: (patient: Patient) => void;
  onOpenRecordTemp: (patient: Patient) => void;
  onOpenPatientDetail: (patient: Patient) => void;
}

export function DoctorRounds({
  onOpenDoctorVisit,
  onOpenRecordTemp,
  onOpenPatientDetail,
}: DoctorRoundsProps) {
  const {
    patients,
    role,
    feverThreshold,
    todayVisitsCompletedCount,
    todayVisitsPendingCount,
    occupiedBedsCount,
  } = useCareFlow();

  const [filter, setFilter] = useState<'ready' | 'blocked' | 'completed' | 'all'>('ready');
  const [ward, setWard] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const activePatients = useMemo(() => patients.filter((p) => p.active), [patients]);

  const queue = useMemo(() => {
    return activePatients.filter((p) => {
      // Ready = Vitals logged today & visit pending
      if (filter === 'ready') {
        if (!(p.todayTempStatus === 'completed' && p.todayVisitStatus === 'pending')) return false;
      }
      // Blocked = Visit pending BUT vitals missing today
      if (filter === 'blocked') {
        if (!(p.todayTempStatus === 'pending' && p.todayVisitStatus === 'pending')) return false;
      }
      // Completed = Visit done today
      if (filter === 'completed') {
        if (p.todayVisitStatus !== 'completed') return false;
      }

      if (ward !== 'all' && p.ward !== ward) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.bed.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [activePatients, filter, ward, search]);

  const readyCount = activePatients.filter(
    (p) => p.todayTempStatus === 'completed' && p.todayVisitStatus === 'pending'
  ).length;
  const blockedCount = activePatients.filter(
    (p) => p.todayTempStatus === 'pending' && p.todayVisitStatus === 'pending'
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Banner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Ready for Rounds</span>
            <div className="text-xl font-black text-teal mt-0.5">
              {readyCount} Patients Ready
            </div>
            <p className="text-[11px] text-gray-500">Morning temperature verified & logged</p>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-light text-teal">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Visits Blocked</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {blockedCount} Patients Blocked
            </div>
            <p className="text-[11px] text-gray-500">Requires daily vitals before routine exam</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed Rounds</span>
            <div className="text-xl font-black text-navy mt-0.5">
              {todayVisitsCompletedCount} Examined
            </div>
            <p className="text-[11px] text-gray-500">
              {Math.round((todayVisitsCompletedCount / (occupiedBedsCount || 1)) * 100)}% rounds coverage
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-navy">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'ready'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ready for Rounds ({readyCount})
          </button>
          <button
            onClick={() => setFilter('blocked')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'blocked'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Blocked by Vitals ({blockedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'completed'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({todayVisitsCompletedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Beds ({occupiedBedsCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-8 pr-3 py-1.5 bg-white text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal"
            />
          </div>

          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium text-gray-700 focus:ring-2 focus:ring-teal"
          >
            <option value="all">All Wards</option>
            <option value="Ward A">Ward A</option>
            <option value="Ward B">Ward B</option>
            <option value="Ward C">Ward C</option>
          </select>
        </div>
      </div>

      {/* Doctor Rounds Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Bed & Location</th>
                <th className="py-3 px-3">Patient Name / ID</th>
                <th className="py-3 px-3">Today Temperature</th>
                <th className="py-3 px-3">Fever-Free Streak</th>
                <th className="py-3 px-3">Clinical Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    No doctor round items pending in this view.
                  </td>
                </tr>
              ) : (
                queue.map((patient) => {
                  const latest = patient.temperatureHistory[0];
                  const isTempMissing = patient.todayTempStatus !== 'completed';
                  const isVisited = patient.todayVisitStatus === 'completed';
                  const isFever = latest && latest.value >= feverThreshold;

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => onOpenPatientDetail(patient)}
                      className="hover:bg-teal-light/20 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-sm">{patient.bed}</span>
                        <span className="block text-[11px] text-gray-500">{patient.ward}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{patient.name}</div>
                        <span className="text-[11px] font-mono text-gray-400">{patient.id}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isTempMissing ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Missing Today
                          </span>
                        ) : (
                          <div>
                            <span
                              className={`font-bold ${
                                isFever ? 'text-rose-600' : 'text-gray-900'
                              }`}
                            >
                              {latest.value.toFixed(1)}°{latest.displayUnit}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              Logged by {latest.recordedBy}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            patient.feverFreeStreak >= 3
                              ? 'bg-teal-light text-teal border border-teal/30'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {patient.feverFreeStreak} full day(s)
                        </span>
                        {patient.feverFreeStreak >= 3 && (
                          <span className="block text-[10px] text-teal font-semibold mt-0.5">
                            Eligible for discharge
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isVisited ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Visit Signed Off
                          </span>
                        ) : isTempMissing ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" /> Routine Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal bg-teal-light px-2 py-0.5 rounded border border-teal/20">
                            <Stethoscope className="w-3 h-3" /> Ready for Assessment
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          {isTempMissing && (
                            <button
                              onClick={() => onOpenRecordTemp(patient)}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition"
                            >
                              Record Temp
                            </button>
                          )}
                          <button
                            onClick={() => onOpenDoctorVisit(patient)}
                            className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 ${
                              isVisited
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : isTempMissing
                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                : 'bg-navy hover:bg-navy-light text-white shadow-xs'
                            }`}
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>{isVisited ? 'Update Notes' : 'Review Patient'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
