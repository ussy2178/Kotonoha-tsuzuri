// src/lib/supabase/admin.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('[admin.ts] URL =', url)
console.log('[admin.ts] KEY exists =', !!key)

if (!url || !key) {
  throw new Error('Supabase env not loaded')
}

export const supabaseAdmin = createClient(url, key)