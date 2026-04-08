import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to fetch user data
    const admin = createAdminClient()

    // Get user from auth
    const { data: { user: authUser }, error } = await admin.auth.admin.getUserById(userId)
    if (error || !authUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get profile
    const { data: profile } = await admin
      .from('profiles')
      .select('is_active, disabled_at, disabled_by')
      .eq('id', userId)
      .single()

    // Get categories
    const { data: categoriesData } = await admin
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get goals
    const { data: goalsData } = await admin
      .from('goals')
      .select('*, category:categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get activities
    const { data: activitiesData } = await admin
      .from('discipline_activities')
      .select('*, goal:goals(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get challenges
    const { data: challengesData } = await admin
      .from('challenges')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    const userData = {
      id: authUser.id,
      email: authUser.email || 'No email',
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at || null,
      is_active: profile?.is_active ?? true,
      disabled_at: profile?.disabled_at ?? null,
      disabled_by: profile?.disabled_by ?? null,
    }

    return NextResponse.json({
      user: userData,
      categories: categoriesData || [],
      goals: goalsData || [],
      activities: activitiesData || [],
      challenges: challengesData || [],
    })
  } catch (error) {
    console.error('Error in /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await req.json()

    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Handle different update types
    if (body.action === 'toggle_status') {
      await admin
        .from('profiles')
        .upsert({
          id: userId,
          is_active: body.is_active,
          disabled_at: body.is_active ? null : new Date().toISOString(),
          disabled_by: body.is_active ? null : 'admin',
        })
    } else if (body.action === 'delete_data') {
      const tableMap: Record<string, string> = {
        categories: 'categories',
        goals: 'goals',
        activities: 'discipline_activities',
        challenges: 'challenges',
      }

      const table = tableMap[body.dataType]
      if (!table) {
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
      }

      await admin
        .from(table)
        .delete()
        .eq(body.dataType === 'challenges' ? 'creator_id' : 'user_id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Delete all user data
    await Promise.all([
      admin.from('categories').delete().eq('user_id', userId),
      admin.from('goals').delete().eq('user_id', userId),
      admin.from('discipline_activities').delete().eq('user_id', userId),
      admin.from('challenges').delete().eq('creator_id', userId),
      admin.from('profiles').delete().eq('id', userId),
    ])

    // Delete auth user
    await admin.auth.admin.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
