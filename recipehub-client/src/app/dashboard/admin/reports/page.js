'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertOctagon, Loader2, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecipeReports() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores report ID being updated

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/reports`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReports(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (user) {
      fetchReports();
    }
  }, [user]);

  const handleDismiss = async (reportId) => {
    if (!window.confirm("Are you sure you want to dismiss this report?")) return;
    
    setActionLoading(reportId);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/reports/${reportId}/dismiss`, {
        method: 'PUT'
      });
      if (res.ok) {
        setReports(reports.filter(r => r._id !== reportId));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to dismiss report");
      }
    } catch (err) {
      console.error(err);
      alert("Error trying to dismiss report.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRecipe = async (recipeId, reportId) => {
    if (!window.confirm("Are you sure you want to delete this recipe? this will also delete all reports associated with it.")) return;

    setActionLoading(reportId);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/recipes/${recipeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Since delete recipe cleans up all reports for this recipe in backend, let's filter them out client-side
        setReports(reports.filter(r => r.recipeId !== recipeId));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete recipe");
      }
    } catch (err) {
      console.error(err);
      alert("Error trying to delete recipe.");
    } finally {
      setActionLoading(null);
    }
  };

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight flex items-center gap-2">
          <AlertOctagon className="text-red-500" />
          <span>Recipe Reports</span>
        </h1>
        <p className="text-foreground-custom/60 text-sm">Review recipes flagged by our community for Spam, Offensive Content, or Copyright Issues.</p>
      </div>

      <div className="bg-card-custom border border-border-custom rounded-3xl overflow-hidden shadow-sm">
        {reports.length === 0 ? (
          <div className="p-16 text-center text-foreground-custom/50">No reports found. All clean!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-foreground-custom/[0.02]">
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Flagged Recipe</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Reporter</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Reason</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Date</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {reports.map((item) => (
                  <tr key={item._id} className="hover:bg-foreground-custom/[0.01] transition-colors">
                    <td className="p-4 sm:p-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground-custom flex items-center gap-1.5">
                          <span>{item.recipeName}</span>
                          <Link href={`/recipes/${item.recipeId}`} target="_blank" className="text-foreground-custom/40 hover:text-brand">
                            <ExternalLink size={14} />
                          </Link>
                        </p>
                        <p className="text-xs text-foreground-custom/50 mt-0.5">Author: {item.recipeAuthor} ({item.recipeAuthorEmail})</p>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 text-sm text-foreground-custom/70">{item.reporterEmail}</td>
                    <td className="p-4 sm:p-5 text-sm">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        item.reason === 'Copyright Issue'
                          ? 'bg-amber-500/10 text-amber-600'
                          : item.reason === 'Offensive Content'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-foreground-custom/10 text-foreground-custom/75'
                      }`}>
                        {item.reason}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-xs text-foreground-custom/50">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 sm:p-5 text-right space-x-2">
                      <button
                        onClick={() => handleDismiss(item._id)}
                        disabled={actionLoading === item._id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border-custom bg-card-custom hover:bg-foreground-custom/5 text-foreground-custom/80 transition-colors inline-flex items-center gap-1"
                      >
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Dismiss</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(item.recipeId, item._id)}
                        disabled={actionLoading === item._id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        <span>Delete Recipe</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
