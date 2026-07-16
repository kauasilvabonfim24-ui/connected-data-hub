import { createClient } from "@supabase/supabase-js";

// Servix IA — projeto Supabase externo (BYO).
// A chave publicável (sb_publishable_...) é segura para uso no frontend.
const SUPABASE_URL = "https://tebccrvgokmkclnjufxr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1iWoRXyZ9GGbQdTAwRtXDQ_7Ou8ZvbM";

// Novas chaves sb_ não são JWTs — remover o Authorization: Bearer padrão evita
// "Expected 3 parts in JWT; got 1" no PostgREST; mantemos apenas o apikey.
const patchedFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (headers.get("Authorization") === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  global: { fetch: patchedFetch },
});
