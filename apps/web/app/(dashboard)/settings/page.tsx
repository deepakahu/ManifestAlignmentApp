import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <Header title="Settings" />

      <div className="p-8 max-w-4xl">
        {/* Account Section */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <p className="text-slate-900">{user.email}</p>
            </div>

            {profile?.display_name && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <p className="text-slate-900">{profile.display_name}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member Since</label>
              <p className="text-slate-900">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        {profile && (
          <div className="bg-white rounded-xl border border-slate-200 mb-6">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                <p className="text-slate-900 capitalize">{profile.theme || 'Light'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                <p className="text-slate-900">{profile.timezone || 'UTC'}</p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Notifications</p>
                  <p className="text-xs text-slate-500">Receive push notifications</p>
                </div>
                <div className={`w-12 h-6 rounded-full ${profile.notifications_enabled ? 'bg-primary-500' : 'bg-slate-300'} flex items-center`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${profile.notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Sound</p>
                  <p className="text-xs text-slate-500">Play sound for alarms</p>
                </div>
                <div className={`w-12 h-6 rounded-full ${profile.sound_enabled ? 'bg-primary-500' : 'bg-slate-300'} flex items-center`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${profile.sound_enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </div>

              {profile.local_data_migrated && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Local data migrated to cloud</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data & Privacy */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Data & Privacy</h2>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">Export Your Data</p>
              <p className="text-xs text-slate-500">Download all your moods, manifestations, and alarms</p>
            </button>

            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">Privacy Policy</p>
              <p className="text-xs text-slate-500">View our privacy practices</p>
            </button>

            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">Terms of Service</p>
              <p className="text-xs text-slate-500">Review our terms and conditions</p>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 mb-6">
          <div className="p-6 border-b border-red-200">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors">
              <p className="text-sm font-medium text-red-900">Delete All Data</p>
              <p className="text-xs text-red-600">Permanently delete all your moods, manifestations, and alarms</p>
            </button>

            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors">
              <p className="text-sm font-medium text-red-900">Delete Account</p>
              <p className="text-xs text-red-600">Permanently delete your account and all associated data</p>
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Mobile App Settings
              </h3>
              <p className="text-sm text-blue-800">
                Some settings like theme, notifications, and sound can be configured in the mobile app. Changes will sync across all your devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
