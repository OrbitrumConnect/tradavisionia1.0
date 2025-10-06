import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://krjpvdllsbxeuuncmitt.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!,
        },
      },
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      console.error('Missing required parameters:', { file: !!file, userId: !!userId });
      return new Response(
        JSON.stringify({ error: 'File and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing document: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Upload para storage (pular se der erro)
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    let uploadError = null;
    
    try {
      // Verificar se o bucket existe primeiro
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'knowledge-docs');
      
      if (bucketExists) {
        const { error } = await supabase.storage
          .from('knowledge-docs')
          .upload(filePath, file);
        uploadError = error;
      } else {
        console.warn('Bucket knowledge-docs does not exist, skipping storage upload');
      }
    } catch (err) {
      console.warn('Storage upload failed, continuing without storage:', err);
      uploadError = null; // Continuar sem storage
    }

    if (uploadError) {
      console.warn('Upload error (continuing without storage):', uploadError);
      // Não falhar por causa do storage, continuar processamento
    }

    // Registrar documento na tabela
    const { data: docRecord, error: insertError } = await supabase
      .from('processed_documents')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userId,
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      console.error('Table processed_documents may not exist or have wrong schema');
      return new Response(
        JSON.stringify({ 
          error: 'Failed to register document', 
          details: insertError.message,
          hint: 'Check if processed_documents table exists'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Document registered:', docRecord.id);

    // Processar conteúdo do arquivo
    let extractedText = '';
    try {
      const fileContent = await file.text();
      
      // Para PDFs e outros formatos binários, precisaríamos de uma biblioteca específica
      // Por enquanto, vamos processar apenas arquivos de texto
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = fileContent;
      } else {
        throw new Error('Unsupported file type. Please upload TXT or MD files for now.');
      }

      // Dividir o texto em chunks de conhecimento
      const chunks = extractTextChunks(extractedText, file.name);
      
      if (chunks.length === 0) {
        throw new Error('No content could be extracted from the file');
      }

      // Inserir cada chunk na base de conhecimento
      const knowledgeEntries = chunks.map(chunk => ({
        topic: chunk.topic,
        content: chunk.content,
        category: 'Documento',
        examples: [],
        metadata: {
          source: file.name,
          document_id: docRecord.id,
          extracted_at: new Date().toISOString()
        }
      }));

      const { error: knowledgeError } = await supabase
        .from('bot_knowledge')
        .insert(knowledgeEntries);

      if (knowledgeError) {
        console.error('Knowledge insert error:', knowledgeError);
        console.error('Table bot_knowledge may not exist or have wrong schema');
        throw new Error(`Failed to insert knowledge entries: ${knowledgeError.message}`);
      }

      // Atualizar status do documento
      await supabase
        .from('processed_documents')
        .update({
          status: 'completed',
          extracted_entries: chunks.length,
          processed_at: new Date().toISOString()
        })
        .eq('id', docRecord.id);

      console.log(`Successfully processed ${chunks.length} knowledge entries from ${file.name}`);

      return new Response(
        JSON.stringify({
          success: true,
          entries: chunks.length,
          documentId: docRecord.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Atualizar status com erro
      await supabase
        .from('processed_documents')
        .update({
          status: 'error',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
        .eq('id', docRecord.id);

      return new Response(
        JSON.stringify({
          error: processingError instanceof Error ? processingError.message : 'Processing failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('General error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para dividir texto em chunks de conhecimento
function extractTextChunks(text: string, fileName: string): Array<{ topic: string; content: string }> {
  const chunks: Array<{ topic: string; content: string }> = [];
  
  // Limpar e normalizar o texto
  const cleanText = text.trim().replace(/\r\n/g, '\n');
  
  // Tentar dividir por seções (procurar por títulos/headers)
  const lines = cleanText.split('\n');
  let currentSection = '';
  let currentTitle = '';
  let chunkIndex = 1;
  const maxChunkSize = 1000; // reduzido para chunks menores

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detectar possíveis títulos (linhas curtas, maiúsculas, ou com marcadores)
    const isPossibleTitle = 
      line.length < 80 && 
      (line.match(/^#+\s/) || // Markdown headers
       line.match(/^\d+\./) || // Numbered lists
       line.match(/^[A-Z][A-Z\s]+$/) || // ALL CAPS
       line.match(/^[-*]\s/) || // Bullet points
       line === line.toUpperCase() && line.split(' ').length <= 6);

    if (isPossibleTitle && currentSection.length > 200) {
      // Salvar seção anterior
      chunks.push({
        topic: currentTitle || `${fileName} - Parte ${chunkIndex}`,
        content: currentSection.trim()
      });
      currentSection = '';
      currentTitle = line.substring(0, 100); // Limitar tamanho do título
      chunkIndex++;
    } else if (currentSection.length + line.length > maxChunkSize) {
      // Se ultrapassar tamanho máximo, criar novo chunk
      chunks.push({
        topic: currentTitle || `${fileName} - Parte ${chunkIndex}`,
        content: currentSection.trim()
      });
      currentSection = line + '\n';
      currentTitle = '';
      chunkIndex++;
    } else {
      // Adicionar linha à seção atual
      if (!currentTitle && line.length < 100) {
        currentTitle = line;
      }
      currentSection += line + '\n';
    }
  }

  // Adicionar última seção
  if (currentSection.trim()) {
    chunks.push({
      topic: currentTitle || `${fileName} - Parte ${chunkIndex}`,
      content: currentSection.trim()
    });
  }

  console.log(`Extracted ${chunks.length} chunks from ${fileName}`);
  return chunks.filter(chunk => chunk.content.length > 50); // Remover chunks muito pequenos
}
