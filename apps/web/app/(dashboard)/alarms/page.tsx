'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

interface Alarm {
  id: string;
  name: string;
  interval_hours: number;
  interval_minutes: number;
  is_test_mode: boolean;
  test_interval_minutes: number;
  day_start_time: string;
  day_end_time: string;
  active_days: boolean[];
  is_enabled: boolean;
  sound_type: string;
  last_triggered_at: string | null;
  next_trigger_at: string | null;
  created_at: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    intervalHours: 0,
    intervalMinutes: 30,
    isTestMode: false,
    testIntervalMinutes: 5,
    dayStartTime: '08:00',
    dayEndTime: '22:00',
    activeDays: [true, true, true, true, true, true, true],
    soundType: 'default',
  });

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      const { data } = await supabase
        .from('alarms')
        .select('*')
        .order('created_at', { ascending: false });

      setAlarms(data || []);
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an alarm name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const alarmData = {
        name: formData.name,
        interval_hours: formData.intervalHours,
        interval_minutes: formData.intervalMinutes,
        is_test_mode: formData.isTestMode,
        test_interval_minutes: formData.testIntervalMinutes,
        day_start_time: formData.dayStartTime + ':00',
        day_end_time: formData.dayEndTime + ':00',
        active_days: formData.activeDays,
        sound_type: formData.soundType,
        ...(editingAlarm ? {} : { user_id: user.id, is_enabled: true }),
      };

      const { error } = editingAlarm
        ? await supabase.from('alarms').update(alarmData).eq('id', editingAlarm.id)
        : await supabase.from('alarms').insert(alarmData);

      if (error) throw error;

      resetForm();
      loadAlarms();
    } catch (error: any) {
      alert('Failed to save alarm: ' + error.message);
    }
  };

  const handleEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setFormData({
      name: alarm.name,
      intervalHours: alarm.interval_hours,
      intervalMinutes: alarm.interval_minutes,
      isTestMode: alarm.is_test_mode,
      testIntervalMinutes: alarm.test_interval_minutes,
      dayStartTime: alarm.day_start_time.slice(0, 5),
      dayEndTime: alarm.day_end_time.slice(0, 5),
      activeDays: alarm.active_days,
      soundType: alarm.sound_type,
    });
    setShowForm(true);
  };

  const handleDelete = async (alarmId: string) => {
    if (!confirm('Are you sure you want to delete this alarm?')) return;

    try {
      const { error } = await supabase.from('alarms').delete().eq('id', alarmId);
      if (error) throw error;
      loadAlarms();
    } catch (error: any) {
      alert('Failed to delete alarm: ' + error.message);
    }
  };

  const handleToggleEnabled = async (alarm: Alarm) => {
    try {
      const { error } = await supabase
        .from('alarms')
        .update({ is_enabled: !alarm.is_enabled })
        .eq('id', alarm.id);

      if (error) throw error;
      loadAlarms();
    } catch (error: any) {
      alert('Failed to update alarm: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      intervalHours: 0,
      intervalMinutes: 30,
      isTestMode: false,
      testIntervalMinutes: 5,
      dayStartTime: '08:00',
      dayEndTime: '22:00',
      activeDays: [true, true, true, true, true, true, true],
      soundType: 'default',
    });
    setEditingAlarm(null);
    setShowForm(false);
  };

  const getIntervalDisplay = (alarm: Alarm) => {
    if (alarm.is_test_mode) {
      return `Every ${alarm.test_interval_minutes} min (Test Mode)`;
    }
    const hours = alarm.interval_hours;
    const minutes = alarm.interval_minutes;
    if (hours === 0) return `Every ${minutes} min`;
    if (minutes === 0) return `Every ${hours}h`;
    return `Every ${hours}h ${minutes}min`;
  };

  const getActiveDaysDisplay = (activeDays: boolean[]) => {
    const allDays = activeDays.every(d => d);
    if (allDays) return 'Every day';
    const activeDayNames = activeDays
      .map((active, index) => active ? DAY_NAMES[index] : null)
      .filter(Boolean);
    return activeDayNames.join(', ');
  };

  const activeAlarms = alarms.filter(a => a.is_enabled);
  const inactiveAlarms = alarms.filter(a => !a.is_enabled);

  if (loading) {
    return (
      <div>
        <Header title="Alarms" />
        <div className="p-8 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Alarms" />

      <div className="p-8">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alarms</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Create Alarm
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {alarms.length}
              </p>
              <p className="text-sm text-slate-600">Total Alarms</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500 mb-2">
                {activeAlarms.length}
              </p>
              <p className="text-sm text-slate-600">Active</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-400 mb-2">
                {inactiveAlarms.length}
              </p>
              <p className="text-sm text-slate-600">Inactive</p>
            </div>
          </div>
        </div>

        {/* Active Alarms */}
        {activeAlarms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Alarms</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {activeAlarms.map((alarm) => (
                <div key={alarm.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-slate-900">{alarm.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-600">Enabled</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <p>
                          <span className="font-medium">Interval:</span> {getIntervalDisplay(alarm)}
                        </p>
                        <p>
                          <span className="font-medium">Active Window:</span>{' '}
                          {alarm.day_start_time.slice(0, 5)} - {alarm.day_end_time.slice(0, 5)}
                        </p>
                        <p>
                          <span className="font-medium">Days:</span> {getActiveDaysDisplay(alarm.active_days)}
                        </p>
                        {alarm.last_triggered_at && (
                          <p className="text-xs text-slate-500">
                            Last triggered: {formatDate(alarm.last_triggered_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleEnabled(alarm)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Disable"
                      >
                        ⏸️
                      </button>
                      <button
                        onClick={() => handleEdit(alarm)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(alarm.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Alarms */}
        {inactiveAlarms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Inactive Alarms</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 opacity-60">
              {inactiveAlarms.map((alarm) => (
                <div key={alarm.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-slate-400">{alarm.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-400">Disabled</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-500">
                        <p>
                          <span className="font-medium">Interval:</span> {getIntervalDisplay(alarm)}
                        </p>
                        <p>
                          <span className="font-medium">Days:</span> {getActiveDaysDisplay(alarm.active_days)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleEnabled(alarm)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Enable"
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => handleEdit(alarm)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(alarm.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alarms.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No alarms set</h3>
            <p className="text-slate-500 mb-6">
              Create your first alarm to get interval-based reminders
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create First Alarm
            </button>
          </div>
        )}
      </div>

      {/* Alarm Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAlarm ? 'Edit Alarm' : 'Create New Alarm'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Alarm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mood Check-in, Manifestation Reminder"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Test Mode */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Test Mode</span>
                    <p className="text-xs text-gray-600">Use shorter intervals for testing (mobile only)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isTestMode}
                    onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>

              {/* Interval */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {formData.isTestMode ? 'Test Interval' : 'Reminder Interval'}
                </label>
                {formData.isTestMode ? (
                  <div>
                    <input
                      type="number"
                      value={formData.testIntervalMinutes}
                      onChange={(e) => setFormData({ ...formData, testIntervalMinutes: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="60"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="ml-2 text-sm text-gray-600">minutes</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div>
                      <input
                        type="number"
                        value={formData.intervalHours}
                        onChange={(e) => setFormData({ ...formData, intervalHours: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="23"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span className="ml-2 text-sm text-gray-600">hours</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.intervalMinutes}
                        onChange={(e) => setFormData({ ...formData, intervalMinutes: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="59"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span className="ml-2 text-sm text-gray-600">minutes</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Window */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Active Window
                </label>
                <p className="text-xs text-gray-600 mb-3">Alarms will only trigger during this time period</p>
                <div className="flex gap-3 items-center">
                  <input
                    type="time"
                    value={formData.dayStartTime}
                    onChange={(e) => setFormData({ ...formData, dayStartTime: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="time"
                    value={formData.dayEndTime}
                    onChange={(e) => setFormData({ ...formData, dayEndTime: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Active Days */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Active Days
                </label>
                <div className="flex gap-2 justify-between">
                  {DAY_NAMES.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = [...formData.activeDays];
                        newDays[index] = !newDays[index];
                        setFormData({ ...formData, activeDays: newDays });
                      }}
                      className={`w-11 h-11 rounded-full font-semibold text-sm transition-all ${
                        formData.activeDays[index]
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Sound
                </label>
                <select
                  value={formData.soundType}
                  onChange={(e) => setFormData({ ...formData, soundType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="bell">Bell</option>
                  <option value="chime">Chime</option>
                  <option value="gong">Gong</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingAlarm ? 'Update Alarm' : 'Create Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
