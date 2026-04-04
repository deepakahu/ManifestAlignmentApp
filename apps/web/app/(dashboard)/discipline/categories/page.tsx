/**
 * Category Management Page
 *
 * Create, edit, archive, and reorder categories
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Category } from '@manifestation/shared';
import { categoryFromDB, categoryToDB, CategorySchema } from '@manifestation/shared';
import { CategoryCard } from '@/components/discipline/category/CategoryCard';

interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color: string;
}

const ICON_OPTIONS = [
  '🙏', '💪', '💼', '💰', '❤️', '🧘', '📚', '🎯',
  '🏃', '🍎', '💡', '🎨', '🎵', '🌟', '🔥', '✨',
];

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: ICON_OPTIONS[0],
    color: COLOR_OPTIONS[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_archived', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data.map(categoryFromDB));
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: ICON_OPTIONS[0],
      color: COLOR_OPTIONS[0],
    });
    setErrors({});
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || ICON_OPTIONS[0],
      color: category.color,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = CategorySchema.safeParse({
      name: formData.name,
      description: formData.description || undefined,
      icon: formData.icon,
      color: formData.color,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingCategory) {
        // Update existing category
        const updateData = categoryToDB({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          icon: formData.icon,
          color: formData.color,
        } as Category);

        const { error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', editingCategory.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new category
        const { data: maxData } = await supabase
          .from('categories')
          .select('order_index')
          .eq('user_id', user.id)
          .order('order_index', { ascending: false })
          .limit(1)
          .single();

        const nextOrderIndex = maxData ? maxData.order_index + 1 : 0;

        const categoryData = categoryToDB({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          icon: formData.icon,
          color: formData.color,
          userId: user.id,
          orderIndex: nextOrderIndex,
          isArchived: false,
        } as Category);

        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) {
          if (error.message?.includes('Category limit reached')) {
            alert('Category limit reached. Upgrade to Pro for unlimited categories.');
            return;
          }
          throw error;
        }
      }

      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      alert(error.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (category: Category) => {
    if (!confirm(`Archive "${category.name}"? You can restore it later.`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('categories')
        .update({ is_archived: true })
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;
      loadCategories();
    } catch (error: any) {
      console.error('Failed to archive category:', error);
      alert(error.message || 'Failed to archive category');
    }
  };

  const handleRestore = async (category: Category) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('categories')
        .update({ is_archived: false })
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) {
        if (error.message?.includes('Category limit reached')) {
          alert('Category limit reached. Upgrade to Pro for unlimited categories.');
          return;
        }
        throw error;
      }
      loadCategories();
    } catch (error: any) {
      console.error('Failed to restore category:', error);
      alert(error.message || 'Failed to restore category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Permanently delete "${category.name}"? This will also delete all goals and activities. This action cannot be undone.`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Failed to delete category');
    }
  };

  const activeCategories = categories.filter(c => !c.isArchived);
  const archivedCategories = categories.filter(c => c.isArchived);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
          <p className="mt-1 text-gray-600">
            Create and organize your life categories
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Category
        </button>
      </div>

      {/* Active Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Categories ({activeCategories.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600">No active categories. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Categories */}
      {archivedCategories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Archived Categories ({archivedCategories.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="e.g., Spiritual Growth"
                    maxLength={50}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="What does this category represent?"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="mt-1 text-sm text-gray-500 text-right">
                    {formData.description?.length || 0}/200
                  </p>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-3 text-2xl border-2 rounded-lg transition-all ${
                          formData.icon === icon
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-3">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-12 h-12 rounded-full border-4 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div
                    className="flex items-center p-4 rounded-lg"
                    style={{ backgroundColor: formData.color + '15' }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.icon}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        {formData.name || 'Category Name'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.description || 'Category description'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: formData.color }}
                    disabled={submitting || !formData.name.trim()}
                  >
                    {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
