/**
 * CategoryGrid Component (Web)
 *
 * Displays categories in a responsive grid layout
 */

'use client';

import type { Category } from '@manifestation/shared';
import { CategoryCard } from './CategoryCard';

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
  goalCounts?: Record<string, number>;
  activityCounts?: Record<string, number>;
}

export function CategoryGrid({
  categories,
  onCategoryClick,
  goalCounts = {},
  activityCounts = {},
}: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Categories Yet
        </h3>
        <p className="text-gray-600">
          Create your first category to start tracking your discipline activities
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={() => onCategoryClick?.(category)}
          goalCount={goalCounts[category.id] || 0}
          activityCount={activityCounts[category.id] || 0}
        />
      ))}
    </div>
  );
}
