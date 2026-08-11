'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { loadStripe } from '@stripe/stripe-js';
import { Clock, ThumbsUp, Heart, AlertTriangle, Lock, ChefHat, Check, Loader2, Calendar } from 'lucide-react';

export default function RecipeDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, fetchWithAuth, favorites, fetchFavorites } = useApp();
  
  const [recipe, setRecipe] = useState(null);
  const [purchasedRecipes, setPurchasedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const isFavorited = favorites.some(fav => fav.recipeId === id);

  const fetchDetails = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecipe(data.data);
        }
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error("Failed to fetch recipe details:", error);
    }
  };

  const fetchPurchased = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/purchased`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPurchasedRecipes(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch purchased recipes:", error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchDetails();
      if (user) {
        await fetchPurchased();
      }
      setLoading(false);
    };
    loadAll();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/${id}/like`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecipe(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
        }
      }
    } catch (error) {
      console.error("Like request failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      if (isFavorited) {
        // Remove favorite
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchFavorites();
        }
      } else {
        // Add favorite
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites`, {
          method: 'POST',
          body: JSON.stringify({ recipeId: id })
        });
        if (res.ok) {
          fetchFavorites();
        }
      }
    } catch (error) {
      console.error("Favorite request failed:", error);
    } finally {
      setIsFavoriting(false);
    }
  };
  // clickable purchased btn**

 
  // or router.push('/purchased-recipes');


//     const handlePurchased = () => {
//   console.log("Purchased button clicked");
// };
 

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Report request failed:", error);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsCheckingOut(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        body: JSON.stringify({ type: 'recipe', recipeId: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          // Redirect to Stripe Checkout Session
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error("Stripe redirection failed:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <Loader2 size={36} className="text-brand animate-spin" />
      </div>
    );
  }

  if (!recipe) return null;

  // Determine access privileges
  const isAuthor = user && recipe.authorEmail === user.email;
  const isAdmin = user && user.role === 'admin';
  const isPurchased = purchasedRecipes.some(purchase => purchase.recipeId === id);
  const hasAccess = !recipe.isLocked;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Recipe Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {recipe.category}
          </span>
          <span className="bg-foreground-custom/5 text-foreground-custom/70 text-xs font-medium px-3 py-1 rounded-full">
            {recipe.cuisineType} Cuisine
          </span>
          <span className="bg-foreground-custom/5 text-foreground-custom/70 text-xs font-medium px-3 py-1 rounded-full capitalize">
            {recipe.difficultyLevel} Level
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground-custom tracking-tight leading-tight">
          {recipe.recipeName}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-y border-border-custom py-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand uppercase">
              {recipe.authorName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground-custom">{recipe.authorName}</p>
              <p className="text-xs text-foreground-custom/60">Recipe Author</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-foreground-custom/70">
            <div className="flex items-center space-x-1.5">
              <Clock size={16} className="text-brand" />
              <span>{recipe.preparationTime} mins Prep Time</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ThumbsUp size={16} className="text-brand" />
              <span>{recipe.likesCount || 0} Likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Image & Interactions **/}
      <div className="space-y-4">
        <div className="relative h-[300px] sm:h-[450px] w-full rounded-3xl overflow-hidden border border-border-custom">
          <img
            src={recipe.recipeImage}
            alt={recipe.recipeName}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center space-x-2 border border-border-custom bg-card-custom hover:bg-foreground-custom/5 px-5 py-3 rounded-2xl text-sm font-semibold text-foreground-custom transition-all"
          >
            <ThumbsUp size={18} className={recipe.likesCount > 0 ? "fill-brand text-brand" : "text-foreground-custom/75"} />
            <span>Like ({recipe.likesCount || 0})</span>
          </button>

          <button
            onClick={handleFavorite}
            disabled={isFavoriting}
            className="flex items-center space-x-2 border border-border-custom bg-card-custom hover:bg-foreground-custom/5 px-5 py-3 rounded-2xl text-sm font-semibold text-foreground-custom transition-all"
          >
            <Heart size={18} className={isFavorited ? "fill-red-500 text-red-500" : "text-foreground-custom/75"} />
            <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
          </button>



          {isPurchased ? (
            <button
              disabled
              className="flex items-center space-x-2 border border-green-300 bg-green-500/10 dark:bg-green-500/20 text-green-600 px-5 py-3 rounded-2xl text-sm font-semibold transition-all"
            >
              <Check size={18} className="text-green-600" />
              <span>Purchased</span>
            </button>
          ) : isAuthor || isAdmin ? (
            <button
              disabled
              className="flex items-center space-x-2 border border-border-custom bg-foreground-custom/5 text-foreground-custom/60 px-5 py-3 rounded-2xl text-sm font-semibold transition-all"
            >
              <Check size={18} />
              <span>{isAuthor ? "Author Access" : "Admin Access"}</span>
            </button>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isCheckingOut}
              className="flex items-center space-x-2 border border-brand bg-brand text-white hover:bg-brand-hover px-5 py-3 rounded-2xl text-sm font-semibold transition-all shadow-md shadow-brand/10"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Buy Recipe ($4.99)</span>
                </>
              )}
            </button>
          )}



          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 border border-border-custom bg-card-custom hover:bg-foreground-custom/5 px-5 py-3 rounded-2xl text-sm font-semibold text-red-500 transition-all ml-auto"
          >
            <AlertTriangle size={18} />
            <span className="hidden sm:inline">Report Recipe</span>
          </button>
        </div>
      </div>

      {/* Recipe Content (Locked / Unlocked) */}
      <div className="pt-6">
        {hasAccess ? (
          /* Unlocked / Authorized View **/
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-foreground-custom flex items-center gap-2">
                <ChefHat size={20} className="text-brand" />
                <span>Ingredients</span>
              </h2>
              <ul className="space-y-3 bg-card-custom border border-border-custom p-6 rounded-3xl">
                {recipe.ingredients && recipe.ingredients.map((ingredient, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-sm text-foreground-custom/80">
                    <Check size={16} className="text-brand shrink-0 mt-0.5" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-foreground-custom">Cooking Instructions</h2>
              <div className="bg-card-custom border border-border-custom p-6 sm:p-8 rounded-3xl">
                <p className="text-sm sm:text-base text-foreground-custom/80 leading-relaxed whitespace-pre-wrap">
                  {recipe.instructions}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Locked Stripe Payment Screen */
          <div className="border border-border-custom bg-card-custom rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto shadow-xl">
            <div className="mx-auto h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground-custom">Unlock this recipe</h3>
              <p className="text-sm text-foreground-custom/60 leading-relaxed">
                This premium recipe requires purchase to unlock full ingredients and detailed cooking instructions. Support the creator by buying it.
              </p>
            </div>
            <div className="bg-foreground-custom/5 py-4 px-6 rounded-2xl inline-block">
              <span className="text-sm text-foreground-custom/60 font-semibold block">One-time payment</span>
              <span className="text-3xl font-black text-foreground-custom">$4.99</span>
            </div>
            <div>
              <button
                onClick={handlePurchase}
                disabled={isCheckingOut}
                className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Redirecting to Stripe...</span>
                  </>
                ) : (
                  <span>Unlock Recipe via Stripe</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card-custom rounded-3xl p-6 border border-border-custom shadow-2xl space-y-4 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground-custom flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <span>Report Recipe</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full hover:bg-foreground-custom/10 text-foreground-custom/60"
              >
                close
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-green-500 font-semibold flex flex-col items-center gap-2">
                <Check size={36} className="bg-green-100 p-1.5 rounded-full" />
                <span>Recipe reported successfully</span>
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <p className="text-xs text-foreground-custom/60">
                  Please select a valid reason why this recipe should be flagged. Admin will moderate it within 24 hours.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground-custom">Select Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-card-custom border border-border-custom rounded-xl p-3 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                  >
                    <option value="Spam">Spam / Advertising</option>
                    <option value="Offensive Content">Offensive Content</option>
                    <option value="Copyright Issue">Copyright Issue</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-border-custom">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 border border-border-custom rounded-xl text-sm font-semibold text-foreground-custom"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
                  >
                    {isSubmittingReport ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span>Submit Report</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
