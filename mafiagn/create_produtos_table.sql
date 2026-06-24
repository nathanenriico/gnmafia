-- Execute no Supabase SQL Editor
create table if not exists produtos (
  id          text primary key default 'photo-' || extract(epoch from now())::bigint::text,
  title       text not null,
  alt         text,
  category    text default 'bobojaco',
  price       numeric(10,2) default 0,
  images      jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table produtos enable row level security;

create policy "public read" on produtos for select using (true);
create policy "anon insert" on produtos for insert with check (true);
create policy "anon update" on produtos for update using (true);
create policy "anon delete" on produtos for delete using (true);
