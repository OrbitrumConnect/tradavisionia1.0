-- Adicionar usuário phpg69@gmail.com como admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'phpg69@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;