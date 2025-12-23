-- Create production_fields table (idempotent)
CREATE TABLE IF NOT EXISTS public.production_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wells table (idempotent)
CREATE TABLE IF NOT EXISTS public.wells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    production_field_id UUID NOT NULL REFERENCES public.production_fields(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(name, production_field_id)
);

-- Enable Row Level Security (safe)
ALTER TABLE public.production_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wells ENABLE ROW LEVEL SECURITY;

-- Create Policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'production_fields'
      AND policyname = 'Authenticated users can view production_fields'
  ) THEN
    CREATE POLICY "Authenticated users can view production_fields" ON public.production_fields
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'production_fields'
      AND policyname = 'Authenticated users can insert production_fields'
  ) THEN
    CREATE POLICY "Authenticated users can insert production_fields" ON public.production_fields
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'production_fields'
      AND policyname = 'Authenticated users can delete production_fields'
  ) THEN
    CREATE POLICY "Authenticated users can delete production_fields" ON public.production_fields
      FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wells'
      AND policyname = 'Authenticated users can view wells'
  ) THEN
    CREATE POLICY "Authenticated users can view wells" ON public.wells
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wells'
      AND policyname = 'Authenticated users can insert wells'
  ) THEN
    CREATE POLICY "Authenticated users can insert wells" ON public.wells
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wells'
      AND policyname = 'Authenticated users can delete wells'
  ) THEN
    CREATE POLICY "Authenticated users can delete wells" ON public.wells
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Seed Initial Data (idempotent)
INSERT INTO public.production_fields (name)
VALUES ('Mosquito'), ('Saíra')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    mosquito_id UUID;
    saira_id UUID;
BEGIN
    SELECT id INTO mosquito_id FROM public.production_fields WHERE name = 'Mosquito';
    SELECT id INTO saira_id FROM public.production_fields WHERE name = 'Saíra';

    INSERT INTO public.wells (name, production_field_id) VALUES
      ('1-MOS-01-ES', mosquito_id),
      ('4-MOS-02-ES', mosquito_id),
      ('1-ABC-01-ES', mosquito_id),
      ('3-NFA-11-D-ES', saira_id),
      ('3-NFA-07-HPA-ES', saira_id),
      ('4-NFA-12-ES', saira_id),
      ('4-NFA-05-ES', saira_id),
      ('7-SAI-01-ES', saira_id),
      ('7-SAI-02-ES', saira_id)
    ON CONFLICT (name, production_field_id) DO NOTHING;
END $$;

-- Update Tanks Table (safe / idempotent)
ALTER TABLE public.tanks
  ADD COLUMN IF NOT EXISTS production_field_id UUID
  REFERENCES public.production_fields(id)
  ON DELETE RESTRICT;

ALTER TABLE public.tanks
  ADD COLUMN IF NOT EXISTS well_id UUID
  REFERENCES public.wells(id)
  ON DELETE SET NULL;

-- Migrate existing data (map legacy text -> id), only if legacy column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tanks'
      AND column_name = 'production_field'
  ) THEN
    UPDATE public.tanks t
    SET production_field_id = pf.id
    FROM public.production_fields pf
    WHERE t.production_field = pf.name;

    -- Drop old column safely (only if exists)
    ALTER TABLE public.tanks DROP COLUMN IF EXISTS production_field;
  END IF;
END $$;

-- Default any remaining nulls to 'Mosquito' (fallback) - safe
UPDATE public.tanks
SET production_field_id = (SELECT id FROM public.production_fields WHERE name = 'Mosquito')
WHERE production_field_id IS NULL
  AND EXISTS (SELECT 1 FROM public.production_fields WHERE name = 'Mosquito');
