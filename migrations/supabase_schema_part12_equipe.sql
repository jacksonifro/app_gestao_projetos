-- ================================================================================
-- MIGRAÇÃO PARTE 12: Equipe do Projeto (Bolsistas)
-- ================================================================================

CREATE TABLE IF NOT EXISTS public.projeto_equipe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(projeto_id, servidor_id, funcao)
);

-- RLS
ALTER TABLE public.projeto_equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver a equipe" 
  ON public.projeto_equipe FOR SELECT USING (true);

CREATE POLICY "Apenas criador do projeto ou admin pode gerenciar equipe" 
  ON public.projeto_equipe FOR ALL USING (
    EXISTS (SELECT 1 FROM projetos WHERE id = projeto_id AND user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM perfis WHERE role IN ('ADMIN', 'REITORIA'))
  );

-- Trigger para inserir automaticamente o criador do projeto como Coordenador-Geral
CREATE OR REPLACE FUNCTION public.handle_projeto_criado()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.projeto_equipe (projeto_id, servidor_id, funcao)
  VALUES (NEW.id, NEW.user_id, 'Coordenador-Geral');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_projeto_created ON public.projetos;
CREATE TRIGGER on_projeto_created
  AFTER INSERT ON public.projetos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_projeto_criado();

-- Como já existem projetos, vamos inserir os coordenadores para os projetos existentes (se ainda não estiverem lá)
INSERT INTO public.projeto_equipe (projeto_id, servidor_id, funcao)
SELECT id, user_id, 'Coordenador-Geral'
FROM public.projetos p
WHERE NOT EXISTS (
  SELECT 1 FROM public.projeto_equipe eq WHERE eq.projeto_id = p.id AND eq.servidor_id = p.user_id AND eq.funcao = 'Coordenador-Geral'
);
