-- ============================================================
-- Absensi Al Manna Bakery - Skema awal
-- Jalankan di Supabase SQL Editor (project kosong).
-- ============================================================

-- ---------- TABEL ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nama text not null,
  jabatan text not null default 'Staff',
  role text not null default 'karyawan' check (role in ('karyawan','admin')),
  jam_masuk_standar time not null default '08:00',
  jam_pulang_standar time not null default '17:00',
  tarif_lembur_per_jam int not null default 20000 check (tarif_lembur_per_jam >= 0),
  tarif_denda_per_jam int not null default 0 check (tarif_denda_per_jam >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  id int primary key check (id = 1),
  nama_lokasi text not null default 'Al Manna Bakery - Kantor Pusat',
  latitude double precision not null,
  longitude double precision not null,
  radius_meter int not null default 100 check (radius_meter > 0),
  tarif_default int not null default 20000 check (tarif_default >= 0),
  toleransi_telat_menit int not null default 15 check (toleransi_telat_menit >= 0),
  jam_masuk_default time not null default '08:00',
  jam_pulang_default time not null default '17:00',
  tolak_diluar_radius boolean not null default true
);

insert into public.settings
  (id, nama_lokasi, latitude, longitude, radius_meter, tarif_default, toleransi_telat_menit, jam_masuk_default, jam_pulang_default, tolak_diluar_radius)
values
  (1, 'Al Manna Bakery - Kantor Pusat', -4.030128, 122.473738, 100, 20000, 15, '08:00', '17:00', true)
on conflict (id) do nothing;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null,
  jam_masuk time,
  lat_masuk double precision,
  lng_masuk double precision,
  akurasi_masuk_meter int,
  status_radius_masuk text check (status_radius_masuk in ('Valid','DiLuarRadius')),
  jam_pulang time,
  lat_pulang double precision,
  lng_pulang double precision,
  akurasi_pulang_meter int,
  status_radius_pulang text check (status_radius_pulang in ('Valid','DiLuarRadius')),
  menit_terlambat int not null default 0,
  created_at timestamptz default now(),
  unique (profile_id, tanggal)
);

create table if not exists public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  total_jam numeric(5,2) not null,
  alasan text not null,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  approved_by uuid references public.profiles(id),
  tanggal_persetujuan date,
  catatan_admin text,
  nominal int not null default 0,
  created_at timestamptz default now(),
  check (jam_selesai > jam_mulai)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  jenis_aksi text not null,
  detail text,
  created_at timestamptz default now()
);

-- ---------- INDEX ----------
create index if not exists idx_attendance_profile_tanggal on public.attendance (profile_id, tanggal);
create index if not exists idx_overtime_profile_tanggal on public.overtime_requests (profile_id, tanggal);
create index if not exists idx_overtime_status on public.overtime_requests (status);

-- Catatan: agregasi rekap dilakukan di aplikasi (src/lib/supabase/queries.ts)
-- memakai Supabase client yang tunduk RLS, jadi tidak perlu VIEW di database.

-- ---------- HELPER anti-recursion ----------
-- Ditaruh di schema `private` (tidak terekspos lewat REST API) agar
-- linter 0029 tidak menandai dan tidak bisa dipanggil lewat /rest/v1/rpc.
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

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.overtime_requests enable row level security;
alter table public.settings enable row level security;
alter table public.activity_logs enable row level security;

-- profiles
drop policy if exists "profiles select sendiri atau admin" on public.profiles;
create policy "profiles select sendiri atau admin"
on public.profiles for select using (auth.uid() = id or private.is_admin());

drop policy if exists "profiles insert admin" on public.profiles;
create policy "profiles insert admin"
on public.profiles for insert with check (private.is_admin());

drop policy if exists "profiles update admin" on public.profiles;
create policy "profiles update admin"
on public.profiles for update using (private.is_admin()) with check (private.is_admin());

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin"
on public.profiles for delete using (private.is_admin());

-- attendance
drop policy if exists "attendance select" on public.attendance;
create policy "attendance select"
on public.attendance for select using (auth.uid() = profile_id or private.is_admin());

drop policy if exists "attendance insert sendiri" on public.attendance;
create policy "attendance insert sendiri"
on public.attendance for insert with check (auth.uid() = profile_id or private.is_admin());

drop policy if exists "attendance update sendiri" on public.attendance;
create policy "attendance update sendiri"
on public.attendance for update using (auth.uid() = profile_id or private.is_admin())
with check (auth.uid() = profile_id or private.is_admin());

-- overtime
drop policy if exists "overtime select" on public.overtime_requests;
create policy "overtime select"
on public.overtime_requests for select using (auth.uid() = profile_id or private.is_admin());

drop policy if exists "overtime insert sendiri" on public.overtime_requests;
create policy "overtime insert sendiri"
on public.overtime_requests for insert with check (auth.uid() = profile_id or private.is_admin());

drop policy if exists "overtime update" on public.overtime_requests;
create policy "overtime update"
on public.overtime_requests for update using (auth.uid() = profile_id or private.is_admin())
with check (auth.uid() = profile_id or private.is_admin());

drop policy if exists "overtime delete pending sendiri" on public.overtime_requests;
create policy "overtime delete pending sendiri"
on public.overtime_requests for delete using (
  (auth.uid() = profile_id and status = 'Pending') or private.is_admin()
);

-- settings
drop policy if exists "settings baca semua" on public.settings;
create policy "settings baca semua" on public.settings for select using (true);

drop policy if exists "settings tulis admin" on public.settings;
create policy "settings tulis admin"
on public.settings for all using (private.is_admin()) with check (private.is_admin());

-- activity_logs (baca admin; tulis via service_role/server)
drop policy if exists "activity_logs baca admin" on public.activity_logs;
create policy "activity_logs baca admin"
on public.activity_logs for select using (private.is_admin());
