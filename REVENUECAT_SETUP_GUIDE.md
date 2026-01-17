# RevenueCat Payment Setup Guide

## Current Status

✅ **Payment Integration Complete** - The code is fully implemented and ready to accept real payments once you configure RevenueCat.

**What's Working:**
- Payment UI (Subscription screen + Paywall modal)
- Purchase flow (Monthly + Lifetime)
- Restore purchases functionality
- Test/mock mode (works without RevenueCat configured)
- Error handling and user feedback

**What's Needed:**
- RevenueCat account setup
- Google Play product creation
- API key configuration

---

## Step 1: Create RevenueCat Account

1. Go to https://app.revenuecat.com/
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Log in to the RevenueCat dashboard

**Why RevenueCat?**
- Simplifies in-app purchases across iOS and Android
- Handles subscription management automatically
- Provides analytics and webhooks
- Free tier supports up to $2,500 in tracked revenue/month

---

## Step 2: Create Project in RevenueCat

1. In the RevenueCat dashboard, click **"Create new app"**
2. Enter app name: **"Manifestation Alarm"**
3. Select **"Google Play"** as the store
4. Enter package name: **`com.manifestationalarm.app`**

---

## Step 3: Configure Google Play Integration

### A. Create Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (if you don't have one) or select existing
3. Go to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "Service Account"**
5. Name it: **"RevenueCat Integration"**
6. Grant role: **"Service Account User"**
7. Click **"Done"**

### B. Create JSON Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key" → "Create new key"**
4. Select **"JSON"** format
5. Download the JSON file (keep it secure!)

### C. Link Google Play to Service Account

1. Go to [Google Play Console](https://play.google.com/console/)
2. Go to **Users and permissions → Service accounts**
3. Click **"Grant access"**
4. Paste the email from the JSON file (looks like: xxx@xxx.iam.gserviceaccount.com)
5. Grant these permissions:
   - **Financial data, orders, and subscriptions**: View only
   - Click **"Invite user"**

### D. Upload JSON to RevenueCat

1. Back in RevenueCat dashboard
2. Go to your app → **Service credentials**
3. Click **"Add new service credential"**
4. Upload the JSON file you downloaded
5. Click **"Save"**

---

## Step 4: Create Products in Google Play Console

### A. Navigate to In-App Products

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app: **"Manifestation Alarm"**
3. Go to **Monetization → In-app products**

### B. Create Monthly Subscription

1. Click **"Create subscription"**
2. Fill in details:
   - **Product ID**: `monthly` (MUST match exactly)
   - **Name**: Monthly Premium Subscription
   - **Description**: Full access to all premium features with monthly billing
3. Add base plan:
   - **Plan ID**: `monthly-standard`
   - **Billing period**: 1 month
   - **Price**: $2.99 USD
   - **Grace period**: 3 days (optional)
   - **Free trial**: 14 days (optional, recommended)
4. Click **"Activate"**

### C. Create Lifetime Access

1. Click **"Create product"** (one-time purchase)
2. Fill in details:
   - **Product ID**: `lifetime` (MUST match exactly)
   - **Name**: Lifetime Premium Access
   - **Description**: One-time payment for unlimited lifetime access to all premium features
   - **Price**: $29.99 USD
3. Click **"Activate"**

**IMPORTANT**: Product IDs MUST match what's configured in [monetization.config.ts:46-59](src/config/monetization.config.ts#L46-L59)

---

## Step 5: Configure Entitlements in RevenueCat

1. In RevenueCat dashboard, go to **Entitlements**
2. Click **"+ New"**
3. Create entitlement:
   - **Identifier**: `premium` (MUST match exactly)
   - **Description**: Premium feature access
4. Click **"Save"**

5. Attach products to entitlement:
   - Click on the **"premium"** entitlement
   - Click **"Attach"**
   - Select both products:
     - `monthly`
     - `lifetime`
   - Click **"Save"**

---

## Step 6: Get RevenueCat API Keys

1. In RevenueCat dashboard, go to **API keys**
2. Find **"Google Play"** section
3. Copy the API key (looks like: `goog_AbCdEf1234567890`)

---

## Step 7: Configure API Keys in Your App

### Option A: Using .env file (Recommended)

1. Create `.env` file in project root (if not exists):
```bash
# RevenueCat API Keys
REVENUECAT_ANDROID_API_KEY=goog_your_actual_key_here
REVENUECAT_IOS_API_KEY=appl_your_actual_key_here
```

2. Add `.env` to `.gitignore` (should already be there)

### Option B: Directly in config file (NOT recommended for production)

Edit [src/config/revenuecat.config.ts:22](src/config/revenuecat.config.ts#L22):
```typescript
ANDROID_API_KEY: 'goog_your_actual_key_here',
```

---

## Step 8: Test Your Payment Integration

### A. Set Up Internal Testing Track

1. Go to Google Play Console
2. Go to **Testing → Internal testing**
3. Create new release:
   - Upload your AAB file (from EAS build)
   - Add release notes
   - Click **"Save"** and **"Review release"**
   - Click **"Start rollout to Internal testing"**

### B. Add Test Accounts

1. Go to **Testing → License testing**
2. Add test Gmail accounts under **"License testers"**
3. These accounts can make test purchases (won't be charged)

### C. Install and Test

1. Share the internal testing link with your test account
2. Install the app on Android device
3. Sign in with the test account
4. Navigate to **Settings → Subscription**
5. Click **"Upgrade to Premium"**
6. Select a plan (Monthly or Lifetime)
7. Click subscribe button

**Expected behavior:**
- Google Play purchase dialog should appear
- Select payment method
- Complete purchase (test accounts won't be charged)
- Success message should appear
- Premium features should unlock immediately

---

## Step 9: Rebuild the App

After configuring API keys, rebuild the app:

```bash
# Increment version
# Edit app.config.js: version 1.0.12 → 1.0.13, versionCode 13 → 14

# Rebuild with EAS
eas build --platform android --profile production
```

---

## Troubleshooting

### "Payment system not configured" message
- API keys not set in .env file
- App needs to be rebuilt after adding API keys
- Check console logs for RevenueCat initialization errors

### "No subscription plans available"
- Products not created in Google Play Console
- Product IDs don't match config
- RevenueCat service credentials not configured
- Wait 2-4 hours after creating products (Google Play sync delay)

### Purchase fails with error
- Test account not added to license testing
- App not published to internal testing track
- Products not activated in Google Play Console
- Service account permissions incomplete

### "No purchases found to restore"
- User hasn't made any purchases yet
- Signed in with different Google account
- Purchases were made on different app (package name mismatch)

---

## Cost Structure

### RevenueCat Pricing
- **Free tier**: Up to $2,500 tracked revenue/month
- **Starter**: $299/month for $10k tracked revenue
- **Growth**: Custom pricing

### Google Play Fees
- **15%** service fee for first $1M revenue per year
- **30%** service fee after $1M
- For subscriptions: 15% ongoing (after first year: reduced to 10%)

---

## Production Checklist

Before launching to production:

- [ ] RevenueCat account created and configured
- [ ] Google Play service account linked
- [ ] Products created and activated in Google Play Console
- [ ] Entitlements configured in RevenueCat
- [ ] API keys added to .env file
- [ ] App rebuilt with production API keys
- [ ] Internal testing completed successfully
- [ ] Test purchases working correctly
- [ ] Restore purchases working correctly
- [ ] Premium features unlock after purchase
- [ ] Subscription status persists across app restarts
- [ ] Privacy policy updated with payment terms
- [ ] Terms of service updated
- [ ] App published to production track

---

## Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [RevenueCat React Native Guide](https://docs.revenuecat.com/docs/reactnative)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

## Support

If you encounter issues:

1. Check RevenueCat dashboard for errors
2. Review Google Play Console for product status
3. Check app logs for RevenueCat initialization
4. Contact RevenueCat support (very responsive)
5. Review [revenuecat.config.ts](src/config/revenuecat.config.ts) for detailed setup instructions
