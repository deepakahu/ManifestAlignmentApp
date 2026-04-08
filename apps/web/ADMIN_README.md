# Admin Dashboard

Admin dashboard integrated into the existing web app at `/admin/users`.

## Setup

1. **Add Service Role Key** to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   ⚠️ **IMPORTANT**: Never commit the service role key to git. This key has full admin access.

2. **Access the Dashboard**:
   - Users List: `/admin/users`
   - User Detail: `/admin/users/[id]`

## Features

### Users List Page (`/admin/users`)
- View all users with email, ID, and creation date
- Online status tracking:
  - 🟢 Online: Last signed in < 5 minutes ago
  - 🟡 Away: Last signed in < 30 minutes ago
  - ⚫ Offline: Last signed in > 30 minutes ago
  - ⚪ Never: User hasn't signed in
- Search by email
- Filter by status (all/active/disabled)
- Real-time statistics (total users, active, disabled)
- Refresh button

### User Detail Page (`/admin/users/[id]`)
- **User Information**
  - Email, user ID, creation date
  - Last sign-in timestamp
  - Account status (active/disabled)
  - Disabled timestamp and admin info

- **Data Statistics**
  - Categories count
  - Goals count
  - Activities count
  - Challenges count

- **Account Management**
  - Enable/Disable user accounts
  - Confirmation dialogs for all actions

- **Data Management**
  - Delete specific data types:
    - Categories
    - Goals
    - Activities
    - Challenges
  - Buttons disabled if no data exists
  - Shows item count on each button

- **Data Preview**
  - Shows first 5 items of each type
  - Displays remaining count

- **Danger Zone**
  - Permanently delete user account
  - Cascading deletion of all user data
  - Multiple confirmation prompts

## Security

### Current Implementation
- ✅ Requires authentication (via existing middleware)
- ✅ Uses service role key for admin operations
- ✅ Admin header indicator shows current user

### TODO: Add Admin Role Check
Currently, any authenticated user can access the admin dashboard. Add role-based access control:

1. **Add `is_admin` column to profiles table**:
   ```sql
   ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   ```

2. **Uncomment admin check in `app/(admin)/admin/layout.tsx`**:
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('is_admin')
     .eq('user_id', user.id)
     .single()

   if (!profile?.is_admin) {
     redirect('/dashboard')
   }
   ```

3. **Set admin users in database**:
   ```sql
   UPDATE profiles SET is_admin = TRUE WHERE user_id = 'your-admin-user-id';
   ```

### Security Checklist
- [ ] Add `is_admin` column to profiles table
- [ ] Enable admin role check in layout
- [ ] Set admin users in database
- [ ] Test non-admin users cannot access `/admin/*`
- [ ] Add audit logging for admin actions
- [ ] Monitor service role key usage
- [ ] Rotate service role key periodically
- [ ] Restrict admin access by IP (optional)

## Files Added

```
apps/web/
├── lib/supabase/admin.ts                          # Admin client with service role
├── app/(admin)/
│   └── admin/
│       ├── layout.tsx                             # Admin layout with auth check
│       └── users/
│           ├── page.tsx                           # Users list
│           └── [id]/
│               └── page.tsx                       # User detail
└── ADMIN_README.md                                # This file
```

## Usage

### Access Admin Dashboard
1. Sign in to your web app
2. Navigate to `/admin/users`
3. View and manage users

### Enable/Disable a User
1. Go to `/admin/users/[user-id]`
2. Click "Disable User" or "Enable User"
3. Confirm the action

### Delete User Data
1. Go to `/admin/users/[user-id]`
2. Scroll to "Data Management"
3. Click delete button for specific data type
4. Confirm the action

### Delete User Account
1. Go to `/admin/users/[user-id]`
2. Scroll to "Danger Zone"
3. Click "Delete User Permanently"
4. Confirm twice

## Database Tables Required

- `profiles` - User profiles with `is_active`, `disabled_at`, `disabled_by`
- `categories` - User categories
- `goals` - User goals
- `discipline_activities` - User activities
- `challenges` - User challenges

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

## Deployment Checklist

Before deploying to production:
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
- [ ] Enable admin role check (see Security section)
- [ ] Test all admin functions in staging
- [ ] Set up monitoring for admin actions
- [ ] Document admin procedures
- [ ] Train admin users
- [ ] Set up backup/restore procedures

## Support

For issues:
1. Check console for errors
2. Verify service role key is set correctly
3. Check Supabase logs
4. Verify database tables exist
5. Test authentication flow

## Future Enhancements

- [ ] Audit logging for all admin actions
- [ ] Bulk operations (enable/disable multiple users)
- [ ] Export user data as CSV/JSON
- [ ] Send email to users (reset password, notifications)
- [ ] Advanced filters and search
- [ ] User activity timeline
- [ ] Analytics dashboard
- [ ] Soft delete with recovery
- [ ] Data anonymization
