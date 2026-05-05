-- ================================================================================
-- MIGRAÇÃO PARTE 13: Novos campos para Campus (Corrigido)
-- ================================================================================

-- Adicionar apenas as colunas que ainda NÃO existem na tabela
ALTER TABLE public.campus
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS sigla TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Renomear coordenador para diretor_geral
-- Verificamos se a coluna existe antes de renomear para evitar erros em execuções repetidas
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'campus' 
            AND column_name = 'coordenador') THEN
            
      ALTER TABLE public.campus RENAME COLUMN coordenador TO diretor_geral;
  END IF;
END $$;
