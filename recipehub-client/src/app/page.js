'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChefHat, Flame, Clock, ThumbsUp, ArrowRight, Star, Heart, Award, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featRes, popRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/featured`),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recipes/popular`)
        ]);

        if (featRes.ok) {
          const featData = await featRes.json();
          if (featData.success) setFeatured(featData.data);
        }

        if (popRes.ok) {
          const popData = await popRes.json();
          if (popData.success) setPopular(popData.data);
        }
      } catch (error) {
        console.error("Failed to load home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-20 overflow-x-hidden">
      {/* 1. HERO BANNER SECTION **/}
      <section className="relative min-h-[90vh] flex items-center gradient-bg overflow-hidden">

  {/* Decorative Blur Spheres */}
  <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-brand/10 rounded-full blur-[130px]" />
  <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-brand/5 rounded-full blur-[150px]" />

  <div className="container mx-auto px-6 lg:px-10 py-20">

    <div className="grid lg:grid-cols-2 gap-16 items-center">

      {/* Left Side */}
      <div className="space-y-8 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          <ChefHat size={15} />
          <span>Elevate Your Culinary Journey</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-foreground-custom"
        >
          Share Your Recipes.
          <br />
          Inspire the World.
          <br />
          <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">
            Savor the Extraordinary.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2 }}
          className="text-lg lg:text-xl text-foreground-custom/70 leading-8 max-w-xl"
        >
          Discover the art of cooking, share your culinary masterpieces,
          and indulge in flavors that bring people together across the globe.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: .9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: .3 }}
          className="flex flex-wrap gap-4 pt-4"
        >

          <Link
            href="/recipes"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-brand/20 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
          >
            Explore Recipes
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/dashboard"
            className="bg-card-custom border border-border-custom text-foreground-custom px-8 py-4 rounded-2xl font-semibold hover:bg-foreground-custom/5 transition-all duration-300 hover:-translate-y-1"
          >
            Share Recipe
          </Link>

        </motion.div>

        {/* Stats */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .5 }}
          className="flex gap-10 pt-10"
        >

          <div>
            <h2 className="text-3xl font-bold text-brand">500+</h2>
            <p className="text-foreground-custom/60 text-sm">
              Recipes
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-brand">100+</h2>
            <p className="text-foreground-custom/60 text-sm">
              Chefs
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-brand">15K+</h2>
            <p className="text-foreground-custom/60 text-sm">
              Food Lovers
            </p>
          </div>

        </motion.div>

      </div>

      {/* Right Side */}

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: .8 }}
        className="relative flex justify-center"
      >

        <div className="absolute w-[380px] h-[380px] bg-brand/10 rounded-full blur-[120px]" />

        <div className="relative bg-card-custom border border-border-custom rounded-[30px] p-4 shadow-2xl">

          <img
            src="https://plus.unsplash.com/premium_photo-1671377387797-8d3307a546a6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
            alt="RecipeHub Hero"
            className="w-full max-w-xl h-[540px] object-cover rounded-3xl"
          />

          {/* Floating Card */}

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity
            }}
            className="absolute -bottom-6 -left-6 bg-card-custom border border-border-custom rounded-2xl p-4 shadow-xl"
          >

            <div className="flex items-center gap-3">

              <div className="bg-brand/10 p-3 rounded-xl">
                <ChefHat className="text-brand" size={20} />
              </div>

              <div>
                <p className="text-xs text-foreground-custom/60">
                  Featured Recipe
                </p>

                <h4 className="font-semibold text-foreground-custom">
                  Chicken Biryani
                </h4>
              </div>

            </div>

          </motion.div>

          {/* Community Card */}

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity
            }}
            className="absolute top-5 -right-5 bg-card-custom border border-border-custom rounded-2xl px-5 py-4 shadow-xl"
          >

            <h3 className="text-2xl font-bold text-brand">
              15K+
            </h3>

            <p className="text-xs text-foreground-custom/60">
              Food Lovers
            </p>

          </motion.div>

        </div>

      </motion.div>

    </div>

  </div>

</section>


      {/* 2. DYNAMIC SECTION 1: FEATURED RECIPES (Framer Motion Animation) **/}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground-custom flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={26} />
              <span>Featured Recipes</span>
            </h2>
            <p className="text-foreground-custom/60">Handpicked culinary masterpieces curated by our editors</p>
          </div>
          <Link href="/recipes" className="text-brand font-medium hover:underline flex items-center gap-1">
            <span>View all recipes</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-border-custom bg-card-custom p-4 space-y-4 animate-pulse">
                <div className="h-56 bg-foreground-custom/10 rounded-2xl" />
                <div className="h-4 bg-foreground-custom/15 w-2/3 rounded" />
                <div className="h-4 bg-foreground-custom/10 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-custom rounded-3xl bg-card-custom">
            <ChefHat className="mx-auto text-foreground-custom/30 mb-3" size={40} />
            <p className="text-foreground-custom/50">No featured recipes available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((recipe, index) => (
              <motion.div
                key={recipe._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-3xl border border-border-custom bg-card-custom overflow-hidden hover:shadow-xl hover:border-brand/35 transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={recipe.recipeImage}
                    alt={recipe.recipeName}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <span className="absolute top-4 right-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {recipe.category}
                  </span>
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
                      <Clock size={16} className="text-brand/80" />
                      <span>{recipe.preparationTime} mins</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <ThumbsUp size={16} className="text-brand/80" />
                      <span>{recipe.likesCount || 0} Likes</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-auto border-t border-border-custom flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand uppercase">
                        {recipe.authorName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-medium text-foreground-custom/80 truncate max-w-[120px]">{recipe.authorName}</span>
                    </div>
                    <Link
                      href={`/recipes/${recipe._id}`}
                      className="text-xs font-bold text-brand group-hover:translate-x-1 transition-transform flex items-center space-x-1"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 3. DYNAMIC SECTION 2: POPULAR RECIPES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground-custom flex items-center gap-2">
            <Flame className="text-red-500 fill-red-500" size={26} />
            <span>Popular Recipes</span>
          </h2>
          <p className="text-foreground-custom/60">The recipes receiving the most love from our community members</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-border-custom bg-card-custom p-4 space-y-4 animate-pulse">
                <div className="h-44 bg-foreground-custom/10 rounded-xl" />
                <div className="h-4 bg-foreground-custom/15 w-2/3 rounded" />
                <div className="h-4 bg-foreground-custom/10 w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : popular.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-custom rounded-3xl bg-card-custom">
            <Flame className="mx-auto text-foreground-custom/30 mb-3" size={40} />
            <p className="text-foreground-custom/50">No popular recipes found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popular.map((recipe) => (
              <div
                key={recipe._id}
                className="group rounded-2xl border border-border-custom bg-card-custom overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={recipe.recipeImage}
                    alt={recipe.recipeName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center space-x-1">
                    <Heart size={12} className="text-red-400 fill-red-400" />
                    <span>{recipe.likesCount || 0}</span>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-grow space-y-3">
                  <h3 className="text-base font-bold text-foreground-custom line-clamp-1 group-hover:text-brand transition-colors">
                    {recipe.recipeName}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-foreground-custom/60 pt-2 border-t border-border-custom/50 mt-auto">
                    <span className="truncate max-w-[100px]">By {recipe.authorName}</span>
                    <Link
                      href={`/recipes/${recipe._id}`}
                      className="text-brand font-bold hover:underline"
                    >
                      Cook Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. EXTRA STATIC SECTION 1: WHY RECIPEHUB */}
      <section className="bg-card-custom border-y border-border-custom py-16 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-foreground-custom">Why RecipeHub?</h2>
            <p className="text-foreground-custom/60">We connect food enthusiasts through a premium sharing experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-border-custom hover:border-brand/20 transition-colors space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground-custom">Quality Over Quantity</h3>
              <p className="text-foreground-custom/60 text-sm leading-relaxed">
                Browse tested and liked recipes. Read honest feedback, culinary instructions, and ingredient requirements.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-border-custom hover:border-brand/20 transition-colors space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground-custom">Safe & Block Protected</h3>
              <p className="text-foreground-custom/60 text-sm leading-relaxed">
                Active platform moderation. Spams, offensive recipe reviews, or copyright breaches are immediately reviewed and filtered.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-border-custom hover:border-brand/20 transition-colors space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground-custom">Stripe Recipe Buying</h3>
              <p className="text-foreground-custom/60 text-sm leading-relaxed">
                Purchase premium recipes directly using secure Stripe integrations. Support authors and unlock premium recipes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXTRA STATIC SECTION 2: PREMIUM MEMBERSHIP PERKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl gradient-bg border border-border-custom p-8 sm:p-16 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-6 max-w-xl text-center lg:text-left">
            <span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Membership
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground-custom leading-tight">
              Unlock Unlimited Recipes with RecipeHub Premium
            </h2>
            <p className="text-foreground-custom/75 text-sm sm:text-base leading-relaxed">
              Standard accounts are limited to posting a maximum of 2 recipes. Become a Premium Member to post unlimited creations, display a verified pro badge on your profile, and join exclusive cooking campaigns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <div className="flex items-center space-x-2 text-sm text-foreground-custom/80 font-medium">
                <ShieldCheck size={18} className="text-brand" />
                <span>Unlimited uploads</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-foreground-custom/80 font-medium">
                <ShieldCheck size={18} className="text-brand" />
                <span>Verified Pro Badge</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-foreground-custom/80 font-medium">
                <ShieldCheck size={18} className="text-brand" />
                <span>One-time upgrade</span>
              </div>
            </div>
          </div>

          <div className="bg-card-custom border border-border-custom rounded-3xl p-8 shadow-xl max-w-sm w-full space-y-6 text-center">
            <h3 className="text-xl font-bold text-foreground-custom">Premium Access</h3>
            <div className="text-4xl font-black text-foreground-custom">
              $9.99
              <span className="text-xs font-normal text-foreground-custom/60"> / one-time</span>
            </div>
            <p className="text-xs text-foreground-custom/60">
              Upgrade instantly using Stripe checkout and enjoy all benefits forever.
            </p>
            <Link
              href="/dashboard/profile"
              className="block w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand/10 text-center"
            >
              Get Premium Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
