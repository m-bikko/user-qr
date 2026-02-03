-- Create 'restaurants' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('restaurants', 'restaurants', true)
on conflict (id) do nothing;

-- Set up RLS for the 'restaurants' bucket
-- Drop policies if they exist to allow re-running (idempotency)
drop policy if exists "Public Access Restaurants Bucket" on storage.objects;
drop policy if exists "Authenticated Admin Upload Restaurants" on storage.objects;
drop policy if exists "Authenticated Admin Update Restaurants" on storage.objects;
drop policy if exists "Authenticated Admin Delete Restaurants" on storage.objects;

create policy "Public Access Restaurants Bucket"
  on storage.objects for select
  using ( bucket_id = 'restaurants' );

create policy "Authenticated Admin Upload Restaurants"
  on storage.objects for insert
  with check ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );

create policy "Authenticated Admin Update Restaurants"
  on storage.objects for update
  using ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );

create policy "Authenticated Admin Delete Restaurants"
  on storage.objects for delete
  using ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );
