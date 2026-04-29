-- 1. Adicionar a coluna email na tabela perfis
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Atualizar a Trigger para que novos cadastros gravem o email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome_completo, siape, campus, setor, telefone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nomeCompleto',
    NEW.raw_user_meta_data->>'siape',
    NEW.raw_user_meta_data->>'campus',
    NEW.raw_user_meta_data->>'setor',
    NEW.raw_user_meta_data->>'telefone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Preencher os e-mails dos usuários que já foram cadastrados antes (Sincronização)
UPDATE public.perfis p
SET email = a.email
FROM auth.users a
WHERE p.id = a.id
  AND p.email IS NULL;

-- 4. Definir manualmente o usuário jackson.henrique@ifro.edu.br como ADMIN
UPDATE public.perfis 
SET role = 'ADMIN' 
WHERE email = 'jackson.henrique@ifro.edu.br';
