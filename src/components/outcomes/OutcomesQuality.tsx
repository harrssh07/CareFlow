'use client';

import React, { useState } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  CheckCircle2,
  Users,
  ShieldAlert,
  Info,
  Calendar,
  Search,
} from 'lucide-react';

export function OutcomesQuality() {
  const { outcomesCohort } = useCareFlow();
  const [filter, setFilter] = useState<'all' | 'success' | 'deceased'>('all');
  const [search, setSearch] = useState('');

  const filteredRecords = outcomesCohort.records.filter((rec) => {
    if (filter === 'success' && rec.outcome !== 'cured_discharged') return false;
    if (filter === 'deceased' && rec.outcome !== 'deceased') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        rec.patientName.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q) ||
        rec.primaryNotes.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Clear Fictional Demonstration Cohort Disclaimer */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-gray-900 text-sm">
            Fictional Clinical Outcomes Demonstration Cohort (N = 25 Cases)
          </h4>
          <p className="leading-relaxed">
            The metrics displayed below evaluate historical closed cases (25 cases) to assess facility performance against institutional benchmarks. Active quarantine inpatients (74 current beds) are <strong>strictly separated</strong> from completed outcomes data to maintain statistical integrity.
          </p>
        </div>
      </div>

      {/* Critical Benchmark Breach Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mortality Breach */}
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Mortality Benchmark Breach
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-rose-200 text-rose-900">
              FAILING BENCHMARK
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-rose-700">
              {outcomesCohort.mortalityRate}%
            </span>
            <span className="text-xs text-rose-800">
              vs {outcomesCohort.mortalityBenchmark}% Max Benchmark Target (+1.0% deviation)
            </span>
          </div>

          <p className="text-xs text-rose-800 leading-relaxed">
            {outcomesCohort.deaths} deaths recorded out of {outcomesCohort.completedCases} completed cases. Benchmark standard requires mortality strictly below 15.0%.
          </p>
        </div>

        {/* Success Rate Breach */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              Treatment Success Benchmark Breach
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-200 text-amber-900">
              BELOW BENCHMARK
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-amber-700">
              {outcomesCohort.successRate}%
            </span>
            <span className="text-xs text-amber-800">
              vs {outcomesCohort.successBenchmark}% Minimum Target (-1.0% deficit)
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            {outcomesCohort.successes} cured/discharged patients out of {outcomesCohort.completedCases} completed cases. Benchmark target requires at least 85.0% curative recovery.
          </p>
        </div>
      </div>

      {/* Visual Cohort Distribution Progress & Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-gray-900 flex items-center justify-between">
          <span>Closed Quarantine Outcomes Distribution</span>
          <span className="text-xs text-gray-500 font-normal">
            Completed Cohort: {outcomesCohort.completedCases} Patients
          </span>
        </h3>

        {/* Stacked Visual Bar */}
        <div className="space-y-2">
          <div className="w-full h-8 rounded-lg overflow-hidden flex bg-gray-100 p-0.5 border border-gray-200">
            <div
              className="bg-emerald-600 h-full flex items-center justify-center text-white text-xs font-bold rounded-l transition-all"
              style={{ width: `${outcomesCohort.successRate}%` }}
              title={`Successful Outcomes: ${outcomesCohort.successes} (${outcomesCohort.successRate}%)`}
            >
              {outcomesCohort.successRate}% Cured ({outcomesCohort.successes})
            </div>
            <div
              className="bg-rose-600 h-full flex items-center justify-center text-white text-xs font-bold rounded-r transition-all"
              style={{ width: `${outcomesCohort.mortalityRate}%` }}
              title={`Mortality: ${outcomesCohort.deaths} (${outcomesCohort.mortalityRate}%)`}
            >
              {outcomesCohort.mortalityRate}% ({outcomesCohort.deaths})
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span>Cured & Discharged (Target &ge; 85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
              <span>Deceased (Target &le; 15%)</span>
            </div>
          </div>
        </div>

        {/* Comparative Target Bar Indicator */}
        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-gray-700">
              <span>Mortality vs Ceiling</span>
              <span className="text-rose-600">16% / 15% Max</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full" style={{ width: '106%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-gray-700">
              <span>Success vs Benchmark</span>
              <span className="text-amber-600">84% / 85% Min</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '98.8%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-navy text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              All Cohort Cases ({outcomesCohort.records.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Cured & Discharged ({outcomesCohort.successes})
            </button>
            <button
              onClick={() => setFilter('deceased')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'deceased'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Deceased ({outcomesCohort.deaths})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cohort records..."
              className="w-full pl-8 pr-3 py-1.5 bg-white text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Admission</th>
                <th className="py-3 px-3">Outcome Date</th>
                <th className="py-3 px-3">Stay Duration</th>
                <th className="py-3 px-3">Final Status</th>
                <th className="py-3 px-4">Primary Clinical Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-gray-600">{item.id}</td>
                  <td className="py-3 px-3 font-bold text-gray-900">{item.patientName}</td>
                  <td className="py-3 px-3 font-mono text-gray-600">{item.admissionDate}</td>
                  <td className="py-3 px-3 font-mono text-gray-600">{item.outcomeDate}</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">{item.daysInQuarantine} days</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.outcome === 'cured_discharged' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Cured & Discharged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded text-[11px] border border-rose-200">
                        <ShieldAlert className="w-3 h-3" /> Deceased
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 leading-relaxed max-w-xs">{item.primaryNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
