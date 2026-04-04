'use client';

/**
 * TrackingInputs (Web)
 *
 * Tracking type-specific input components for web
 * Handles: Boolean, Number, MultiSelect, Text
 */

import React from 'react';

interface TrackingInputsProps {
  trackingType: 'boolean' | 'number' | 'multiselect' | 'text';
  targetConfig: any;
  value: any;
  onChange: (value: any) => void;
}

export function TrackingInputs({
  trackingType,
  targetConfig,
  value,
  onChange,
}: TrackingInputsProps) {
  switch (trackingType) {
    case 'boolean':
      return <BooleanInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'number':
      return <NumberInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'multiselect':
      return <MultiSelectInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'text':
      return <TextInput_ value={value} onChange={onChange} targetConfig={targetConfig} />;
    default:
      return null;
  }
}

// Boolean Input Component
function BooleanInput({
  value,
  onChange,
  targetConfig,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  targetConfig: any;
}) {
  const config = targetConfig as { label?: string };
  const label = config.label || 'Mark as completed';

  return (
    <div className="py-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
          value
            ? 'bg-indigo-50 border-indigo-500'
            : 'bg-slate-50 border-slate-300 hover:border-slate-400'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
            value ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'
          }`}
        >
          {value && (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-lg font-medium ${value ? 'text-slate-900' : 'text-slate-600'}`}>
          {label}
        </span>
      </button>
    </div>
  );
}

// Number Input Component
function NumberInput({
  value,
  onChange,
  targetConfig,
}: {
  value: string;
  onChange: (value: string) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    target?: number;
    min?: number;
    max?: number;
    unit?: string;
    label?: string;
  };

  const displayValue = value || '';
  const numValue = parseFloat(displayValue);
  const isValid = !isNaN(numValue);

  return (
    <div className="py-3 space-y-3">
      <label className="block text-base font-semibold text-slate-900">
        {config.label || 'Enter value'}
      </label>

      {config.target && (
        <p className="text-sm text-slate-600">
          Target: {config.target} {config.unit || ''}
        </p>
      )}

      <div className="flex items-center bg-slate-50 border-2 border-slate-300 rounded-xl px-5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 bg-transparent text-4xl font-semibold text-slate-900 py-4 text-center outline-none"
          step="any"
        />
        {config.unit && <span className="text-xl font-medium text-slate-600 ml-2">{config.unit}</span>}
      </div>

      {/* Range indicators */}
      {(config.min !== undefined || config.max !== undefined) && (
        <p className="text-xs text-slate-600 text-center">
          {config.min !== undefined && config.max !== undefined
            ? `Range: ${config.min} - ${config.max}`
            : config.min !== undefined
            ? `Minimum: ${config.min}`
            : `Maximum: ${config.max}`}
        </p>
      )}

      {/* Value comparison */}
      {isValid && config.target && (
        <p
          className={`text-sm font-medium text-center ${
            numValue >= config.target ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {numValue >= config.target
            ? `✓ Reached target (+${numValue - config.target})`
            : `${config.target - numValue} away from target`}
        </p>
      )}
    </div>
  );
}

// MultiSelect Input Component
function MultiSelectInput({
  value,
  onChange,
  targetConfig,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    options: string[];
    minSelect?: number;
    maxSelect?: number;
  };

  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      // Deselect - check minSelect
      if (config.minSelect && selectedValues.length <= config.minSelect) {
        return; // Can't deselect below minimum
      }
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      // Select - check maxSelect
      if (config.maxSelect && selectedValues.length >= config.maxSelect) {
        return; // Can't select above maximum
      }
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className="py-3 space-y-4">
      <label className="block text-base font-semibold text-slate-900">Select options:</label>

      {(config.minSelect || config.maxSelect) && (
        <p className="text-sm text-slate-600">
          {config.minSelect && config.maxSelect
            ? `Select ${config.minSelect}-${config.maxSelect} options`
            : config.minSelect
            ? `Select at least ${config.minSelect}`
            : `Select up to ${config.maxSelect}`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {config.options?.map((option) => {
          const isSelected = selectedValues.includes(option);
          const canDeselect = !config.minSelect || selectedValues.length > config.minSelect;
          const canSelect = !config.maxSelect || selectedValues.length < config.maxSelect;
          const isDisabled = isSelected ? !canDeselect : !canSelect;

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-slate-400'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{option}</span>
              {isSelected && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 text-center">{selectedValues.length} selected</p>
    </div>
  );
}

// Text Input Component
function TextInput_({
  value,
  onChange,
  targetConfig,
}: {
  value: string;
  onChange: (value: string) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
  };

  const displayValue = value || '';
  const characterCount = displayValue.length;

  return (
    <div className="py-3 space-y-3">
      <label className="block text-base font-semibold text-slate-900">
        {config.required ? 'Enter text (required)' : 'Enter text'}
      </label>

      <textarea
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder || 'Type here...'}
        maxLength={config.maxLength}
        rows={6}
        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-4 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-600">
          {characterCount} {config.maxLength ? `/ ${config.maxLength}` : ''} characters
        </span>
        {config.required && displayValue.trim() === '' && (
          <span className="text-xs text-red-500 font-medium">* Required</span>
        )}
      </div>
    </div>
  );
}
