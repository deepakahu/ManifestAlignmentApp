import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Fee configuration
export const PLATFORM_FEE_PERCENTAGE = 7.5 // 7.5% platform fee
export const STRIPE_PROCESSING_FEE_PERCENTAGE = 2.9 // Stripe's fee
export const STRIPE_FIXED_FEE_CENTS = 30 // Stripe's fixed fee in cents

/**
 * Calculate platform fee from stake amount
 */
export function calculatePlatformFee(stakeAmountCents: number): number {
  return Math.round(stakeAmountCents * (PLATFORM_FEE_PERCENTAGE / 100))
}

/**
 * Calculate total amount to charge (stake + platform fee)
 * Tax will be calculated separately by Stripe Tax
 */
export function calculateChargeAmount(stakeAmountCents: number): {
  stakeAmount: number
  platformFee: number
  subtotal: number
} {
  const platformFee = calculatePlatformFee(stakeAmountCents)
  const subtotal = stakeAmountCents + platformFee

  return {
    stakeAmount: stakeAmountCents,
    platformFee,
    subtotal,
  }
}

/**
 * Calculate Stripe processing fees (for display purposes)
 */
export function calculateStripeFees(amountCents: number): number {
  // Stripe fee: 2.9% + $0.30
  return Math.round(amountCents * (STRIPE_PROCESSING_FEE_PERCENTAGE / 100)) + STRIPE_FIXED_FEE_CENTS
}

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
