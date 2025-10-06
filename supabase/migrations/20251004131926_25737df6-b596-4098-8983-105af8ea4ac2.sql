-- Corrigir warnings de segurança: adicionar search_path às funções

-- Atualizar função handle_updated_at com search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Atualizar função increment_knowledge_usage com search_path
CREATE OR REPLACE FUNCTION public.increment_knowledge_usage(knowledge_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bot_knowledge
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = knowledge_id;
END;
$$;