'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Heart, Trash2, Clock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Favorites() {
  const { fetchWithAuth, favorites, fetchFavorites } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavs = async () => {
      setLoading(true);
      await fetchFavorites();
      setLoading(false);
    };
    loadFavs();
  }, []);

  const handleRemove = async (recipeId) => {
    if (!window.confirm("Remove this recipe from your favorites?")) return;

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites/${recipeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchFavorites();
      } else {
        alert("Failed to remove from favorites.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing favorite.");
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Favorites</h1>
        <p className="text-foreground-custom/60 text-sm">A collection of recipes you've bookmarked to cook later.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="border border-dashed border-border-custom bg-card-custom p-16 rounded-3xl text-center space-y-4">
          <Heart className="mx-auto text-foreground-custom/30" size={48} />
          <h3 className="text-lg font-bold text-foreground-custom">No favorite recipes</h3>
          <p className="text-sm text-foreground-custom/60 max-w-sm mx-auto">
            You haven't bookmarked any recipes yet. Browse recipes to find your favorite dishes!
          </p>
          <Link
            href="/recipes"
            className="inline-block bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full"
          >
            Browse Recipes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav._id}
              className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="h-40 w-full overflow-hidden relative">
                <img
                  src={fav.recipeImage}
                  alt={fav.recipeName}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {fav.category}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-grow space-y-4">
                <div>
                  <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{fav.cuisineType}</span>
                  <h3 className="text-base font-bold text-foreground-custom truncate mt-0.5">{fav.recipeName}</h3>
                  <p className="text-xs text-foreground-custom/50 mt-1">Author: {fav.authorName}</p>
                </div>

                <div className="flex items-center text-xs text-foreground-custom/60 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-brand/80" />
                    <span>{fav.preparationTime}m Prep</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-border-custom mt-auto">
                  <Link
                    href={`/recipes/${fav.recipeId}`}
                    className="text-xs font-bold text-brand hover:underline mr-auto flex items-center gap-1 group"
                  >
                    <span>View Details</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <button
                    onClick={() => handleRemove(fav.recipeId)}
                    className="p-2 border border-border-custom rounded-xl hover:bg-red-50 dark:hover:bg-red-950/25 text-red-500 transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
