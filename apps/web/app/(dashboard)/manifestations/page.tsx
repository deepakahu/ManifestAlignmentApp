import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function ManifestationsPage() {
  const supabase = await createClient();

  // Fetch all manifestations
  const { data: manifestations } = await supabase
    .from('manifestation_entries')
    .select('*')
    .order('created_at', { ascending: false });

  const activeManifestations = manifestations?.filter(m => !m.is_completed) ?? [];
  const completedManifestations = manifestations?.filter(m => m.is_completed) ?? [];

  return (
    <div>
      <Header title="Manifestations" />

      <div className="p-8">
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
              Create your first manifestation using the mobile app
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
