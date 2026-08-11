'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, User, PlusCircle, BookOpen, Heart, ShoppingBag,
  Users, AlertOctagon, FileText, Menu, X, Loader2, Award, Star
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protection & Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex-grow flex flex-col items-center justify-center space-y-4">
        <Loader2 size={36} className="text-brand animate-spin" />
        <span className="text-sm font-semibold text-foreground-custom/60">Authenticating session...</span>
      </div>
    );
  }

  if (!user) return null;

  const userLinks = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
    { name: 'Add Recipe', href: '/dashboard/add-recipe', icon: PlusCircle },
    { name: 'My Recipes', href: '/dashboard/my-recipes', icon: BookOpen },
    { name: 'Favorites', href: '/dashboard/favorites', icon: Heart },
    { name: 'Purchased Recipes', href: '/dashboard/purchased', icon: ShoppingBag },
  ];

  const adminLinks = [
    { name: 'Admin Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
    { name: 'Manage Recipes', href: '/dashboard/admin/recipes', icon: BookOpen },
    { name: 'Featured Recipes', href: '/dashboard/admin/featured', icon: Star },
    { name: 'Recipe Reports', href: '/dashboard/admin/reports', icon: AlertOctagon },
    { name: 'Transactions', href: '/dashboard/admin/transactions', icon: FileText },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row transition-all duration-300">
      {/* Mobile Drawer Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-border-custom bg-card-custom">
        <span className="text-base font-bold text-foreground-custom">Dashboard</span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 border border-border-custom rounded-xl hover:bg-foreground-custom/5 text-foreground-custom/80"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 border-r border-border-custom bg-card-custom md:flex flex-col shrink-0 transition-all duration-300 ${
          isSidebarOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-6 border-b border-border-custom space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={user.image}
              alt={user.name}
              className="h-11 w-11 rounded-full object-cover border-2 border-brand/20"
            />
            <div className="truncate">
              <p className="text-sm font-bold text-foreground-custom truncate">{user.name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {user.isPremium ? (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-0.5">
                    <Award size={10} />
                    <span>Premium</span>
                  </span>
                ) : (
                  <span className="bg-foreground-custom/10 text-foreground-custom/60 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Standard
                  </span>
                )}
                <span className="text-[10px] text-foreground-custom/50 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="flex-grow py-6 overflow-y-auto px-4 space-y-8">
          {/* User Links */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground-custom/40 uppercase tracking-widest px-3">
              User Panel
            </span>
            <nav className="space-y-1">
              {userLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive(link.href)
                        ? 'bg-brand/10 text-brand'
                        : 'text-foreground-custom/80 hover:bg-foreground-custom/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Links */}
          {user.role === 'admin' && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-foreground-custom/40 uppercase tracking-widest px-3">
                Admin Panel
              </span>
              <nav className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive(link.href)
                          ? 'bg-brand/10 text-brand'
                          : 'text-foreground-custom/80 hover:bg-foreground-custom/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow bg-background-custom p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
