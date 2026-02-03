
-- 1. Create Role Enum
create type public.app_role as enum ('super_admin', 'restaurant_admin');

-- 2. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role public.app_role not null default 'restaurant_admin',
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.profiles enable row level security;

-- 4. Policies
-- Users can read their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

-- 5. Function to handle new user signup (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role, restaurant_id)
  values (new.id, 'restaurant_admin', null);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
