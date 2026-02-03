-- Add email column to profiles
alter table public.profiles 
add column if not exists email text;

-- Update the handle_new_user function to copy email
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, role, restaurant_id)
  values (new.id, new.email, 'restaurant_admin', null);
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing profiles with email from auth.users
-- We need a temporary function to do this securely
do $$
declare
  user_record record;
begin
  for user_record in select id, email from auth.users loop
    update public.profiles
    set email = user_record.email
    where id = user_record.id and email is null;
  end loop;
end;
$$;
