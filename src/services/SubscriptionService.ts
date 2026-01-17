import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MONETIZATION_CONFIG,
  getCouponByCode,
  calculateTrialEndDate,
  calculateCouponExpiryDate,
} from '../config/monetization.config';

/**
 * Subscription status types
 */
export type SubscriptionStatus =
  | 'trial' // In free trial period
  | 'trial_expired' // Trial ended, no payment
  | 'active_monthly' // Active monthly subscription
  | 'active_lifetime' // Active lifetime subscription
  | 'active_coupon' // Active coupon-based access
  | 'expired'; // All access expired

export interface SubscriptionData {
  status: SubscriptionStatus;
  installDate: Date;
  trialEndDate: Date;
  isTrialActive: boolean;
  isPremium: boolean;
  subscriptionType?: 'monthly' | 'lifetime' | 'coupon';
  subscriptionExpiry?: Date; // For monthly subscriptions
  couponCode?: string;
  couponActivationDate?: Date;
  couponExpiryDate?: Date;
  daysRemainingInTrial?: number;
  daysRemainingInCoupon?: number;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  INSTALL_DATE: '@manifestation_install_date',
  SUBSCRIPTION_TYPE: '@manifestation_subscription_type',
  SUBSCRIPTION_EXPIRY: '@manifestation_subscription_expiry',
  COUPON_CODE: '@manifestation_coupon_code',
  COUPON_ACTIVATION_DATE: '@manifestation_coupon_activation_date',
  COUPON_EXPIRY_DATE: '@manifestation_coupon_expiry_date',
  LIFETIME_ACCESS: '@manifestation_lifetime_access',
};

/**
 * Subscription Service
 * Manages trial periods, subscriptions, and coupon-based access
 */
export class SubscriptionService {
  /**
   * Initialize subscription data on first app launch
   */
  static async initialize(): Promise<void> {
    try {
      const installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);

      // If no install date, this is first launch
      if (!installDate) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, now);
        console.log('✅ Subscription initialized with trial start date:', now);
      }
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    }
  }

  /**
   * Get current subscription status and details
   */
  static async getSubscriptionData(): Promise<SubscriptionData> {
    try {
      const now = new Date();

      // Get install date (start of trial)
      const installDateStr = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
      const installDate = installDateStr ? new Date(installDateStr) : new Date();

      // Calculate trial end date
      const trialEndDate = calculateTrialEndDate(installDate);
      const isTrialActive = now < trialEndDate;
      const daysRemainingInTrial = isTrialActive
        ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Check for lifetime access
      const hasLifetimeAccess = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_ACCESS);
      if (hasLifetimeAccess === 'true') {
        return {
          status: 'active_lifetime',
          installDate,
          trialEndDate,
          isTrialActive: false,
          isPremium: true,
          subscriptionType: 'lifetime',
        };
      }

      // Check for active coupon
      const couponCode = await AsyncStorage.getItem(STORAGE_KEYS.COUPON_CODE);
      const couponExpiryStr = await AsyncStorage.getItem(STORAGE_KEYS.COUPON_EXPIRY_DATE);
      const couponActivationStr = await AsyncStorage.getItem(STORAGE_KEYS.COUPON_ACTIVATION_DATE);

      if (couponCode && couponExpiryStr) {
        const couponExpiryDate = new Date(couponExpiryStr);
        const isCouponActive = now < couponExpiryDate;

        if (isCouponActive) {
          const daysRemainingInCoupon = Math.ceil(
            (couponExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            status: 'active_coupon',
            installDate,
            trialEndDate,
            isTrialActive: false,
            isPremium: true,
            subscriptionType: 'coupon',
            couponCode,
            couponActivationDate: couponActivationStr ? new Date(couponActivationStr) : undefined,
            couponExpiryDate,
            daysRemainingInCoupon,
          };
        }
      }

      // Check for monthly subscription
      const subscriptionType = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_TYPE);
      const subscriptionExpiryStr = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY);

      if (subscriptionType === 'monthly' && subscriptionExpiryStr) {
        const subscriptionExpiry = new Date(subscriptionExpiryStr);
        const isSubscriptionActive = now < subscriptionExpiry;

        if (isSubscriptionActive) {
          return {
            status: 'active_monthly',
            installDate,
            trialEndDate,
            isTrialActive: false,
            isPremium: true,
            subscriptionType: 'monthly',
            subscriptionExpiry,
          };
        }
      }

      // If trial is active
      if (isTrialActive) {
        return {
          status: 'trial',
          installDate,
          trialEndDate,
          isTrialActive: true,
          isPremium: true, // Trial users get premium features
          daysRemainingInTrial,
        };
      }

      // Trial expired, no active subscription
      return {
        status: isTrialActive ? 'trial' : 'trial_expired',
        installDate,
        trialEndDate,
        isTrialActive: false,
        isPremium: false,
      };
    } catch (error) {
      console.error('Failed to get subscription data:', error);
      // Return safe default
      return {
        status: 'expired',
        installDate: new Date(),
        trialEndDate: new Date(),
        isTrialActive: false,
        isPremium: false,
      };
    }
  }

  /**
   * Check if user has premium access (trial, subscription, or coupon)
   */
  static async hasPremiumAccess(): Promise<boolean> {
    const data = await this.getSubscriptionData();
    return data.isPremium;
  }

  /**
   * Apply a coupon code
   */
  static async applyCoupon(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const coupon = getCouponByCode(code);

      if (!coupon) {
        return {
          success: false,
          message: 'Invalid coupon code',
        };
      }

      // Check if coupon already applied
      const existingCoupon = await AsyncStorage.getItem(STORAGE_KEYS.COUPON_CODE);
      if (existingCoupon) {
        return {
          success: false,
          message: 'You already have an active coupon',
        };
      }

      const now = new Date();
      const expiryDate = calculateCouponExpiryDate(now, coupon.durationMonths);

      // Save coupon data
      await AsyncStorage.setItem(STORAGE_KEYS.COUPON_CODE, coupon.code);
      await AsyncStorage.setItem(STORAGE_KEYS.COUPON_ACTIVATION_DATE, now.toISOString());
      await AsyncStorage.setItem(STORAGE_KEYS.COUPON_EXPIRY_DATE, expiryDate.toISOString());

      console.log(`✅ Coupon applied: ${coupon.code} - ${coupon.durationMonths} months`);

      return {
        success: true,
        message: `Coupon applied! You now have ${coupon.durationMonths} months of free access.`,
      };
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      return {
        success: false,
        message: 'Failed to apply coupon. Please try again.',
      };
    }
  }

  /**
   * Activate monthly subscription
   * (This would be called after successful payment)
   */
  static async activateMonthlySubscription(): Promise<void> {
    try {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 1);

      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TYPE, 'monthly');
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY, expiry.toISOString());

      console.log('✅ Monthly subscription activated until:', expiry);
    } catch (error) {
      console.error('Failed to activate monthly subscription:', error);
      throw error;
    }
  }

  /**
   * Activate lifetime subscription
   * (This would be called after successful payment)
   */
  static async activateLifetimeSubscription(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_ACCESS, 'true');
      console.log('✅ Lifetime subscription activated');
    } catch (error) {
      console.error('Failed to activate lifetime subscription:', error);
      throw error;
    }
  }

  /**
   * Renew monthly subscription
   * (This would be called by subscription auto-renewal)
   */
  static async renewMonthlySubscription(): Promise<void> {
    try {
      const now = new Date();
      const newExpiry = new Date(now);
      newExpiry.setMonth(newExpiry.getMonth() + 1);

      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY, newExpiry.toISOString());
      console.log('✅ Monthly subscription renewed until:', newExpiry);
    } catch (error) {
      console.error('Failed to renew monthly subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * (Clears subscription data but doesn't affect trial or coupons)
   */
  static async cancelSubscription(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_TYPE);
      await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY);
      await AsyncStorage.removeItem(STORAGE_KEYS.LIFETIME_ACCESS);
      console.log('✅ Subscription cancelled');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Clear all subscription data (for testing/reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.INSTALL_DATE,
        STORAGE_KEYS.SUBSCRIPTION_TYPE,
        STORAGE_KEYS.SUBSCRIPTION_EXPIRY,
        STORAGE_KEYS.COUPON_CODE,
        STORAGE_KEYS.COUPON_ACTIVATION_DATE,
        STORAGE_KEYS.COUPON_EXPIRY_DATE,
        STORAGE_KEYS.LIFETIME_ACCESS,
      ]);
      console.log('✅ All subscription data cleared');
    } catch (error) {
      console.error('Failed to clear subscription data:', error);
      throw error;
    }
  }

  /**
   * Get formatted subscription status message
   */
  static async getStatusMessage(): Promise<string> {
    const data = await this.getSubscriptionData();

    switch (data.status) {
      case 'trial':
        return `Free trial - ${data.daysRemainingInTrial} days remaining`;
      case 'trial_expired':
        return 'Trial expired - Subscribe to continue';
      case 'active_monthly':
        return 'Monthly subscription active';
      case 'active_lifetime':
        return 'Lifetime access active';
      case 'active_coupon':
        return `Coupon active - ${data.daysRemainingInCoupon} days remaining`;
      case 'expired':
        return 'No active subscription';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Check if specific feature is available
   */
  static async canAccessFeature(feature: keyof typeof MONETIZATION_CONFIG.PREMIUM_FEATURES): Promise<boolean> {
    const hasPremium = await this.hasPremiumAccess();
    return hasPremium || !MONETIZATION_CONFIG.PREMIUM_FEATURES[feature];
  }
}
