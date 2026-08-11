'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Users, ShieldAlert, CheckCircle, Ban, Loader2, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManageUsers() {
  const { user, fetchWithAuth } = useApp();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores user ID of user currently being updated

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        }
      }
    } catch (err) {
      console.error(err);
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
      fetchUsers();
    }
  }, [user]);

  const toggleBlockStatus = async (targetUser) => {
    const isBlocking = !targetUser.isBlocked;
    const actionText = isBlocking ? 'block' : 'unblock';
    
    if (targetUser.email === user.email) {
      alert("You cannot block your own admin account!");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionText} ${targetUser.name}?`)) return;

    setActionLoading(targetUser._id);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${targetUser._id}/${actionText}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === targetUser._id ? { ...u, isBlocked: isBlocking } : u));
      } else {
        const errorData = await res.json();
        alert(errorData.message || `Failed to ${actionText} user.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error trying to ${actionText} user.`);
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-custom tracking-tight">Manage Users</h1>
        <p className="text-foreground-custom/60 text-sm">Monitor registration list, upgrade roles, and block spammers.</p>
      </div>

      <div className="bg-card-custom border border-border-custom rounded-3xl overflow-hidden shadow-sm">
        {users.length === 0 ? (
          <div className="p-16 text-center text-foreground-custom/60">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-foreground-custom/[0.02]">
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">User Info</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Email Address</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Role</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider">Status</th>
                  <th className="p-4 sm:p-5 text-xs font-bold text-foreground-custom/60 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {users.map((item) => (
                  <tr key={item._id} className="hover:bg-foreground-custom/[0.01] transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image || "https://i.ibb.co/Vvpwk7R/default-avatar.png"}
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover border border-border-custom"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground-custom flex items-center space-x-1.5">
                            <span>{item.name}</span>
                            {item.isPremium && (
                              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-0.5">
                                <Award size={8} />
                                <span>PRO</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 text-sm text-foreground-custom/70">{item.email}</td>
                    <td className="p-4 sm:p-5 text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${
                        item.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-600' 
                          : 'bg-foreground-custom/10 text-foreground-custom/75'
                      }`}>
                        {item.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-sm">
                      {item.isBlocked ? (
                        <span className="inline-flex items-center space-x-1 text-red-500 text-xs font-semibold">
                          <Ban size={14} />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-green-500 text-xs font-semibold">
                          <CheckCircle size={14} />
                          <span>Active</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      {item.email !== user.email && (
                        <button
                          onClick={() => toggleBlockStatus(item)}
                          disabled={actionLoading === item._id}
                          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                            item.isBlocked
                              ? 'bg-green-500/15 text-green-500 hover:bg-green-500 hover:text-white'
                              : 'bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {actionLoading === item._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : item.isBlocked ? (
                            'Unblock'
                          ) : (
                            'Block'
                          )}
                        </button>
                      )}
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
