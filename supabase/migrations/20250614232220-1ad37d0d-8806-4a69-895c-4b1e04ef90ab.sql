
-- Criar tabela para armazenar histórico de conversas
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player TEXT NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('player', 'echo')),
  message_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para a tabela
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total à tabela (já que é um jogo single-player)
CREATE POLICY "Permitir todas as operações em chat_history" 
  ON public.chat_history 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Criar índice para melhorar performance das consultas
CREATE INDEX idx_chat_history_player_created ON public.chat_history(player, created_at);
