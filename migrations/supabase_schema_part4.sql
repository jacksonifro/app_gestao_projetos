-- Execute este script no SQL Editor do Supabase para adicionar as colunas faltantes de Projetos

ALTER TABLE public.projetos 
ADD COLUMN IF NOT EXISTS indicadores_pdi TEXT,
ADD COLUMN IF NOT EXISTS objetivos_atendidos_pdi TEXT,
ADD COLUMN IF NOT EXISTS campus_telefone TEXT,
ADD COLUMN IF NOT EXISTS coord_exec_nome TEXT,
ADD COLUMN IF NOT EXISTS coord_exec_email TEXT,
ADD COLUMN IF NOT EXISTS coord_exec_telefone TEXT,
ADD COLUMN IF NOT EXISTS coord_exec_campus TEXT,

ADD COLUMN IF NOT EXISTS ods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ods_comentario TEXT,

ADD COLUMN IF NOT EXISTS publico_alvo TEXT,
ADD COLUMN IF NOT EXISTS escopo_projeto TEXT,
ADD COLUMN IF NOT EXISTS nao_escopo TEXT,
ADD COLUMN IF NOT EXISTS escopo_produto TEXT,

ADD COLUMN IF NOT EXISTS premissas JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS restricoes JSONB DEFAULT '{}'::jsonb,

ADD COLUMN IF NOT EXISTS justificativa TEXT,
ADD COLUMN IF NOT EXISTS tecnologias_sociais TEXT,
ADD COLUMN IF NOT EXISTS produtos_resultados JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metodologia TEXT,
ADD COLUMN IF NOT EXISTS plano_comunicacao TEXT,
ADD COLUMN IF NOT EXISTS cronograma_aba1 JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS referencias TEXT,
ADD COLUMN IF NOT EXISTS orcamento_resumo JSONB DEFAULT '[]'::jsonb,

-- Dados da Aba 2 (Plano de Trabalho)
ADD COLUMN IF NOT EXISTS plano_instituicao JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS plano_fundacao JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS plano_participante JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cronograma_desembolso JSONB DEFAULT '[]'::jsonb;
