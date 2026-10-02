-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  email text,
  name text,
  phone text,
  address text,
  items jsonb not null,
  total numeric not null,
  created_at timestamptz not null default now()
);
alter table orders enable row level security;
-- Customers can only read their own orders. Inserts are done by the server.
create policy "read own orders" on orders for select using (auth.uid() = user_id);
