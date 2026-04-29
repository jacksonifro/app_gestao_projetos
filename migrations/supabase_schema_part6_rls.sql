-- Execute este script no SQL Editor do Supabase para permitir a leitura de todos os perfis na tela de Usuários

-- 1. Remove a política antiga que restringia a visão
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.perfis;

-- 2. Cria a nova política permitindo a leitura geral (necessário para a tela de listar usuários)
CREATE POLICY "Todos podem ver todos os perfis" ON public.perfis FOR SELECT USING (true);

-- 3. Atualiza a política de vinculação para permitir que um admin atualize (para o MVP, todos autenticados)
DROP POLICY IF EXISTS "Usuários podem atualizar seus perfis" ON public.perfis;
CREATE POLICY "Usuários autenticados podem atualizar perfis" ON public.perfis FOR UPDATE USING (auth.uid() IS NOT NULL);
