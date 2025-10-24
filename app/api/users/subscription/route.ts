import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage paths
const USERS_DIR = join(process.cwd(), 'apps/web/data/users');
const BILLING_DIR = join(process.cwd(), 'apps/web/data/billing');
const USERS_FILE = join(USERS_DIR, 'users.json');
const SUBSCRIPTIONS_FILE = join(BILLING_DIR, 'subscriptions.json');
const BILLING_HISTORY_FILE = join(BILLING_DIR, 'billing_history.json');

// Subscription interfaces
interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  billing_cycle: 'monthly' | 'yearly';
  price_per_cycle: number;
  currency: string;
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  features: string[];
  usage_limits: {
    bookmarks: number;
    ai_processing: number;
    storage_mb: number;
    api_calls: number;
  };
}

interface BillingHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice_url?: string;
  description: string;
  billing_date: string;
  due_date: string;
  paid_at?: string;
  stripe_invoice_id?: string;
  created_at: string;
}

// Plan configurations
const PLAN_CONFIGS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['basic_bookmarks', 'basic_categories', 'basic_search'],
    limits: { bookmarks: 100, ai_processing: 10, storage_mb: 100, api_calls: 1000 }
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    features: ['unlimited_bookmarks', 'ai_categorization', 'advanced_search', 'bulk_operations', 'api_access'],
    limits: { bookmarks: 10000, ai_processing: 1000, storage_mb: 1000, api_calls: 10000 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 29.99,
    features: ['unlimited_everything', 'priority_support', 'custom_integrations', 'sso', 'audit_logs'],
    limits: { bookmarks: -1, ai_processing: -1, storage_mb: 10000, api_calls: 100000 }
  }
};

// Ensure data directories exist
function ensureDataDirectories() {
  [USERS_DIR, BILLING_DIR].forEach(dir => {
    if (!existsSync(dir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(dir, { recursive: true });
    }
  });
}

// Load data functions
function loadUsers(): any[] {
  ensureDataDirectories();
  if (!existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USERS_FILE, 'utf8'));
  } catch { return []; }
}

function loadSubscriptions(): Subscription[] {
  ensureDataDirectories();
  if (!existsSync(SUBSCRIPTIONS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
  } catch { return []; }
}

function loadBillingHistory(): BillingHistory[] {
  ensureDataDirectories();
  if (!existsSync(BILLING_HISTORY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(BILLING_HISTORY_FILE, 'utf8'));
  } catch { return []; }
}

// Save data functions
function saveUsers(users: any[]) {
  ensureDataDirectories();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveSubscriptions(subscriptions: Subscription[]) {
  ensureDataDirectories();
  writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
}

function saveBillingHistory(history: BillingHistory[]) {
  ensureDataDirectories();
  writeFileSync(BILLING_HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Create default subscription
function createDefaultSubscription(userId: string): Subscription {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  return {
    id: uuidv4(),
    user_id: userId,
    plan: 'free',
    status: 'active',
    billing_cycle: 'monthly',
    price_per_cycle: 0,
    currency: 'USD',
    current_period_start: now.toISOString(),
    current_period_end: nextMonth.toISOString(),
    cancel_at_period_end: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    features: PLAN_CONFIGS.free.features,
    usage_limits: PLAN_CONFIGS.free.limits,
  };
}

// GET /api/users/subscription - Get user subscription details
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const { searchParams } = new URL(request.url);
    const include_history = searchParams.get('include_history') === 'true';

    console.log(`💳 Getting subscription details for user: ${userId}`);

    const subscriptions = loadSubscriptions();
    let subscription = subscriptions.find(s => s.user_id === userId && s.status !== 'cancelled');

    // Create default subscription if none exists
    if (!subscription) {
      console.log(`🆕 Creating default subscription for user: ${userId}`);
      subscription = createDefaultSubscription(userId);
      subscriptions.push(subscription);
      saveSubscriptions(subscriptions);
    }

    const response: any = {
      subscription,
      plan_config: PLAN_CONFIGS[subscription.plan],
    };

    if (include_history) {
      const billingHistory = loadBillingHistory().filter(h => h.user_id === userId);
      response.billing_history = billingHistory;
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Subscription details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get subscription details'
    }, { status: 500 });
  }
}

// POST /api/users/subscription - Create or upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const body = await request.json();
    const { plan, billing_cycle = 'monthly', payment_method_id } = body;

    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan specified'
      }, { status: 400 });
    }

    console.log(`🔄 Creating/upgrading subscription for user: ${userId} to plan: ${plan}`);

    const subscriptions = loadSubscriptions();
    const users = loadUsers();
    
    // Find existing subscription
    const existingIndex = subscriptions.findIndex(s => s.user_id === userId && s.status !== 'cancelled');
    const planConfig = PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS];
    
    const now = new Date();
    const nextPeriod = billing_cycle === 'yearly' 
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const newSubscription: Subscription = {
      id: uuidv4(),
      user_id: userId,
      plan: plan as any,
      status: plan === 'free' ? 'active' : 'trial',
      billing_cycle: billing_cycle as any,
      price_per_cycle: billing_cycle === 'yearly' ? planConfig.price * 10 : planConfig.price, // 2 months free for yearly
      currency: 'USD',
      current_period_start: now.toISOString(),
      current_period_end: nextPeriod.toISOString(),
      cancel_at_period_end: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      features: planConfig.features,
      usage_limits: planConfig.limits,
    };

    // Add trial period for paid plans
    if (plan !== 'free') {
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
      newSubscription.trial_ends_at = trialEnd.toISOString();
    }

    // Cancel existing subscription if upgrading
    if (existingIndex !== -1) {
      subscriptions[existingIndex].status = 'cancelled';
      subscriptions[existingIndex].cancelled_at = now.toISOString();
      subscriptions[existingIndex].updated_at = now.toISOString();
    }

    subscriptions.push(newSubscription);
    saveSubscriptions(subscriptions);

    // Update user profile
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].subscription = {
        plan: newSubscription.plan,
        status: newSubscription.status,
        billing_cycle: newSubscription.billing_cycle,
        next_billing_date: newSubscription.current_period_end,
        features: newSubscription.features,
      };
      users[userIndex].updated_at = now.toISOString();
      saveUsers(users);
    }

    // Create billing record for paid plans
    if (plan !== 'free') {
      const billingHistory = loadBillingHistory();
      const billingRecord: BillingHistory = {
        id: uuidv4(),
        user_id: userId,
        subscription_id: newSubscription.id,
        amount: newSubscription.price_per_cycle,
        currency: 'USD',
        status: 'pending',
        description: `${planConfig.name} Plan - ${billing_cycle} billing`,
        billing_date: newSubscription.current_period_end,
        due_date: newSubscription.current_period_end,
        created_at: now.toISOString(),
      };
      billingHistory.push(billingRecord);
      saveBillingHistory(billingHistory);
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: newSubscription,
        plan_config: planConfig,
      },
      message: `Subscription ${existingIndex !== -1 ? 'upgraded' : 'created'} successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create subscription'
    }, { status: 500 });
  }
}

// PUT /api/users/subscription - Update subscription
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const body = await request.json();
    const { action, ...updates } = body;

    console.log(`✏️ Updating subscription for user: ${userId}, action: ${action}`);

    const subscriptions = loadSubscriptions();
    const subscriptionIndex = subscriptions.findIndex(s => s.user_id === userId && s.status !== 'cancelled');

    if (subscriptionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    const subscription = subscriptions[subscriptionIndex];
    const now = new Date();

    switch (action) {
      case 'cancel':
        subscription.status = 'cancelled';
        subscription.cancelled_at = now.toISOString();
        subscription.cancel_at_period_end = true;
        break;

      case 'reactivate':
        if (subscription.status === 'cancelled' && new Date(subscription.current_period_end) > now) {
          subscription.status = 'active';
          subscription.cancel_at_period_end = false;
          delete subscription.cancelled_at;
        } else {
          return NextResponse.json({
            success: false,
            error: 'Cannot reactivate expired subscription'
          }, { status: 400 });
        }
        break;

      case 'update_billing_cycle':
        if (updates.billing_cycle && ['monthly', 'yearly'].includes(updates.billing_cycle)) {
          subscription.billing_cycle = updates.billing_cycle;
          const planConfig = PLAN_CONFIGS[subscription.plan];
          subscription.price_per_cycle = updates.billing_cycle === 'yearly' 
            ? planConfig.price * 10 
            : planConfig.price;
        }
        break;

      case 'update_payment_method':
        // In a real implementation, this would update Stripe payment method
        break;

      default:
        // General updates
        Object.assign(subscription, updates);
    }

    subscription.updated_at = now.toISOString();
    subscriptions[subscriptionIndex] = subscription;
    saveSubscriptions(subscriptions);

    // Update user profile
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].subscription = {
        plan: subscription.plan,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        next_billing_date: subscription.current_period_end,
        features: subscription.features,
      };
      users[userIndex].updated_at = now.toISOString();
      saveUsers(users);
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan_config: PLAN_CONFIGS[subscription.plan],
      },
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update subscription'
    }, { status: 500 });
  }
}

// DELETE /api/users/subscription - Cancel subscription immediately
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const { searchParams } = new URL(request.url);
    const immediate = searchParams.get('immediate') === 'true';

    console.log(`🗑️ Cancelling subscription for user: ${userId}, immediate: ${immediate}`);

    const subscriptions = loadSubscriptions();
    const subscriptionIndex = subscriptions.findIndex(s => s.user_id === userId && s.status !== 'cancelled');

    if (subscriptionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    const subscription = subscriptions[subscriptionIndex];
    const now = new Date();

    if (immediate) {
      // Immediate cancellation - downgrade to free plan
      subscription.status = 'cancelled';
      subscription.cancelled_at = now.toISOString();
      subscription.current_period_end = now.toISOString();
      
      // Create new free subscription
      const freeSubscription = createDefaultSubscription(userId);
      subscriptions.push(freeSubscription);
    } else {
      // Cancel at period end
      subscription.cancel_at_period_end = true;
      subscription.cancelled_at = now.toISOString();
    }

    subscription.updated_at = now.toISOString();
    subscriptions[subscriptionIndex] = subscription;
    saveSubscriptions(subscriptions);

    // Update user profile
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (immediate) {
        users[userIndex].subscription = {
          plan: 'free',
          status: 'active',
          features: PLAN_CONFIGS.free.features,
        };
      } else {
        users[userIndex].subscription.status = 'cancelled';
      }
      users[userIndex].updated_at = now.toISOString();
      saveUsers(users);
    }

    return NextResponse.json({
      success: true,
      message: immediate 
        ? 'Subscription cancelled immediately and downgraded to free plan'
        : 'Subscription will be cancelled at the end of current billing period'
    });

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel subscription'
    }, { status: 500 });
  }
}  