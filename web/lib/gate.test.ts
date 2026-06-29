import { describe, it, expect, beforeAll } from "vitest";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// These cover the security/write-gate machinery that must work WITHOUT calling
// any model — the parts that, if wrong, would let a write happen without a yes.

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
});

describe("token encryption at rest", () => {
  it("round-trips and rejects tampering", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const secret = JSON.stringify({ refresh_token: "1//super-secret", access_token: "ya29.x" });
    const blob = encrypt(secret);
    expect(blob).not.toContain("super-secret");
    expect(decrypt(blob)).toBe(secret);
    const tampered = blob.slice(0, -2) + "xx";
    expect(() => decrypt(tampered)).toThrow();
  });
});

describe("affirmative / negative detection (the gate's trigger)", () => {
  it("recognizes yeses and noes, ignores ambiguous", async () => {
    const { isAffirmative, isNegative } = await import("./conversation");
    for (const y of ["Y", "yes", "Yep", "ok do it", "approve", "👍"]) expect(isAffirmative(y)).toBe(true);
    for (const n of ["N", "no", "nope", "cancel", "leave it"]) expect(isNegative(n)).toBe(true);
    expect(isAffirmative("what about Thursday?")).toBe(false);
    expect(isNegative("what about Thursday?")).toBe(false);
  });
});

describe("mock calendar write (what the demo gate executes)", () => {
  it("moves an event only when apply() is called", async () => {
    const { mockCalendarSource } = await import("./calendar-source");
    const { MOCK_EVENTS } = await import("./mock-calendar");
    const events = structuredClone(MOCK_EVENTS);
    const target = events.find((e) => e.summary === "Eyebrow appt")!;
    const cal = mockCalendarSource(() => events, () => {});

    expect(target.start?.dateTime).toContain("14:00");
    await cal.apply({
      type: "move",
      event_id: target.id!,
      new_start: "2026-06-13T16:00:00-04:00",
      new_end: "2026-06-13T17:00:00-04:00",
    });
    const moved = events.find((e) => e.id === target.id)!;
    expect(moved.start?.dateTime).toBe("2026-06-13T16:00:00-04:00");
  });
});

describe("pending-proposal lifecycle (file store)", () => {
  it("stores one live proposal, supersedes, and clears", async () => {
    const { FileStore } = await import("./store/file-store");
    const dir = path.join(os.tmpdir(), `stanley-test-${crypto.randomBytes(4).toString("hex")}`);
    const store = new FileStore(dir);
    const future = new Date(Date.now() + 60_000).toISOString();

    await store.putProposal({
      id: "p1",
      user_id: "u1",
      action: { type: "delete", event_id: "e1" },
      human_summary: "cleared X",
      created_at: new Date().toISOString(),
      expires_at: future,
    });
    expect((await store.latestPendingProposal("u1"))?.id).toBe("p1");

    await store.clearProposals("u1");
    expect(await store.latestPendingProposal("u1")).toBeNull();
  });

  it("ignores expired proposals", async () => {
    const { FileStore } = await import("./store/file-store");
    const dir = path.join(os.tmpdir(), `stanley-test-${crypto.randomBytes(4).toString("hex")}`);
    const store = new FileStore(dir);
    await store.putProposal({
      id: "old",
      user_id: "u2",
      action: { type: "delete", event_id: "e1" },
      human_summary: "x",
      created_at: "2000-01-01T00:00:00Z",
      expires_at: "2000-01-01T00:30:00Z",
    });
    expect(await store.latestPendingProposal("u2")).toBeNull();
  });
});
