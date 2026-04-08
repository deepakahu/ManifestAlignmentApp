import { stripe, calculateChargeAmount, PLATFORM_FEE_PERCENTAGE } from './config'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export interface CreateChallengePaymentParams {
  challengeId: string
  userId: string
  stakeAmountCents: number
  currency: string
  userEmail: string
  userName?: string
  challengeTitle: string
}

export interface PaymentResult {
  paymentIntentId: string
  clientSecret: string
  amount: number
  currency: string
  platformFee: number
  estimatedTotal: number // Before tax
}

/**
 * Create a payment intent for challenge stake with Stripe Tax
 * Funds are held in Stripe until challenge completes
 */
export async function createChallengePayment(
  params: CreateChallengePaymentParams
): Promise<PaymentResult> {
  const { stakeAmountCents, currency, userEmail, userName, challengeTitle } = params

  // Calculate amounts
  const { stakeAmount, platformFee, subtotal } = calculateChargeAmount(stakeAmountCents)

  // Create Payment Intent with automatic tax calculation
  const paymentIntent = await stripe.paymentIntents.create({
    amount: subtotal, // Stripe Tax will add tax on top of this
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      challengeId: params.challengeId,
      userId: params.userId,
      stakeAmount: stakeAmount.toString(),
      platformFee: platformFee.toString(),
      type: 'challenge_stake',
    },
    description: `Challenge Stake: ${challengeTitle}`,
    receipt_email: userEmail,

    // NOTE: automatic_tax requires enabling Stripe Tax in Dashboard
    // and may not be available in all Stripe SDK versions
    // For manual tax calculation, calculate and include in amount above
    // automatic_tax: {
    //   enabled: true,
    // },

    // Capture manually - we'll capture when challenge starts
    capture_method: 'manual',
  } as any) // Type assertion needed for automatic_tax if using newer API version

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    amount: stakeAmount,
    currency,
    platformFee,
    estimatedTotal: subtotal,
  }
}

/**
 * Capture (charge) the payment when challenge starts
 */
export async function capturePayment(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.capture(paymentIntentId)
}

/**
 * Cancel uncaptured payment if user cancels before challenge starts
 */
export async function cancelPayment(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.cancel(paymentIntentId)
}

/**
 * Refund payment when user completes challenge successfully
 * Returns the stake amount (minus platform fee which is kept)
 */
export async function refundStakeToUser(
  paymentIntentId: string,
  refundAmountCents: number,
  reason: string = 'Challenge completed successfully'
): Promise<Stripe.Refund> {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: refundAmountCents,
    reason: 'requested_by_customer',
    metadata: {
      reason,
    },
  })

  return refund
}

/**
 * Transfer funds to charity when user fails challenge
 * Platform keeps the service fee, rest goes to charity
 */
export async function transferToCharity(
  paymentIntentId: string,
  charityStripeAccountId: string,
  amountCents: number,
  challengeId: string
): Promise<Stripe.Transfer> {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: charityStripeAccountId,
    transfer_group: `challenge_${challengeId}`,
    metadata: {
      paymentIntentId,
      type: 'charity_transfer',
      challengeId,
    },
  })

  return transfer
}

/**
 * Transfer funds to accountability partner
 */
export async function transferToPartner(
  paymentIntentId: string,
  partnerStripeAccountId: string,
  amountCents: number,
  challengeId: string
): Promise<Stripe.Transfer> {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: partnerStripeAccountId,
    transfer_group: `challenge_${challengeId}`,
    metadata: {
      paymentIntentId,
      type: 'partner_transfer',
      challengeId,
    },
  })

  return transfer
}

/**
 * Handle challenge completion - determine where funds go
 */
export async function processChallengeCompletion(
  challengeId: string,
  succeeded: boolean
): Promise<void> {
  const admin = createAdminClient()

  // Get challenge details
  const { data: challenge } = await admin
    .from('challenges')
    .select('*, payment_intent_id, failure_consequence, creator_id, prize_amount, prize_currency')
    .eq('id', challengeId)
    .single()

  if (!challenge || !challenge.payment_intent_id) {
    throw new Error('Challenge or payment not found')
  }

  const stakeAmountCents = challenge.prize_amount * 100 // Convert to cents
  const { platformFee } = calculateChargeAmount(stakeAmountCents)
  const userStakeAmount = stakeAmountCents // Original stake amount

  if (succeeded) {
    // User completed challenge - refund their stake (they get back what they put in)
    // Platform keeps the service fee
    await refundStakeToUser(
      challenge.payment_intent_id,
      userStakeAmount,
      'Challenge completed successfully'
    )

    // Update challenge status
    await admin
      .from('challenges')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
  } else {
    // User failed challenge - handle based on failure consequence
    const failureConsequence = challenge.failure_consequence

    switch (failureConsequence) {
      case 'charity':
        // Transfer to charity (platform keeps service fee)
        // TODO: Get charity Stripe Connect account ID
        // await transferToCharity(challenge.payment_intent_id, charityAccountId, userStakeAmount, challengeId)
        break

      case 'partner':
        // Transfer to accountability partner
        // TODO: Get partner's Stripe Connect account ID
        // await transferToPartner(challenge.payment_intent_id, partnerAccountId, userStakeAmount, challengeId)
        break

      case 'platform':
        // Platform keeps everything (already captured)
        break

      case 'anti-charity':
        // Transfer to anti-charity
        // TODO: Get anti-charity Stripe Connect account ID
        break
    }

    // Update challenge status
    await admin
      .from('challenges')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
  }

  // Record transaction in payment_transactions table
  await admin.from('payment_transactions').insert({
    challenge_id: challengeId,
    payment_intent_id: challenge.payment_intent_id,
    amount: stakeAmountCents,
    platform_fee: platformFee,
    currency: challenge.prize_currency,
    status: succeeded ? 'refunded' : 'transferred',
    completed_at: new Date().toISOString(),
  })
}

/**
 * Get payment details for display
 */
export async function getPaymentDetails(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  })

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    created: paymentIntent.created,
    metadata: paymentIntent.metadata,
  }
}
