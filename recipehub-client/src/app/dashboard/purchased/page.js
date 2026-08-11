'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ShoppingBag, Clock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PurchasedRecipes() {
  const { fetchWithAuth, user } = useApp();
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchased = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/purchased`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPurchased(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch purchased recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPurchased();
    }
  }, [user]);

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Purchased Recipes</h1>
        <p className="text-foreground-custom/60 text-sm">Unlock the full recipes and guides you have purchased.</p>
      </div>

      {purchased.length === 0 ? (
        <div className="border border-dashed border-border-custom bg-card-custom p-16 rounded-3xl text-center space-y-4">
          <ShoppingBag className="mx-auto text-foreground-custom/30" size={48} />
          <h3 className="text-lg font-bold text-foreground-custom">No purchased recipes</h3>
          <p className="text-sm text-foreground-custom/60 max-w-sm mx-auto">
            You haven't purchased any premium recipes yet. Support creators and unlock exclusive guidelines!
          </p>
          <Link
            href="/recipes"
            className="inline-block bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full"
          >
            Explore Recipes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {purchased.map((item) => (
            <div
              key={item._id}
              className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="h-40 w-full overflow-hidden relative">
                <img
                  src={item.recipeImage}
                  alt={item.recipeName}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Unlocked
                </span>
              </div>

              <div className="p-5 flex flex-col flex-grow space-y-4">
                <div>
                  <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{item.cuisineType}</span>
                  <h3 className="text-base font-bold text-foreground-custom truncate mt-0.5">{item.recipeName}</h3>
                  <p className="text-xs text-foreground-custom/50 mt-1">Author: {item.authorName}</p>
                </div>

                <div className="flex items-center text-xs text-foreground-custom/60 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-brand/80" />
                    <span>{item.preparationTime}m Prep</span>
                  </div>
                  <span>•</span>
                  <span>Paid: ${item.amount}</span>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-border-custom mt-auto">
                  <Link
                    href={`/recipes/${item.recipeId}`}
                    className="text-xs font-bold text-brand hover:underline mr-auto flex items-center gap-1 group"
                  >
                    <span>View Unlocked Recipe</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
