import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cloud sync is optional. With these unset the app runs exactly as before:
 * local-only, data in localStorage, no login screen.
 *
 * The anon (publishable) key is designed to be public; Row Level Security in
 * supabase/schema.sql is what keeps each user's data private.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "pfd:auth" },
      })
    : null;

export const isCloudEnabled = supabase !== null;

export type OAuthProvider = "google" | "github";

/** OAuth buttons shown on the login page, e.g. VITE_AUTH_PROVIDERS="google,github". */
export const OAUTH_PROVIDERS: OAuthProvider[] = (import.meta.env.VITE_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is OAuthProvider => p === "google" || p === "github");
