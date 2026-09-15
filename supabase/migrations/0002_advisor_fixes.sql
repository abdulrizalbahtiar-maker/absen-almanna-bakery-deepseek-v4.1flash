-- ============================================================
-- Patch 0002: perbaikan temuan Supabase Advisor
-- Jalankan di SQL Editor SETELAH 0001_init.sql.
--
-- Jika pernah gagal di tengah (error 2BP01 "cannot drop function
-- is_admin() because other objects depend on it"), jalankan dulu:
--     drop function if exists public.is_admin() cascade;
-- lalu jalankan ulang file ini.
-- ============================================================

-- 1) Hapus VIEW (lint 0010 security_definer_view).
--    Agregasi rekap dilakukan di aplikasi (RLS-aware), bukan di DB.
drop view if exists public.rekap_keterlambatan_raw;
drop view if exists public.rekap_lembur_approved_raw;

-- 2) Pindahkan is_admin() ke schema `private` (lint 0029).
--    Schema `private` tidak terekspos lewat REST API.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- 3) Hapus semua policy LAMA lebih dulu.
--    WAJIB dilakukan sebelum drop function public.is_admin(),
--    karena policy lama masih bergantung pada fungsi tsb (error 2BP01).
drop policy if exists "profiles select sendiri atau admin" on public.profiles;
drop policy if exists "profiles insert admin" on public.profiles;
drop policy if exists "profiles update admin" on public.profiles;
drop policy if exists "profiles delete admin" on public.profiles;
drop policy if exists "attendance select" on public.attendance;
drop policy if exists "attendance insert sendiri" on public.attendance;
drop policy if exists "attendance update sendiri" on public.attendance;
drop policy if exists "overtime select" on public.overtime_requests;
drop policy if exists "overtime insert sendiri" on public.overtime_requests;
drop policy if exists "overtime update" on public.overtime_requests;
drop policy if exists "overtime delete pending sendiri" on public.overtime_requests;
drop policy if exists "settings baca semua" on public.settings;
drop policy if exists "settings tulis admin" on public.settings;
drop policy if exists "activity_logs baca admin" on public.activity_logs;

-- 4) Baru hapus fungsi lama di schema public (kini aman, tanpa dependensi).
drop function if exists public.is_admin();

-- 5) Buat ulang policy memakai private.is_admin().
create policy "profiles select sendiri atau admin"
on public.profiles for select using (auth.uid() = id or private.is_admin());

create policy "profiles insert admin"
on public.profiles for insert with check (private.is_admin());

create policy "profiles update admin"
on public.profiles for update using (private.is_admin()) with check (private.is_admin());

create policy "profiles delete admin"
on public.profiles for delete using (private.is_admin());

create policy "attendance select"
on public.attendance for select using (auth.uid() = profile_id or private.is_admin());

create policy "attendance insert sendiri"
on public.attendance for insert with check (auth.uid() = profile_id or private.is_admin());

create policy "attendance update sendiri"
on public.attendance for update using (auth.uid() = profile_id or private.is_admin())
with check (auth.uid() = profile_id or private.is_admin());

create policy "overtime select"
on public.overtime_requests for select using (auth.uid() = profile_id or private.is_admin());

create policy "overtime insert sendiri"
on public.overtime_requests for insert with check (auth.uid() = profile_id or private.is_admin());

create policy "overtime update"
on public.overtime_requests for update using (auth.uid() = profile_id or private.is_admin())
with check (auth.uid() = profile_id or private.is_admin());

create policy "overtime delete pending sendiri"
on public.overtime_requests for delete using (
  (auth.uid() = profile_id and status = 'Pending') or private.is_admin()
);

create policy "settings baca semua" on public.settings for select using (true);

create policy "settings tulis admin"
on public.settings for all using (private.is_admin()) with check (private.is_admin());

create policy "activity_logs baca admin"
on public.activity_logs for select using (private.is_admin());
