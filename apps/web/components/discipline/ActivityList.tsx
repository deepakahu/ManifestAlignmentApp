/**
 * ActivityList Component (Web)
 *
 * Displays activities with today's tracking status
 */

'use client';

import type { DisciplineActivity } from '@manifestation/shared';

interface ActivityListProps {
  activities: DisciplineActivity[];
  goalColor?: string;
  onEdit?: (activity: DisciplineActivity) => void;
  onDelete?: (activity: DisciplineActivity) => void;
  onToggleActive?: (activity: DisciplineActivity) => void;
}

export function ActivityList({
  activities,
  goalColor = '#6366f1',
  onEdit,
  onDelete,
  onToggleActive,
}: ActivityListProps) {
  const activeActivities = activities.filter((a) => a.isActive);
  const inactiveActivities = activities.filter((a) => !a.isActive);

  const getFrequencyLabel = (activity: DisciplineActivity): string => {
    if (activity.frequencyType === 'daily') return 'Daily';
    if (activity.frequencyType === 'specific_days') {
      const config = activity.frequencyConfig as { days: number[] };
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return config.days?.map((d) => dayNames[d]).join(', ') || 'No days';
    }
    return 'Custom';
  };

  const getTrackingLabel = (activity: DisciplineActivity): string => {
    switch (activity.trackingType) {
      case 'boolean':
        return 'Yes/No';
      case 'number':
        const config = activity.targetConfig as { target: number; unit: string };
        return `${config.target} ${config.unit}`;
      case 'multiselect':
        return 'Multi-select';
      case 'text':
        return 'Notes';
      default:
        return '';
    }
  };

  const isDueToday = (activity: DisciplineActivity): boolean => {
    const today = new Date().getDay();
    if (activity.frequencyType === 'daily') return true;
    if (activity.frequencyType === 'specific_days') {
      const config = activity.frequencyConfig as { days: number[] };
      return config.days?.includes(today) || false;
    }
    return false;
  };

  const renderActivity = (activity: DisciplineActivity) => (
    <div
      key={activity.id}
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            {activity.title}
          </h4>
          {activity.description && (
            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: goalColor + '20', color: goalColor }}
            >
              {getTrackingLabel(activity)}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              {getFrequencyLabel(activity)}
            </span>
            {isDueToday(activity) && (
              <span
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: goalColor }}
              >
                Due Today
              </span>
            )}
            {activity.reminderEnabled && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                🔔 {activity.reminderTime?.slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(activity)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={activity.isActive ? 'Deactivate' : 'Activate'}
            >
              {activity.isActive ? '⏸️' : '▶️'}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(activity)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <p className="text-gray-600 mb-2">No activities yet</p>
        <p className="text-sm text-gray-500">
          Add your first activity to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Activities */}
      {activeActivities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Active Activities ({activeActivities.length})
          </h3>
          <div className="space-y-3">
            {activeActivities.map((activity) => renderActivity(activity))}
          </div>
        </div>
      )}

      {/* Inactive Activities */}
      {inactiveActivities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 mb-3">
            Inactive Activities ({inactiveActivities.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {inactiveActivities.map((activity) => renderActivity(activity))}
          </div>
        </div>
      )}
    </div>
  );
}
