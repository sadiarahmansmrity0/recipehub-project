'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchWithAuth, checkAuth } = useApp();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentData, setPaymentData] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing payment session ID. Please contact support.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/verify`, {
          method: 'POST',
          body: JSON.stringify({ sessionId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPaymentData(data.data);
            setStatus('success');
            setMessage(data.message || 'Payment successfully processed!');
            // Refresh auth state to update user.isPremium if upgraded**
            await checkAuth();
          } else {
            setStatus('error');
            setMessage(data.message || 'Verification failed. Please check your transaction.');
          }
        } else {
          setStatus('error');
          setMessage('Unable to verify payment at this time.');
        }
      } catch (error) {
        console.error("Payment Verification Error:", error);
        setStatus('error');
        setMessage('A network error occurred while verifying payment.');
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-md w-full bg-card-custom border border-border-custom p-8 sm:p-10 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden">
      {/* Decorative backdrop blobs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />

      {status === 'verifying' && (
        <div className="space-y-6 py-6">
          <div className="flex justify-center">
            <Loader2 size={64} className="text-brand animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground-custom">Verifying Payment</h2>
            <p className="text-sm text-foreground-custom/60">{message}</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="space-y-6"
        >
          <div className="flex justify-center relative">
            <CheckCircle2 size={72} className="text-green-500 fill-green-500/10" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              className="absolute -top-2 right-1/3 text-brand"
            >
              <Sparkles size={20} />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground-custom tracking-tight">Thank You!</h2>
            <p className="text-sm text-green-600 font-semibold">{message}</p>
            {paymentData?.amount && (
              <p className="text-xs text-foreground-custom/50 mt-1">
                Transaction ID: <span className="font-mono">{paymentData.transactionId}</span>
              </p>
            )}
          </div>

          <div className="bg-foreground-custom/5 py-4 px-6 rounded-2xl">
            {paymentData?.recipeId ? (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand">Exclusive Access</span>
                <span className="block text-sm font-bold text-foreground-custom">Recipe is now unlocked!</span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand">Premium Account Active</span>
                <span className="block text-sm font-bold text-foreground-custom">Unlimited recipe submissions unlocked!</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href={paymentData?.recipeId ? `/recipes/${paymentData.recipeId}` : "/dashboard/add-recipe"}
              className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand/10 flex items-center justify-center space-x-2"
            >
              <span>{paymentData?.recipeId ? 'View Recipe' : 'Add New Recipe'}</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 border border-border-custom bg-card-custom hover:bg-foreground-custom/5 text-foreground-custom text-sm font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <XCircle size={72} className="text-red-500 fill-red-500/10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground-custom">Payment Unsuccessful</h2>
            <p className="text-sm text-red-500 font-semibold">{message}</p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => router.push('/recipes')}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand/10"
            >
              Browse Other Recipes
            </button>
            <Link
              href="/"
              className="text-xs text-foreground-custom/50 hover:text-brand font-medium transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex-grow flex items-center justify-center min-h-[75vh] px-4 py-12">
      <Suspense fallback={
        <div className="max-w-md w-full bg-card-custom border border-border-custom p-8 rounded-3xl shadow-xl text-center py-12 space-y-6">
          <Loader2 size={48} className="text-brand animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-foreground-custom">Loading payment details...</h2>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
