#!/bin/bash

# Script to remove Supabase imports and replace with stubs

# Create stub for supabase-demo
mkdir -p lib
cat > lib/supabase-demo.ts << 'STUB'
/**
 * DEPRECATED: This file is deprecated. Use DatabaseService from @/lib/db-service instead.
 */
import { appLogger } from '@/lib/logger'

appLogger.warn('[supabase-demo] DEPRECATED: This file is deprecated. Use DatabaseService instead.')

export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  })
}
STUB

# Create stub for utils/supabase-server
mkdir -p app/api/ai/utils
cat > app/api/ai/utils/supabase-server.ts << 'STUB'
/**
 * DEPRECATED: This file is deprecated. Use DatabaseService from @/lib/db-service instead.
 */
export const createClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  })
})
STUB

echo "Supabase stubs created successfully"
