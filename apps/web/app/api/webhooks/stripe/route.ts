import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        // Update challenge payment status
        if (paymentIntent.metadata.challengeId) {
          await admin
            .from('challenges')
            .update({ payment_status: 'paid' })
            .eq('id', paymentIntent.metadata.challengeId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)

        // Update challenge payment status
        if (paymentIntent.metadata.challengeId) {
          await admin
            .from('challenges')
            .update({ payment_status: 'failed' })
            .eq('id', paymentIntent.metadata.challengeId)
        }
        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment canceled:', paymentIntent.id)

        // Update challenge payment status
        if (paymentIntent.metadata.challengeId) {
          await admin
            .from('challenges')
            .update({ payment_status: 'canceled' })
            .eq('id', paymentIntent.metadata.challengeId)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Charge refunded:', charge.id)

        // Find challenge by payment intent
        if (charge.payment_intent) {
          const { data: challenge } = await admin
            .from('challenges')
            .select('id')
            .eq('payment_intent_id', charge.payment_intent)
            .single()

          if (challenge) {
            await admin
              .from('challenges')
              .update({ payment_status: 'refunded' })
              .eq('id', challenge.id)
          }
        }
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        console.log('Transfer created:', transfer.id)

        // Log transfer for audit trail
        if (transfer.metadata.challengeId) {
          await admin.from('payment_transactions').insert({
            challenge_id: transfer.metadata.challengeId,
            payment_intent_id: transfer.metadata.paymentIntentId,
            amount: transfer.amount,
            currency: transfer.currency,
            status: 'transferred',
            transfer_id: transfer.id,
            completed_at: new Date().toISOString(),
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
