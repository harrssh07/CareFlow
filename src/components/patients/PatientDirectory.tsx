'use client';

import React, { useState, useMemo } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient, DischargeStatus } from '@/types';
import {
  Search,
  Filter,
  UserPlus,
  Thermometer,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Eye,
  ListOrdered,
  Bed,
} from 'lucide-react';

interface PatientDirectoryProps {
  onOpenRecordTemp: (patient: Patient) => void;
  onOpenDoctorVisit: (patient: Patient) => void;
  onOpenPatientDetail: (patient: Patient) => void;
  onOpenAdmissionModal: (tab?: 'new' | 'waiting') => void;
}

export function PatientDirectory({
  onOpenRecordTemp,
  onOpenDoctorVisit,
  onOpenPatientDetail,
  onOpenAdmissionModal,
}: PatientDirectoryProps) {
  const {
    patients,
    waitingList,
    searchQuery,
    setSearchQuery,
    feverThreshold,
    role,
    occupiedBedsCount,
    maxCapacity,
    vacantBeds,
    admitFromWaitingList,
  } = useCareFlow();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search matching ID, name, or bed
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const match =
          p.id.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.bed.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Ward filter
      if (wardFilter !== 'all' && p.ward !== wardFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'all') return p.active;
      if (statusFilter === 'temp_pending') return p.active && p.todayTempStatus === 'pending';
      if (statusFilter === 'visit_pending') return p.active && p.todayVisitStatus === 'pending';
      if (statusFilter === 'clinical_review')
        return p.active && p.dischargeStatus === 'eligible_clinical_review';
      if (statusFilter === 'admin_discharge')
        return p.active && p.dischargeStatus === 'approved_by_doctor';
      if (statusFilter === 'discharged') return !p.active;

      return true;
    });
  }, [patients, searchQuery, statusFilter, wardFilter]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, ID (CF-1001), or Bed..."
            className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal"
          />
        </div>

        {/* Ward Filter & Admission Action */}
        <div className="flex items-center gap-2">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium text-gray-700 focus:ring-2 focus:ring-teal"
          >
            <option value="all">All Wards (A, B, C)</option>
            <option value="Ward A">Ward A (Beds 01–25)</option>
            <option value="Ward B">Ward B (Beds 26–50)</option>
            <option value="Ward C">Ward C (Beds 51–74)</option>
          </select>

          <button
            onClick={() => onOpenAdmissionModal('new')}
            className="px-3.5 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-gray-200">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'all'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Active Quarantine ({patients.filter((p) => p.active).length})
        </button>
        <button
          onClick={() => setStatusFilter('temp_pending')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'temp_pending'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Temp Pending ({patients.filter((p) => p.active && p.todayTempStatus === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('visit_pending')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'visit_pending'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Visit Pending ({patients.filter((p) => p.active && p.todayVisitStatus === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('clinical_review')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'clinical_review'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Awaiting Clinical Review ({patients.filter((p) => p.active && p.dischargeStatus === 'eligible_clinical_review').length})
        </button>
        <button
          onClick={() => setStatusFilter('admin_discharge')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'admin_discharge'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Awaiting Admin Discharge ({patients.filter((p) => p.active && p.dischargeStatus === 'approved_by_doctor').length})
        </button>
        <button
          onClick={() => setStatusFilter('waiting_list')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'waiting_list'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Waiting List ({waitingList.length})
        </button>
        <button
          onClick={() => setStatusFilter('discharged')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition whitespace-nowrap ${
            statusFilter === 'discharged'
              ? 'border-b-2 border-teal text-teal bg-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Discharged ({patients.filter((p) => !p.active).length})
        </button>
      </div>

      {/* WAITING LIST VIEW (when waiting_list tab is selected) */}
      {statusFilter === 'waiting_list' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Quarantine Intake Waiting List</h3>
              <p className="text-xs text-gray-500">
                Facility Occupancy: {occupiedBedsCount}/{maxCapacity} Beds &bull;{' '}
                {vacantBeds.length > 0 ? (
                  <span className="text-emerald-600 font-semibold">{vacantBeds.length} bed(s) available for intake</span>
                ) : (
                  <span className="text-rose-600 font-semibold">0 vacant beds (discharges required before admission)</span>
                )}
              </p>
            </div>
            {occupiedBedsCount < maxCapacity && (
              <button
                onClick={() => onOpenAdmissionModal('waiting')}
                className="px-3 py-1.5 bg-teal text-white rounded-lg text-xs font-semibold hover:bg-teal-hover transition"
              >
                Intake Next Candidate
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {waitingList.map((cand, idx) => (
              <div key={cand.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm">{cand.name}</h4>
                    <span className="text-gray-400 font-mono text-[11px]">({cand.id})</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cand.urgency === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : cand.urgency === 'Urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cand.urgency} Priority
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px]">
                    Age: {cand.age} &bull; Gender: {cand.gender} &bull; Added: {cand.addedDate} &bull; Contact: {cand.contact}
                  </p>
                  <p className="text-gray-700 text-xs italic">{cand.notes}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={occupiedBedsCount >= maxCapacity || role !== 'Admin'}
                    onClick={() => admitFromWaitingList(cand.id)}
                    className="px-3 py-1.5 bg-teal hover:bg-teal-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition"
                  >
                    Admit to Available Bed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PATIENT TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Patient / ID</th>
                  <th className="py-3 px-3">Bed & Ward</th>
                  <th className="py-3 px-3">Admission</th>
                  <th className="py-3 px-3">Latest Temp</th>
                  <th className="py-3 px-3">Fever-Free</th>
                  <th className="py-3 px-3">Today Temp</th>
                  <th className="py-3 px-3">Today Visit</th>
                  <th className="py-3 px-3">Discharge Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No patients found matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const latest = patient.temperatureHistory[0];
                    const isFever = latest && latest.value >= feverThreshold;

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => onOpenPatientDetail(patient)}
                        className="hover:bg-teal-light/20 cursor-pointer transition"
                      >
                        {/* Name & ID */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 hover:text-teal transition">
                            {patient.name}
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">{patient.id}</span>
                        </td>

                        {/* Bed & Ward */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{patient.bed}</span>
                          <span className="block text-[11px] text-gray-500">{patient.ward}</span>
                        </td>

                        {/* Admission Date */}
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {patient.admissionDate}
                        </td>

                        {/* Latest Temp */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {latest ? (
                            <span
                              className={`font-bold ${
                                isFever ? 'text-rose-600' : 'text-gray-900'
                              }`}
                            >
                              {latest.value.toFixed(1)}°{latest.displayUnit}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>

                        {/* Fever-Free Streak */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              patient.feverFreeStreak >= 3
                                ? 'bg-teal-light text-teal border border-teal/30'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {patient.feverFreeStreak}d
                          </span>
                        </td>

                        {/* Today Temp Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {patient.todayTempStatus === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Logged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Today Visit Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {patient.todayVisitStatus === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Visited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Discharge Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              patient.dischargeStatus === 'approved_by_doctor'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : patient.dischargeStatus === 'eligible_clinical_review'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : patient.dischargeStatus === 'discharged'
                                ? 'bg-gray-100 text-gray-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {patient.dischargeStatus.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Next Action Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            {patient.todayTempStatus === 'pending' && (
                              <button
                                onClick={() => onOpenRecordTemp(patient)}
                                title="Record Temperature"
                                className="p-1.5 rounded-md bg-teal/10 hover:bg-teal text-teal hover:text-white transition"
                              >
                                <Thermometer className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {patient.todayVisitStatus === 'pending' && (
                              <button
                                onClick={() => onOpenDoctorVisit(patient)}
                                title="Doctor Rounds"
                                className="p-1.5 rounded-md bg-navy/10 hover:bg-navy text-navy hover:text-white transition"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenPatientDetail(patient)}
                              title="View Chart"
                              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
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

          {/* Footer Count */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>Showing {filteredPatients.length} of {patients.length} total records</span>
            <span>Total Bed Capacity: {occupiedBedsCount}/{maxCapacity}</span>
          </div>
        </div>
      )}
    </div>
  );
}
