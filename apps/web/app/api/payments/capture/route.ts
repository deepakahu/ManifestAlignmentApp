import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { capturePayment } from '@/lib/stripe/payments'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId } = body

    if (!challengeId) {
      return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 })
    }

    // Get challenge with payment intent
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('creator_id, payment_intent_id, status')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only challenge creator can activate' }, { status: 403 })
    }

    if (!challenge.payment_intent_id) {
      return NextResponse.json({ error: 'No payment intent found for this challenge' }, { status: 400 })
    }

    if (challenge.status !== 'draft') {
      return NextResponse.json({ error: 'Can only capture payment for draft challenges' }, { status: 400 })
    }

    // Capture the payment
    await capturePayment(challenge.payment_intent_id)

    // Update challenge status to active
    await supabase
      .from('challenges')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', challengeId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error capturing payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
