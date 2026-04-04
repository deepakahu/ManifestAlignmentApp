'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, getMoodEmoji, getMoodLabel, getMoodColor } from '@/lib/utils';

interface MoodEntry {
  id: string;
  mood_level: number;
  timestamp: string;
  notes?: string;
  tags?: string[];
}

export default function MoodsPage() {
  const router = useRouter();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [moodLevel, setMoodLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setMoods(data || []);
    } catch (error: any) {
      console.error('Failed to load moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmitMood = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_level: moodLevel,
          notes: notes.trim() || null,
          tags: tags.length > 0 ? tags : null,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      // Reset form
      setMoodLevel(5);
      setNotes('');
      setTags([]);
      setShowMoodForm(false);

      // Reload moods
      await loadMoods();
    } catch (error: any) {
      console.error('Failed to save mood:', error);
      alert('Failed to save mood: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate mood statistics
  const moodStats = moods.reduce((acc, mood) => {
    acc.total++;
    acc.sum += mood.mood_level;
    if (mood.mood_level >= 8) acc.great++;
    else if (mood.mood_level >= 6) acc.good++;
    else if (mood.mood_level >= 4) acc.neutral++;
    else acc.low++;
    return acc;
  }, { total: 0, sum: 0, great: 0, good: 0, neutral: 0, low: 0 });

  const avgMood = moodStats.total > 0
    ? (moodStats.sum / moodStats.total).toFixed(1)
    : 'N/A';

  return (
    <div>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mood Tracking</h1>
            <p className="mt-1 text-gray-600">Track and analyze your emotional well-being</p>
          </div>
          <button
            onClick={() => setShowMoodForm(true)}
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Track Mood
          </button>
        </div>

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
                Track your first mood to get started
              </p>
              <button
                onClick={() => setShowMoodForm(true)}
                className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Track Your Mood
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mood Form Modal */}
      {showMoodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Track Your Mood</h2>
                <button
                  onClick={() => setShowMoodForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Mood Level Slider */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-900">
                    How are you feeling?
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{getMoodEmoji(moodLevel)}</span>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${getMoodColor(moodLevel)}`}>
                        {moodLevel}/10
                      </span>
                      <p className="text-sm text-gray-600">{getMoodLabel(moodLevel)}</p>
                    </div>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodLevel}
                  onChange={(e) => setMoodLevel(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right,
                      #ef4444 0%,
                      #f59e0b 25%,
                      #eab308 50%,
                      #84cc16 75%,
                      #22c55e 100%)`
                  }}
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Terrible</span>
                  <span>Amazing</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{notes.length}/500</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tags (Optional)
                </label>

                {/* Tag Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag (e.g., work, family, exercise)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Tags Display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowMoodForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMood}
                className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Mood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
