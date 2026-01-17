# In-App Purchase Implementation Guide

This guide covers implementing real payments with RevenueCat for iOS App Store approval.

## Status

✅ **Completed:**
1. AlarmPermissionGuard - Fixed to hide Android-specific items on iOS
2. RevenueCat SDK installed (`react-native-purchases`)

⏳ **Requires Setup:**
1. RevenueCat account creation and API keys
2. App Store Connect / Google Play Console product configuration
3. Code updates to use RevenueCat
4. Testing with sandbox accounts

---

## Part 1: RevenueCat Setup (Do This First)

### Step 1: Create RevenueCat Account

1. Go to https://app.revenuecat.com/
2. Sign up for a free account
3. Create a new project: "Manifestation Alarm"

### Step 2: Get API Keys

1. In RevenueCat dashboard, go to **Settings → API Keys**
2. Copy your **iOS API Key**
3. Copy your **Android API Key**
4. Save these securely - you'll need them for the code

### Step 3: Configure Products in RevenueCat

**Monthly Subscription:**
- Product ID (iOS): `com.manifestationalarm.app.monthly`
- Product ID (Android): `monthly`
- Type: Auto-renewable subscription
- Duration: 1 month
- Price: $2.99

**Lifetime Access:**
- Product ID (iOS): `com.manifestationalarm.app.lifetime`
- Product ID (Android): `lifetime`
- Type: Non-consumable (iOS) / Non-subscription (Android)
- Price: $29.99

### Step 4: Create Entitlement

1. In RevenueCat, go to **Entitlements**
2. Create new entitlement: `premium`
3. Attach both products (monthly & lifetime) to this entitlement

---

## Part 2: App Store Connect Setup (iOS)

### Step 1: Create Products

1. Go to https://appstoreconnect.apple.com/
2. Select your app: "Manifestation Alarm"
3. Go to **In-App Purchases** section
4. Create **Auto-Renewable Subscription**:
   - Reference Name: Monthly Premium Subscription
   - Product ID: `com.manifestationalarm.app.monthly`
   - Subscription Group: Premium Access
   - Duration: 1 Month
   - Price: $2.99

5. Create **Non-Consumable**:
   - Reference Name: Lifetime Premium Access
   - Product ID: `com.manifestationalarm.app.lifetime`
   - Price: $29.99

### Step 2: Add to RevenueCat

1. In RevenueCat dashboard, go to **Integrations → Apple App Store**
2. Enter your App Store Connect credentials
3. Link the products you created

---

## Part 3: Google Play Console Setup (Android)

### Step 1: Create Products

1. Go to https://play.google.com/console/
2. Select "Manifestation Alarm"
3. Go to **Monetize → Products → Subscriptions**
4. Create subscription:
   - Product ID: `monthly`
   - Name: Monthly Premium Subscription
   - Description: Full access to all premium features
   - Billing period: 1 Month
   - Price: $2.99

5. Go to **Monetize → Products → In-app products**
6. Create in-app product:
   - Product ID: `lifetime`
   - Name: Lifetime Premium Access
   - Description: One-time payment for unlimited access
   - Price: $29.99

### Step 2: Link to RevenueCat

1. In RevenueCat dashboard, go to **Integrations → Google Play**
2. Upload your Google Play service account JSON
3. Link the products

---

## Part 4: Code Implementation

### File 1: Update `.env` (Create if doesn't exist)

```bash
# RevenueCat API Keys
REVENUECAT_IOS_API_KEY=your_ios_api_key_here
REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
```

### File 2: Updated `SubscriptionService.ts`

The new service uses RevenueCat for real purchases. Key changes:

1. **Initialization**: Calls `Purchases.configure()` with API keys
2. **Purchase Flow**: Uses `Purchases.purchasePackage()`
3. **Restore Purchases**: Uses `Purchases.restorePurchases()`
4. **Entitlement Check**: Uses `Purchases.getCustomerInfo()` to check active subscriptions

### File 3: Update `SubscriptionScreen.tsx`

Add these features:

1. **Restore Purchases Button** (required by Apple):
```typescript
<TouchableOpacity onPress={handleRestorePurchases}>
  <Text>Restore Purchases</Text>
</TouchableOpacity>
```

2. **Real Purchase Flow**:
```typescript
const handlePurchase = async (packageType: 'monthly' | 'lifetime') => {
  const packages = await SubscriptionService.getAvailablePackages();
  const selectedPackage = packages.find(p =>
    p.product.identifier.includes(packageType)
  );

  if (selectedPackage) {
    const result = await SubscriptionService.purchasePackage(selectedPackage);
    if (result.success) {
      Alert.alert('Success', 'Subscription activated!');
    }
  }
};
```

---

## Part 5: Testing

### iOS Testing

1. **Set up Sandbox Tester**:
   - Go to App Store Connect → Users and Access → Sandbox Testers
   - Create a test account

2. **Test on Physical Device**:
   - Build app with `eas build --platform ios --profile production`
   - Install on device via TestFlight
   - Sign out of App Store
   - Sign in with sandbox tester account
   - Test purchases

### Android Testing

1. **Add Test Account**:
   - Go to Google Play Console → Settings → License Testing
   - Add your Gmail account as test account

2. **Test with Internal Testing Track**:
   - Upload AAB to internal testing
   - Join internal testing with your test account
   - Download and test purchases

---

## Part 6: Important Apple Requirements

### 1. Restore Purchases (REQUIRED)

Every iOS app with purchases must have a "Restore Purchases" button. This allows users to restore their purchases on new devices.

**Implementation:**
```typescript
const handleRestorePurchases = async () => {
  const result = await SubscriptionService.restorePurchases();
  if (result.success) {
    Alert.alert('Success', 'Your purchases have been restored!');
  } else {
    Alert.alert('No Purchases', 'No previous purchases found.');
  }
};
```

### 2. Terms & Privacy

Ensure you have:
- Privacy Policy URL in app.config.js
- Terms of Service URL
- Links displayed on subscription screen

### 3. Subscription Management

Users manage subscriptions via iOS Settings, not in-app. Add text like:
> "Manage your subscription in iOS Settings → Apple ID → Subscriptions"

---

## Next Steps

1. ✅ Create RevenueCat account
2. ✅ Set up products in App Store Connect / Google Play Console
3. ✅ Configure products in RevenueCat
4. ✅ Add API keys to code
5. ✅ Update SubscriptionService with new implementation
6. ✅ Add "Restore Purchases" button to UI
7. ✅ Test with sandbox accounts
8. ✅ Submit to App Store / Play Store

---

## Quick Implementation Checklist

- [ ] RevenueCat account created
- [ ] Products configured in App Store Connect
- [ ] Products configured in Google Play Console
- [ ] Products linked in RevenueCat
- [ ] API keys added to code
- [ ] SubscriptionService updated
- [ ] Restore Purchases button added
- [ ] Tested on iOS with sandbox account
- [ ] Tested on Android with test account
- [ ] Privacy policy and terms added to UI

---

## Need Help?

- RevenueCat Docs: https://docs.revenuecat.com/
- RevenueCat React Native Guide: https://docs.revenuecat.com/docs/reactnative
- Apple Subscriptions Guide: https://developer.apple.com/app-store/subscriptions/
- Google Play Billing: https://developer.android.com/google/play/billing
