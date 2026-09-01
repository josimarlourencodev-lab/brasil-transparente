import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let cachedAdmin: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl =
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_INTERNAL_URL) e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
    );
  }

  cached = createClient(supabaseUrl, supabaseAnonKey);
  return cached;
}

export function supabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const supabaseUrl =
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Variáveis SUPABASE_INTERNAL_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no servidor."
    );
  }

  cachedAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  return cachedAdmin;
}