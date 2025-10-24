# Test Login Credentials

## Application Access

**Live URL:** https://bookmarkai-kevin-houstons-projects.vercel.app

## Test Account

Use these credentials to log in to the application:

- **Email:** `test@example.com`
- **Password:** `test123`

## Login Page

Navigate to: `/login`

The login page displays the test credentials for easy reference.

## Authentication System

- **Provider:** NextAuth.js with Credentials Provider
- **Session:** JWT-based
- **Protected Routes:** Middleware checks authentication for dashboard and settings pages

## Notes

- This is a test account for demonstration purposes only
- The credentials are hardcoded in the NextAuth configuration
- For production, implement proper user registration and database-backed authentication
- Current setup uses Prisma with PostgreSQL for data persistence

## Environment Variables Required

Make sure these are set in Vercel:

```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
DATABASE_URL=your-postgresql-connection-string
```

## Next Steps

1. Set up proper user registration flow
2. Implement password hashing (bcrypt)
3. Add email verification
4. Implement password reset functionality
5. Add OAuth providers (Google, GitHub, etc.)
