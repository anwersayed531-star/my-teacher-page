import { createClient } from "@supabase/supabase-js";

// Publishable key — safe to expose in the browser (RLS enforces access).
const SUPABASE_URL = "https://tfmkjssvlukeydzwkowz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_G1S5DbaVWOz408DvAJvj8g_fhTVU1To";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // sb_publishable_ keys are opaque, not JWTs — strip default Bearer header.
    fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (h.get("Authorization") === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`) {
        h.delete("Authorization");
      }
      h.set("apikey", SUPABASE_PUBLISHABLE_KEY);
      return fetch(input, { ...init, headers: h });
    },
  },
});