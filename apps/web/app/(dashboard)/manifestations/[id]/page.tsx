import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ManifestationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: manifestation } = await supabase
    .from('manifestation_entries')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!manifestation) {
    notFound();
  }

  return (
    <div>
      <Header title="Manifestation Details" />

      <div className="p-8">
        {/* Back Button */}
        <Link
          href="/manifestations"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Manifestations
        </Link>

        {/* Manifestation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-3xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {manifestation.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {manifestation.category || 'General'}
                </span>
                {manifestation.is_completed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✨ Completed
                  </span>
                )}
              </div>
            </div>
            <span className="text-5xl">⭐</span>
          </div>

          {/* Description */}
          {manifestation.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                Description
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {manifestation.description}
              </p>
            </div>
          )}

          {/* Affirmations */}
          {manifestation.affirmations && manifestation.affirmations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                Affirmations
              </h2>
              <div className="space-y-2">
                {manifestation.affirmations.map((affirmation: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg"
                  >
                    <span className="text-amber-600 font-bold flex-shrink-0">{index + 1}.</span>
                    <p className="text-slate-700">{affirmation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visualization Notes */}
          {manifestation.visualization_notes && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                Visualization Notes
              </h2>
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {manifestation.visualization_notes}
                </p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                Created
              </p>
              <p className="text-sm text-slate-900">{formatDate(manifestation.created_at)}</p>
            </div>

            {manifestation.target_date && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  Target Date
                </p>
                <p className="text-sm text-slate-900">{formatDate(manifestation.target_date)}</p>
              </div>
            )}

            {manifestation.completed_at && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-sm text-slate-900">{formatDate(manifestation.completed_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 max-w-3xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Manifestation Practice
                </h3>
                <p className="text-sm text-blue-800">
                  Review your manifestation daily, visualize your desired outcome, and repeat your affirmations with conviction.
                  Use the mobile app to mark as completed when your manifestation comes to fruition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
