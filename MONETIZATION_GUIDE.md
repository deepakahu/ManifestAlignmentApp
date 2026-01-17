# Monetization System - Complete Guide

## Overview

The app now includes a full-featured monetization system with:
- **2-week free trial** from install date
- **Monthly subscription** at $2.99/month
- **Lifetime access** at $29.99 (one-time payment)
- **Coupon system** for 2-6 months free access
- All pricing and coupons configured in a central config file

## System Components

### 1. Configuration File
**Location:** `src/config/monetization.config.ts`

Contains all hardcoded values:
```typescript
TRIAL_DURATION_DAYS: 14

PLANS:
  - Monthly: $2.99/month
  - Lifetime: $29.99 one-time

COUPONS:
  - WELCOME2024: 2 months free
  - MANIFEST3: 3 months free
  - EARLYBIRD4: 4 months free
  - PREMIUM6: 6 months free
  - BETA2025: 3 months free

FREE_TIER_LIMITS:
  - Max Alarms: 3
  - Max Manifestations: 5
  - Statistics: Last 7 days only
```

### 2. Subscription Service
**Location:** `src/services/SubscriptionService.ts`

Manages subscription state, trial tracking, and coupon validation:
- `initialize()` - Set install date on first launch
- `getSubscriptionData()` - Get current subscription status
- `hasPremiumAccess()` - Check if user has premium features
- `applyCoupon(code)` - Redeem coupon code
- `activateMonthlySubscription()` - Activate monthly subscription
- `activateLifetimeSubscription()` - Activate lifetime access

### 3. UI Components

#### PaywallModal
**Location:** `src/components/PaywallModal.tsx`

Beautiful subscription paywall showing:
- Premium feature list
- Monthly vs Lifetime plans
- Savings calculation
- "Best Value" badge on lifetime plan

#### PremiumGuard
**Location:** `src/components/PremiumGuard.tsx`

Wraps premium features and shows upgrade prompt for free users:
```typescript
<PremiumGuard featureName="Custom Sounds">
  <YourPremiumContent />
</PremiumGuard>
```

#### SubscriptionScreen
**Location:** `src/screens/Settings/SubscriptionScreen.tsx`

Full subscription management screen with:
- Current status display
- Premium features list
- Coupon redemption
- Subscription plan details

### 4. Integration

**App.tsx:**
- Initializes subscription service on launch
- Sets install date for trial tracking

**Settings Screen:**
- Added "Manage Subscription" button

**Navigation:**
- Added Subscription route

## How It Works

### Trial System

1. **First Launch:**
   - App detects no install date
   - Sets current date as install date
   - Trial starts (14 days)

2. **During Trial:**
   - User has full premium access
   - Can see days remaining
   - No payment required

3. **Trial Expiration:**
   - Premium features locked
   - Paywall shown when accessing premium features
   - User prompted to subscribe

### Subscription Flow

1. **User Views Plans:**
   - Opens Settings → Manage Subscription
   - Sees current status (trial, active, or expired)
   - Reviews monthly vs lifetime options

2. **User Subscribes:**
   - Selects plan (monthly or lifetime)
   - Completes payment (to be integrated with stores)
   - Subscription activated immediately

3. **Premium Access Granted:**
   - All premium features unlocked
   - No more paywalls
   - Status shows "Premium Active"

### Coupon System

1. **User Has Coupon:**
   - Opens Settings → Manage Subscription
   - Enters coupon code (e.g., "PREMIUM6")
   - Taps "Apply"

2. **Validation:**
   - System checks if code exists
   - Checks if code is active
   - Checks if user already has coupon

3. **Activation:**
   - Coupon duration added (2-6 months)
   - Expiry date calculated
   - Premium access granted
   - Status shows "Coupon Active - X days remaining"

## Configuration

### To Add New Coupon Code:

Edit `src/config/monetization.config.ts`:

```typescript
COUPONS: [
  // ... existing coupons
  {
    code: 'NEWCODE2025',
    durationMonths: 3,
    description: '3 months free access',
    isActive: true,
  },
]
```

### To Change Pricing:

Edit `src/config/monetization.config.ts`:

```typescript
PLANS: {
  MONTHLY: {
    price: 2.99, // Change this
    // ... other config
  },
  LIFETIME: {
    price: 29.99, // Change this
    // ... other config
  },
}
```

### To Change Trial Duration:

Edit `src/config/monetization.config.ts`:

```typescript
TRIAL_DURATION_DAYS: 14, // Change this (e.g., 7, 30)
```

### To Disable a Coupon:

Set `isActive: false`:

```typescript
{
  code: 'OLDCODE',
  durationMonths: 2,
  description: '2 months free',
  isActive: false, // Coupon disabled
}
```

## Premium Features

Currently configured premium features:
1. **Unlimited Alarms** (Free: Max 3)
2. **Custom Sounds** for alarms
3. **Advanced Statistics** (Free: Last 7 days only)
4. **Data Export**
5. **Cloud Backup**
6. **Ad-Free Experience**

To add premium-only features, wrap with PremiumGuard:

```typescript
import { PremiumGuard } from '../components/PremiumGuard';

<PremiumGuard featureName="Advanced Analytics">
  <AdvancedAnalyticsComponent />
</PremiumGuard>
```

Or check programmatically:

```typescript
import { SubscriptionService } from '../services/SubscriptionService';

const hasPremium = await SubscriptionService.hasPremiumAccess();
if (!hasPremium) {
  // Show upgrade prompt
}
```

## Next Steps - In-App Purchases

Currently, subscriptions are simulated (for testing). To integrate real payments:

### For Google Play (Android):
1. Install `expo-in-app-purchases`:
   ```bash
   npx expo install expo-in-app-purchases
   ```

2. Configure products in Google Play Console
3. Update PaywallModal to use real purchase flow
4. Handle purchase callbacks
5. Verify receipts

### For App Store (iOS):
1. Same package: `expo-in-app-purchases`
2. Configure products in App Store Connect
3. Same integration as Android
4. Handle App Store receipts

### Alternative: Use RevenueCat
For easier cross-platform management:
1. Install `@revenuecat/purchases-typescript`
2. Configure products in RevenueCat dashboard
3. Single API for both platforms
4. Built-in receipt validation

## Testing

### Test Trial:
1. Clear app data
2. Reinstall app
3. Verify trial shows "14 days remaining"
4. Check premium features accessible

### Test Coupons:
1. Go to Settings → Manage Subscription
2. Enter code: `PREMIUM6`
3. Verify "6 months free access" message
4. Check status shows "Coupon Active"

### Test Subscription (Simulated):
1. Let trial expire (or clear install date)
2. Try accessing premium feature
3. Paywall should appear
4. Select plan and subscribe
5. Verify premium access granted

### Reset for Testing:
Add this to Settings screen (dev only):

```typescript
import { SubscriptionService } from '../services/SubscriptionService';

// Dev only - reset all subscription data
await SubscriptionService.clearAllData();
```

## Subscription States

The system tracks these states:
- **trial**: Active free trial
- **trial_expired**: Trial ended, no subscription
- **active_monthly**: Paid monthly subscription
- **active_lifetime**: Lifetime access purchased
- **active_coupon**: Coupon-based access
- **expired**: All access expired

## User Experience Flow

### New User:
1. Downloads app
2. Sees "Free trial - 14 days remaining"
3. Gets full premium access
4. Reminded of trial expiry
5. Prompted to subscribe before expiry

### Returning User (Trial Expired):
1. Opens app
2. Sees features locked
3. Taps premium feature
4. Paywall appears
5. Subscribes to continue

### User with Coupon:
1. Opens Settings
2. Enters coupon code
3. Gets X months free
4. Enjoys premium features
5. Prompted to subscribe when coupon expires

## Best Practices

1. **Show Value Early**: Let users experience premium features during trial
2. **Clear Communication**: Always show days remaining
3. **Gentle Prompts**: Don't spam with upgrade prompts
4. **Easy Access**: "Manage Subscription" always available in Settings
5. **Transparent Pricing**: Show both monthly and lifetime clearly
6. **Highlight Savings**: "Save 75% with lifetime" messaging

## Support & Troubleshooting

### User Can't Apply Coupon:
- Check if code is spelled correctly (case-insensitive)
- Verify code is active in config
- Check if user already has active coupon

### Trial Not Starting:
- Ensure `SubscriptionService.initialize()` called in App.tsx
- Check AsyncStorage permissions
- Verify install date is set

### Premium Features Not Unlocking:
- Check subscription status with diagnostics
- Verify payment completed (for real purchases)
- Check if trial/coupon/subscription is active

## Files Modified/Created

### Created:
- `src/config/monetization.config.ts` - All pricing/coupons
- `src/services/SubscriptionService.ts` - Subscription logic
- `src/components/PaywallModal.tsx` - Paywall UI
- `src/components/PremiumGuard.tsx` - Feature guard
- `src/screens/Settings/SubscriptionScreen.tsx` - Management screen

### Modified:
- `App.tsx` - Initialize subscription service
- `src/screens/Settings/SettingsScreen.tsx` - Added subscription link
- `src/navigation/AppNavigator.tsx` - Added subscription route

## Analytics & Metrics

Consider tracking:
- Trial conversion rate
- Coupon redemption rate
- Monthly vs Lifetime preference
- Churn rate
- Lifetime value (LTV)

Add analytics calls:
- Trial started
- Trial expiring (7 days, 3 days, 1 day)
- Subscription purchased
- Coupon redeemed
- Subscription cancelled

## FAQ

**Q: How do I change trial duration?**
A: Edit `TRIAL_DURATION_DAYS` in `monetization.config.ts`

**Q: Can users have both coupon and subscription?**
A: No, subscription takes precedence. Coupon expires when subscription activates.

**Q: What happens when monthly subscription expires?**
A: User loses premium access. Must renew to continue.

**Q: Can I offer different prices per country?**
A: Yes, but requires store-level configuration in Google Play/App Store.

**Q: How do I track subscription revenue?**
A: Use Google Play Console, App Store Connect, or RevenueCat analytics.

**Q: Can free users still use the app?**
A: Yes! They get limited features (3 alarms, 5 manifestations, 7-day stats).

**Q: How do I test in-app purchases?**
A: Use test accounts in Google Play Console and App Store Connect sandbox.

## Conclusion

The monetization system is fully implemented and ready for testing. To go live:
1. Test thoroughly with simulated purchases
2. Integrate real in-app purchase API
3. Submit to app stores
4. Monitor analytics
5. Iterate based on conversion data

All pricing and features are easily configurable in the central config file!
