import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  Store,
  User,
  UserStatus,
  GoogleTokens,
  PendingProposal,
  ProposalAction,
  LastChange,
  Episode,
  Message,
  MemoryProfile,
} from "./types";

// Production store. Schema is created by db/schema.sql. The service key is
// server-only; row-level isolation is by user_id (a phone only ever touches its
// own rows because conversation code resolves the user from the verified number).

export class SupabaseStore implements Store {
  private db: SupabaseClient;

  constructor() {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set");
    }
    this.db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }

  async getUserByChatId(chatId: string): Promise<User | null> {
    const { data } = await this.db.from("users").select("*").eq("chat_id", chatId).maybeSingle();
    return (data as User) ?? null;
  }
  async getUserById(id: string): Promise<User | null> {
    const { data } = await this.db.from("users").select("*").eq("id", id).maybeSingle();
    return (data as User) ?? null;
  }
  async upsertUser(u: User): Promise<User> {
    const { data, error } = await this.db.from("users").upsert(u).select().single();
    if (error) throw error;
    return data as User;
  }
  async setUserStatus(userId: string, status: UserStatus): Promise<void> {
    await this.db.from("users").update({ status }).eq("id", userId);
  }
  async listActiveUsers(): Promise<User[]> {
    const { data } = await this.db.from("users").select("*").eq("status", "active");
    return (data as User[]) ?? [];
  }

  async getTokens(userId: string): Promise<GoogleTokens | null> {
    const { data } = await this.db
      .from("google_tokens")
      .select("payload")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return JSON.parse(decrypt((data as { payload: string }).payload)) as GoogleTokens;
  }
  async setTokens(userId: string, tokens: GoogleTokens): Promise<void> {
    await this.db
      .from("google_tokens")
      .upsert({ user_id: userId, payload: encrypt(JSON.stringify(tokens)) });
  }

  async putOAuthHandoff(token: string, userId: string): Promise<void> {
    await this.db.from("oauth_handoffs").upsert({ token, user_id: userId });
  }
  async takeOAuthHandoff(token: string): Promise<string | null> {
    const { data } = await this.db
      .from("oauth_handoffs")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();
    if (!data) return null;
    await this.db.from("oauth_handoffs").delete().eq("token", token);
    return (data as { user_id: string }).user_id;
  }

  async putProposal(p: PendingProposal): Promise<void> {
    await this.db.from("pending_proposals").delete().eq("user_id", p.user_id);
    await this.db.from("pending_proposals").insert(p);
  }
  async latestPendingProposal(userId: string): Promise<PendingProposal | null> {
    const { data } = await this.db
      .from("pending_proposals")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as PendingProposal) ?? null;
  }
  async clearProposals(userId: string): Promise<void> {
    await this.db.from("pending_proposals").delete().eq("user_id", userId);
  }

  async setLastChange(userId: string, change: LastChange | null): Promise<void> {
    if (change) {
      await this.db
        .from("last_changes")
        .upsert({ user_id: userId, action: change.action, summary: change.summary });
    } else {
      await this.db.from("last_changes").delete().eq("user_id", userId);
    }
  }
  async getLastChange(userId: string): Promise<LastChange | null> {
    const { data } = await this.db
      .from("last_changes")
      .select("action, summary")
      .eq("user_id", userId)
      .maybeSingle();
    return data ? { action: (data as { action: ProposalAction }).action, summary: (data as { summary: string }).summary } : null;
  }

  async appendEpisode(e: Episode): Promise<void> {
    await this.db.from("episodes").insert(e);
  }
  async recentEpisodes(userId: string, limit: number): Promise<Episode[]> {
    const { data } = await this.db
      .from("episodes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Episode[]) ?? []).reverse();
  }
  async getProfile(userId: string): Promise<MemoryProfile | null> {
    const { data } = await this.db
      .from("memory_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as MemoryProfile) ?? null;
  }
  async setProfile(p: MemoryProfile): Promise<void> {
    await this.db.from("memory_profile").upsert(p);
  }

  async appendMessage(m: Message): Promise<void> {
    await this.db.from("messages").insert(m);
  }
  async recentMessages(userId: string, limit: number): Promise<Message[]> {
    const { data } = await this.db
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Message[]) ?? []).reverse();
  }
}
