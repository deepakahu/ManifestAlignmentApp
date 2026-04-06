'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function DataPrivacyActions() {
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setExporting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to export data');
        return;
      }

      // Fetch all user data
      const [
        { data: categories },
        { data: goals },
        { data: activities },
        { data: activityLogs },
        { data: challenges },
        { data: challengeParticipants },
        { data: profile }
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('discipline_activities').select('*').eq('user_id', user.id),
        supabase.from('activity_logs').select('*').eq('user_id', user.id),
        supabase.from('challenges').select('*').eq('user_id', user.id),
        supabase.from('challenge_participants').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      // Create export data object
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        profile,
        discipline: {
          categories: categories || [],
          goals: goals || [],
          activities: activities || [],
          activityLogs: activityLogs || []
        },
        challenges: {
          challenges: challenges || [],
          participations: challengeParticipants || []
        }
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manifest-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Failed to export data: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportData}
      disabled={exporting}
      className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p className="text-sm font-medium text-slate-900">
        {exporting ? 'Exporting...' : 'Export Your Data'}
      </p>
      <p className="text-xs text-slate-500">
        Download all your categories, goals, activities, and challenges
      </p>
    </button>
  );
}
