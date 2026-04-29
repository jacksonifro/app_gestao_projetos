-- Execute este script no SQL Editor do Supabase para adicionar níveis de acesso

-- 1. Adicionar coluna 'role' na tabela de perfis (Padrão: SERVIDOR)
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'SERVIDOR';

-- Nota: Os perfis disponíveis deverão ser: 'ADMIN', 'SERVIDOR', 'AVALIADOR', 'REITORIA'

-- 2. Atualizar o primeiro usuário criado para ser ADMIN (opcional, ajustará o primeiro usuário logado)
UPDATE public.perfis SET role = 'ADMIN' WHERE id = (SELECT id FROM public.perfis ORDER BY created_at ASC LIMIT 1);
