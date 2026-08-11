'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ChefHat, Edit, Trash2, Clock, Check, Plus, Loader2, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MyRecipes() {
  const { user, fetchWithAuth } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing State
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editFormData, setEditFormData] = useState({
    recipeName: '',
    recipeImage: '',
    category: 'Main Course',
    cuisineType: '',
    difficultyLevel: 'Easy',
    preparationTime: '',
    instructions: '',
    isPremium: false,
  });
  const [editIngredients, setEditIngredients] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMyRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Filter recipes created by the current user
          const own = data.data.filter(r => r.authorEmail === user?.email);
          setRecipes(own);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch recipes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyRecipes();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecipes(recipes.filter(r => r._id !== id));
      } else {
        alert("Failed to delete recipe.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting recipe.");
    }
  };

  // Open Edit Modal
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
      isPremium: recipe.isPremium || false,
    });
    setEditIngredients(recipe.ingredients || []);
  };

  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditFormData({ ...editFormData, [e.target.name]: value });
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
        fetchMyRecipes();
      } else {
        alert("Failed to update recipe.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating recipe.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">My Recipes</h1>
          <p className="text-foreground-custom/60 text-sm">View, update, and manage your published creations.</p>
        </div>
        <Link
          href="/dashboard/add-recipe"
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all self-start"
        >
          Add New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="border border-dashed border-border-custom bg-card-custom p-16 rounded-3xl text-center space-y-4">
          <ChefHat className="mx-auto text-foreground-custom/30" size={48} />
          <h3 className="text-lg font-bold text-foreground-custom">No recipes posted</h3>
          <p className="text-sm text-foreground-custom/60 max-w-sm mx-auto">
            You haven't shared any recipes yet. Click below to add your first culinary masterpiece!
          </p>
          <Link
            href="/dashboard/add-recipe"
            className="inline-block bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full"
          >
            Add First Recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe._id}
              className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="h-44 w-full overflow-hidden relative">
                <img
                  src={recipe.recipeImage}
                  alt={recipe.recipeName}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {recipe.category}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-grow space-y-4">
                <div>
                  <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{recipe.cuisineType}</span>
                  <h3 className="text-lg font-bold text-foreground-custom truncate mt-0.5">{recipe.recipeName}</h3>
                </div>

                <div className="flex items-center text-xs text-foreground-custom/60 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-brand/80" />
                    <span>{recipe.preparationTime}m Prep</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{recipe.likesCount || 0} Likes</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-border-custom mt-auto">
                  <Link
                    href={`/recipes/${recipe._id}`}
                    className="text-xs font-semibold text-brand hover:underline mr-auto"
                  >
                    View Details
                  </Link>

                  <button
                    onClick={() => startEdit(recipe)}
                    className="p-2 border border-border-custom rounded-xl hover:bg-foreground-custom/5 text-foreground-custom/80 transition-colors"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(recipe._id)}
                    className="p-2 border border-border-custom rounded-xl hover:bg-red-50 dark:hover:bg-red-950/25 text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card-custom rounded-3xl p-6 border border-border-custom shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <h3 className="text-lg font-bold text-foreground-custom">Update Recipe</h3>
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

              {/* Recipe Access Toggle (Free/Premium) */}
              <div className="bg-foreground-custom/[0.02] border border-border-custom rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-foreground-custom">Premium Recipe</label>
                  <p className="text-xs text-foreground-custom/60">Premium recipes require a one-time Stripe payment of $4.99 to unlock for other users.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isPremium"
                    checked={editFormData.isPremium}
                    onChange={handleEditChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-foreground-custom/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
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
