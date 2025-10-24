
# Supabase Migration Status

## Overview
This document tracks the migration from Supabase to Abacus AI PostgreSQL + Prisma.

## Completed Actions

### 1. ✅ Supabase Packages Removed
- `@supabase/auth-helpers-nextjs`
- `@supabase/auth-helpers-react`
- `@supabase/auth-ui-react`
- `@supabase/auth-ui-shared`
- `@supabase/supabase-js`

### 2. ✅ Created Stub Files for Compatibility
To prevent build failures, stub files have been created at:
- `/lib/supabase.ts` - Deprecated, returns mock data
- `/lib/supabase-demo.ts` - Deprecated, exports `createDemoSupabaseClient()` and `DEMO_USER_ID`
- `/src/lib/supabase.ts` - Deprecated
- `/src/utils/supabase.ts` - Deprecated
- `/utils/supabase.ts` - Deprecated
- `/utils/supabase-server.ts` - Deprecated
- `/node_modules/@supabase/*` - Stub modules to prevent webpack errors

All stub files return mock data and log deprecation warnings.

### 3. ✅ Created New Database Service
- `/lib/db-service.ts` - Comprehensive DatabaseService class using Prisma
  - User operations (CRUD)
  - Bookmark operations (CRUD, bulk create, search)
  - Folder operations (CRUD, hierarchical)
  - Settings operations (user settings, AI settings)
  - Notification operations
  - Task and Pomodoro operations
  - Marketplace operations (listings, orders, reviews)

### 4. ✅ Prisma Schema is Complete
- All models defined in `/prisma/schema.prisma`
- Supports all app features:
  - Authentication (Users, Accounts, Sessions)
  - Bookmarks and Folders
  - Settings (User Settings, AI Settings)
  - Tasks and Pomodoro
  - Notifications
  - Marketplace (Listings, Orders, Reviews, Payouts)

### 5. ✅ Auth Callback Routes Updated
- `/app/auth/callback/route.ts` - Updated to use NextAuth
- `/src/app/auth/callback/route.ts` - Updated to use NextAuth

## Remaining Work

### Files Still Using Supabase (70+ files)
These files have Supabase imports but are using stub modules:

#### API Routes (45+ files)
- `/app/api/ai/auto-processing/route.ts`
- `/app/api/ai/bulk-uploader/route.ts`
- `/app/api/ai/link-finder/route.ts`
- `/app/api/ai/recommendations/route.ts`
- `/app/api/ai/voice/stt/route.ts`
- `/app/api/ai/voice/tts/route.ts`
- `/app/api/auth/change-password/route.ts`
- `/app/api/auth/delete-account/route.ts`
- `/app/api/auth/sessions/route.ts`
- `/app/api/bookmarks/*/route.ts` (multiple)
- `/app/api/category-folders/*/route.ts`
- `/app/api/comments/*/route.ts`
- `/app/api/create-checkout-session/route.ts`
- `/app/api/credits/route.ts`
- `/app/api/hierarchy*/route.ts` (multiple)
- `/app/api/mentions/route.ts`
- `/app/api/migrate/route.ts`
- `/app/api/notifications/*/route.ts`
- `/app/api/playbooks/*/route.ts` (multiple)
- `/app/api/pomodoro/route.ts`
- `/app/api/setup-*/route.ts` (multiple)
- `/app/api/timeline/*/route.ts` (multiple)
- `/app/api/user-data/*/route.ts` (multiple)
- `/app/api/webhooks/stripe/route.ts`

#### Pages (10+ files)
- `/app/auth/reset-password/page.tsx`
- `/app/auth/update-password/page.tsx`
- `/app/components/PricingCard.tsx`
- `/app/dashboard/DashboardClient.tsx`
- `/app/dashboard/billing/page.tsx`
- `/app/dashboard/profile/page.tsx`
- `/app/settings/dna/*/page.tsx` (7 files)

#### Components (5+ files)
- `/components/Auth.tsx`
- `/components/auth/AuthForm.tsx`
- `/components/dashboard/Header.tsx`

#### Services & Libraries (10+ files)
- `/lib/api-helpers/storage-helpers.ts`
- `/lib/database/connection.ts`
- `/lib/database/read-replicas.ts`
- `/lib/database/secure-client.ts`
- `/src/hooks/useAnalytics.ts`
- `/src/services/analyticsService.ts`
- `/src/services/goalService.ts`

## Migration Strategy

### Phase 1: Core API Routes (Priority: HIGH)
Replace Supabase in:
1. Authentication routes (`/api/auth/*`)
2. Bookmark routes (`/api/bookmarks/*`)
3. User routes (settings, profile, etc.)

### Phase 2: Feature Routes (Priority: MEDIUM)
Replace Supabase in:
1. AI processing routes (`/api/ai/*`)
2. Marketplace routes (`/api/*`)
3. Timeline, Pomodoro, Notifications

### Phase 3: Client Components (Priority: MEDIUM)
Replace Supabase in:
1. Dashboard components
2. Settings pages
3. Profile pages

### Phase 4: Utilities & Services (Priority: LOW)
Replace Supabase in:
1. Analytics service
2. Goal service
3. Storage helpers

## How to Migrate a File

### Step 1: Replace Import
```typescript
// OLD:
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// NEW:
import { DatabaseService } from '@/lib/db-service'
import { prisma } from '@/lib/prisma'
```

### Step 2: Replace Database Operations
```typescript
// OLD Supabase:
const { data, error } = await supabase
  .from('bookmarks')
  .select('*')
  .eq('userId', userId)

// NEW Prisma:
const bookmarks = await DatabaseService.getBookmarks(userId)
// OR
const bookmarks = await prisma.bookmark.findMany({
  where: { userId }
})
```

### Step 3: Replace Auth Operations
```typescript
// OLD Supabase Auth:
const { data: { session } } = await supabase.auth.getSession()

// NEW NextAuth:
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
const session = await getServerSession(authOptions)
```

## Current Status

### ✅ Working
- App builds successfully (with TypeScript warnings)
- Core database schema is ready
- DatabaseService is available for use
- NextAuth authentication is functional

### ⚠️ Partially Working
- All API routes using Supabase stubs (return mock data)
- Components using Supabase stubs (return mock data)

### ❌ Needs Migration
- 70+ files still using Supabase stubs
- Real database operations not yet migrated
- Legacy Supabase features need Prisma equivalent

## Testing After Migration

After migrating a file, test:
1. API route returns real data from Prisma
2. No console warnings about deprecated Supabase
3. Database operations complete successfully
4. Error handling works correctly

## Notes

- The app is currently **deployed and functional** using stub data
- **Prisma client must be generated** after schema changes: `yarn prisma generate`
- **Database must be migrated** after schema changes: `yarn prisma migrate dev`
- All new code should use `DatabaseService` or `prisma` directly
- Stub files will be removed once all migrations are complete

## Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [NextAuth Docs](https://next-auth.js.org/)
- [DatabaseService API](/lib/db-service.ts)
- [Prisma Schema](/prisma/schema.prisma)
