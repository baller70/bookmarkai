# Vercel Environment Variables Setup

## Required Environment Variables

Copy these to your Vercel project settings:

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

### 1. Database
```
DATABASE_URL=<your-database-url-from-local-.env-file>
```

### 2. NextAuth (Authentication)
```
NEXTAUTH_SECRET=<your-nextauth-secret-from-local-.env-file>
NEXTAUTH_URL=https://bookmarkai-kevin-houstons-projects.vercel.app
```

### 3. Stripe (Payments)
```
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

### 4. Other Services
```
ABACUSAI_API_KEY=<your-abacusai-api-key>
RESEND_API_KEY=<your-resend-api-key>
OPENAI_API_KEY=<your-openai-api-key-or-leave-empty>
NEXT_PUBLIC_APP_URL=https://bookmarkai-kevin-houstons-projects.vercel.app
REDIS_DISABLE=true
```

### 5. Supabase Placeholders (Not Used)
```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwbGFjZWhvbGRlciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ2NzI4MDAwLCJleHAiOjE5NjIwODgwMDB9.placeholder
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwbGFjZWhvbGRlciIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDY3MjgwMDAsImV4cCI6MTk2MjA4ODAwMH0.placeholder
```

## Where to Find These Values

All the actual values are in your local `.env` file at:
```
nextjs_space/.env
```

**IMPORTANT:** Copy the values from your local `.env` file. Do NOT commit the actual secrets to GitHub.

## Important Notes

1. **Set all variables for all environments** (Production, Preview, Development)
2. **After adding variables**, redeploy your project
3. **Most critical variables** for authentication to work:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `DATABASE_URL`

## How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar
5. For each variable:
   - Enter the **Key** (e.g., `NEXTAUTH_SECRET`)
   - Enter the **Value** (copy from your local `.env` file)
   - Select all environments: **Production**, **Preview**, **Development**
   - Click "Save"
6. After adding all variables, go to "Deployments" tab
7. Click the three dots on the latest deployment
8. Click "Redeploy"

## Test Credentials

After setting up environment variables:

**URL:** https://bookmarkai-kevin-houstons-projects.vercel.app/login

**Email:** test@example.com  
**Password:** test123
