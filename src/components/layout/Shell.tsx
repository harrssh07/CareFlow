'use client';

import React, { useState } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { StaffRole, Patient } from '@/types';
import {
  LayoutDashboard,
  Users,
  Thermometer,
  Stethoscope,
  LogOut,
  BarChart3,
  Search,
  Menu,
  X,
  RotateCcw,
  Shield,
  UserCheck,
  AlertCircle,
  Bell,
  CheckCircle,
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  onOpenResetModal: () => void;
  onOpenAdmissionModal: (tab?: 'new' | 'waiting') => void;
}

export function Shell({ children, onOpenResetModal, onOpenAdmissionModal }: ShellProps) {
  const {
    role,
    setRole,
    activeSection,
    setActiveSection,
    todayTempsPendingCount,
    todayVisitsPendingCount,
    awaitingClinicalReviewCount,
    awaitingAdminDischargeCount,
    occupiedBedsCount,
    maxCapacity,
    searchQuery,
    setSearchQuery,
    patients,
    setSelectedPatientId,
  } = useCareFlow();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      badge: `${occupiedBedsCount}/${maxCapacity}`,
      badgeColor: occupiedBedsCount >= maxCapacity ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-white/20 text-white',
    },
    {
      id: 'nurse',
      label: 'Nurse Monitoring',
      icon: Thermometer,
      badge: todayTempsPendingCount > 0 ? `${todayTempsPendingCount}` : null,
      badgeColor: 'bg-amber-500 text-white font-bold',
    },
    {
      id: 'doctor',
      label: 'Doctor Rounds',
      icon: Stethoscope,
      badge: todayVisitsPendingCount > 0 ? `${todayVisitsPendingCount}` : null,
      badgeColor: 'bg-teal text-white font-bold',
    },
    {
      id: 'discharge',
      label: 'Discharge Management',
      icon: LogOut,
      badge: (awaitingClinicalReviewCount + awaitingAdminDischargeCount) > 0 ? `${awaitingClinicalReviewCount + awaitingAdminDischargeCount}` : null,
      badgeColor: 'bg-emerald-500 text-white font-bold',
    },
    {
      id: 'outcomes',
      label: 'Outcomes & Quality',
      icon: BarChart3,
      badge: '16% Mort',
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  // Instant global search matches
  const searchResults = searchQuery.trim()
    ? patients
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.bed.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row text-gray-800">
      {/* Desktop / Tablet Sidebar (Navy: #14263D) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#14263D] text-white flex-shrink-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-light/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center font-black text-white shadow-md text-base">
              CF
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-none text-white">
                CareFlow
              </h1>
              <span className="text-[11px] font-medium text-teal block mt-1 tracking-wider uppercase">
                Quarantine Operations
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-teal text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal/80 group-hover:text-teal'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Facility Capacity Widget placed below Discharge Management */}
                {item.id === 'discharge' && (
                  <div className="p-3 my-2 bg-white/5 rounded-xl border border-white/10 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-[11px] uppercase font-bold text-slate-400">Occupancy</span>
                      <span className="font-mono font-bold text-white">
                        {occupiedBedsCount} / {maxCapacity}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupiedBedsCount >= maxCapacity ? 'bg-amber-400' : 'bg-teal'
                        }`}
                        style={{ width: `${(occupiedBedsCount / maxCapacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {occupiedBedsCount >= maxCapacity
                        ? 'Capacity limit reached (74/74)'
                        : `${maxCapacity - occupiedBedsCount} bed(s) available for intake`}
                    </p>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Staff Role Simulation Footer */}
        <div className="p-4 border-t border-navy-light/60 bg-[#0E1C2E]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Staff Simulation Role:</span>
            <span className="text-teal font-bold">{role}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-lg text-[11px]">
            {(['Nurse', 'Doctor', 'Admin'] as StaffRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-1 text-center font-bold rounded transition ${
                  role === r
                    ? 'bg-teal text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
          {/* Left: Mobile hamburger & Current section title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 capitalize tracking-tight">
                {activeSection === 'overview'
                  ? 'Operations Command Center'
                  : activeSection.replace(/_/g, ' ')}
              </h2>
              <span className="text-[11px] text-gray-500 hidden sm:inline-block">
                Quarantine Facility Monitoring &bull; Shift 08:00–16:00
              </span>
            </div>
          </div>

          {/* Center / Global Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-md hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchDropdownOpen(true);
              }}
              onFocus={() => setSearchDropdownOpen(true)}
              placeholder="Quick search patient, bed, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 hover:bg-white focus:bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal transition"
            />

            {/* Instant Search Dropdown */}
            {searchDropdownOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-40 text-xs">
                <div className="p-2 bg-gray-50 text-[11px] font-semibold text-gray-500 border-b">
                  Matching Patients ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-3 text-gray-400 text-center">No patients found</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setSearchDropdownOpen(false);
                        }}
                        className="w-full p-2.5 text-left hover:bg-teal-light/20 flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-bold text-gray-900">{p.name}</span>
                          <span className="text-gray-400 font-mono ml-2">({p.id})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {p.bed} ({p.ward})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Role Badge, Reset button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher Pill (Tablet / Mobile friendly) */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
              <span className="text-[11px] text-gray-500 px-2 hidden sm:inline">Role:</span>
              {(['Nurse', 'Doctor', 'Admin'] as StaffRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                    role === r
                      ? 'bg-teal text-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={onOpenResetModal}
              title="Reset initial 74/74 demo state"
              className="p-1.5 sm:px-3 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-navy text-white p-4 space-y-2 border-b border-navy-light animate-in slide-in-from-top-2 duration-150">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                      isActive ? 'bg-teal text-white' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-teal" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Facility Occupancy: {occupiedBedsCount}/{maxCapacity}</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmissionModal('new');
                }}
                className="text-teal font-bold underline"
              >
                + Admit Patient
              </button>
            </div>
          </div>
        )}

        {/* Content Container (Constrained max-width for 2560px ultra-wide screens) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
