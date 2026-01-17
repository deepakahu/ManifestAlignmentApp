/**
 * Monetization Configuration
 *
 * This file contains all pricing, subscription, and coupon configurations
 * for the app's monetization system.
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'lifetime';
  productId: {
    ios: string;
    android: string;
  };
}

export interface CouponCode {
  code: string;
  durationMonths: number;
  description: string;
  isActive: boolean;
}

export const MONETIZATION_CONFIG = {
  /**
   * Free trial duration in days
   */
  TRIAL_DURATION_DAYS: 14,

  /**
   * Subscription plans
   */
  PLANS: {
    MONTHLY: {
      id: 'monthly',
      name: 'Monthly Subscription',
      description: 'Full access to all features',
      price: 2.99,
      currency: 'USD',
      interval: 'month' as const,
      productId: {
        ios: 'com.manifestationalarm.app.monthly',
        android: 'monthly',
      },
    },
    LIFETIME: {
      id: 'lifetime',
      name: 'Lifetime Access',
      description: 'One-time payment for unlimited access',
      price: 29.99,
      currency: 'USD',
      interval: 'lifetime' as const,
      productId: {
        ios: 'com.manifestationalarm.app.lifetime',
        android: 'lifetime',
      },
    },
  } as const,

  /**
   * Coupon codes for extended free access
   * Format: code -> months of free access
   */
  COUPONS: [
    {
      code: 'WELCOME2024',
      durationMonths: 2,
      description: '2 months free access',
      isActive: true,
    },
    {
      code: 'MANIFEST3',
      durationMonths: 3,
      description: '3 months free access',
      isActive: true,
    },
    {
      code: 'EARLYBIRD4',
      durationMonths: 4,
      description: '4 months free access',
      isActive: true,
    },
    {
      code: 'PREMIUM6',
      durationMonths: 6,
      description: '6 months free access',
      isActive: true,
    },
    {
      code: 'BETA2025',
      durationMonths: 3,
      description: 'Beta tester bonus - 3 months free',
      isActive: true,
    },
  ] as CouponCode[],

  /**
   * Feature flags for premium features
   */
  PREMIUM_FEATURES: {
    UNLIMITED_ALARMS: true,
    CUSTOM_SOUNDS: true,
    ADVANCED_STATISTICS: true,
    DATA_EXPORT: true,
    CLOUD_BACKUP: true,
    AD_FREE: true,
  } as const,

  /**
   * Free tier limitations
   */
  FREE_TIER_LIMITS: {
    MAX_ALARMS: 3,
    MAX_MANIFESTATIONS: 5,
    STATISTICS_DAYS: 7, // Only see last 7 days
  } as const,
} as const;

/**
 * Helper function to get a coupon by code
 */
export function getCouponByCode(code: string): CouponCode | undefined {
  return MONETIZATION_CONFIG.COUPONS.find(
    (coupon) => coupon.code.toUpperCase() === code.toUpperCase() && coupon.isActive
  );
}

/**
 * Helper function to validate if a coupon code is valid
 */
export function isValidCouponCode(code: string): boolean {
  return getCouponByCode(code) !== undefined;
}

/**
 * Helper function to get coupon duration
 */
export function getCouponDuration(code: string): number {
  const coupon = getCouponByCode(code);
  return coupon ? coupon.durationMonths : 0;
}

/**
 * Get all active coupon codes (for admin/testing purposes)
 */
export function getActiveCoupons(): CouponCode[] {
  return MONETIZATION_CONFIG.COUPONS.filter((coupon) => coupon.isActive);
}

/**
 * Calculate trial end date from install date
 */
export function calculateTrialEndDate(installDate: Date): Date {
  const endDate = new Date(installDate);
  endDate.setDate(endDate.getDate() + MONETIZATION_CONFIG.TRIAL_DURATION_DAYS);
  return endDate;
}

/**
 * Calculate coupon expiry date from activation date
 */
export function calculateCouponExpiryDate(activationDate: Date, months: number): Date {
  const expiryDate = new Date(activationDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  return expiryDate;
}
