-- Adicionar usuário ehohotcanal@gmail.com como admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'ehohotcanal@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
