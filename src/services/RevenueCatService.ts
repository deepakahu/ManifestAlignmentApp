/**
 * RevenueCat Service
 *
 * Handles all in-app purchase logic using RevenueCat SDK
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../config/revenuecat.config';
import { MONETIZATION_CONFIG } from '../config/monetization.config';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export class RevenueCatService {
  private static isInitialized = false;
  private static isConfigured = false;

  /**
   * Initialize RevenueCat SDK
   * Call this on app startup
   */
  static async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      // Check if API keys are configured
      const apiKey = Platform.OS === 'ios'
        ? REVENUECAT_CONFIG.IOS_API_KEY
        : REVENUECAT_CONFIG.ANDROID_API_KEY;

      if (apiKey.includes('YOUR_') || apiKey.includes('_KEY_HERE')) {
        console.warn('⚠️ RevenueCat API key not configured. Using mock mode.');
        console.warn('To enable real payments:');
        console.warn('1. Set up RevenueCat account at https://app.revenuecat.com/');
        console.warn('2. Add API key to .env file');
        console.warn('3. Rebuild the app');
        this.isConfigured = false;
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Initialize SDK
      Purchases.configure({ apiKey });

      // Set user ID if provided
      if (userId) {
        await Purchases.logIn(userId);
      }

      this.isInitialized = true;
      this.isConfigured = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if RevenueCat is properly configured
   */
  static isReady(): boolean {
    return this.isInitialized && this.isConfigured;
  }

  /**
   * Get available offerings/packages from RevenueCat
   */
  static async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isReady()) {
      console.warn('RevenueCat not configured');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();

      if (offerings.current !== null) {
        return offerings.current;
      }

      console.warn('No offerings found in RevenueCat');
      return null;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  /**
   * Purchase monthly subscription
   */
  static async purchaseMonthly(): Promise<PurchaseResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Payment system not configured. Please contact support.',
      };
    }

    try {
      const offerings = await this.getOfferings();

      if (!offerings) {
        return {
          success: false,
          error: 'No subscription plans available',
        };
      }

      // Find monthly package
      const monthlyPackage = offerings.availablePackages.find(
        (pkg) => pkg.product.identifier === MONETIZATION_CONFIG.PLANS.MONTHLY.productId.android
      );

      if (!monthlyPackage) {
        return {
          success: false,
          error: 'Monthly subscription not available',
        };
      }

      // Purchase package
      const { customerInfo } = await Purchases.purchasePackage(monthlyPackage);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Purchase error:', error);

      // User cancelled
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Purchase lifetime access
   */
  static async purchaseLifetime(): Promise<PurchaseResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Payment system not configured. Please contact support.',
      };
    }

    try {
      const offerings = await this.getOfferings();

      if (!offerings) {
        return {
          success: false,
          error: 'No subscription plans available',
        };
      }

      // Find lifetime package
      const lifetimePackage = offerings.availablePackages.find(
        (pkg) => pkg.product.identifier === MONETIZATION_CONFIG.PLANS.LIFETIME.productId.android
      );

      if (!lifetimePackage) {
        return {
          success: false,
          error: 'Lifetime access not available',
        };
      }

      // Purchase package
      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Purchase error:', error);

      // User cancelled
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Check if user has premium access
   */
  static async checkPremiumStatus(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();

      // Check if user has active entitlement
      return (
        typeof customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== 'undefined'
      );
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Get customer info
   */
  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Restore purchases
   * Call this when user clicks "Restore Purchases" button
   */
  static async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Payment system not configured',
      };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      const hasPremium =
        typeof customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== 'undefined';

      if (hasPremium) {
        return {
          success: true,
          customerInfo,
        };
      } else {
        return {
          success: false,
          error: 'No purchases found to restore',
        };
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  /**
   * Log out current user
   */
  static async logout(): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Set user attributes (for analytics and targeting)
   */
  static async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Error setting user attributes:', error);
    }
  }
}
