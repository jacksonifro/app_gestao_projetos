-- ================================================================================
-- MIGRAÇÃO PARTE 11: Unificação Especialistas → Servidores + Acompanhamento
-- Data: 2026-05-04
-- Descrição: 
--   1. Adiciona campos de especialista na tabela perfis (unificação)
--   2. Migra dados de especialistas para perfis
--   3. Redireciona FK de comissao_especialistas para perfis
--   4. Atualiza trigger de signup com novos campos
--   5. Adiciona campos de acompanhamento na tabela metas
--   6. Cria tabela historico_projeto
-- ================================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEÇÃO 1: Unificação do cadastro de Servidores (Especialistas → Perfis)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1.1 Adicionar novos campos na tabela perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS titulacao TEXT DEFAULT 'Graduado';
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS especialidades TEXT DEFAULT '';
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS lattes TEXT;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS projetos_ativos INTEGER DEFAULT 0;

-- 1.2 Migrar dados dos especialistas existentes para perfis (se houver vínculo)
UPDATE perfis p
SET 
  titulacao = e.titulacao,
  especialidades = e.especialidades,
  lattes = e.lattes,
  projetos_ativos = COALESCE(e.projetos_ativos, 0)
FROM especialistas e
WHERE p.especialista_id = e.id;

-- 1.3 Dropar a FK antiga que aponta para 'especialistas'
ALTER TABLE comissao_especialistas 
  DROP CONSTRAINT IF EXISTS comissao_especialistas_especialista_id_fkey;

-- 1.4 Remover registros órfãos de comissao_especialistas que não existem em perfis
DELETE FROM comissao_especialistas 
WHERE especialista_id NOT IN (SELECT id FROM perfis);

-- 1.5 Criar nova FK apontando para 'perfis'
ALTER TABLE comissao_especialistas
  ADD CONSTRAINT comissao_especialistas_especialista_id_fkey
  FOREIGN KEY (especialista_id) REFERENCES perfis(id) ON DELETE CASCADE;

-- 1.6 Remover a coluna especialista_id da tabela perfis (não mais necessária)
ALTER TABLE perfis DROP COLUMN IF EXISTS especialista_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEÇÃO 2: Atualização do trigger de criação de perfil (signup)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, email, siape, campus, setor, telefone, role, titulacao, especialidades, lattes)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nomeCompleto', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'siape', ''),
    COALESCE(new.raw_user_meta_data->>'campus', ''),
    COALESCE(new.raw_user_meta_data->>'setor', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', ''),
    'SERVIDOR',
    COALESCE(new.raw_user_meta_data->>'titulacao', 'Graduado'),
    COALESCE(new.raw_user_meta_data->>'especialidades', ''),
    NULLIF(new.raw_user_meta_data->>'lattes', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEÇÃO 3: Acompanhamento de Execução de Projetos
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3.1 Adicionar campos na tabela metas para acompanhamento detalhado
ALTER TABLE metas ADD COLUMN IF NOT EXISTS percentual INTEGER DEFAULT 0;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS previsao_conclusao DATE;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_conclusao DATE;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS link_comprovacao TEXT;

-- 3.2 Tabela de histórico de atualizações do projeto
CREATE TABLE IF NOT EXISTS historico_projeto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  usuario_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 RLS para histórico
ALTER TABLE historico_projeto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver historico" ON historico_projeto FOR SELECT USING (true);
CREATE POLICY "Autenticados podem inserir historico" ON historico_projeto FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3.4 Atualizar RLS de metas para permitir edição por qualquer autenticado
DROP POLICY IF EXISTS "Apenas criadores do projeto podem editar metas" ON metas;
CREATE POLICY "Autenticados podem editar metas" ON metas FOR ALL USING (auth.uid() IS NOT NULL);
