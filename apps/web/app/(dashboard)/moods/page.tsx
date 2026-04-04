import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDateTime, getMoodEmoji, getMoodLabel, getMoodColor } from '@/lib/utils';

export default async function MoodsPage() {
  const supabase = await createClient();

  // Fetch all mood entries
  const { data: moods } = await supabase
    .from('mood_entries')
    .select('*')
    .order('timestamp', { ascending: false });

  // Calculate mood statistics
  const moodStats = moods?.reduce((acc, mood) => {
    acc.total++;
    acc.sum += mood.mood_level;
    if (mood.mood_level >= 8) acc.great++;
    else if (mood.mood_level >= 6) acc.good++;
    else if (mood.mood_level >= 4) acc.neutral++;
    else acc.low++;
    return acc;
  }, { total: 0, sum: 0, great: 0, good: 0, neutral: 0, low: 0 });

  const avgMood = moodStats && moodStats.total > 0
    ? (moodStats.sum / moodStats.total).toFixed(1)
    : 'N/A';

  return (
    <div>
      <Header title="Mood Tracking" />

      <div className="p-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-2">{avgMood}</p>
              <p className="text-sm text-slate-600">Average Mood</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500 mb-2">{moodStats?.great ?? 0}</p>
              <p className="text-sm text-slate-600">Great Days</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500 mb-2">{moodStats?.good ?? 0}</p>
              <p className="text-sm text-slate-600">Good Days</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-2">{moodStats?.total ?? 0}</p>
              <p className="text-sm text-slate-600">Total Entries</p>
            </div>
          </div>
        </div>

        {/* Mood Entries */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Mood History</h2>
          </div>

          {moods && moods.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {moods.map((mood) => (
                <div key={mood.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Mood Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-5xl">{getMoodEmoji(mood.mood_level)}</span>
                    </div>

                    {/* Mood Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-2xl font-bold ${getMoodColor(mood.mood_level)}`}>
                          {mood.mood_level}/10
                        </span>
                        <span className="text-sm text-slate-500">
                          {getMoodLabel(mood.mood_level)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 mb-3">
                        {formatDateTime(mood.timestamp)}
                      </p>

                      {mood.notes && (
                        <p className="text-sm text-slate-700 mb-3 bg-slate-50 p-3 rounded-lg">
                          {mood.notes}
                        </p>
                      )}

                      {mood.tags && mood.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {mood.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No mood entries yet</h3>
              <p className="text-slate-500 mb-6">
                Start tracking your moods using the mobile app
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
