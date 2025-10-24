/**
 * DEPRECATED: This file is deprecated. Use DatabaseService from @/lib/db-service instead.
 */

// Stub exports for compatibility
export const DEMO_USER_ID = 'dev-user-123'

function createChainableQuery() {
  const chain: any = {
    select: (columns?: string) => chain,
    insert: (data: any) => chain,
    update: (data: any) => chain,
    delete: () => chain,
    upsert: (data: any) => chain,
    eq: (column: string, value: any) => chain,
    neq: (column: string, value: any) => chain,
    gt: (column: string, value: any) => chain,
    gte: (column: string, value: any) => chain,
    lt: (column: string, value: any) => chain,
    lte: (column: string, value: any) => chain,
    like: (column: string, value: any) => chain,
    ilike: (column: string, value: any) => chain,
    is: (column: string, value: any) => chain,
    in: (column: string, values: any[]) => chain,
    contains: (column: string, value: any) => chain,
    containedBy: (column: string, value: any) => chain,
    rangeGt: (column: string, value: any) => chain,
    rangeGte: (column: string, value: any) => chain,
    rangeLt: (column: string, value: any) => chain,
    rangeLte: (column: string, value: any) => chain,
    rangeAdjacent: (column: string, value: any) => chain,
    overlaps: (column: string, value: any) => chain,
    textSearch: (column: string, query: string, config?: any) => chain,
    match: (query: Record<string, any>) => chain,
    not: (column: string, operator: string, value: any) => chain,
    or: (filters: string) => chain,
    filter: (column: string, operator: string, value: any) => chain,
    order: (column: string, options?: any) => chain,
    limit: (count: number) => chain,
    range: (from: number, to: number) => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    csv: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any, reject?: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  }
  return chain
}

export function createDemoSupabaseClient() {
  return {
    from: (table: string) => createChainableQuery(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any, options?: any) => Promise.resolve({ data: { path }, error: null }),
        download: (path: string) => Promise.resolve({ data: null, error: null }),
        remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
        createSignedUrl: (path: string, expiresIn: number) => Promise.resolve({ data: { signedUrl: '' }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://placeholder.supabase.co/storage/v1/object/public/${bucket}/${path}` } })
      })
    }
  }
}

export const supabase = createDemoSupabaseClient()
