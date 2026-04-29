-- Execute este script no SQL Editor do Supabase para criar as tabelas de Comissões

-- 1. Tabela de Comissões
CREATE TABLE public.comissoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler comissoes" ON public.comissoes FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir comissoes" ON public.comissoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar comissoes" ON public.comissoes FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar comissoes" ON public.comissoes FOR DELETE USING (true);

-- 2. Tabela de Relacionamento (Comissões <-> Especialistas)
CREATE TABLE public.comissao_especialistas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comissao_id UUID REFERENCES public.comissoes(id) ON DELETE CASCADE NOT NULL,
  especialista_id UUID REFERENCES public.especialistas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(comissao_id, especialista_id)
);
ALTER TABLE public.comissao_especialistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler relacionamento" ON public.comissao_especialistas FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir relacionamento" ON public.comissao_especialistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem deletar relacionamento" ON public.comissao_especialistas FOR DELETE USING (true);
