# Bookmark Marketplace Feature

A complete e-commerce marketplace for buying and selling bookmark collections, built with React, TypeScript, and modern web technologies.

## Features

### 🛍️ Marketplace
- **Browse Listings**: Discover curated bookmark collections with advanced filtering
- **Search & Filter**: Find bookmarks by category, price, rating, and tags
- **Featured Collections**: Highlight top-performing bookmark collections
- **Responsive Design**: Optimized for desktop and mobile devices

### 💳 E-commerce
- **Secure Payments**: Stripe integration for safe transactions
- **Shopping Cart**: Add multiple items and manage purchases
- **Order Management**: Track purchase history and status
- **Digital Delivery**: Instant access to purchased bookmarks

### 👤 Seller Dashboard
- **Listing Management**: Create, edit, and manage bookmark listings
- **Analytics**: Track sales performance and earnings
- **Payout System**: Request and manage seller payouts
- **Review Management**: Monitor customer feedback

### ⭐ Reviews & Ratings
- **Customer Reviews**: Rate and review purchased collections
- **Seller Ratings**: Build trust through verified reviews
- **Review Moderation**: Quality control for marketplace integrity

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Stripe Elements** for payment forms

### Backend
- **Next.js API Routes**
- **Prisma ORM** for database management
- **Zod** for validation
- **Stripe** for payments and payouts

### Database Schema
- Users, Listings, Orders, Reviews, Payouts
- Optimized indexes for performance
- Relationship integrity with foreign keys

## Project Structure

```
src/features/marketplace/
├── components/           # React components
│   ├── MarketplaceHome.tsx
│   ├── ListingCard.tsx
│   ├── ListingDetail.tsx
│   ├── SellerDashboard.tsx
│   ├── PurchaseModal.tsx
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useMarketplaceListings.ts
│   ├── useCart.ts
│   ├── usePayment.ts
│   └── ...
├── services/           # API service classes
│   ├── MarketplaceService.ts
│   ├── OrderService.ts
│   ├── PaymentService.ts
│   └── ...
├── models/             # TypeScript types and schemas
│   ├── index.ts
│   └── schema.prisma
├── pages/              # Page components
├── tests/              # Unit tests
└── README.md
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install date-fns lucide-react
npm install zod
```

### 2. Environment Variables

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL="your-database-url"
```

### 3. Database Setup

Add the Prisma schema to your main `schema.prisma` file:

```bash
npx prisma db push
npx prisma generate
```

### 4. Stripe Setup

1. Create a Stripe account
2. Set up webhook endpoints for payment events
3. Configure Stripe Connect for seller payouts

## API Endpoints

### Listings
- `GET /api/marketplace/listings` - Get listings with filters
- `POST /api/marketplace/listings` - Create new listing
- `GET /api/marketplace/listings/[id]` - Get listing details
- `PATCH /api/marketplace/listings/[id]` - Update listing
- `DELETE /api/marketplace/listings/[id]` - Delete listing

### Orders
- `POST /api/marketplace/orders` - Create order
- `GET /api/marketplace/orders` - Get user orders
- `GET /api/marketplace/orders/[id]` - Get order details

### Payments
- `POST /api/marketplace/payments/create-intent` - Create payment intent
- `POST /api/marketplace/payments/connect-account` - Create Stripe Connect account

### Reviews
- `POST /api/marketplace/listings/[id]/reviews` - Create review
- `GET /api/marketplace/listings/[id]/reviews` - Get listing reviews

## Usage Examples

### Basic Marketplace Integration

```tsx
import { MarketplacePage } from '@/src/features/marketplace';

export default function Marketplace() {
  return <MarketplacePage />;
}
```

### Using Marketplace Hooks

```tsx
import { useMarketplaceListings, useCart } from '@/src/features/marketplace';

function MyComponent() {
  const { listings, loading, updateFilters } = useMarketplaceListings();
  const { addToCart, cart } = useCart();

  return (
    <div>
      {listings.map(listing => (
        <div key={listing.id}>
          <h3>{listing.title}</h3>
          <button onClick={() => addToCart(listing)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Custom Service Usage

```tsx
import { MarketplaceService } from '@/src/features/marketplace';

const marketplaceService = new MarketplaceService();

// Search listings
const results = await marketplaceService.searchListings('web development');

// Create listing
const newListing = await marketplaceService.createListing({
  title: 'My Bookmark Collection',
  description: 'Great bookmarks for developers',
  // ... other fields
});
```

## Configuration

### Marketplace Settings

```typescript
export const MARKETPLACE_CONFIG = {
  COMMISSION_RATE: 0.05,          // 5% commission
  MIN_PRICE_CENTS: 100,           // $1.00 minimum
  MAX_PRICE_CENTS: 100000,        // $1000.00 maximum
  PAYOUT_THRESHOLD_CENTS: 2000,   // $20.00 minimum payout
  MAX_TAGS: 10,                   // Maximum tags per listing
  MAX_TITLE_LENGTH: 100,          // Maximum title length
  MAX_DESCRIPTION_LENGTH: 1000,   // Maximum description length
};
```

## Testing

Run the test suite:

```bash
npm test src/features/marketplace
```

## Security Considerations

1. **Input Validation**: All inputs validated with Zod schemas
2. **Authentication**: User authentication required for transactions
3. **Payment Security**: PCI compliance through Stripe
4. **Data Sanitization**: XSS protection for user content
5. **Rate Limiting**: API rate limiting to prevent abuse

## Performance Optimizations

1. **Lazy Loading**: Components loaded on demand
2. **Image Optimization**: Next.js Image component
3. **Database Indexes**: Optimized for common queries
4. **Caching**: API response caching where appropriate
5. **Pagination**: Efficient data loading

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Use semantic commit messages
4. Update documentation for API changes

## License

This marketplace feature is part of the larger BookmarkHub application.