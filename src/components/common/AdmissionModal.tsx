'use client';

import React, { useState } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { X, UserPlus, AlertTriangle, Bed, ListOrdered, CheckCircle2 } from 'lucide-react';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'new' | 'waiting';
}

export function AdmissionModal({ isOpen, onClose, initialTab = 'new' }: AdmissionModalProps) {
  const {
    role,
    occupiedBedsCount,
    maxCapacity,
    vacantBeds,
    waitingList,
    admitFromWaitingList,
    admitNewPatient,
  } = useCareFlow();

  const [activeTab, setActiveTab] = useState<'new' | 'waiting'>(initialTab);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M');
  const [ward, setWard] = useState<'Ward A' | 'Ward B' | 'Ward C'>('Ward A');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(waitingList[0]?.id || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isFull = occupiedBedsCount >= maxCapacity;

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isFull) {
      setError('Cannot admit new patient: All 74 beds are currently occupied. Free a bed via discharge or register on waiting list.');
      return;
    }

    if (!name.trim()) {
      setError('Patient name is required.');
      return;
    }

    const res = admitNewPatient({ name, age, gender, ward });
    if (res.success) {
      setName('');
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleWaitingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isFull) {
      setError('Facility is at maximum capacity (74/74). Discharge a patient to free a bed before admitting from waiting list.');
      return;
    }

    if (!selectedCandidateId) {
      setError('Please select a waiting list candidate.');
      return;
    }

    const res = admitFromWaitingList(selectedCandidateId);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Patient Admission & Intake</h3>
              <p className="text-xs text-slate-300">
                Facility Occupancy: {occupiedBedsCount}/{maxCapacity} Beds
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-md transition" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('new'); setError(null); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${
              activeTab === 'new'
                ? 'border-teal text-teal bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Direct Admission
          </button>
          <button
            onClick={() => { setActiveTab('waiting'); setError(null); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'waiting'
                ? 'border-teal text-teal bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Admit from Waiting List ({waitingList.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Capacity notice */}
          {isFull && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Facility at Maximum Bed Capacity (74/74)</span>
              </div>
              <p className="leading-relaxed">
                Direct admissions and waiting-list intake are currently blocked because all beds are in active use.
                To admit a new patient, an approved patient must first be processed through final Administrative Discharge.
              </p>
              <p className="text-amber-700 font-medium">
                Tip: Switch to Discharge Management to review patients awaiting final discharge clearance.
              </p>
            </div>
          )}

          {!isFull && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>{vacantBeds.length} bed(s) available</strong>: {vacantBeds.slice(0, 3).join(', ')}
                  {vacantBeds.length > 3 ? ` +${vacantBeds.length - 3} more` : ''}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'new' ? (
            <form onSubmit={handleNewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  disabled={isFull}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samantha Ortiz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={110}
                    disabled={isFull}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    disabled={isFull}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal disabled:bg-gray-100 bg-white"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Assigned Ward *</label>
                <select
                  value={ward}
                  disabled={isFull}
                  onChange={(e) => setWard(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal disabled:bg-gray-100 bg-white"
                >
                  <option value="Ward A">Ward A (Beds 01–25)</option>
                  <option value="Ward B">Ward B (Beds 26–50)</option>
                  <option value="Ward C">Ward C (Beds 51–74)</option>
                </select>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFull}
                  className="px-5 py-2 bg-teal hover:bg-teal-hover text-white rounded-lg font-semibold shadow-xs disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleWaitingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Candidate *</label>
                {waitingList.length === 0 ? (
                  <p className="p-3 bg-gray-50 border rounded-lg text-gray-500">
                    No candidates currently on the waiting list.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {waitingList.map((cand) => (
                      <label
                        key={cand.id}
                        className={`flex items-start gap-2.5 p-2 rounded-md border cursor-pointer transition ${
                          selectedCandidateId === cand.id
                            ? 'border-teal bg-teal-light/30'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          checked={selectedCandidateId === cand.id}
                          onChange={() => setSelectedCandidateId(cand.id)}
                          className="mt-0.5 text-teal focus:ring-teal"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{cand.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
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
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Age: {cand.age} &bull; Added: {cand.addedDate} &bull; {cand.contact}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5 italic">{cand.notes}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFull || waitingList.length === 0}
                  className="px-5 py-2 bg-teal hover:bg-teal-hover text-white rounded-lg font-semibold shadow-xs disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Admit Selected Candidate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
