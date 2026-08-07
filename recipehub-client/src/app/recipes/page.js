'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChefHat, Search, Filter, Clock, ThumbsUp, ChevronLeft, ChevronRight, X, Lock } from 'lucide-react';

const CATEGORIES = ["Dessert", "Main Course", "Breakfast", "Beverage", "Salad", "Soup"];

export default function BrowseRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); // Added to trigger fetch only on submit
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);

  const limit = 6;

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategories.join(',');
      
      // Fallback base URL to your server's Port (5001) if environment variables aren't loaded
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5001';
      const url = `${baseUrl}/api/recipes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(categoryParam)}`;
      
      // Get the authorization token directly from local storage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // Make the network request directly without relying on AppContext helper functions
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (res.ok) {
        const data = await res.json();

console.log(data.data.map(r => r.recipeName));
console.log(data.pagination);

if (data.success) {
  setRecipes(data.data);
  setTotalPages(data.pagination.totalPages);
  setTotalRecipes(data.pagination.totalRecipes);
}
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  };
  // 6. Restored search in the dependency list to load results when submitting or clearing
  useEffect(() => {
    fetchRecipes();
  }, [page, selectedCategories]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on search submission
    fetchRecipes();
  };

  const handleCategoryChange = (category) => {
    setPage(1); // Reset to page 1 on category change
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setPage(1);
    // Since state triggers are asynchronous, calling fetchRecipes here directly resets the search
    setTimeout(() => {
      fetchRecipes();
    }, 0);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-custom">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground-custom tracking-tight">Browse Recipes</h1>
          <p className="text-foreground-custom/60 text-sm">Discover culinary inspirations or search for specific recipes.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card-custom border border-border-custom rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground-custom placeholder-foreground-custom/40 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
          />
          <Search size={18} className="absolute left-4 top-3.5 text-foreground-custom/40" />
          <button
            type="submit"
            className="absolute right-2.5 top-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Grid: Filters & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between bg-card-custom border border-border-custom p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground-custom flex items-center space-x-2">
              <Filter size={18} className="text-brand" />
              <span>Filters</span>
            </h2>
            {(selectedCategories.length > 0 || search) && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="bg-card-custom border border-border-custom p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground-custom">Categories</h3>
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <label key={category} className="flex items-center space-x-3 text-sm text-foreground-custom/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4.5 w-4.5 rounded border-border-custom text-brand focus:ring-brand"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setIsFilterMobileOpen(true)}
            className="flex items-center space-x-2 bg-card-custom border border-border-custom px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground-custom/80"
          >
            <Filter size={16} />
            <span>Filter Categories</span>
          </button>
          <span className="text-xs text-foreground-custom/50 font-medium">{totalRecipes} recipes found</span>
        </div>

        {/* Recipe Cards Grid */}
        <div className="lg:col-span-3 space-y-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[1, 2, 4, 5].map((n) => (
                <div key={n} className="rounded-3xl border border-border-custom bg-card-custom p-4 space-y-4 animate-pulse">
                  <div className="h-52 bg-foreground-custom/10 rounded-2xl" />
                  <div className="h-4 bg-foreground-custom/15 w-2/3 rounded" />
                  <div className="h-4 bg-foreground-custom/10 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-20 bg-card-custom border border-border-custom rounded-3xl space-y-4">
              <ChefHat className="mx-auto text-foreground-custom/30" size={48} />
              <h3 className="text-lg font-bold text-foreground-custom">No recipes found</h3>
              <p className="text-sm text-foreground-custom/60 max-w-sm mx-auto">We couldn't find any recipes matching your filters. Try clearing them to search again.</p>
              <button
                onClick={clearFilters}
                className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {recipes.map((recipe) => (
                <div
                  key={recipe._id}
                  className="group rounded-3xl border border-border-custom bg-card-custom overflow-hidden hover:shadow-xl hover:border-brand/30 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={recipe.recipeImage}
                      alt={recipe.recipeName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 right-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {recipe.category}
                    </span>
                    {recipe.isPremium && (
                      <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Lock size={10} />
                        $4.99 Unlock
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs text-brand font-semibold uppercase tracking-wider">{recipe.cuisineType} Cuisine</span>
                      <h3 className="text-xl font-bold text-foreground-custom line-clamp-1 group-hover:text-brand transition-colors">
                        {recipe.recipeName}
                      </h3>
                    </div>

                    <div className="flex items-center text-sm text-foreground-custom/60 space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <Clock size={16} className="text-brand/85" />
                        <span>{recipe.preparationTime} mins</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <ThumbsUp size={16} className="text-brand/85" />
                        <span>{recipe.likesCount || 0} Likes</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-border-custom flex items-center justify-between">
                      <span className="text-xs text-foreground-custom/60 truncate max-w-[150px]">By {recipe.authorName}</span>
                      <Link
                        href={`/recipes/${recipe._id}`}
                        className="bg-brand/10 hover:bg-brand text-brand hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-border-custom rounded-xl bg-card-custom hover:bg-foreground-custom/5 disabled:opacity-50 disabled:pointer-events-none transition-colors text-foreground-custom"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-10 w-10 text-sm font-semibold rounded-xl transition-all ${
                      page === p
                        ? 'bg-brand text-white'
                        : 'border border-border-custom bg-card-custom hover:bg-foreground-custom/5 text-foreground-custom'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border border-border-custom rounded-xl bg-card-custom hover:bg-foreground-custom/5 disabled:opacity-50 disabled:pointer-events-none transition-colors text-foreground-custom"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {isFilterMobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="w-full max-h-[80vh] bg-card-custom rounded-t-3xl p-6 border-t border-border-custom overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground-custom">Filter Categories</h2>
              <button
                onClick={() => setIsFilterMobileOpen(false)}
                className="p-1 rounded-full hover:bg-foreground-custom/10 text-foreground-custom/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`p-3 rounded-2xl text-xs font-semibold text-center border transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-card-custom border-border-custom text-foreground-custom/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-border-custom">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 border border-border-custom rounded-xl text-sm font-semibold text-foreground-custom/80"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterMobileOpen(false)}
                className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}