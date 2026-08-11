'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Sparkles, Award, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function UserProfile() {
  const { user, setUser, fetchWithAuth } = useApp();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    image: user?.image || '',
  });

  const [loading, setLoading] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    setSuccess('');

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
    setSuccess('');
    setError('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    setPremiumLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        body: JSON.stringify({ type: 'premium' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {

          // Redirect to Stripe Checkout**

          window.location.href = data.url;
        } else {
          setError('Failed to create payment session.');
          setPremiumLoading(false);
        }
      } else {
        setError('Server responded with checkout session error.');
        setPremiumLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Checkout error. Please check your network connection.');
      setPremiumLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Title **/}
      <div className="border-b border-border-custom pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">My Profile</h1>
        <p className="text-foreground-custom/60 text-sm">Update your personal credentials and upgrade your account tier.</p>
      </div>

      {(success || error) && (
        <div className={`p-4 rounded-2xl flex items-start space-x-2.5 text-sm ${
          success 
            ? 'bg-green-500/10 border border-green-500/20 text-green-500' 
            : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          <span>{success || error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Update Profile Form */}
        <div className="md:col-span-3 space-y-6 bg-card-custom border border-border-custom p-6 sm:p-8 rounded-3xl shadow-sm h-fit">
          <h2 className="text-lg font-bold text-foreground-custom flex items-center space-x-2">
            <User size={18} className="text-brand" />
            <span>Profile Details</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Full Name</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Profile Image</label>
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
                  required
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full bg-card-custom border border-border-custom rounded-2xl p-3 text-sm text-foreground-custom focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-custom">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email}
                className="w-full bg-foreground-custom/5 border border-border-custom/50 rounded-2xl p-3 text-sm text-foreground-custom/60 cursor-not-allowed select-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Upgrade Card */}
        <div className="md:col-span-2 space-y-6">
          {user?.isPremium ? (
            /* Premium Banner */
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-400/20 text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Award size={36} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Premium Member</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Thank you for supporting RecipeHub! You have unlocked unlimited recipe uploads and have the Verified badge displayed on your dashboard.
              </p>
            </div>
          ) : (
            /* Marketing Upgrade card */
            <div className="bg-card-custom border border-border-custom p-6 sm:p-8 rounded-3xl shadow-sm text-center space-y-6">
              <div className="mx-auto h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground-custom">Go Premium!</h3>
                <p className="text-xs text-foreground-custom/60 leading-relaxed">
                  Submit unlimited recipe creations. Currently, standard users are capped at 2 recipe uploads.
                </p>
              </div>

              <div className="space-y-3 text-left bg-foreground-custom/[0.02] border border-border-custom/80 p-4 rounded-2xl text-xs text-foreground-custom/75">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-brand" />
                  <span>Unlimited recipe uploads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-brand" />
                  <span>Verified Premium badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-brand" />
                  <span>Permanent pro tier</span>
                </div>
              </div>

              <div className="text-2xl font-black text-foreground-custom">
                $9.99
                <span className="text-xs font-normal text-foreground-custom/60"> / one-time</span>
              </div>

              <button
                onClick={handleUpgradeToPremium}
                disabled={premiumLoading}
                className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
              >
                {premiumLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Redirection...</span>
                  </>
                ) : (
                  <span>Upgrade Tier</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
