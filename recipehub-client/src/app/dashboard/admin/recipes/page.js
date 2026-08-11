'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { ChefHat, Edit, Trash2, Star, Check, Plus, Loader2, X } from 'lucide-react';

export default function ManageRecipes() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Edit Modal State
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editFormData, setEditFormData] = useState({
    recipeName: '',
    recipeImage: '',
    category: 'Main Course',
    cuisineType: '',
    difficultyLevel: 'Easy',
    preparationTime: '',
    instructions: '',
  });
  const [editIngredients, setEditIngredients] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/recipes`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecipes(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/recipes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecipes(recipes.filter(r => r._id !== id));
      } else {
        alert("Failed to delete recipe.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFeature = async (recipe) => {
    const isFeatured = !recipe.isFeatured;
    setActionId(recipe._id);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/recipes/${recipe._id}/feature`, {
        method: 'PUT',
        body: JSON.stringify({ isFeatured })
      });
      if (res.ok) {
        setRecipes(recipes.map(r => r._id === recipe._id ? { ...r, isFeatured } : r));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  // Open Edit modal
  const startEdit = (recipe) => {
    setEditingRecipe(recipe);
    setEditFormData({
      recipeName: recipe.recipeName,
      recipeImage: recipe.recipeImage,
      category: recipe.category,
      cuisineType: recipe.cuisineType,
      difficultyLevel: recipe.difficultyLevel || 'Easy',
      preparationTime: recipe.preparationTime,
      instructions: recipe.instructions,
    });
    setEditIngredients(recipe.ingredients || []);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleIngredientChange = (index, value) => {
    const updated = [...editIngredients];
    updated[index] = value;
    setEditIngredients(updated);
  };

  const addIngredient = () => {
    setEditIngredients([...editIngredients, '']);
  };

  const removeIngredient = (index) => {
    if (editIngredients.length === 1) return;
    setEditIngredients(editIngredients.filter((_, i) => i !== index));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const filteredIngredients = editIngredients.map(i => i.trim()).filter(Boolean);

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/${editingRecipe._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          ingredients: filteredIngredients
        })
      });

      if (res.ok) {
        setEditingRecipe(null);
        fetchRecipes();
      } else {
        alert("Failed to update recipe.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={30} className="text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border-custom pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Manage Recipes</h1>
        <p className="text-foreground-custom/60 text-sm">Review, feature, edit, or delete platform recipes.</p>
      </div>

      <div className="bg-card-custom border border-border-custom rounded-3xl overflow-hidden shadow-sm">
        {recipes.length === 0 ? (
          <div className="p-16 text-center text-foreground-custom/60">No recipes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-foreground-custom/[0.02]">
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Recipe Name</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Category</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Author</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Featured</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {recipes.map((item) => (
                  <tr key={item._id} className="hover:bg-foreground-custom/[0.01] transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.recipeImage}
                          alt={item.recipeName}
                          className="h-10 w-16 rounded-lg object-cover border border-border-custom"
                        />
                        <div className="max-w-[200px] truncate">
                          <p className="text-sm font-semibold text-foreground-custom truncate">{item.recipeName}</p>
                          <p className="text-[10px] text-foreground-custom/50 truncate">{item.cuisineType} Cuisine</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 text-sm text-foreground-custom/80">{item.category}</td>
                    <td className="p-4 sm:p-5 text-sm text-foreground-custom/70">
                      <div>
                        <p className="font-semibold text-foreground-custom">{item.authorName}</p>
                        <p className="text-[10px] text-foreground-custom/50">{item.authorEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5">
                      <button
                        onClick={() => toggleFeature(item)}
                        disabled={actionId === item._id}
                        className="focus:outline-none"
                        title={item.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                      >
                        {actionId === item._id ? (
                          <Loader2 size={18} className="animate-spin text-brand" />
                        ) : (
                          <Star
                            size={18}
                            className={item.isFeatured ? "text-yellow-400 fill-yellow-400" : "text-foreground-custom/30 hover:text-yellow-400 transition-colors"}
                          />
                        )}
                      </button>
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 border border-border-custom rounded-xl hover:bg-foreground-custom/5 text-foreground-custom/80 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 border border-border-custom rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card-custom rounded-3xl p-6 border border-border-custom shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <h3 className="text-lg font-bold text-foreground-custom">Edit Recipe (Admin)</h3>
              <button
                onClick={() => setEditingRecipe(null)}
                className="p-1 rounded-full hover:bg-foreground-custom/10 text-foreground-custom/60"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-custom">Recipe Name</label>
                  <input
                    name="recipeName"
                    type="text"
                    required
                    value={editFormData.recipeName}
                    onChange={handleEditChange}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-custom">Category</label>
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditChange}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Salad">Salad</option>
                    <option value="Soup">Soup</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Cuisine, Difficulty, Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-custom">Cuisine Type</label>
                  <input
                    name="cuisineType"
                    type="text"
                    required
                    value={editFormData.cuisineType}
                    onChange={handleEditChange}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-custom">Difficulty</label>
                  <select
                    name="difficultyLevel"
                    value={editFormData.difficultyLevel}
                    onChange={handleEditChange}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-custom">Prep Time (mins)</label>
                  <input
                    name="preparationTime"
                    type="number"
                    required
                    min="1"
                    value={editFormData.preparationTime}
                    onChange={handleEditChange}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-custom">Image URL</label>
                <input
                  name="recipeImage"
                  type="url"
                  required
                  value={editFormData.recipeImage}
                  onChange={handleEditChange}
                  className="w-full bg-card-custom border border-border-custom rounded-xl p-2.5 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                />
              </div>

              {/* Ingredients Nested Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground-custom">Ingredients</label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-brand text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                  {editIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        required
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        className="flex-grow bg-card-custom border border-border-custom rounded-xl p-2 text-xs text-foreground-custom focus:outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        disabled={editIngredients.length === 1}
                        className="p-2 border border-border-custom rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-custom">Instructions</label>
                <textarea
                  name="instructions"
                  required
                  rows="4"
                  value={editFormData.instructions}
                  onChange={handleEditChange}
                  className="w-full bg-card-custom border border-border-custom rounded-xl p-3 text-sm text-foreground-custom focus:outline-none focus:border-brand leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setEditingRecipe(null)}
                  className="flex-1 py-2.5 border border-border-custom rounded-xl text-sm font-semibold text-foreground-custom"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  {isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
