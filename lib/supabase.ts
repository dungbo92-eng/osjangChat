import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Server-side Supabase client (Service Role).
 * RLS 우회 — 절대 클라이언트 컴포넌트에서 import 금지.
 */
export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다.");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "clothing";
