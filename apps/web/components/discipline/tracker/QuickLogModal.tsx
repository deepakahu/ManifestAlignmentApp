'use client';

/**
 * QuickLogModal (Web)
 *
 * Modal for quickly logging activity completion
 * Supports all tracking types: boolean, number, multiselect, text
 * Includes status selection and optional notes
 * Challenge-ready with dual logging capability (placeholder for future)
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { TrackingInputs } from './TrackingInputs';
import { StatusSelector } from './StatusSelector';

interface QuickLogModalProps {
  isOpen: boolean;
  activity: DisciplineActivity | null;
  existingLog: ActivityLog | null;
  onClose: () => void;
  onSubmit: (log: Partial<ActivityLog>) => Promise<void>;
}

export function QuickLogModal({
  isOpen,
  activity,
  existingLog,
  onClose,
  onSubmit,
}: QuickLogModalProps) {
  // Form state
  const [value, setValue] = useState<any>(null);
  const [status, setStatus] = useState<'good' | 'neutral' | 'bad' | 'skipped'>('good');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form with existing log data
  useEffect(() => {
    if (existingLog) {
      setValue(existingLog.value);
      setStatus(existingLog.status);
      setNotes(existingLog.notes || '');
      setShowNotes(!!existingLog.notes);
    } else {
      // Reset form for new log
      setValue(getDefaultValue());
      setStatus('good');
      setNotes('');
      setShowNotes(false);
    }
    setErrors([]);
  }, [existingLog, activity, isOpen]);

  // Get default value based on tracking type
  const getDefaultValue = () => {
    if (!activity) return null;

    switch (activity.trackingType) {
      case 'boolean':
        return false;
      case 'number':
        return '';
      case 'multiselect':
        return [];
      case 'text':
        return '';
      default:
        return null;
    }
  };

  // Handle value change from tracking inputs
  const handleValueChange = (newValue: any) => {
    setValue(newValue);
    setErrors([]);

    // Auto-suggest status based on value
    if (activity) {
      const suggestedStatus = getSuggestedStatus(newValue);
      setStatus(suggestedStatus);
    }
  };

  // Suggest status based on value and target
  const getSuggestedStatus = (val: any): 'good' | 'neutral' | 'bad' | 'skipped' => {
    if (!activity) return 'good';

    switch (activity.trackingType) {
      case 'boolean':
        return val ? 'good' : 'neutral';

      case 'number': {
        const numValue = parseFloat(val);
        if (isNaN(numValue)) return 'neutral';

        const config = activity.targetConfig as { target?: number; min?: number; max?: number };
        const target = config.target || 0;

        if (numValue >= target) return 'good';
        if (numValue >= target * 0.7) return 'neutral';
        return 'bad';
      }

      case 'multiselect': {
        const config = activity.targetConfig as { minSelect?: number };
        const minSelect = config.minSelect || 1;
        return Array.isArray(val) && val.length >= minSelect ? 'good' : 'neutral';
      }

      case 'text':
        return val && val.trim().length > 0 ? 'good' : 'neutral';

      default:
        return 'good';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!activity) return false;

    const newErrors: string[] = [];

    switch (activity.trackingType) {
      case 'boolean':
        // Always valid
        break;

      case 'number': {
        if (!value || value.trim() === '') {
          newErrors.push('Please enter a number');
          break;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          newErrors.push('Please enter a valid number');
          break;
        }
        const config = activity.targetConfig as { min?: number; max?: number };
        if (config.min !== undefined && numValue < config.min) {
          newErrors.push(`Value must be at least ${config.min}`);
        }
        if (config.max !== undefined && numValue > config.max) {
          newErrors.push(`Value must be at most ${config.max}`);
        }
        break;
      }

      case 'multiselect': {
        const config = activity.targetConfig as { minSelect?: number; maxSelect?: number };
        if (config.minSelect && (!Array.isArray(value) || value.length < config.minSelect)) {
          newErrors.push(`Please select at least ${config.minSelect} option(s)`);
        }
        break;
      }

      case 'text': {
        const config = activity.targetConfig as { required?: boolean };
        if (config.required && (!value || value.trim() === '')) {
          newErrors.push('Please enter some text');
        }
        break;
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const log: Partial<ActivityLog> = {
        activityId: activity!.id,
        logDate: new Date(),
        status,
        value,
        notes: notes.trim() || undefined,
      };

      await onSubmit(log);
      onClose();
    } catch (error: any) {
      setErrors([error.message || 'Failed to save log']);
    } finally {
      setSubmitting(false);
    }
  };

  console.log('QuickLogModal render:', { isOpen, activity: activity?.title, existingLog });

  if (!isOpen || !activity) {
    console.log('Modal not rendering because:', { isOpen, hasActivity: !!activity });
    return null;
  }

  console.log('Modal should be visible now');

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{activity.title}</h2>
            {activity.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    {errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-800 font-medium">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Input */}
            <div>
              <TrackingInputs
                trackingType={activity.trackingType}
                targetConfig={activity.targetConfig}
                value={value}
                onChange={handleValueChange}
              />
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                How did it go?
              </label>
              <StatusSelector value={status} onChange={setStatus} />
            </div>

            {/* Notes (Collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 py-2"
              >
                <span>{showNotes ? '▼' : '▶'}</span>
                <span>Add notes (optional)</span>
              </button>

              {showNotes && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or reflections..."
                  rows={4}
                  className="w-full mt-3 bg-slate-50 border-2 border-slate-300 rounded-lg p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
                />
              )}
            </div>

            {/* Challenge Context (Future) */}
            {/* Will display challenge badges and dual logging options here */}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Logging...' : existingLog ? 'Update Log' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
