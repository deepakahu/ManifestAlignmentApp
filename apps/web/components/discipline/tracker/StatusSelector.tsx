'use client';

/**
 * StatusSelector (Web)
 *
 * Visual badge selector for activity log status
 * Options: Good (✓), Neutral (=), Bad (✗), Skipped (⊘)
 */

import React from 'react';

interface StatusSelectorProps {
  value: 'good' | 'neutral' | 'bad' | 'skipped';
  onChange: (status: 'good' | 'neutral' | 'bad' | 'skipped') => void;
}

interface StatusOption {
  value: 'good' | 'neutral' | 'bad' | 'skipped';
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'good',
    label: 'Good',
    icon: '✓',
    color: 'text-green-600',
    backgroundColor: 'bg-green-50',
    borderColor: 'border-green-600',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: '=',
    color: 'text-blue-600',
    backgroundColor: 'bg-blue-50',
    borderColor: 'border-blue-600',
  },
  {
    value: 'bad',
    label: 'Bad',
    icon: '✗',
    color: 'text-red-600',
    backgroundColor: 'bg-red-50',
    borderColor: 'border-red-600',
  },
  {
    value: 'skipped',
    label: 'Skipped',
    icon: '⊘',
    color: 'text-slate-600',
    backgroundColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
  },
];

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {STATUS_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl border-2 transition-all ${
              isSelected
                ? `${option.backgroundColor} ${option.borderColor}`
                : 'bg-white border-slate-300 hover:border-slate-400'
            }`}
          >
            <span
              className={`text-2xl ${
                isSelected ? option.color : 'text-slate-400'
              }`}
            >
              {option.icon}
            </span>
            <span
              className={`text-sm font-medium ${
                isSelected ? option.color : 'text-slate-500'
              } ${isSelected ? 'font-semibold' : ''}`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
