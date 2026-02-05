-- 1. Create Kitchens Table
create table if not exists public.kitchens (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name_en text not null,
  name_ru text not null,
  name_kz text not null,
  slug text, -- Optional for now, useful for anchors
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add kitchen_id to Categories
alter table public.categories
add column if not exists kitchen_id uuid references public.kitchens(id) on delete cascade;

-- 3. Enable RLS on Kitchens
alter table public.kitchens enable row level security;

-- Drop generic policies if they exist (good practice for idempotency)
drop policy if exists "Public Read Kitchens" on public.kitchens;
drop policy if exists "Admin Manage Kitchens" on public.kitchens;

-- Policy: Public Read
create policy "Public Read Kitchens" on public.kitchens
  for select to anon
  using (true);

-- Policy: Admin Write (Matches Logic for Categories)
create policy "Admin Manage Kitchens" on public.kitchens
  for all to authenticated
  using (
    public.is_super_admin() or
    restaurant_id = public.get_my_restaurant_id()
  )
  with check (
    public.is_super_admin() or
    restaurant_id = public.get_my_restaurant_id()
  );

-- 4. Data Migration: Create Default Kitchen for EACH Restaurant and assign existing categories
do $$
declare
  r record;
  k_id uuid;
begin
  for r in select id from public.restaurants loop
    -- Check if this restaurant already has a kitchen?
    -- For simplicity, we create a "Main Kitchen" if none exists, or just ensure one exists to map orphaned categories.
    
    -- Insert 'Main Kitchen'
    insert into public.kitchens (restaurant_id, name_en, name_ru, name_kz, sort_order)
    values (r.id, 'Main Kitchen', 'Основная Кухня', 'Негізгі Асхана', 0)
    returning id into k_id;
    
    -- Update orphaned categories for this restaurant
    update public.categories
    set kitchen_id = k_id
    where restaurant_id = r.id and kitchen_id is null;
    
  end loop;
end $$;

-- 5. Optional: Enforce NOT NULL on categories.kitchen_id
-- NOW that we have migrated data, we can enforce it.
-- alter table public.categories alter column kitchen_id set not null;
