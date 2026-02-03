-- Helper Functions
create or replace function public.is_super_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql security definer;

create or replace function public.get_my_restaurant_id() returns uuid as $$
  select restaurant_id from public.profiles
  where id = auth.uid();
$$ language sql security definer;

-- Categories RLS
alter table public.categories enable row level security;

-- Drop existing policies if any to ensure clean slate
drop policy if exists "Public read" on public.categories;
drop policy if exists "Admin all" on public.categories;
drop policy if exists "Public Read Categories" on public.categories;
drop policy if exists "Admin Manage Categories" on public.categories;

-- Policy 1: Anon users (Public Menu) can read everything (filtered by query usually)
create policy "Public Read Categories" on public.categories
  for select to anon
  using (true);

-- Policy 2: Authenticated Admins can Manage ONLY their own restaurant's data (or ALL if Super Admin)
create policy "Admin Manage Categories" on public.categories
  for all to authenticated
  using (
    public.is_super_admin() or 
    restaurant_id = public.get_my_restaurant_id()
  )
  with check (
    public.is_super_admin() or 
    restaurant_id = public.get_my_restaurant_id()
  );

-- Products RLS
alter table public.products enable row level security;

drop policy if exists "Public read" on public.products;
drop policy if exists "Admin all" on public.products;
drop policy if exists "Public Read Products" on public.products;
drop policy if exists "Admin Manage Products" on public.products;

create policy "Public Read Products" on public.products
  for select to anon
  using (true);

create policy "Admin Manage Products" on public.products
  for all to authenticated
  using (
    public.is_super_admin() or 
    restaurant_id = public.get_my_restaurant_id()
  )
  with check (
    public.is_super_admin() or 
    restaurant_id = public.get_my_restaurant_id()
  );

-- Restaurants RLS (Update)
-- Ensure Public Read is still there (created in previous migration? Check.)
-- We need Super Admin Write Access.
create policy "Super Admin Manage Restaurants" on public.restaurants
  for all to authenticated
  using ( public.is_super_admin() )
  with check ( public.is_super_admin() );

-- Profiles RLS (Refinement)
-- Ensure users can read their own profile (already there potentially)
-- Super Admins might need to read all profiles?
create policy "Super Admin Read All Profiles" on public.profiles
  for select to authenticated
  using ( public.is_super_admin() );
