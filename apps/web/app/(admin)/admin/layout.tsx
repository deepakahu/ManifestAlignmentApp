import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Add admin role check here
  // For now, any authenticated user can access
  // In production, check if user has admin role from profiles table
  
  // Example admin check (uncomment when ready):
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('is_admin')
  //   .eq('user_id', user.id)
  //   .single()
  // 
  // if (!profile?.is_admin) {
  //   redirect('/dashboard')
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium">
        🔒 Admin Mode - Viewing as: {user.email}
      </div>
      {children}
    </div>
  )
}
