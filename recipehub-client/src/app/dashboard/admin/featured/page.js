'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Star, Loader2, Search, ThumbsUp, Trash2 } from 'lucide-react';

export default function FeaturedRecipesManagement() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState(null);

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

  const toggleFeature = async (recipeId, currentFeatured) => {
    const isFeatured = !currentFeatured;
    setActionId(recipeId);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/recipes/${recipeId}/feature`, {
        method: 'PUT',
        body: JSON.stringify({ isFeatured })
      });
      if (res.ok) {
        setRecipes(prev => prev.map(r => r._id === recipeId ? { ...r, isFeatured } : r));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={36} className="text-brand animate-spin" />
      </div>
    );
  }

  // Filter lists****
  const featuredRecipes = recipes.filter(r => r.isFeatured);
  const searchedRecipes = searchQuery.trim() === ''
    ? recipes.filter(r => !r.isFeatured).slice(0, 5) // Show some standard recipes if no search
    : recipes.filter(r => 
        !r.isFeatured && 
        (r.recipeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
         r.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Statistics**
  const totalFeatured = featuredRecipes.length;
  const totalLikesOnFeatured = featuredRecipes.reduce((sum, r) => sum + (r.likesCount || 0), 0);
  const averageLikes = totalFeatured > 0 ? (totalLikesOnFeatured / totalFeatured).toFixed(1) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border-custom pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Featured Section</h1>
          <p className="text-foreground-custom/60 text-sm">Manage handpicked editorial recipes displayed on the home page banner.</p>
        </div>
      </div>

      {/* Stats Cards **/}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card-custom border border-border-custom p-6 rounded-2xl">
          <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">Total Featured</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-foreground-custom">{totalFeatured}</span>
            <span className="text-xs text-foreground-custom/40">recipes</span>
          </div>
        </div>
        <div className="bg-card-custom border border-border-custom p-6 rounded-2xl">
          <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">Total Likes on Featured</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-foreground-custom">{totalLikesOnFeatured}</span>
            <span className="text-xs text-foreground-custom/40">likes</span>
          </div>
        </div>
        <div className="bg-card-custom border border-border-custom p-6 rounded-2xl">
          <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">Avg Likes per Recipe</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-foreground-custom">{averageLikes}</span>
            <span className="text-xs text-foreground-custom/40 flex items-center">avg</span>
          </div>
        </div>
      </div>

      {/* Current Featured Recipes **/}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground-custom flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400" size={20} />
          <span>Currently Featured Recipes ({featuredRecipes.length})</span>
        </h2>

        {featuredRecipes.length === 0 ? (
          <div className="border border-dashed border-border-custom bg-card-custom p-12 rounded-3xl text-center text-foreground-custom/50 text-sm">
            No recipes are currently featured. Use the search tool below to add recipes to the featured section.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredRecipes.map(recipe => (
              <div 
                key={recipe._id} 
                className="bg-card-custom border border-border-custom rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <img 
                  src={recipe.recipeImage} 
                  alt={recipe.recipeName}
                  className="h-16 w-24 object-cover rounded-xl border border-border-custom"
                />
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-bold text-foreground-custom truncate">{recipe.recipeName}</h3>
                  <p className="text-xs text-foreground-custom/50 mt-0.5">By {recipe.authorName}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-foreground-custom/60 font-semibold">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} className="text-brand" /> {recipe.likesCount || 0}
                    </span>
                    <span>•</span>
                    <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase">{recipe.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(recipe._id, true)}
                  disabled={actionId === recipe._id}
                  className="p-2 border border-border-custom rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Remove from Featured"
                >
                  {actionId === recipe._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Featured Recipes Section */}
      <div className="bg-card-custom border border-border-custom p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground-custom">Feature a New Recipe</h2>
          <p className="text-xs text-foreground-custom/60">Search all active platform recipes to promote them to the featured section.</p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search recipes by name or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card-custom border border-border-custom rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground-custom placeholder-foreground-custom/40 focus:outline-none focus:border-brand"
          />
          <Search size={18} className="absolute left-4 top-3.5 text-foreground-custom/40" />
        </div>

        {/* Search Results List */}
        <div className="divide-y divide-border-custom max-h-[400px] overflow-y-auto pr-2">
          {searchedRecipes.length === 0 ? (
            <div className="py-6 text-center text-foreground-custom/50 text-sm">
              {searchQuery ? "No matching unfeatured recipes found." : "Type above to search recipes."}
            </div>
          ) : (
            searchedRecipes.map(recipe => (
              <div key={recipe._id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={recipe.recipeImage}
                    alt={recipe.recipeName}
                    className="h-12 w-20 object-cover rounded-lg border border-border-custom"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground-custom truncate">{recipe.recipeName}</h4>
                    <p className="text-xs text-foreground-custom/50">By {recipe.authorName} | {recipe.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(recipe._id, false)}
                  disabled={actionId === recipe._id}
                  className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                >
                  {actionId === recipe._id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Star size={12} className="fill-white" />
                      <span>Feature</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
