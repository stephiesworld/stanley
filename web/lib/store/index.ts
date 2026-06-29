import { Store } from "./types";
import { FileStore } from "./file-store";
import { SupabaseStore } from "./supabase-store";

// One process-wide store. Supabase if configured, otherwise the local file
// store — so the full propose→confirm→write loop runs with zero accounts.
let singleton: Store | null = null;

export function getStore(): Store {
  if (singleton) return singleton;
  singleton =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
      ? new SupabaseStore()
      : new FileStore();
  return singleton;
}

export function storeBackend(): "supabase" | "file" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? "supabase" : "file";
}

export * from "./types";
