-- Voice assistant conversation log, written by the Vercel API (/api/ai-bible/ask).
--
-- The API writes with the secret key when SUPABASE_SECRET_KEY is set (bypasses
-- RLS), otherwise with the publishable key under the insert-only policy below.
-- Nobody can read, update or delete rows through the Data API; read them in the
-- dashboard / SQL editor.
create table if not exists public.conversations (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  question text not null check (char_length(question) between 1 and 2000),
  question_translation text check (char_length(question_translation) <= 2000),
  answer text check (char_length(answer) <= 10000),
  language text not null check (language in ('en', 'ta')),
  provider text not null check (char_length(provider) <= 100),
  latency_ms integer not null check (latency_ms between 0 and 600000),
  success boolean not null,
  error text check (char_length(error) <= 1000)
);

alter table public.conversations enable row level security;

revoke all on table public.conversations from anon, authenticated;
grant insert on table public.conversations to anon;

create policy "API can append conversation logs"
  on public.conversations
  for insert
  to anon
  with check (true);

create index if not exists conversations_created_at_idx
  on public.conversations (created_at desc);
