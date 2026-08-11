'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, AlertOctagon, Award, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminOverview() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalPremiumMembers: 0,
    totalReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth guard for admin
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load admin overview stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdminStats();
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-foreground-custom/10 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-foreground-custom/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-500/10', href: '/dashboard/admin/users' },
    { name: 'Total Recipes', value: stats.totalRecipes, icon: BookOpen, color: 'text-brand bg-brand/10', href: '/dashboard/admin/recipes' },
    { name: 'Premium Members', value: stats.totalPremiumMembers, icon: Award, color: 'text-amber-500 bg-amber-500/10', href: '/dashboard/admin/transactions' },
    { name: 'Active Reports', value: stats.totalReports, icon: AlertOctagon, color: 'text-red-500 bg-red-500/10', href: '/dashboard/admin/reports' },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-border-custom pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Admin Overview</h1>
        <p className="text-foreground-custom/60 text-sm">Site-wide metrics, system moderation, and log analytics.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-card-custom border border-border-custom p-6 rounded-2xl flex items-center space-x-4 hover:shadow-md transition-shadow relative group"
            >
              <div className={`p-4 rounded-xl ${card.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-grow">
                <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">{card.name}</p>
                <p className="text-2xl font-black text-foreground-custom mt-0.5">{card.value}</p>
              </div>
              <Link href={card.href} className="absolute bottom-3 right-3 text-foreground-custom/30 group-hover:text-brand transition-colors">
                <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Admin Quick Tips Card */}
      <div className="bg-card-custom border border-border-custom p-6 sm:p-8 rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-foreground-custom">Moderator Guidelines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-foreground-custom/75">
          <div className="space-y-2 border-l-2 border-brand/50 pl-4">
            <h4 className="font-bold text-foreground-custom">Report Moderation</h4>
            <p className="text-xs leading-relaxed text-foreground-custom/60">
              Check reports for recipes flagged as Spam, Offensive, or Copyright Issue. If the issue is valid, delete the recipe. Otherwise, dismiss the report.
            </p>
          </div>
          <div className="space-y-2 border-l-2 border-brand/50 pl-4">
            <h4 className="font-bold text-foreground-custom">User Control</h4>
            <p className="text-xs leading-relaxed text-foreground-custom/60">
              Users violating posting rules or uploading spam can be blocked. Blocking a user terminates their sessions immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
