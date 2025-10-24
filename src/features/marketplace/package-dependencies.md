# Marketplace Feature Dependencies

## Required Dependencies

Add these to your main `package.json`:

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^5.2.0",
    "@stripe/react-stripe-js": "^2.4.0",
    "stripe": "^17.4.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.468.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database
DATABASE_URL="your-postgresql-database-url"

# Optional: For testing
STRIPE_TEST_MODE=true
```

## Installation Commands

```bash
# Install main dependencies
npm install @stripe/stripe-js @stripe/react-stripe-js stripe date-fns lucide-react zod

# Install testing dependencies
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks for payment events
4. Configure Stripe Connect for marketplace functionality

## Database Setup

The marketplace uses PostgreSQL with Prisma ORM. The schema includes:
- Users table with Stripe integration
- Listings for bookmark collections
- Orders for purchase tracking
- Reviews and ratings system
- Payouts for seller earnings

## Testing

Run tests with:
```bash
npm run test
# or
npx vitest
``` 