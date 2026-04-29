-- Execute este script no SQL Editor do Supabase para criar a vinculação entre contas e especialistas

ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS especialista_id UUID REFERENCES public.especialistas(id) ON DELETE SET NULL;
