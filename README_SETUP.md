# Manifestation App - Full Stack Setup

This is a monorepo containing the mobile app (React Native/Expo) and web app (Next.js) with Supabase backend.

## Project Structure

```
ManifestExpo/
├── apps/
│   └── web/                    # Next.js 14 web application
├── packages/
│   └── shared/                 # Shared types and utilities
├── src/                        # Mobile app (React Native/Expo)
├── supabase/
│   └── migrations/             # Database schema
├── turbo.json                  # Turborepo configuration
└── package.json                # Root package.json
```

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Step 1: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   - Copy content from `supabase/migrations/001_initial_schema.sql`
   - Execute in SQL Editor
3. Go to **Settings > API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key

## Step 2: Configure Environment Variables

### Mobile App

Create `.env` in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Web App

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Install Dependencies

```bash
# Install root dependencies
npm install

# Install web app dependencies
cd apps/web
npm install
cd ../..

# Install mobile dependencies (already in root)
```

## Step 4: Run the Applications

### Mobile App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

### Web App

```bash
# Development
cd apps/web
npm run dev

# Build for production
npm run build
npm start
```

## Step 5: Set Up OAuth (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs in Supabase:
   - Go to **Authentication > Providers > Google**
   - Enable Google provider
   - Add your credentials

### Apple Sign In

1. Go to [Apple Developer](https://developer.apple.com)
2. Create an App ID with Sign in with Apple capability
3. Create a Services ID
4. Configure in Supabase:
   - Go to **Authentication > Providers > Apple**
   - Enable Apple provider
   - Add your credentials

## Architecture Overview

### Mobile App (Offline-First)

- **Local Storage**: AsyncStorage for offline data
- **Sync Manager**: Background sync with Supabase when online
- **Repository Pattern**: Abstracted data layer
- **Auth Flow**: Supabase Auth with OAuth
- **Migration**: Automatic migration from local to cloud

### Web App (Server-Side)

- **Next.js 14**: App Router with Server Components
- **Supabase SSR**: Server-side auth with cookies
- **Tailwind CSS**: Utility-first styling
- **Type-Safe**: Full TypeScript support

### Database (Supabase)

- **PostgreSQL**: Relational database
- **Row Level Security (RLS)**: Data isolation per user
- **Real-time**: Optional real-time subscriptions
- **Storage**: File uploads (if needed)

## Key Features

### Mobile
- Mood tracking with notes and tags
- Manifestation creation with affirmations
- Smart alarms with custom schedules
- Offline-first with auto-sync
- Migration from local to cloud

### Web
- Dashboard with statistics
- View all moods, manifestations, alarms
- Account settings management
- Responsive design

## Testing

### Mobile App

```bash
npm test
```

### Web App

```bash
cd apps/web
npm run lint
```

## Deployment

### Mobile App

```bash
# Build for production
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Web App

Deploy to Vercel:

```bash
cd apps/web
vercel
```

Or deploy to your preferred hosting service.

## Troubleshooting

### Mobile Build Issues

- Clear cache: `expo start --clear`
- Rebuild: `npx expo prebuild --clean`
- Check permissions in `app.json`

### Supabase Connection Issues

- Verify environment variables
- Check Supabase project status
- Verify RLS policies are enabled

### TypeScript Errors

- Clear TypeScript cache: `rm -rf node_modules/.cache`
- Rebuild: `npm install`

## Project Dependencies

### Mobile Core
- `expo` - ^53.0.0
- `react-native` - Latest
- `@supabase/supabase-js` - ^2.x
- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`

### Web Core
- `next` - 14.2.x
- `react` - ^18.x
- `@supabase/ssr` - ^0.5.x
- `tailwindcss` - ^3.x

### Shared
- `zod` - ^3.x
- `typescript` - ^5.x

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
