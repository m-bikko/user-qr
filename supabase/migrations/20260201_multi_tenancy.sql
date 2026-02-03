
-- 1. Create restaurants table
create table if not exists public.restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Insert default restaurant
insert into public.restaurants (name, slug)
values ('Demo Restaurant', 'demo-restaurant')
on conflict (slug) do nothing;

-- 3. Add restaurant_id to categories and products
alter table public.categories 
add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

alter table public.products 
add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

-- 4. Update existing data to belong to the default restaurant
do $$
declare
  default_rest_id uuid;
begin
  select id into default_rest_id from public.restaurants where slug = 'demo-restaurant' limit 1;
  
  if default_rest_id is not null then
    update public.categories set restaurant_id = default_rest_id where restaurant_id is null;
    update public.products set restaurant_id = default_rest_id where restaurant_id is null;
  end if;
end $$;

-- 5. Enforce NOT NULL (after migration)
-- alter table public.categories alter column restaurant_id set not null; -- Optional: Enforce strictly later
-- alter table public.products alter column restaurant_id set not null;

-- 6. Enable RLS on restaurants
alter table public.restaurants enable row level security;
create policy "Allow public read restaurants" on public.restaurants for select using (true);
