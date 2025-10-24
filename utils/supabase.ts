
/**
 * DEPRECATED: Use DatabaseService instead
 */

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
    order: (column: string, options?: any) => chain,
    limit: (count: number) => chain,
    range: (from: number, to: number) => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any, reject?: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  }
  return chain
}

export const supabase = {
  from: (table: string) => createChainableQuery(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    updateUser: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
    })
  }
}
