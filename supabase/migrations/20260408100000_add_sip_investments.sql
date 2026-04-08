-- SIP Investments table
create table if not exists public.sip_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_name text not null,
  amc text not null,
  fund_type text not null check (fund_type in ('equity', 'debt', 'hybrid', 'elss', 'index', 'other')),
  monthly_amount numeric(12,2) not null check (monthly_amount > 0),
  sip_date integer not null check (sip_date between 1 and 31),
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  color text not null default 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_sip_user_id on public.sip_investments(user_id);
create index if not exists idx_sip_status on public.sip_investments(status);

-- RLS
alter table public.sip_investments enable row level security;

create policy "Users can view own SIPs" on public.sip_investments
  for select using (auth.uid() = user_id);

create policy "Users can insert own SIPs" on public.sip_investments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own SIPs" on public.sip_investments
  for update using (auth.uid() = user_id);

create policy "Users can delete own SIPs" on public.sip_investments
  for delete using (auth.uid() = user_id);

-- updated_at trigger
create trigger update_sip_updated_at
  before update on public.sip_investments
  for each row execute function update_updated_at_column();
