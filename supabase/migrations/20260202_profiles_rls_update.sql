-- Allow Super Admins to update any profile
create policy "Super Admin Update All Profiles"
  on public.profiles for update
  using ( is_super_admin() );
