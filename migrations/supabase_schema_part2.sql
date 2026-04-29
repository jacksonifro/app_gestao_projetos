-- Execute este script no SQL Editor do Supabase para criar as novas tabelas

-- 1. Tabela de Campus
CREATE TABLE public.campus (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  endereco TEXT NOT NULL,
  areas_especializacao TEXT,
  coordenador TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.campus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler campus" ON public.campus FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir campus" ON public.campus FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar campus" ON public.campus FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar campus" ON public.campus FOR DELETE USING (true);


-- 2. Tabela de Financiamentos
CREATE TABLE public.financiamentos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor_disponivel TEXT,
  parlamentar TEXT,
  ano TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.financiamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler financiamentos" ON public.financiamentos FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir financiamentos" ON public.financiamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar financiamentos" ON public.financiamentos FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar financiamentos" ON public.financiamentos FOR DELETE USING (true);


-- 3. Tabela de Especialistas
CREATE TABLE public.especialistas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  titulacao TEXT NOT NULL,
  campus TEXT NOT NULL,
  especialidades TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  lattes TEXT,
  projetos_ativos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.especialistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler especialistas" ON public.especialistas FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir especialistas" ON public.especialistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar especialistas" ON public.especialistas FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar especialistas" ON public.especialistas FOR DELETE USING (true);


-- 4. Tabela de Avaliações
CREATE TABLE public.avaliacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE NOT NULL,
  avaliador_nome TEXT NOT NULL,
  nota DECIMAL(4, 2) NOT NULL,
  parecer TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler avaliacoes" ON public.avaliacoes FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem avaliar" ON public.avaliacoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Avaliador pode atualizar sua avaliacao" ON public.avaliacoes FOR UPDATE USING (auth.uid() IS NOT NULL);
