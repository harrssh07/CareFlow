'use client';

import React, { useState, useEffect } from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { Patient, TemperatureUnit, TemperatureRecord } from '@/types';
import { TODAY } from '@/lib/demoData';
import { X, Thermometer, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface RecordTempModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecordTempModal({ patient, isOpen, onClose }: RecordTempModalProps) {
  const { recordTemperature, feverThreshold } = useCareFlow();
  const [value, setValue] = useState<string>('36.8');
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const [note, setNote] = useState<string>('');
  const [repeatReason, setRepeatReason] = useState<string>('Routine verification');
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<TemperatureRecord | null>(null);
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      const existing = patient.temperatureHistory.find((r) => r.timestamp.startsWith(TODAY));
      if (existing) {
        setDuplicateWarning(true);
        setExistingRecord(existing);
        setValue(existing.value.toString());
        setUnit(existing.displayUnit || 'C');
      } else {
        setDuplicateWarning(false);
        setExistingRecord(null);
        setValue('36.8');
        setUnit('C');
      }
      setNote('');
      setRepeatReason('Physician requested verification');
      setAllowRepeat(false);
      setValidationError(null);
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  const handleUnitToggle = (newUnit: TemperatureUnit) => {
    if (newUnit === unit) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (newUnit === 'F') {
        setValue(((num * 9) / 5 + 32).toFixed(1));
      } else {
        setValue((((num - 32) * 5) / 9).toFixed(1));
      }
    }
    setUnit(newUnit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setValidationError('Please enter a valid numeric temperature value.');
      return;
    }

    // Convert to Celsius for bounds checking
    const cVal = unit === 'F' ? ((numValue - 32) * 5) / 9 : numValue;
    if (cVal < 34.0 || cVal > 43.0) {
      setValidationError('Physiologically improbable temperature. Expected range: 34.0°C – 43.0°C (93.2°F – 109.4°F).');
      return;
    }

    if (duplicateWarning && !allowRepeat) {
      setValidationError('Please confirm the repeat reading override checkbox before saving.');
      return;
    }

    const result = recordTemperature({
      patientId: patient.id,
      value: numValue,
      inputUnit: unit,
      note: note.trim() || undefined,
      allowRepeat,
      repeatReason: allowRepeat ? repeatReason : undefined,
    });

    if (result.success) {
      onClose();
    } else if (result.duplicateWarning) {
      setDuplicateWarning(true);
      setExistingRecord(result.existingRecord || null);
    } else {
      setValidationError(result.message);
    }
  };

  const numVal = parseFloat(value);
  const cVal = isNaN(numVal) ? 0 : unit === 'F' ? ((numVal - 32) * 5) / 9 : numVal;
  const isFever = cVal >= feverThreshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Thermometer className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Record Temperature</h3>
              <p className="text-xs text-slate-300">
                {patient.name} &bull; {patient.bed} ({patient.ward}) &bull; {patient.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Duplicate reading warning banner */}
          {duplicateWarning && existingRecord && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Existing Daily Measurement Detected</span>
              </div>
              <p>
                A reading of <span className="font-bold">{existingRecord.value.toFixed(1)}°{existingRecord.displayUnit}</span> was
                already logged today by <span className="font-medium">{existingRecord.recordedBy}</span>.
              </p>
              <p className="text-amber-700">
                Under facility protocol, the original reading will never be overwritten. Submitting will save a distinct repeat
                measurement record.
              </p>
              <div className="pt-2 border-t border-amber-200/60">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRepeat}
                    onChange={(e) => setAllowRepeat(e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-teal border-gray-300"
                  />
                  <span>Confirm recording of justified repeat reading</span>
                </label>
              </div>
            </div>
          )}

          {/* Temperature input with Unit toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="temp-val" className="text-xs font-semibold text-gray-700">
                Temperature Reading *
              </label>
              <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('C')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    unit === 'C' ? 'bg-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  °Celsius
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('F')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    unit === 'F' ? 'bg-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  °Fahrenheit
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="temp-val"
                type="number"
                step="0.1"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-lg font-bold rounded-lg border focus:ring-2 focus:ring-teal transition ${
                  isFever ? 'border-rose-300 text-rose-700 bg-rose-50/30' : 'border-gray-300 text-gray-900 bg-white'
                }`}
                placeholder={unit === 'C' ? '36.8' : '98.2'}
              />
              <span className="absolute right-3.5 top-3 text-sm font-semibold text-gray-400">
                °{unit}
              </span>
            </div>

            {/* Fever indicator status */}
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Fever threshold: {feverThreshold.toFixed(1)}°C ({(feverThreshold * 1.8 + 32).toFixed(1)}°F)
              </span>
              {isFever ? (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                  <ShieldAlert className="w-3.5 h-3.5" /> Febrile (Fever detected)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Afebrile (Within normal limits)
                </span>
              )}
            </div>
          </div>

          {/* Repeat Reason (visible if duplicate reading) */}
          {duplicateWarning && allowRepeat && (
            <div>
              <label htmlFor="repeat-reason" className="block text-xs font-semibold text-gray-700 mb-1">
                Repeat Reading Justification *
              </label>
              <select
                id="repeat-reason"
                value={repeatReason}
                onChange={(e) => setRepeatReason(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal"
              >
                <option value="Physician requested verification">Physician requested verification</option>
                <option value="Post-antipyretic evaluation">Post-antipyretic evaluation</option>
                <option value="Subjective fever flare reported by patient">Subjective fever flare reported by patient</option>
                <option value="Suspected device calibration discrepancy">Suspected device calibration discrepancy</option>
              </select>
            </div>
          )}

          {/* Optional notes */}
          <div>
            <label htmlFor="temp-note" className="block text-xs font-semibold text-gray-700 mb-1">
              Clinical Observations / Notes (Optional)
            </label>
            <textarea
              id="temp-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Patient reports mild shivering, given warm blanket."
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Validation error display */}
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg shadow-sm transition"
            >
              {duplicateWarning ? 'Save Repeat Reading' : 'Save Temperature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
