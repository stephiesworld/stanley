import fs from "node:fs";
import path from "node:path";
import { encrypt, decrypt, randomToken } from "@/lib/crypto";
import {
  Store,
  User,
  UserStatus,
  GoogleTokens,
  PendingProposal,
  LastChange,
  Episode,
  Message,
  MemoryProfile,
} from "./types";

// JSON-file store: the dev/demo fallback for Supabase. Single file under
// `.data/` (gitignored). Not concurrency-safe — fine for one developer and the
// single-user prototype; production uses supabase-store.ts.

interface DbShape {
  users: User[];
  tokens: Record<string, string>; // userId -> encrypted JSON
  handoffs: Record<string, string>; // token -> userId
  proposals: PendingProposal[];
  lastChanges: Record<string, LastChange>; // userId -> inverse of last write
  episodes: Episode[];
  messages: Message[];
  profiles: Record<string, MemoryProfile>;
}

const EMPTY: DbShape = {
  users: [],
  tokens: {},
  handoffs: {},
  proposals: [],
  lastChanges: {},
  episodes: [],
  messages: [],
  profiles: {},
};

export class FileStore implements Store {
  private file: string;

  constructor(dir = path.join(process.cwd(), ".data")) {
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "store.json");
  }

  private read(): DbShape {
    try {
      return { ...EMPTY, ...JSON.parse(fs.readFileSync(this.file, "utf8")) };
    } catch {
      return structuredClone(EMPTY);
    }
  }
  private write(db: DbShape): void {
    fs.writeFileSync(this.file, JSON.stringify(db, null, 2));
  }

  async getUserByChatId(chatId: string): Promise<User | null> {
    return this.read().users.find((u) => u.chat_id === chatId) ?? null;
  }
  async getUserById(id: string): Promise<User | null> {
    return this.read().users.find((u) => u.id === id) ?? null;
  }
  async upsertUser(u: User): Promise<User> {
    const db = this.read();
    const i = db.users.findIndex((x) => x.id === u.id);
    if (i >= 0) db.users[i] = u;
    else db.users.push(u);
    this.write(db);
    return u;
  }
  async setUserStatus(userId: string, status: UserStatus): Promise<void> {
    const db = this.read();
    const u = db.users.find((x) => x.id === userId);
    if (u) {
      u.status = status;
      this.write(db);
    }
  }
  async listActiveUsers(): Promise<User[]> {
    return this.read().users.filter((u) => u.status === "active");
  }

  async getTokens(userId: string): Promise<GoogleTokens | null> {
    const enc = this.read().tokens[userId];
    return enc ? (JSON.parse(decrypt(enc)) as GoogleTokens) : null;
  }
  async setTokens(userId: string, tokens: GoogleTokens): Promise<void> {
    const db = this.read();
    db.tokens[userId] = encrypt(JSON.stringify(tokens));
    this.write(db);
  }

  async putOAuthHandoff(token: string, userId: string): Promise<void> {
    const db = this.read();
    db.handoffs[token] = userId;
    this.write(db);
  }
  async takeOAuthHandoff(token: string): Promise<string | null> {
    const db = this.read();
    const userId = db.handoffs[token] ?? null;
    if (userId) {
      delete db.handoffs[token];
      this.write(db);
    }
    return userId;
  }

  async putProposal(p: PendingProposal): Promise<void> {
    const db = this.read();
    // one live proposal per user — supersede any previous
    db.proposals = db.proposals.filter((x) => x.user_id !== p.user_id);
    db.proposals.push(p);
    this.write(db);
  }
  async latestPendingProposal(userId: string): Promise<PendingProposal | null> {
    const now = new Date().toISOString();
    const live = this.read()
      .proposals.filter((p) => p.user_id === userId && p.expires_at > now)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return live[0] ?? null;
  }
  async clearProposals(userId: string): Promise<void> {
    const db = this.read();
    db.proposals = db.proposals.filter((p) => p.user_id !== userId);
    this.write(db);
  }

  async setLastChange(userId: string, change: LastChange | null): Promise<void> {
    const db = this.read();
    if (change) db.lastChanges[userId] = change;
    else delete db.lastChanges[userId];
    this.write(db);
  }
  async getLastChange(userId: string): Promise<LastChange | null> {
    return this.read().lastChanges[userId] ?? null;
  }

  async appendEpisode(e: Episode): Promise<void> {
    const db = this.read();
    db.episodes.push(e);
    this.write(db);
  }
  async recentEpisodes(userId: string, limit: number): Promise<Episode[]> {
    return this.read()
      .episodes.filter((e) => e.user_id === userId)
      .slice(-limit);
  }
  async getProfile(userId: string): Promise<MemoryProfile | null> {
    return this.read().profiles[userId] ?? null;
  }
  async setProfile(p: MemoryProfile): Promise<void> {
    const db = this.read();
    db.profiles[p.user_id] = p;
    this.write(db);
  }

  async appendMessage(m: Message): Promise<void> {
    const db = this.read();
    db.messages.push(m);
    this.write(db);
  }
  async recentMessages(userId: string, limit: number): Promise<Message[]> {
    return this.read()
      .messages.filter((m) => m.user_id === userId)
      .slice(-limit);
  }
}

// Handy elsewhere.
export { randomToken };
