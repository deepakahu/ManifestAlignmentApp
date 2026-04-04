/**
 * CategoryCard Component (Web)
 *
 * Displays a category card with actions
 */

'use client';

import type { Category } from '@manifestation/shared';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  onEdit?: (category: Category) => void;
  onArchive?: (category: Category) => void;
  onRestore?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  goalCount?: number;
  activityCount?: number;
}

export function CategoryCard({
  category,
  onClick,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  goalCount = 0,
  activityCount = 0,
}: CategoryCardProps) {
  const isArchived = category.isArchived;

  return (
    <div
      className={`group relative rounded-lg border-2 border-gray-200 p-6 transition-all hover:shadow-lg ${
        isArchived ? 'opacity-60' : 'hover:border-gray-300 cursor-pointer'
      }`}
      style={{ backgroundColor: category.color + '08' }}
      onClick={onClick && !isArchived ? onClick : undefined}
    >
      {/* Archived Badge */}
      {isArchived && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
          Archived
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
        style={{ backgroundColor: category.color }}
      >
        {category.icon || '📋'}
      </div>

      {/* Name and Description */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {category.name}
      </h3>
      {category.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {category.description}
        </p>
      )}

      {/* Stats */}
      {!isArchived && (
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span>{goalCount} goals</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span>{activityCount} activities</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {!isArchived ? (
          <>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(category);
                }}
                className="px-3 py-1.5 text-sm text-orange-600 bg-white border border-orange-300 rounded hover:bg-orange-50 transition-colors"
              >
                Archive
              </button>
            )}
          </>
        ) : (
          <>
            {onRestore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(category);
                }}
                className="px-3 py-1.5 text-sm text-green-600 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
              >
                Restore
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                className="px-3 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
