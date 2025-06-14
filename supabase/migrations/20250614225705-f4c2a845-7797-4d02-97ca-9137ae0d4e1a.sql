
-- Criar tabela para armazenar memórias do jogo
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player TEXT NOT NULL,
  memory TEXT NOT NULL,
  emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar estado do jogador e Echo
CREATE TABLE public.game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  player_mood TEXT NOT NULL,
  player_preference TEXT NOT NULL,
  echo_personality TEXT NOT NULL,
  echo_mood TEXT NOT NULL DEFAULT 'neutro',
  echo_sprite TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para as tabelas
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso total às tabelas (já que é um jogo single-player)
CREATE POLICY "Permitir todas as operações em memories" 
  ON public.memories 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir todas as operações em game_state" 
  ON public.game_state 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
