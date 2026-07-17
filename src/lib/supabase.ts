import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://tebccrvgokmkclnjufxr.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_1iWoRXyZ9GGbQdTAwRtXDQ_7Ou8ZvbM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
