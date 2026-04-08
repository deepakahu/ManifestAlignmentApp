import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user is admin
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('is_admin')
    //   .eq('user_id', user.id)
    //   .single()
    //
    // if (!profile?.is_admin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Use admin client to fetch all users
    const admin = createAdminClient()

    // Get all users from auth
    const { data: { users: authUsers }, error: usersError } = await admin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    // Get all profiles
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, is_active, disabled_at')

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Merge auth users with profile data
    const mergedUsers = authUsers.map(user => {
      const profile = profileMap.get(user.id)
      return {
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        is_active: profile?.is_active ?? true,
        disabled_at: profile?.disabled_at ?? null,
      }
    })

    return NextResponse.json({ users: mergedUsers })
  } catch (error) {
    console.error('Error in /api/admin/users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
