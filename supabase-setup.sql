-- Tablas para teatro-encuestas
-- Ejecutar en Supabase > SQL Editor

create table enc_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  activo boolean default true,
  created_at timestamp with time zone default now()
);

create table enc_opciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references enc_eventos(id) on delete cascade,
  texto text not null,
  orden int not null default 0
);

create table enc_codigos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references enc_eventos(id) on delete cascade,
  codigo text not null,
  usado boolean default false,
  usado_at timestamp with time zone,
  unique(evento_id, codigo)
);

create table enc_votos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references enc_eventos(id) on delete cascade,
  opcion_id uuid references enc_opciones(id) on delete cascade,
  codigo_id uuid references enc_codigos(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(codigo_id)
);

-- Permitir acceso desde la app (usamos service role para el admin, anon para votantes)
alter table enc_eventos enable row level security;
alter table enc_opciones enable row level security;
alter table enc_codigos enable row level security;
alter table enc_votos enable row level security;

-- Políticas: lectura pública para eventos y opciones activos
create policy "eventos publicos" on enc_eventos for select using (activo = true);
create policy "opciones publicas" on enc_opciones for select using (true);

-- Política: votantes pueden verificar su código
create policy "verificar codigo" on enc_codigos for select using (true);
create policy "marcar usado" on enc_codigos for update using (true);

-- Política: votantes pueden insertar su voto
create policy "insertar voto" on enc_votos for insert with check (true);
