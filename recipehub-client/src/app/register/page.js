'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Loader2, AlertCircle, ChefHat } from 'lucide-react';

export default function Register() {
  const { setUser, fetchFavorites } = useApp();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    image: '',
    password: '',
    role: 'user',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    const body = new FormData();
    body.append('image', file);

    try {
      const imgbb_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
      if (!imgbb_API_KEY) {
        setError('ImgBB API key is not configured.');
        setUploadingImage(false);
        return;
      }

      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbb_API_KEY}`, {
        method: 'POST',
        body
      });

      if (imgbbRes.ok) {
        const imgbbData = await imgbbRes.json();
        if (imgbbData.success) {
          setFormData(prev => ({ ...prev, image: imgbbData.data.url }));
        } else {
          setError(imgbbData.error?.message || 'Failed to upload image to ImgBB.');
        }
      } else {
        setError('Failed to upload image. Server responded with error.');
      }
    } catch (err) {
      console.error(err);
      setError('ImgBB upload request failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validatePassword = (pw) => {
    const minLength = pw.length >= 6;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    return minLength && hasUpper && hasLower;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, image, password, role } = formData;

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long and contain at least one uppercase letter and one lowercase letter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, image, password, role })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save token to localStorage*
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        // Fetch favorites
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
        
        router.push('/');
      } else {
        setError(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-background-custom transition-all duration-300">
      <div className="max-w-md w-full space-y-8 bg-card-custom p-8 rounded-3xl border border-border-custom shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <ChefHat size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground-custom tracking-tight">Create your account</h2>
          <p className="text-sm text-foreground-custom/60">
            Or{' '}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              sign in to your existing account
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
              <label className="text-xs font-bold text-foreground-custom">Full Name *</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom placeholder-foreground-custom/30 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Email Address *</label>
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
              <label className="text-xs font-bold text-foreground-custom">Profile Image (Optional)</label>
              <div className="flex items-center space-x-4">
                <div className="flex-grow">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-card-custom border border-border-custom rounded-2xl p-2.5 text-xs text-foreground-custom focus:outline-none focus:border-brand"
                    disabled={uploadingImage || loading}
                  />
                  {uploadingImage && <p className="text-[10px] text-brand animate-pulse mt-1">Uploading to ImgBB...</p>}
                </div>
                {formData.image && (
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-brand shrink-0">
                    <img src={formData.image} alt="Profile Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 mt-2">
                <span className="text-[10px] font-bold text-foreground-custom/60 block">Or paste Direct Image URL</span>
                <input
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom placeholder-foreground-custom/30 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Account Type (Role)</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom focus:outline-none focus:border-brand"
              >
                <option value="user">User (Standard Member)</option>
                {/* <option value="admin">Admin (Site Administrator)</option> ****/}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Password *</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom placeholder-foreground-custom/30 focus:outline-none focus:border-brand"
              />
              <p className="text-[10px] text-foreground-custom/50 leading-relaxed pl-1">
                Must be at least 6 characters, contain 1 uppercase and 1 lowercase letter.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
