
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://chzkslqbplmpepvydacu.supabase.co';
const supabaseKey = 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO';

// Explicitly enable session persistence to handle auto-login on refresh
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
