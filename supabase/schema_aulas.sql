-- Tabla de aulas/puertas para el AR indoor (escaneo de QR).
-- Ejecutar en el SQL Editor de Supabase.
-- Los mismos permisos que ya tiene "edificios" (RLS con acceso anónimo total,
-- porque el panel admin usa la clave anon + su propio login contra la tabla
-- "administradores", no Supabase Auth).

create table if not exists aulas (
  id uuid primary key default gen_random_uuid(),
  edificio_id uuid not null references edificios(id) on delete cascade,
  codigo text not null unique,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

alter table aulas enable row level security;

create policy "Lectura publica de aulas"
  on aulas for select
  using (true);

create policy "Escritura publica de aulas"
  on aulas for all
  using (true)
  with check (true);
