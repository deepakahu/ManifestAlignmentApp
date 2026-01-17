/**
 * RevenueCat Configuration
 *
 * RevenueCat API Keys
 * Get these from: https://app.revenuecat.com/
 *
 * IMPORTANT: Before deploying to production, you MUST:
 * 1. Create a RevenueCat account at https://app.revenuecat.com/
 * 2. Create a new project
 * 3. Add your Android app with the package name: com.manifestationalarm.app
 * 4. Configure Google Play Store integration
 * 5. Create products in Google Play Console matching the product IDs below
 * 6. Replace the placeholder API keys below with your actual keys
 */

import Constants from 'expo-constants';

export const REVENUECAT_CONFIG = {
  /**
   * RevenueCat API Key for Android
   * Get this from: RevenueCat Dashboard > Your Project > API Keys > Google Play
   *
   * Loaded from app.config.js extra section (which reads from .env file)
   */
  ANDROID_API_KEY: Constants.expoConfig?.extra?.revenueCatAndroidApiKey || 'test_1yp6hdIBqgZUsvkvIcZTTfcewhI',

  /**
   * RevenueCat API Key for iOS
   * Get this from: RevenueCat Dashboard > Your Project > API Keys > App Store
   *
   * Loaded from app.config.js extra section (which reads from .env file)
   */
  IOS_API_KEY: Constants.expoConfig?.extra?.revenueCatIosApiKey || 'YOUR_IOS_API_KEY_HERE',

  /**
   * Entitlement identifier (used to check if user has premium access)
   * This should match the entitlement created in RevenueCat dashboard
   */
  ENTITLEMENT_ID: 'premium',

  /**
   * Product identifiers (must match Google Play Console and App Store Connect)
   */
  PRODUCTS: {
    MONTHLY: 'monthly',
    LIFETIME: 'lifetime',
  },
};

/**
 * Setup Instructions:
 *
 * 1. Create RevenueCat Account:
 *    - Go to https://app.revenuecat.com/
 *    - Sign up for free account
 *
 * 2. Create Project:
 *    - Create new project in RevenueCat
 *    - Name it "Manifestation Alarm" or similar
 *
 * 3. Add Android App:
 *    - Click "Add App"
 *    - Select "Google Play"
 *    - Enter package name: com.manifestationalarm.app
 *    - Upload Google Play service account JSON
 *
 * 4. Create Products in Google Play Console:
 *    - Go to Google Play Console
 *    - Navigate to: Monetization > In-app products
 *    - Create two products:
 *      a) Product ID: monthly
 *         Type: Subscription
 *         Price: $2.99/month
 *
 *      b) Product ID: lifetime
 *         Type: In-app product (one-time purchase)
 *         Price: $29.99
 *
 * 5. Configure Entitlements in RevenueCat:
 *    - Go to RevenueCat Dashboard > Entitlements
 *    - Create entitlement named "premium"
 *    - Add both products to this entitlement
 *
 * 6. Get API Keys:
 *    - Go to RevenueCat Dashboard > API Keys
 *    - Copy Android API key
 *    - Add to your .env file:
 *      REVENUECAT_ANDROID_API_KEY=your_actual_key_here
 *
 * 7. Test Payment:
 *    - Use Google Play internal testing track
 *    - Add test account emails in Google Play Console
 *    - Test purchases with test accounts
 */
