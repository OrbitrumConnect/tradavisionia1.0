-- Criar bucket de storage para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-docs', 'knowledge-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela para rastrear documentos processados
CREATE TABLE IF NOT EXISTS public.processed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  extracted_entries INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para processed_documents
CREATE POLICY "Admins can view all documents"
  ON public.processed_documents
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert documents"
  ON public.processed_documents
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
  ON public.processed_documents
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas de storage para knowledge-docs
CREATE POLICY "Admins can upload knowledge docs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-docs' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can view knowledge docs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'knowledge-docs' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete knowledge docs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'knowledge-docs' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );