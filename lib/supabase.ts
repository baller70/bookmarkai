/**
 * DEPRECATED: This app has migrated away from Supabase to Abacus AI PostgreSQL + Prisma
 *
 * This is a stub file for compatibility during migration.
 *
 * Use instead:
 * - import { DatabaseService } from '@/lib/db-service'
 * - import { prisma } from '@/lib/prisma'
 */

function createChainableQuery(): any {
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

function createSupabaseStub() {
  return {
    from: (table: string) => createChainableQuery(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      })
    }
  }
}

export const supabase = createSupabaseStub()

export function createClient(url?: string, key?: string, options?: any) {
  console.warn('[DEPRECATED] createClient from @/lib/supabase is a stub. Please migrate to Prisma.')
  return createSupabaseStub()
}

export function createClientComponentClient() {
  console.warn('[DEPRECATED] createClientComponentClient is a stub. Please migrate to NextAuth and Prisma.')
  return createSupabaseStub()
}

export function createRouteHandlerClient(context?: any) {
  console.warn('[DEPRECATED] createRouteHandlerClient is a stub. Please migrate to NextAuth and Prisma.')
  return createSupabaseStub()
}

export function createMiddlewareClient(context?: any) {
  console.warn('[DEPRECATED] createMiddlewareClient is a stub. Please migrate to NextAuth and Prisma.')
  return createSupabaseStub()
}
