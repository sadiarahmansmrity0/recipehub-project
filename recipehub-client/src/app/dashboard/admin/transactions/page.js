'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, Loader2, DollarSign, Award, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminTransactions() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/transactions`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTransactions(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={30} className="text-brand animate-spin" />
      </div>
    );
  }

  // Calculate total earnings
  const totalEarnings = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const premiumCount = transactions.filter(tx => !tx.recipeId).length;
  const recipePurchasesCount = transactions.filter(tx => tx.recipeId).length;

  return (
    <div className="space-y-8">
      <div className="border-b border-border-custom pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight flex items-center gap-2">
            <FileText className="text-brand" />
            <span>Transactions Log</span>
          </h1>
          <p className="text-foreground-custom/60 text-sm">Monitor system revenues, premium membership sales, and individual recipe purchases.</p>
        </div>
        
        {/* Total Revenues mini card **/}
        <div className="bg-brand/10 border border-brand/20 py-3 px-6 rounded-2xl flex items-center space-x-3 shrink-0">
          <div className="p-2 bg-brand text-white rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand">Total Revenue</span>
            <span className="block text-xl font-black text-brand-dark dark:text-brand">${totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Transaction break-down stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card-custom border border-border-custom p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">Premium Upgrades</p>
            <p className="text-2xl font-black text-foreground-custom mt-0.5">{premiumCount}</p>
          </div>
        </div>
        <div className="bg-card-custom border border-border-custom p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground-custom/50 uppercase tracking-wider">Recipe Unlocks</p>
            <p className="text-2xl font-black text-foreground-custom mt-0.5">{recipePurchasesCount}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card-custom border border-border-custom rounded-3xl overflow-hidden shadow-sm">
        {transactions.length === 0 ? (
          <div className="p-16 text-center text-foreground-custom/50">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-foreground-custom/[0.02]">
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Transaction ID</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Customer Email</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Item Type</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Amount</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {transactions.map((item) => (
                  <tr key={item._id} className="hover:bg-foreground-custom/[0.01] transition-colors">
                    <td className="p-4 sm:p-5 font-mono text-xs text-foreground-custom/80">{item.transactionId}</td>
                    <td className="p-4 sm:p-5 text-sm text-foreground-custom/70">{item.userEmail}</td>
                    <td className="p-4 sm:p-5 text-sm">
                      {item.recipeId ? (
                        <span className="inline-flex items-center space-x-1 text-blue-500 font-semibold text-xs bg-blue-500/10 px-2 py-0.5 rounded-lg">
                          <ShoppingBag size={12} />
                          <span>Recipe Purchase</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-500 font-semibold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg">
                          <Award size={12} />
                          <span>Premium Upgrade</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-sm font-bold text-foreground-custom">${item.amount?.toFixed(2)}</td>
                    <td className="p-4 sm:p-5 text-xs text-foreground-custom/50">
                      {new Date(item.paidAt).toLocaleString()}
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
