'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, challengeId }: { clientSecret: string; challengeId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/discipline/challenges/${challengeId}/payment/success`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push(`/discipline/challenges/${challengeId}`)}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

export default function ChallengePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    platformFee: number;
    estimatedTotal: number;
    currency: string;
  } | null>(null);

  useEffect(() => {
    loadChallengeAndCreatePayment();
  }, [challengeId]);

  const loadChallengeAndCreatePayment = async () => {
    try {
      setLoading(true);

      // Get challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      setChallenge(challengeData);

      // Check if already paid
      if (challengeData.payment_intent_id && challengeData.payment_status === 'paid') {
        router.push(`/discipline/challenges/${challengeId}`);
        return;
      }

      // Check if prize amount is 0
      if (!challengeData.prize_amount || challengeData.prize_amount === 0) {
        router.push(`/discipline/challenges/${challengeId}`);
        return;
      }

      // Create payment intent
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          stakeAmountCents: Math.round(challengeData.prize_amount * 100),
          currency: challengeData.prize_currency || 'USD',
          challengeTitle: challengeData.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentDetails({
        amount: data.amount,
        platformFee: data.platformFee,
        estimatedTotal: data.estimatedTotal,
        currency: data.currency,
      });
    } catch (err: any) {
      console.error('Error loading payment:', err);
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push(`/discipline/challenges/${challengeId}`)}
              className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !challenge || !paymentDetails) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Complete Your Challenge Payment
          </h1>
          <p className="text-gray-600">
            Secure your commitment for: <span className="font-medium">{challenge.title}</span>
          </p>
        </div>

        {/* Payment Breakdown */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Challenge Stake:</span>
            <span className="font-medium">
              {paymentDetails.currency} {(paymentDetails.amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (7.5%):</span>
            <span className="font-medium">
              {paymentDetails.currency} {(paymentDetails.platformFee / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax:</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between">
            <span className="font-semibold text-gray-900">Estimated Total:</span>
            <span className="font-bold text-indigo-600">
              {paymentDetails.currency} {(paymentDetails.estimatedTotal / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Payment Terms</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Your payment will be held securely by Stripe</li>
            <li>✓ Funds are captured when you activate the challenge</li>
            <li>✓ Complete the challenge successfully to get your stake refunded</li>
            <li>✓ Platform keeps the 7.5% service fee in all cases</li>
            {challenge.failure_consequence && (
              <li>
                ✓ If you fail: stake goes to{' '}
                <span className="font-medium">
                  {challenge.failure_consequence === 'charity'
                    ? 'charity'
                    : challenge.failure_consequence === 'partner'
                    ? 'accountability partner'
                    : challenge.failure_consequence === 'anti-charity'
                    ? 'anti-charity'
                    : 'platform'}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} challengeId={challengeId} />
        </Elements>

        {/* Security Notice */}
        <p className="mt-6 text-xs text-center text-gray-500">
          🔒 Payments are processed securely through Stripe. We never store your card details.
        </p>
      </div>
    </div>
  );
}
