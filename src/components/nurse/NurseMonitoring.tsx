'use client';

import React, { useState, useMemo } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient } from '@/types';
import {
  Thermometer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface NurseMonitoringProps {
  onOpenRecordTemp: (patient: Patient) => void;
  onOpenPatientDetail: (patient: Patient) => void;
}

export function NurseMonitoring({ onOpenRecordTemp, onOpenPatientDetail }: NurseMonitoringProps) {
  const {
    patients,
    feverThreshold,
    todayTempsCompletedCount,
    todayTempsPendingCount,
    occupiedBedsCount,
  } = useCareFlow();

  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [ward, setWard] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const activePatients = useMemo(() => patients.filter((p) => p.active), [patients]);

  const queue = useMemo(() => {
    return activePatients.filter((p) => {
      if (filter === 'pending' && p.todayTempStatus !== 'pending') return false;
      if (filter === 'completed' && p.todayTempStatus !== 'completed') return false;

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

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Banner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Monitoring Queue Status</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {todayTempsPendingCount} Patients Pending
            </div>
            <p className="text-[11px] text-gray-500">Awaiting daily morning temperature log</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed Today</span>
            <div className="text-xl font-black text-teal mt-0.5">
              {todayTempsCompletedCount} Logged
            </div>
            <p className="text-[11px] text-gray-500">
              {Math.round((todayTempsCompletedCount / (occupiedBedsCount || 1)) * 100)}% shift vitals progress
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-light text-teal">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Fever Protocol Standard</span>
            <div className="text-xl font-black text-gray-900 mt-0.5">
              {feverThreshold.toFixed(1)}°C
            </div>
            <p className="text-[11px] text-gray-500">Threshold triggers clinical physician alert</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Queue Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'pending'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Vitals ({todayTempsPendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'completed'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({todayTempsCompletedCount})
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
              placeholder="Search queue..."
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

      {/* Task Queue Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Bed & Location</th>
                <th className="py-3 px-3">Patient Name / ID</th>
                <th className="py-3 px-3">Last Recorded Temp</th>
                <th className="py-3 px-3">Today Status</th>
                <th className="py-3 px-3">Doctor Visit Blocker</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    All patient temperature readings are up to date in this view!
                  </td>
                </tr>
              ) : (
                queue.map((patient) => {
                  const latest = patient.temperatureHistory[0];
                  const isPending = patient.todayTempStatus === 'pending';
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
                        {latest ? (
                          <div>
                            <span
                              className={`font-bold ${
                                isFever ? 'text-rose-600' : 'text-gray-900'
                              }`}
                            >
                              {latest.value.toFixed(1)}°{latest.displayUnit}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              {new Date(latest.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No previous reading</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            <Clock className="w-3 h-3" /> Overdue / Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Logged Today
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isPending && patient.todayVisitStatus === 'pending' ? (
                          <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Blocks Doctor Round
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Unblocked</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenRecordTemp(patient)}
                          className="px-3 py-1.5 bg-teal hover:bg-teal-hover text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 ml-auto"
                        >
                          <Thermometer className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Record Temperature' : 'Repeat Reading'}</span>
                        </button>
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
