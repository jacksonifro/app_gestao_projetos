-- Execute este script no SQL Editor do Supabase para criar as tabelas do projeto

-- 1. Tabela de Perfis de Usuário (Estendendo auth.users)
CREATE TABLE public.perfis (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  siape TEXT NOT NULL,
  campus TEXT NOT NULL,
  setor TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seus perfis" ON public.perfis FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente após cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, siape, campus, setor, telefone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nomeCompleto',
    NEW.raw_user_meta_data->>'siape',
    NEW.raw_user_meta_data->>'campus',
    NEW.raw_user_meta_data->>'setor',
    NEW.raw_user_meta_data->>'telefone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Tabela de Projetos (Propostas / Demandas)
CREATE TABLE public.projetos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  acao_estrategica TEXT,
  campus_key TEXT,
  status TEXT DEFAULT 'EM ANÁLISE',
  
  -- Coordenador
  coord_geral_nome TEXT,
  coord_geral_email TEXT,
  coord_geral_telefone TEXT,
  coord_geral_campus TEXT,
  
  -- Seções de Texto Longo
  introducao TEXT,
  objeto_projeto TEXT,
  objetivo_geral TEXT,
  
  -- Dados complexos podem ser armazenados como JSONB para simplificar no MVP
  objetivos_especificos JSONB DEFAULT '[]'::jsonb,
  alinhamento JSONB DEFAULT '[]'::jsonb,
  partes_interessadas JSONB DEFAULT '[]'::jsonb,
  mapa_risco JSONB DEFAULT '[]'::jsonb,
  equipe JSONB DEFAULT '[]'::jsonb,
  metas_plano_trabalho JSONB DEFAULT '[]'::jsonb,
  
  -- Datas
  vigencia_inicio DATE,
  vigencia_fim DATE,
  duracao_meses INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Projetos
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver os projetos" ON public.projetos FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem criar projetos" ON public.projetos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios projetos" ON public.projetos FOR UPDATE USING (auth.uid() = user_id);

-- 3. Tabela de Metas (Detalhes para ProjetosPage)
CREATE TABLE public.metas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  cronograma TEXT,
  custo_estimado DECIMAL(10, 2),
  custo_realizado DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'AGENDADO',
  alerta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver as metas" ON public.metas FOR SELECT USING (true);
CREATE POLICY "Apenas criadores do projeto podem editar metas" ON public.metas 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projetos WHERE id = metas.projeto_id AND user_id = auth.uid())
  );
