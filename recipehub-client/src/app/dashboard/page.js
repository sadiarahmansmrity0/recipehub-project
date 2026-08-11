'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ChefHat, Heart, ThumbsUp, Award, Clock, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user, fetchWithAuth } = useApp();
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalFavorites: 0,
    totalLikesReceived: 0
  });
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch stats
        const statsRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data);
          }
        }

        // Fetch user's own recipes
        const recipesRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes`);
        if (recipesRes.ok) {
          const recipesData = await recipesRes.json();
          if (recipesData.success) {
            // Filter to show only recipes created by this user
            const own = recipesData.data.filter(r => r.authorEmail === user?.email);
            setRecentRecipes(own.slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-foreground-custom/10 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-foreground-custom/10 rounded-2xl" />
          ))}
        </div>
        <div className="h-60 bg-foreground-custom/10 rounded-3xl" />
      </div>
    );
  }

  const statCards = [
    { name: 'My Recipes', value: stats.totalRecipes, icon: ChefHat, color: 'text-brand bg-brand/10' },
    { name: 'Favorites Bookmarked', value: stats.totalFavorites, icon: Heart, color: 'text-red-500 bg-red-500/10' },
    { name: 'Total Likes Received', value: stats.totalLikesReceived, icon: ThumbsUp, color: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name}!</span>
          </h1>
          <p className="text-foreground-custom/60 text-sm">Here is a quick overview of your cooking activity.</p>
        </div>

        {/* Premium Badge Display */}
        {user?.isPremium ? (
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md">
            <Award size={16} />
            <span>Premium Member</span>
          </div>
        ) : (
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center space-x-2 bg-foreground-custom/5 border border-border-custom hover:border-brand/40 text-foreground-custom/80 hover:text-brand px-4 py-2 rounded-2xl text-xs font-bold transition-all"
          >
            <span>Upgrade to Premium</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-card-custom border border-border-custom p-6 rounded-2xl flex items-center space-x-4 hover:shadow-md transition-shadow"
            >
              <div className={`p-4 rounded-xl ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground-custom/60">{card.name}</p>
                <p className="text-2xl font-black text-foreground-custom mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Creations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground-custom">My Recent Recipes</h2>
            <Link href="/dashboard/my-recipes" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentRecipes.length === 0 ? (
            <div className="border border-dashed border-border-custom bg-card-custom p-10 rounded-3xl text-center space-y-4">
              <ChefHat className="mx-auto text-foreground-custom/30" size={36} />
              <p className="text-sm text-foreground-custom/60">You haven't posted any recipes yet.</p>
              <Link
                href="/dashboard/add-recipe"
                className="inline-block bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Create First Recipe
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecipes.map((recipe) => (
                <div
                  key={recipe._id}
                  className="bg-card-custom border border-border-custom p-4 rounded-2xl flex items-center space-x-4 hover:shadow-sm transition-all"
                >
                  <img
                    src={recipe.recipeImage}
                    alt={recipe.recipeName}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-foreground-custom truncate">{recipe.recipeName}</h3>
                    <div className="flex items-center space-x-3 text-xs text-foreground-custom/60 mt-1">
                      <span>{recipe.category}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{recipe.preparationTime}m</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/recipes/${recipe._id}`}
                    className="text-xs font-bold text-brand hover:underline shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips Box */}
        <div className="bg-card-custom border border-border-custom p-6 rounded-3xl space-y-4 h-fit">
          <h3 className="text-base font-bold text-foreground-custom flex items-center space-x-2">
            <BookOpen size={18} className="text-brand" />
            <span>Cooking Tip of the Day</span>
          </h3>
          <p className="text-xs text-foreground-custom/70 leading-relaxed">
            "For extra crispy potato wedges, soak the raw cut potatoes in cold water for 30 minutes to remove excess starch. Pat them completely dry before tossing with olive oil, cornstarch, and spices, then bake at 425°F!"
          </p>
          <div className="pt-2 border-t border-border-custom/50 flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground-custom/60">Level: Easy</span>
            <span className="text-brand">More Tips</span>
          </div>
        </div>
      </div>
    </div>
  );
}
