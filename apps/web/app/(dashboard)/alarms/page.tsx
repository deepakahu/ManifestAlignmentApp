import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

export default async function AlarmsPage() {
  const supabase = await createClient();

  // Fetch all alarms
  const { data: alarms } = await supabase
    .from('alarms')
    .select('*')
    .order('time', { ascending: true });

  const activeAlarms = alarms?.filter(a => a.is_enabled) ?? [];
  const inactiveAlarms = alarms?.filter(a => !a.is_enabled) ?? [];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysDisplay = (days: number[]) => {
    if (!days || days.length === 0) return 'Once';
    if (days.length === 7) return 'Every day';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
  };

  return (
    <div>
      <Header title="Alarms" />

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {alarms?.length ?? 0}
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-slate-900">
                        {formatTime(alarm.time)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Enabled</span>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {alarm.label && (
                    <p className="text-sm font-medium text-slate-900 mb-2">{alarm.label}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      {getDaysDisplay(alarm.repeat_days)}
                    </span>
                    {alarm.snooze_duration && (
                      <span className="text-xs text-slate-500">
                        Snooze: {alarm.snooze_duration}min
                      </span>
                    )}
                  </div>

                  {alarm.last_triggered && (
                    <p className="text-xs text-slate-500 mt-2">
                      Last triggered: {formatDate(alarm.last_triggered)}
                    </p>
                  )}
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-slate-400">
                        {formatTime(alarm.time)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-400">Disabled</span>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {alarm.label && (
                    <p className="text-sm font-medium text-slate-600 mb-2">{alarm.label}</p>
                  )}

                  <span className="text-sm text-slate-500">
                    {getDaysDisplay(alarm.repeat_days)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alarms?.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No alarms set</h3>
            <p className="text-slate-500 mb-6">
              Set up daily reminders using the mobile app
            </p>
          </div>
        )}

        {/* Note */}
        <div className="mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Manage Alarms on Mobile
                </h3>
                <p className="text-sm text-blue-800">
                  Alarms can be created, edited, and managed through the mobile app. This web dashboard provides a view-only interface for your alarm settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
