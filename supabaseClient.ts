
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://chzkslqbplmpepvydacu.supabase.co';
const supabaseKey = 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
