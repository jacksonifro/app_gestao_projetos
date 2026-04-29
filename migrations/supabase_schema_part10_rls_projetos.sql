-- Execute este script no SQL Editor do Supabase para corrigir a permissão de UPDATE em Projetos

-- Remove a política antiga que restringia a atualização apenas ao criador do projeto
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios projetos" ON public.projetos;

-- Cria uma nova política permitindo que qualquer usuário autenticado (como Admin ou Reitoria no Matching) possa atualizar os projetos
CREATE POLICY "Todos autenticados podem atualizar projetos" ON public.projetos FOR UPDATE USING (auth.uid() IS NOT NULL);
