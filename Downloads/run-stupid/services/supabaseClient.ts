/**
 * Supabase client singleton for Run Stupid.
 *
 * Setup:
 *  1. `npm install @supabase/supabase-js`
 *  2. Create a `.env` file in the project root with:
 *       VITE_SUPABASE_URL=https://your-project.supabase.co
 *       VITE_SUPABASE_ANON_KEY=your-anon-key
 *  3. Find both values in: Supabase Dashboard → Settings → API
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[RunStupid] Supabase env vars missing. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
