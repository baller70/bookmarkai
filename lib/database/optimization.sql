-- BookAIMark Database Optimization SQL
-- Task 14.1: Efficient Indexing Strategies
-- This file contains all database optimizations for production performance

-- ============================================================================
-- 1. CORE BOOKMARK INDEXES
-- ============================================================================

-- Primary user_bookmarks table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_user_id_created 
    ON public.user_bookmarks(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_category_user 
    ON public.user_bookmarks(category, user_id) WHERE category IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_tags_gin 
    ON public.user_bookmarks USING GIN(tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_ai_tags_gin 
    ON public.user_bookmarks USING GIN(ai_tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_domain_user 
    ON public.user_bookmarks(domain, user_id) WHERE domain IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_url_hash 
    ON public.user_bookmarks USING HASH(url);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_favorite 
    ON public.user_bookmarks(user_id, is_favorite) WHERE is_favorite = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_priority 
    ON public.user_bookmarks(user_id, priority, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_visit_count 
    ON public.user_bookmarks(user_id, visit_count DESC) WHERE visit_count > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_last_visited 
    ON public.user_bookmarks(user_id, last_visited_at DESC NULLS LAST);

-- Full-text search index for bookmarks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_search 
    ON public.user_bookmarks USING GIN(
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, ''))
    );

-- Composite index for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_complex 
    ON public.user_bookmarks(user_id, category, is_favorite, created_at DESC);

-- ============================================================================
-- 2. USER MANAGEMENT INDEXES
-- ============================================================================

-- User profile indexes (for Task 13 User Management APIs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email 
    ON public.user_profiles(email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_verification 
    ON public.user_profiles(verification_status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_subscription 
    ON public.user_profiles(subscription_plan, subscription_status);

-- User analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_user_date 
    ON public.user_analytics(user_id, activity_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_activity_type 
    ON public.user_analytics(activity_type, activity_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_insights 
    ON public.user_analytics(user_id, insights_data) USING GIN(insights_data);

-- User privacy indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_privacy_consent 
    ON public.user_privacy(user_id, consent_version, consent_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_privacy_requests 
    ON public.user_privacy_requests(user_id, request_type, status, created_at DESC);

-- ============================================================================
-- 3. MARKETPLACE INDEXES
-- ============================================================================

-- Listings performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_seller_active 
    ON public.listings(seller_id, is_active, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_price 
    ON public.listings(category, price_cents, rating_avg DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_tags_gin 
    ON public.listings USING GIN(tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_rating 
    ON public.listings(rating_avg DESC, rating_count DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_search 
    ON public.listings USING GIN(
        to_tsvector('english', title || ' ' || description)
    ) WHERE is_active = true;

-- Orders performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_date 
    ON public.orders(buyer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_listing_status 
    ON public.orders(listing_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_intent 
    ON public.orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- ============================================================================
-- 4. PLAYBOOK INDEXES
-- ============================================================================

-- Playbook performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_playbooks_user_public 
    ON public.user_playbooks(user_id, is_public, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_playbooks_category 
    ON public.user_playbooks(category, likes_count DESC) WHERE is_public = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_playbooks_tags_gin 
    ON public.user_playbooks USING GIN(tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_playbooks_marketplace 
    ON public.user_playbooks(is_marketplace_listed, category, plays DESC) WHERE is_marketplace_listed = true;

-- Playbook bookmarks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playbook_bookmarks_playbook 
    ON public.playbook_bookmarks(playbook_id, order_index);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playbook_bookmarks_bookmark 
    ON public.playbook_bookmarks(bookmark_id, added_at DESC);

-- Playbook interactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playbook_likes_user 
    ON public.playbook_likes(user_id, liked_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playbook_plays_playbook 
    ON public.playbook_plays(playbook_id, played_at DESC);

-- ============================================================================
-- 5. AI PROCESSING INDEXES
-- ============================================================================

-- AI processing jobs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_processing_jobs_user_status 
    ON public.ai_processing_jobs(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_processing_jobs_type 
    ON public.ai_processing_jobs(processing_type, status, priority DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_processing_jobs_queue 
    ON public.ai_processing_jobs(status, priority DESC, created_at) 
    WHERE status IN ('pending', 'processing');

-- AI results indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_results_entity 
    ON public.ai_results(entity_type, entity_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_results_confidence 
    ON public.ai_results(confidence_score DESC, created_at DESC) 
    WHERE confidence_score >= 0.8;

-- ============================================================================
-- 6. ANALYTICS AND MONITORING INDEXES
-- ============================================================================

-- User activity log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_user_date 
    ON public.user_activity_log(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_type 
    ON public.user_activity_log(activity_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_entity 
    ON public.user_activity_log(entity_type, entity_id, created_at DESC);

-- Analytics cache indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_cache_user_range 
    ON public.user_analytics_cache(user_id, time_range, section);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_cache_expires 
    ON public.user_analytics_cache(expires_at) WHERE expires_at < NOW();

-- ============================================================================
-- 7. PERFORMANCE MONITORING INDEXES
-- ============================================================================

-- Performance metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_timestamp 
    ON public.performance_metrics(timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_endpoint 
    ON public.performance_metrics(endpoint, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_slow 
    ON public.performance_metrics(response_time DESC, timestamp DESC) 
    WHERE response_time > 1000;

-- Error logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_timestamp 
    ON public.error_logs(timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_severity 
    ON public.error_logs(severity, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_endpoint 
    ON public.error_logs(endpoint, timestamp DESC) WHERE endpoint IS NOT NULL;

-- ============================================================================
-- 8. PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================================================

-- Recent bookmarks (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_recent 
    ON public.user_bookmarks(user_id, created_at DESC) 
    WHERE created_at >= (NOW() - INTERVAL '30 days');

-- Active users (logged in last 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_active 
    ON public.user_profiles(last_login_at DESC) 
    WHERE last_login_at >= (NOW() - INTERVAL '7 days');

-- High-value listings (price > $10)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_high_value 
    ON public.listings(price_cents DESC, rating_avg DESC) 
    WHERE price_cents > 1000 AND is_active = true;

-- Popular playbooks (plays > 100)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_playbooks_popular 
    ON public.user_playbooks(plays DESC, likes_count DESC) 
    WHERE plays > 100 AND is_public = true;

-- ============================================================================
-- 9. JSONB INDEXES FOR FLEXIBLE DATA
-- ============================================================================

-- Custom data indexes for bookmarks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_custom_data_gin 
    ON public.user_bookmarks USING GIN(custom_data);

-- Metadata indexes for various entities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oracle_messages_metadata_gin 
    ON public.oracle_messages USING GIN(metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_documents_content_gin 
    ON public.user_documents USING GIN(content);

-- Settings data indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oracle_settings_data_gin 
    ON public.oracle_settings USING GIN(settings_data);

-- ============================================================================
-- 10. CLEANUP AND MAINTENANCE INDEXES
-- ============================================================================

-- Expired records cleanup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at 
    ON public.sessions(expires_at) WHERE expires_at < NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_tokens_expires 
    ON public.verification_tokens(expires) WHERE expires < NOW();

-- Soft-deleted records indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_bookmarks_deleted 
    ON public.user_bookmarks(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 11. ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE public.user_bookmarks;
ANALYZE public.user_profiles;
ANALYZE public.listings;
ANALYZE public.orders;
ANALYZE public.user_playbooks;
ANALYZE public.playbook_bookmarks;
ANALYZE public.ai_processing_jobs;
ANALYZE public.user_activity_log;
ANALYZE public.user_analytics_cache;

-- ============================================================================
-- 12. INDEX USAGE MONITORING QUERIES
-- ============================================================================

-- Query to monitor index usage (run periodically)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to find unused indexes (run periodically)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
    AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- Query to find duplicate indexes
/*
SELECT 
    pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size,
    (array_agg(idx))[1] AS idx1, 
    (array_agg(idx))[2] AS idx2
FROM (
    SELECT 
        indexrelid::regclass AS idx, 
        (indrelid::regclass)::text AS tbl,
        indkey::text AS cols
    FROM pg_index
) sub
GROUP BY tbl, cols 
HAVING COUNT(*) > 1;
*/

-- Performance optimization complete
-- Run VACUUM ANALYZE after creating indexes for optimal performance 