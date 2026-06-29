-- Stanley — Supabase schema (BUILD-STANLEY-SMS.md data model).
-- Run once in the Supabase SQL editor. The service key bypasses RLS; isolation
-- is enforced in app code (a verified phone only ever resolves to its own rows).
-- RLS is still enabled with no public policies as defense in depth.

create table if not exists users (
  id          text primary key,            -- == handleHash(channel, chat_id)
  channel     text not null default 'telegram',  -- telegram | sms
  chat_id     text unique not null,         -- Telegram chat id, or E.164 phone
  timezone    text not null default 'America/New_York',
  status      text not null default 'pending',  -- pending | active | stopped
  created_at  timestamptz not null default now()
);

create table if not exists google_tokens (
  user_id     text primary key references users(id) on delete cascade,
  payload     text not null,                -- AES-256-GCM encrypted token JSON
  updated_at  timestamptz not null default now()
);

create table if not exists oauth_handoffs (
  token       text primary key,             -- single-use SMS->browser handoff
  user_id     text not null references users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists pending_proposals (
  id            text primary key,
  user_id       text not null references users(id) on delete cascade,
  action        jsonb not null,             -- {type,event_id,new_start,...}
  human_summary text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);
create index if not exists pending_proposals_user on pending_proposals(user_id, expires_at desc);

create table if not exists last_changes (
  user_id     text primary key references users(id) on delete cascade,
  action      jsonb not null,               -- the INVERSE of the last write
  summary     text not null,
  updated_at  timestamptz not null default now()
);

create table if not exists episodes (
  id          text primary key,
  user_id     text not null references users(id) on delete cascade,
  text        text not null,                -- verbatim user statement
  created_at  timestamptz not null default now()
);
create index if not exists episodes_user on episodes(user_id, created_at desc);

create table if not exists memory_profile (
  user_id        text primary key references users(id) on delete cascade,
  updated_at     timestamptz not null default now(),
  preferences    jsonb not null default '[]',
  seasons        jsonb not null default '[]',
  guarded_blocks jsonb not null default '[]',
  labels         jsonb not null default '{}'
);

create table if not exists messages (
  id          text primary key,
  user_id     text not null references users(id) on delete cascade,
  direction   text not null,                -- in | out
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_user on messages(user_id, created_at desc);

alter table users            enable row level security;
alter table google_tokens    enable row level security;
alter table oauth_handoffs   enable row level security;
alter table pending_proposals enable row level security;
alter table last_changes      enable row level security;
alter table episodes         enable row level security;
alter table memory_profile   enable row level security;
alter table messages         enable row level security;
