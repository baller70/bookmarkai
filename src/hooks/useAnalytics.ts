import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time environment variable issues
let supabaseClient: any = null

const getSupabaseClient = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
};

export interface BookmarkAnalytics {
  id: string;
  bookmark_id: string;
  visits: number;
  timeSpent: number;
  sessionCount: number;
  lastVisited: string | null;
  weeklyVisits: number;
  monthlyVisits: number;
}

export interface GlobalAnalytics {
  totalVisits: number;
  totalBookmarks: number;
  avgUsage: number;
  activeBookmarks: number;
  topPerformer: BookmarkAnalytics | null;
  lastUpdated: string;
}

export function useAnalytics(bookmarkId?: string | any) {
  const [analyticsData, setAnalyticsData] = useState<BookmarkAnalytics[] | BookmarkAnalytics | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Persist last-known values per bookmark to avoid render flicker down
  const [lastKnown, setLastKnown] = useState<Record<string, BookmarkAnalytics>>({});

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Handle case where bookmarkId is an array (bookmarks) - fetch global analytics
      const isBookmarkIdString = typeof bookmarkId === 'string';
      const url = isBookmarkIdString ? `/api/bookmarks/analytics?bookmarkId=${bookmarkId}` : '/api/bookmarks/analytics';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        if (isBookmarkIdString) {
          const d = result.data
          console.log(`🔍 fetchAnalytics got data for ${d.bookmark_id}:`, d);
          
          // On initial load (page refresh), accept server data as truth
          // On subsequent fetches, use Math.max to prevent regression
          setLastKnown((prev) => {
            const current = prev[d.bookmark_id];
            const isInitialLoad = !current; // No previous data means initial load
            
            const updated = {
              ...prev,
              [d.bookmark_id]: {
                ...d,
                // On initial load, use server data directly
                // On subsequent loads, prevent regression
                visits: isInitialLoad ? (d.visits || 0) : Math.max(current.visits || 0, d.visits || 0),
                weeklyVisits: isInitialLoad ? (d.weeklyVisits || 0) : Math.max(current.weeklyVisits || 0, d.weeklyVisits || 0),
              } as any,
            };
            console.log(`💾 fetchAnalytics updated lastKnown for ${d.bookmark_id} (initial: ${isInitialLoad}):`, updated[d.bookmark_id]);
            return updated;
          });
          
          // Set analytics data directly from server on initial load
          console.log(`📊 Setting analyticsData for ${d.bookmark_id}:`, d);
          setAnalyticsData(d);
        } else {
          const arr = result.data.analytics || []
          console.log(`🔍 fetchAnalytics got global analytics:`, arr);
          setAnalyticsData(arr);
          setGlobalStats(result.data.globalStats);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [bookmarkId]);

  const trackVisit = useCallback(async (id: string) => {
    console.log(`🔄 trackVisit called for bookmark ${id}`);
    try {
      // Server-first update to avoid double-count/flicker
      const res = await fetch('/api/bookmarks/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId: id, action: 'visit' }),
      })
      const json = await res.json().catch(() => ({} as any))
      const server = (json && json.analytics) || null
      console.log(`📊 Server response for ${id}:`, server);

      if (server) {
        // Update lastKnown with server values (ensure they only go up)
        setLastKnown((prev) => {
          const current = prev[id] || { visits: 0, weeklyVisits: 0 } as any;
          const updated = {
            ...prev,
            [id]: {
              ...current,
              ...server,
              visits: Math.max(current.visits || 0, server.visits || 0),
              weeklyVisits: Math.max(current.weeklyVisits || 0, server.weeklyVisits || 0),
            }
          };
          console.log(`💾 Updated lastKnown for ${id}:`, updated[id]);
          return updated;
        });

        setAnalyticsData((prev) => {
          const newData = (() => {
            if (!prev) return server
            if (Array.isArray(prev)) {
              const found = prev.find((a: any) => a.bookmark_id === id)
              if (!found) return [...prev, server]
              return prev.map((a: any) => a.bookmark_id === id ? server : a)
            }
            if ((prev as any).bookmark_id === id) return server
            return prev
          })();
          console.log(`🎯 Updated analyticsData for ${id}:`, newData);
          return newData;
        })
      } else {
        console.log(`⚠️ No server analytics returned for ${id}, using fallback bump`);
        // Fallback: minimal bump if server didn't return analytics
        setAnalyticsData((prev) => {
          if (!prev) return prev
          const bump = (a: any) => {
            const bumped = {
              ...a,
              visits: (a.visits || 0) + 1,
              weeklyVisits: (a.weeklyVisits || 0) + 1,
              sessionCount: (a.sessionCount || 0) + 1,
              lastVisited: new Date().toISOString(),
            };
            console.log(`📈 Fallback bump for ${id}:`, bumped);
            return bumped;
          }
          if (Array.isArray(prev)) return prev.map((a: any) => a.bookmark_id === id ? bump(a) : a)
          if ((prev as any).bookmark_id === id) return bump(prev as any)
          return prev
        })

        // Update lastKnown even for fallback
        setLastKnown((prev) => {
          const current = prev[id] || { visits: 0, weeklyVisits: 0 } as any;
          const updated = {
            ...prev,
            [id]: {
              ...current,
              visits: (current.visits || 0) + 1,
              weeklyVisits: (current.weeklyVisits || 0) + 1,
            }
          };
          console.log(`💾 Updated lastKnown (fallback) for ${id}:`, updated[id]);
          return updated;
        });
      }
      // Skip the refresh to avoid overwriting our updates
      // setTimeout(fetchAnalytics, 400)
    } catch (e) {
      console.error('Failed to track visit:', e);
    }
  }, []);

  const trackTimeSpent = useCallback(async (id: string, timeSpent: number) => {
    try {
      await fetch('/api/bookmarks/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId: id, action: 'timeUpdate', timeSpent }),
      });
       fetchAnalytics();
    } catch (e) {
      console.error('Failed to track time spent:', e);
    }
  }, [fetchAnalytics]);

  const getBookmarkAnalytics = useCallback((id: string) => {
    // First check lastKnown for the most up-to-date values
    const lastKnownData = lastKnown[id];
    
    if (!analyticsData) return lastKnownData || null;
    
    let baseData = null;
    // If analyticsData is an array, find the specific bookmark
    if (Array.isArray(analyticsData)) {
      baseData = analyticsData.find(item => item.bookmark_id === id) || null;
    } else if (typeof analyticsData === 'object' && analyticsData.bookmark_id === id) {
      // If analyticsData is a single object and matches the id
      baseData = analyticsData;
    }
    
    // Merge with lastKnown to ensure we have the highest values
    if (baseData && lastKnownData) {
      return {
        ...baseData,
        visits: Math.max(baseData.visits || 0, lastKnownData.visits || 0),
        weeklyVisits: Math.max(baseData.weeklyVisits || 0, lastKnownData.weeklyVisits || 0),
      };
    }
    
    return baseData || lastKnownData || null;
  }, [analyticsData, lastKnown]);


  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return {
    analyticsData,
    globalStats,
    isLoading,
    error,
    trackVisit,
    trackTimeSpent,
    getBookmarkAnalytics,
    refreshAnalytics: fetchAnalytics,
  };
}

export function useBookmarkTracking() {
  const trackBookmarkVisit = useCallback(async (bookmarkId: string) => {
    try {
      await fetch('/api/bookmarks/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId, action: 'visit' }),
      });
    } catch (error) {
      console.error('Failed to track bookmark visit:', error)
    }
  }, [])

  return {
    trackBookmarkVisit,
  }
} 