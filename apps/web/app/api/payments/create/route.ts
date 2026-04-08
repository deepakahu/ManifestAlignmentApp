import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChallengePayment, CreateChallengePaymentParams } from '@/lib/stripe/payments'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, stakeAmountCents, currency, challengeTitle } = body

    // Validate required fields
    if (!challengeId || !stakeAmountCents || !currency || !challengeTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, stakeAmountCents, currency, challengeTitle' },
        { status: 400 }
      )
    }

    // Verify user owns this challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('creator_id, status')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creator_id !== user.id) {
      return NextResponse.json({ error: 'You can only create payments for your own challenges' }, { status: 403 })
    }

    if (challenge.status !== 'draft') {
      return NextResponse.json({ error: 'Can only create payments for draft challenges' }, { status: 400 })
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    // Create payment intent
    const params: CreateChallengePaymentParams = {
      challengeId,
      userId: user.id,
      stakeAmountCents,
      currency,
      userEmail: user.email || '',
      userName: profile?.full_name,
      challengeTitle,
    }

    const paymentResult = await createChallengePayment(params)

    // Update challenge with payment intent ID
    await supabase
      .from('challenges')
      .update({ payment_intent_id: paymentResult.paymentIntentId })
      .eq('id', challengeId)

    return NextResponse.json(paymentResult)
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}
