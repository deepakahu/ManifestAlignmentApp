# Stripe Payment Integration

Complete guide for integrating Stripe payments into the challenge system with 7.5% platform fee and automatic tax calculation.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Payment Flow](#payment-flow)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Tax Handling](#tax-handling)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Overview

The Stripe integration enables:

- **Challenge Stakes**: Users put money on the line to commit to challenges
- **Platform Fee**: 7.5% service fee on all stakes
- **Automatic Tax**: Stripe Tax API calculates sales tax/VAT/GST automatically
- **Escrow-like Holding**: Funds held until challenge completes (up to 90 days)
- **Success Refund**: Stake refunded if user completes challenge
- **Failure Transfer**: Stake transferred based on failure consequence:
  - **Charity**: Transfer to charitable organization
  - **Accountability Partner**: Transfer to user's partner
  - **Platform**: Platform keeps the stake
  - **Anti-Charity**: Transfer to cause user opposes (motivation through aversion)

### Fee Structure

```
User Stake:           $100.00
Platform Fee (7.5%):  $  7.50
Subtotal:             $107.50
Tax (auto-calculated): $  8-12 (varies by location)
────────────────────────────
Total Charged:        $115-120
```

**On Success**: User gets $100 back, platform keeps $7.50 + tax
**On Failure**: Based on consequence setting, platform keeps $7.50 in all cases

---

## Setup

### 1. Install Stripe Package

```bash
cd apps/web
npm install stripe @stripe/stripe-js
```

### 2. Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or sign in
3. Navigate to **Developers → API Keys**
4. Copy the following keys:
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### 3. Enable Stripe Tax

1. In Stripe Dashboard, go to **Settings → Tax**
2. Click **Enable Stripe Tax**
3. Add your business information (required for tax compliance)
4. Select tax regions you operate in
5. Configure tax collection settings

**Cost**: Stripe Tax costs 0.5% per transaction (0.4% if >$100K/month volume)

### 4. Set Up Webhook

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `transfer.created`
5. Copy the **Signing Secret** (starts with `whsec_`)

### 5. Configure Environment Variables

Add to `/apps/web/.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

⚠️ **IMPORTANT**:
- Never commit secret keys to git
- Use test keys (`sk_test_`, `pk_test_`) during development
- Use live keys (`sk_live_`, `pk_live_`) only in production

### 6. Run Database Migration

```bash
cd /path/to/ManifestExpo
supabase db reset  # Or apply migration manually
```

This adds payment-related columns to the `challenges` table and creates `payment_transactions` table.

---

## Payment Flow

### Step 1: Create Payment Intent (Draft Challenge)

When user creates a challenge with a prize/stake amount:

```typescript
// Frontend call (web or mobile)
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challengeId: 'uuid',
    stakeAmountCents: 10000, // $100.00
    currency: 'USD',
    challengeTitle: 'Exercise 30 days',
  }),
})

const { clientSecret, paymentIntentId, amount, platformFee, estimatedTotal } = await response.json()

// clientSecret is used to complete payment on frontend with Stripe Elements
```

**What Happens**:
1. Payment Intent created with `capture_method: 'manual'`
2. Funds authorized but NOT captured yet
3. Challenge remains in `draft` status
4. User completes payment on frontend using Stripe Elements
5. Challenge updated with `payment_intent_id`

### Step 2: Activate Challenge (Capture Payment)

When user activates the challenge (starts it):

```typescript
const response = await fetch('/api/payments/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ challengeId: 'uuid' }),
})

// Payment captured, funds now held by platform
// Challenge status changes to 'active'
// Challenge start_date and started_at set
```

**What Happens**:
1. Payment captured (funds taken from user's card)
2. Challenge status changed to `active`
3. User cannot edit challenge anymore (based on urgency level)
4. Challenge begins tracking

### Step 3: Complete Challenge (Refund or Transfer)

When challenge ends:

```typescript
// Backend cron job or manual trigger
import { processChallengeCompletion } from '@/lib/stripe/payments'

await processChallengeCompletion(challengeId, succeeded: true) // User succeeded
// OR
await processChallengeCompletion(challengeId, succeeded: false) // User failed
```

**If User Succeeded**:
1. Refund stake to user ($100)
2. Platform keeps service fee ($7.50) + tax
3. Challenge status → `completed`

**If User Failed**:
1. Based on `failure_consequence`:
   - **Charity**: Transfer $100 to charity's Stripe Connect account
   - **Partner**: Transfer $100 to partner's Stripe Connect account
   - **Platform**: Platform keeps everything
   - **Anti-Charity**: Transfer $100 to anti-charity
2. Platform keeps service fee ($7.50) + tax in all cases
3. Challenge status → `failed`

---

## API Endpoints

### POST `/api/payments/create`

Create payment intent for a challenge stake.

**Request**:
```json
{
  "challengeId": "uuid",
  "stakeAmountCents": 10000,
  "currency": "USD",
  "challengeTitle": "Exercise 30 days"
}
```

**Response**:
```json
{
  "paymentIntentId": "pi_xxx",
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 10000,
  "currency": "USD",
  "platformFee": 750,
  "estimatedTotal": 10750
}
```

**Security**: Requires authentication, verifies user owns challenge

---

### POST `/api/payments/capture`

Capture payment and activate challenge.

**Request**:
```json
{
  "challengeId": "uuid"
}
```

**Response**:
```json
{
  "success": true
}
```

**Security**: Requires authentication, only creator can activate

---

### POST `/api/webhooks/stripe`

Webhook handler for Stripe events.

**Events Handled**:
- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment canceled
- `charge.refunded`: Refund processed
- `transfer.created`: Transfer to charity/partner completed

**Security**: Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`

---

## Database Schema

### `challenges` Table (Updated)

```sql
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status challenge_status DEFAULT 'draft',
  prize_amount decimal(10,2) DEFAULT 0.00,
  prize_currency text DEFAULT 'USD',

  -- Payment fields (NEW)
  payment_intent_id text,
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),

  -- Challenge lifecycle (NEW)
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,

  -- Prize mechanics (NEW)
  urgency_level text CHECK (urgency_level IN ('critical', 'high', 'medium')) DEFAULT 'medium',
  failure_consequence text CHECK (failure_consequence IN ('charity', 'partner', 'platform', 'anti-charity')),

  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### `payment_transactions` Table (New)

```sql
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES challenges(id),
  payment_intent_id text NOT NULL,
  amount integer NOT NULL, -- Amount in cents
  platform_fee integer, -- Platform fee in cents
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'transferred')),
  transfer_id text, -- Stripe transfer ID if transferred
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## Tax Handling

### How Stripe Tax Works

1. **Automatic Calculation**: Stripe Tax automatically calculates correct tax based on:
   - Customer's location (IP address, billing address)
   - Product type (digital service in this case)
   - Local tax rates (sales tax, VAT, GST)

2. **What You Need to Do**:
   - Enable Stripe Tax in dashboard
   - Add your business information
   - Set tax collection regions
   - Stripe handles the rest (calculation, collection, filing, remittance)

3. **Tax Display**:
   ```
   Stake:         $100.00
   Platform Fee:  $  7.50
   Subtotal:      $107.50
   Tax:           $  9.68  (calculated by Stripe)
   ────────────────────────
   Total:         $117.18
   ```

4. **Cost**: 0.5% per transaction (0.4% if >$100K/month)

### Alternative: Manual Tax Calculation

If you don't want to use Stripe Tax:

1. Remove `automatic_tax: { enabled: true }` from Payment Intent creation
2. Calculate tax manually based on user's location
3. Include tax in the amount charged
4. Handle tax filing/remittance yourself (complex, not recommended)

---

## Testing

### Test Cards

Use Stripe's test cards in development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC.

### Test Payment Flow

1. Create a challenge with prize amount
2. Call `/api/payments/create`
3. Use Stripe Elements on frontend to complete payment
4. Verify challenge status and payment_intent_id updated
5. Call `/api/payments/capture` to activate
6. Verify payment captured and challenge active
7. Test completion scenarios:
   - Success: Call `processChallengeCompletion(id, true)` → Check refund
   - Failure: Call `processChallengeCompletion(id, false)` → Check transfer

### Test Webhooks Locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Replace test keys with live keys in production environment
- [ ] Enable Stripe Tax in production Stripe account
- [ ] Configure production webhook endpoint
- [ ] Set up tax regions and business information
- [ ] Test with real (small amount) payments
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for payment events
- [ ] Review Stripe Dashboard regularly

### Environment Variables (Production)

```bash
# Use live keys (sk_live_, pk_live_)
STRIPE_SECRET_KEY=sk_live_your_production_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
```

### Security Best Practices

1. **Never log sensitive data** (card numbers, secrets)
2. **Use HTTPS** for all API calls
3. **Verify webhook signatures** (already implemented)
4. **Monitor for suspicious activity** in Stripe Dashboard
5. **Set up fraud detection** rules in Stripe
6. **Implement rate limiting** on payment endpoints
7. **Use environment variables** for all keys (never hardcode)

### Monitoring

Track these metrics:
- Payment success rate
- Failed payment reasons
- Refund volume
- Average stake amount
- Platform fee revenue
- Tax collected by region

---

## Future Enhancements

- [ ] Stripe Connect integration for charities/partners
- [ ] Recurring challenges with subscriptions
- [ ] Group challenges with split payments
- [ ] Payment disputes handling
- [ ] Partial refunds for partial completion
- [ ] Multiple payment methods (Apple Pay, Google Pay)
- [ ] Invoicing for enterprise users
- [ ] Payment analytics dashboard

---

## Support

### Stripe Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Tax Docs](https://stripe.com/docs/tax)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### Common Issues

**Q: Payment Intent creation fails with "invalid currency"**
A: Ensure currency is lowercase ('usd' not 'USD')

**Q: Webhook signature verification fails**
A: Check that `STRIPE_WEBHOOK_SECRET` is set correctly

**Q: Tax not calculating**
A: Verify Stripe Tax is enabled and business information is complete

**Q: Can't capture payment**
A: Payment Intent must be in `requires_capture` status, check Stripe Dashboard

---

## Example Integration (Frontend)

```typescript
// Example: Payment completion on frontend using Stripe Elements
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/challenges/payment-success`,
      },
    })

    if (error) {
      console.error('Payment failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  )
}

// In your component
function ChallengePayment({ challengeId, amount }: Props) {
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    // Create payment intent
    fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        stakeAmountCents: amount * 100,
        currency: 'USD',
        challengeTitle: 'My Challenge',
      }),
    })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret))
  }, [challengeId, amount])

  if (!clientSecret) return <div>Loading...</div>

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
```

---

**Last Updated**: 2026-04-08
**Version**: 1.0
