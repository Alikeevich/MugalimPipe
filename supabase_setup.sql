-- =============================================================
--  MugalimPipe — настройка базы Supabase
--  Выполните этот скрипт целиком в Supabase → SQL Editor.
--  Идемпотентный: можно запускать повторно без ошибок.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Таблица reports — отчёты пользователей
--    Колонки в точности совпадают с тем, что пишет фронтенд
--    (src/App.tsx → insert) и читает Profile.tsx.
-- -------------------------------------------------------------
create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,

  title          text not null default 'Анализ урока',

  -- результаты
  total_score    integer default 0 check (total_score between 0 and 1000),
  percentage     numeric default 0 check (percentage between 0 and 100),
  grade          text default 'N/A',

  -- детальные данные
  metrics        jsonb  default '{}'::jsonb,
  ai_report      jsonb  default '{}'::jsonb,
  strengths      text[] default '{}',
  priority_areas text[] default '{}',
  transcription  text,
  video_duration numeric,

  -- PDF-файл в Storage
  file_name      text,
  file_url       text,
  storage_path   text,

  status         text default 'completed'
                   check (status in ('pending','processing','completed','failed')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_reports_user_created
  on public.reports (user_id, created_at desc);

-- -------------------------------------------------------------
-- 2. updated_at — автообновление
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 3. Row Level Security — каждый видит только свои отчёты
-- -------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "reports: owner full access" on public.reports;
create policy "reports: owner full access"
  on public.reports
  for all
  to authenticated
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 4. Storage — приватный бакет 'reports' для PDF
--    Путь к файлу: <user_id>/<дата>_<имя>.pdf  (см. App.tsx)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Политики Storage: пользователь работает только со своей папкой
-- (первый сегмент пути = его user_id).
drop policy if exists "reports storage: owner read"   on storage.objects;
drop policy if exists "reports storage: owner insert" on storage.objects;
drop policy if exists "reports storage: owner update" on storage.objects;
drop policy if exists "reports storage: owner delete" on storage.objects;

create policy "reports storage: owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "reports storage: owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "reports storage: owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "reports storage: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================
--  Готово. Проверка: select * from public.reports limit 1;
-- =============================================================
