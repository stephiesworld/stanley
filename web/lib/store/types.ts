// The persistence contract. Two implementations satisfy it:
//   - file-store.ts    (local dev / the /demo simulator — JSON under .data/)
//   - supabase-store.ts (production — the tables from BUILD-STANLEY-SMS.md)
// Conversation code only ever touches this interface, so flipping backends is a
// one-line change in store/index.ts.

export type UserStatus = "pending" | "active" | "stopped";

// Stanley is channel-agnostic. A user is reached over Telegram (default) or SMS;
// `chat_id` is whichever handle that channel uses (a Telegram chat id, or an
// E.164 phone number). `id` is a hash of channel+chat_id, so the same number on
// two channels never collides.
export type Channel = "telegram" | "sms";

export interface User {
  id: string;
  channel: Channel;
  chat_id: string; // Telegram chat id, or E.164 phone for SMS
  timezone: string; // IANA, e.g. America/New_York
  status: UserStatus;
  created_at: string; // ISO
}

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null; // epoch ms
  scope?: string | null;
}

// A change Stanley has PROPOSED but not executed. The confirmation handler is
// the only thing that turns one of these into a real calendar write.
export type ProposalType = "move" | "create" | "delete";

export interface ProposalAction {
  type: ProposalType;
  event_id?: string; // for move/delete — concrete Google event id
  title?: string; // for create, or human label
  new_start?: string; // ISO, for move/create
  new_end?: string; // ISO, for move/create
  location?: string;
}

export interface PendingProposal {
  id: string;
  user_id: string;
  action: ProposalAction;
  human_summary: string; // what Stanley said, for the confirmation echo
  created_at: string; // ISO
  expires_at: string; // ISO — stale proposals are ignored
}

// The last executed write, stored as its INVERSE so "undo" can reverse it.
export interface LastChange {
  action: ProposalAction; // the inverse — apply it to undo
  summary: string; // describes the original change, for the echo
}

// Append-only, verbatim — Layer 2 of memory.
export interface Episode {
  id: string;
  user_id: string;
  text: string; // raw user statement
  created_at: string; // ISO
}

export interface Message {
  id: string;
  user_id: string;
  direction: "in" | "out";
  body: string;
  created_at: string; // ISO
}

// Layer 1 of memory — the Quirks Profile (quirks_profile.schema.json shape).
// Kept loosely typed here; the schema is the source of truth.
export interface MemoryProfile {
  user_id: string;
  updated_at: string;
  preferences: unknown[];
  seasons: unknown[];
  guarded_blocks?: unknown[];
  labels?: Record<string, unknown>;
}

export interface Store {
  // users
  getUserByChatId(chatId: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  upsertUser(u: User): Promise<User>;
  setUserStatus(userId: string, status: UserStatus): Promise<void>;
  listActiveUsers(): Promise<User[]>;

  // google tokens (stored encrypted by the store impl)
  getTokens(userId: string): Promise<GoogleTokens | null>;
  setTokens(userId: string, tokens: GoogleTokens): Promise<void>;

  // oauth handoff: opaque token -> userId, single use
  putOAuthHandoff(token: string, userId: string): Promise<void>;
  takeOAuthHandoff(token: string): Promise<string | null>;

  // pending proposals (the write gate)
  putProposal(p: PendingProposal): Promise<void>;
  latestPendingProposal(userId: string): Promise<PendingProposal | null>;
  clearProposals(userId: string): Promise<void>;

  // last executed write, for undo
  setLastChange(userId: string, change: LastChange | null): Promise<void>;
  getLastChange(userId: string): Promise<LastChange | null>;

  // memory
  appendEpisode(e: Episode): Promise<void>;
  recentEpisodes(userId: string, limit: number): Promise<Episode[]>;
  getProfile(userId: string): Promise<MemoryProfile | null>;
  setProfile(p: MemoryProfile): Promise<void>;

  // transcript
  appendMessage(m: Message): Promise<void>;
  recentMessages(userId: string, limit: number): Promise<Message[]>;
}
