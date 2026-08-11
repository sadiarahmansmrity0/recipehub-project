'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { authClient } from '@/lib/auth-client';
import { Loader2, AlertCircle, ChefHat } from 'lucide-react';

function LoginComponent() {
  const { setUser, fetchFavorites, user } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirect);
    }
  }, [user, redirect, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        // Fetch favorites list
        const favsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        if (favsRes.ok) {
          const favsData = await favsRes.json();
          if (favsData.success) {
            fetchFavorites();
          }
        }
        
        router.push(redirect);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`
      });
    } catch (err) {
      console.error("Google sign in failed:", err);
      setError("Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-background-custom transition-all duration-300">
      <div className="max-w-md w-full space-y-8 bg-card-custom p-8 rounded-3xl border border-border-custom shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <ChefHat size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground-custom tracking-tight">Log in to RecipeHub</h2>
          <p className="text-sm text-foreground-custom/60">
            Or{' '}
            <Link href="/register" className="font-semibold text-brand hover:underline">
              register a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Email Address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom placeholder-foreground-custom/30 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom placeholder-foreground-custom/30 focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-custom" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card-custom px-3 text-foreground-custom/50 font-semibold">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full border border-border-custom bg-card-custom hover:bg-foreground-custom/5 text-foreground-custom font-semibold py-3 px-4 rounded-2xl transition-all flex items-center justify-center space-x-2.5 focus:outline-none"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-foreground-custom/60" />
            ) : (
              <>
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-brand" size={36} /></div>}>
      <LoginComponent />
    </Suspense>
  );
}
