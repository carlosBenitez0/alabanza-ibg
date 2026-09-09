-- ============================================================
-- ALABANZA IBG: ESQUEMA DE PRIVILEGIOS Y ALABANZAS
-- ============================================================

-- 1. Tabla de Catálogo de Alabanzas (songs)
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  default_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de alabanzas" ON public.songs
  FOR SELECT USING (true);

CREATE POLICY "Creación de alabanzas para usuarios autenticados" ON public.songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Tabla de Privilegios Semanales (weekly_privileges)
CREATE TABLE IF NOT EXISTS public.weekly_privileges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  privilege_key TEXT NOT NULL CHECK (privilege_key IN ('saturday_musician', 'sunday_lead_vocal', 'sunday_choir', 'sunday_rehearsal')),
  assigned_date DATE NOT NULL,
  songs JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id, privilege_key, assigned_date)
);

-- Habilitar RLS en weekly_privileges
ALTER TABLE public.weekly_privileges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de tabla semanal" ON public.weekly_privileges
  FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden insertar sus propios privilegios" ON public.weekly_privileges
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios privilegios" ON public.weekly_privileges
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios privilegios" ON public.weekly_privileges
  FOR DELETE USING (auth.uid() = profile_id);

-- Datos iniciales de ejemplo para el catálogo de alabanzas (Opcional)
INSERT INTO public.songs (title, default_key) VALUES
  ('Cuan Grande es Él', 'G'),
  ('La Bondad de Dios', 'C'),
  ('En la Tierra como en el Cielos', 'D'),
  ('Glorioso Día', 'D'),
  ('Tu Fidelidad es Grande', 'F'),
  ('Digno de Alabar', 'A')
ON CONFLICT (title) DO NOTHING;
