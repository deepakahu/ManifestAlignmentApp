import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDate, getMoodEmoji } from '@/lib/utils';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch recent mood entries
  const { data: recentMoods } = await supabase
    .from('mood_entries')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5);

  // Fetch recent manifestations
  const { data: recentManifestations } = await supabase
    .from('manifestation_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch active alarms count
  const { count: activeAlarmsCount } = await supabase
    .from('alarms')
    .select('*', { count: 'exact', head: true })
    .eq('is_enabled', true);

  // Get mood stats for this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: weekMoods } = await supabase
    .from('mood_entries')
    .select('mood_level')
    .gte('timestamp', oneWeekAgo.toISOString());

  const avgMood = weekMoods && weekMoods.length > 0
    ? (weekMoods.reduce((sum, entry) => sum + entry.mood_level, 0) / weekMoods.length).toFixed(1)
    : 'N/A';

  // Fetch discipline stats
  const { count: categoriesCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  const { count: goalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: activitiesCount } = await supabase
    .from('discipline_activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Get today's activity completion
  const today = new Date().toISOString().split('T')[0];

  // Get all activities
  const { data: allActivities } = await supabase
    .from('discipline_activities')
    .select('id, frequency_type, frequency_config')
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Filter activities due today
  const activitiesToday = allActivities?.filter(activity => {
    if (activity.frequency_type === 'daily') return true;

    if (activity.frequency_type === 'specific_days') {
      const dayOfWeek = new Date().getDay();
      const config = activity.frequency_config as { days: number[] };
      return config?.days?.includes(dayOfWeek) || false;
    }

    if (activity.frequency_type === 'custom') {
      const config = activity.frequency_config as { dates: string[] };
      return config?.dates?.includes(today) || false;
    }

    return false;
  }) || [];

  // Get today's logs
  const { data: todayLogs } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('log_date', today);

  const todayCompletion = activitiesToday.length > 0
    ? Math.round((todayLogs?.length || 0) / activitiesToday.length * 100)
    : 0;

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-slate-600">
            Here&apos;s your manifestation journey overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link href="/discipline" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {activitiesCount ?? 0}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Discipline</p>
            <p className="text-xs text-slate-500">{categoriesCount ?? 0} categories, {goalsCount ?? 0} goals</p>
          </Link>

          <Link href="/discipline/tracker" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {todayCompletion}%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Today</p>
            <p className="text-xs text-slate-500">{todayLogs?.length ?? 0}/{activitiesToday.length} logged</p>
          </Link>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {recentManifestations?.length ?? 0}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Manifestations</p>
            <p className="text-xs text-slate-500">Active intentions</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900">{avgMood}</span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Average Mood</p>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {activeAlarmsCount ?? 0}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Active Alarms</p>
            <p className="text-xs text-slate-500">Daily reminders</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Moods */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Recent Moods</h3>
              <Link
                href="/moods"
                className="text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                View all
              </Link>
            </div>
            <div className="p-6">
              {recentMoods && recentMoods.length > 0 ? (
                <div className="space-y-4">
                  {recentMoods.map((mood) => (
                    <div
                      key={mood.id}
                      className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <span className="text-3xl">{getMoodEmoji(mood.mood_level)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          Mood Level: {mood.mood_level}/10
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(mood.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No mood entries yet</p>
                  <Link
                    href="/moods"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Track Your Mood
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Manifestations */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Recent Manifestations</h3>
              <Link
                href="/manifestations"
                className="text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                View all
              </Link>
            </div>
            <div className="p-6">
              {recentManifestations && recentManifestations.length > 0 ? (
                <div className="space-y-4">
                  {recentManifestations.map((manifestation) => (
                    <div
                      key={manifestation.id}
                      className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {manifestation.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          {manifestation.category || 'General'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(manifestation.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No manifestations yet</p>
                  <Link
                    href="/manifestations"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Create Manifestation
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
