-- Create 'restaurants' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('restaurants', 'restaurants', true)
on conflict (id) do nothing;

-- Set up RLS for the 'restaurants' bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'restaurants' );

create policy "Authenticated Admin Upload"
  on storage.objects for insert
  with check ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );

create policy "Authenticated Admin Update"
  on storage.objects for update
  using ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );

create policy "Authenticated Admin Delete"
  on storage.objects for delete
  using ( bucket_id = 'restaurants' and auth.role() = 'authenticated' );
