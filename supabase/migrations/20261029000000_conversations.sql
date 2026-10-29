-- Voice assistant conversation log. Written only by the Vercel API using the
-- secret key (bypasses RLS). RLS is enabled with no policies, so the table is
-- not readable or writable through the public (anon/authenticated) Data API.
create table if not exists public.conversations (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  question text not null,
  question_translation text,
  answer text,
  language text not null check (language in ('en', 'ta')),
  provider text not null,
  latency_ms integer not null,
  success boolean not null,
  error text
);

alter table public.conversations enable row level security;

revoke all on table public.conversations from anon, authenticated;

create index if not exists conversations_created_at_idx
  on public.conversations (created_at desc);
