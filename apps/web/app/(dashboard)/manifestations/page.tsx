'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Manifestation {
  id: string;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export default function ManifestationsPage() {
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Personal',
    targetDate: '',
    visualizationNotes: '',
    affirmations: '',
  });

  useEffect(() => {
    loadManifestations();
  }, []);

  const loadManifestations = async () => {
    try {
      const { data } = await supabase
        .from('manifestation_entries')
        .select('*')
        .order('created_at', { ascending: false });

      setManifestations(data || []);
    } catch (error) {
      console.error('Failed to load manifestations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('manifestation_entries')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category || 'Personal',
          target_date: formData.targetDate || null,
          visualization_notes: formData.visualizationNotes || null,
          affirmations: formData.affirmations
            ? formData.affirmations.split('\n').filter(Boolean)
            : [],
          is_completed: false,
        });

      if (error) throw error;

      setFormData({
        title: '',
        description: '',
        category: 'Personal',
        targetDate: '',
        visualizationNotes: '',
        affirmations: '',
      });
      setShowForm(false);
      loadManifestations();
    } catch (error: any) {
      alert('Failed to create manifestation: ' + error.message);
    }
  };

  const activeManifestations = manifestations.filter(m => !m.is_completed);
  const completedManifestations = manifestations.filter(m => m.is_completed);

  if (loading) {
    return (
      <div>
        <Header title="Manifestations" />
        <div className="p-8 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  const CATEGORIES = ['Personal', 'Health', 'Career', 'Relationships', 'Financial', 'Spiritual', 'Other'];

  return (
    <div>
      <Header title="Manifestations" />

      <div className="p-8">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manifestations</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Create Manifestation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {manifestations?.length ?? 0}
              </p>
              <p className="text-sm text-slate-600">Total Manifestations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500 mb-2">
                {activeManifestations.length}
              </p>
              <p className="text-sm text-slate-600">Active</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500 mb-2">
                {completedManifestations.length}
              </p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </div>
        </div>

        {/* Active Manifestations */}
        {activeManifestations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Manifestations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeManifestations.map((manifestation) => (
                <Link
                  key={manifestation.id}
                  href={`/manifestations/${manifestation.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex-1">
                      {manifestation.title}
                    </h3>
                    <span className="flex-shrink-0 text-2xl ml-2">⭐</span>
                  </div>

                  {manifestation.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {manifestation.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {manifestation.category || 'General'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(manifestation.created_at)}
                    </span>
                  </div>

                  {manifestation.target_date && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        Target: {formatDate(manifestation.target_date)}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Completed Manifestations */}
        {completedManifestations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Completed Manifestations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedManifestations.map((manifestation) => (
                <Link
                  key={manifestation.id}
                  href={`/manifestations/${manifestation.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex-1 line-through">
                      {manifestation.title}
                    </h3>
                    <span className="flex-shrink-0 text-2xl ml-2">✨</span>
                  </div>

                  {manifestation.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {manifestation.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                    <span className="text-xs text-slate-500">
                      {manifestation.completed_at ? formatDate(manifestation.completed_at) : formatDate(manifestation.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {manifestations?.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No manifestations yet</h3>
            <p className="text-slate-500 mb-6">
              Create your first manifestation to start manifesting your dreams
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Create First Manifestation
            </button>
          </div>
        )}
      </div>

      {/* Manifestation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Manifestation</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Own my dream home, Start my business"
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your manifestation in detail..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Visualization Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Visualization Notes (Optional)
                </label>
                <textarea
                  value={formData.visualizationNotes}
                  onChange={(e) => setFormData({ ...formData, visualizationNotes: e.target.value })}
                  placeholder="How do you visualize this manifestation? What does it feel like?"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.visualizationNotes.length}/500</p>
              </div>

              {/* Affirmations */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Affirmations (Optional)
                </label>
                <p className="text-xs text-gray-600 mb-2">Enter one affirmation per line</p>
                <textarea
                  value={formData.affirmations}
                  onChange={(e) => setFormData({ ...formData, affirmations: e.target.value })}
                  placeholder="I am worthy of my dreams&#10;I attract abundance effortlessly&#10;I am living my best life"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Create Manifestation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
