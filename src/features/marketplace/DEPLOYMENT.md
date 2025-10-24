# Bookmark Marketplace - Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Setup

Create `.env.production` with production values:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Stripe (Production Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Next.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret

# Optional: Email notifications
RESEND_API_KEY=your_resend_api_key
```

### 2. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Deploy database schema
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

### 3. Stripe Configuration

#### Production Setup:
1. **Activate your Stripe account** in live mode
2. **Set up webhooks** for these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (for Connect accounts)
   - `payout.paid`
   - `payout.failed`

3. **Configure Stripe Connect** for marketplace:
   - Enable Express accounts
   - Set up application fees (5% commission)
   - Configure payout schedules

#### Webhook Endpoint:
```
POST https://yourdomain.com/api/webhooks/stripe
```

### 4. Security Considerations

#### API Routes Security:
- ✅ All API routes include authentication checks
- ✅ Input validation with Zod schemas
- ✅ Rate limiting implemented
- ✅ CORS configured properly

#### Database Security:
- ✅ All sensitive data encrypted
- ✅ Row-level security enabled
- ✅ Database connections use SSL
- ✅ Regular backups configured

### 5. Performance Optimizations

#### Caching Strategy:
```typescript
// Next.js API Routes with caching
export const revalidate = 300; // 5 minutes

// Static generation for listing pages
export async function generateStaticParams() {
  // Generate paths for popular listings
}
```

#### Database Optimizations:
- ✅ Proper indexing on frequently queried fields
- ✅ Connection pooling configured
- ✅ Query optimization with Prisma

### 6. Monitoring & Analytics

#### Error Tracking:
```bash
npm install @sentry/nextjs
```

#### Performance Monitoring:
- Set up Vercel Analytics
- Configure Stripe Dashboard alerts
- Database performance monitoring

### 7. Testing in Production

#### Pre-deployment Tests:
```bash
# Run all tests
npm run test

# Build verification
npm run build

# Type checking
npm run type-check
```

#### Post-deployment Verification:
- [ ] Marketplace homepage loads correctly
- [ ] User can browse listings
- [ ] Search and filters work
- [ ] Payment flow completes successfully
- [ ] Seller dashboard functions properly
- [ ] Email notifications sent
- [ ] Webhooks receive events correctly

### 8. Deployment Platforms

#### Vercel (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Alternative Platforms:
- **Netlify**: Full-stack support with functions
- **Railway**: Database + app hosting
- **DigitalOcean App Platform**: Container-based deployment

### 9. Domain & SSL

#### Custom Domain Setup:
1. Configure DNS records
2. SSL certificate (automatic with Vercel/Netlify)
3. Update CORS origins
4. Update Stripe webhook URLs

### 10. Backup & Recovery

#### Database Backups:
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

#### File Storage Backups:
- User uploads (if any)
- Static assets
- Configuration files

### 11. Legal Compliance

#### Required Pages:
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy
- [ ] GDPR compliance (if EU users)

#### Marketplace Policies:
- [ ] Seller agreement
- [ ] Content guidelines
- [ ] Dispute resolution process

### 12. Launch Checklist

#### Pre-Launch:
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Stripe webhooks configured
- [ ] Email templates tested
- [ ] Error monitoring active
- [ ] Performance baseline established

#### Launch Day:
- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Test customer support flow

#### Post-Launch:
- [ ] Monitor key metrics
- [ ] Collect user feedback
- [ ] Performance optimization
- [ ] Feature iteration planning

### 13. Scaling Considerations

#### Database Scaling:
- Connection pooling (PgBouncer)
- Read replicas for analytics
- Partitioning for large tables

#### Application Scaling:
- CDN for static assets
- Image optimization
- API rate limiting
- Caching layers (Redis)

### 14. Maintenance

#### Regular Tasks:
- Security updates
- Dependency updates  
- Database maintenance
- Performance monitoring
- Backup verification

#### Monthly Reviews:
- Security audit
- Performance analysis
- User feedback review
- Feature usage analytics

## 🎯 Success Metrics

Track these KPIs post-deployment:
- **User Engagement**: DAU, session duration
- **Conversion**: Browse-to-purchase rate
- **Revenue**: GMV, commission earned
- **Performance**: Page load times, error rates
- **Satisfaction**: User reviews, support tickets

## 🆘 Troubleshooting

### Common Issues:

#### Payment Failures:
1. Check Stripe webhook logs
2. Verify API keys are correct
3. Ensure webhook endpoint is accessible

#### Database Connection Issues:
1. Verify connection string
2. Check connection pool limits
3. Monitor database performance

#### Performance Issues:
1. Review slow query logs
2. Check CDN cache hit rates
3. Monitor server resources

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Contact your hosting provider
4. Escalate to development team if needed 