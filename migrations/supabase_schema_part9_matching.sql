-- Execute este script no SQL Editor do Supabase para adicionar colunas de Matching nos Projetos

ALTER TABLE public.projetos
ADD COLUMN IF NOT EXISTS comissao_id UUID REFERENCES public.comissoes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS financiamento_id UUID REFERENCES public.financiamentos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campus_executor_id UUID REFERENCES public.campus(id) ON DELETE SET NULL;
