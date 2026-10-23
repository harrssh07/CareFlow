'use client';

import React from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetModal({ isOpen, onClose }: ResetModalProps) {
  const { resetDemoData } = useCareFlow();

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetDemoData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-base font-bold text-gray-900">Reset Demo Operational Data?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This action will restore the original assessment baseline:
            </p>
            <ul className="text-xs text-left bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-gray-700 list-disc list-inside">
              <li>Restore 74/74 bed occupancy (full capacity)</li>
              <li>Restore baseline pending temperature and doctor visit queues</li>
              <li>Reset fever-free streaks and clinical discharge clearances</li>
              <li>Restore initial waiting list candidates and activity history</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 text-xs font-semibold text-white bg-navy hover:bg-navy-light rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Confirm Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
