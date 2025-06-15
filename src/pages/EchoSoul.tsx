
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import PhaserGame from '@/components/Game/PhaserGame';
import GameChat from '@/components/Game/GameChat';
import { useEchoStore } from '@/store/echoStore';
import { supabase } from '@/integrations/supabase/client';
import { Eye, History, Menu } from 'lucide-react';
import { toast } from 'sonner';

const EchoSoul = () => {
  const navigate = useNavigate();
  const { playerData, echoPersonality, echoMood, updateEchoMood } = useEchoStore();
  const [showChat, setShowChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    if (!playerData) {
      navigate('/create-echo');
      return;
    }

    setGameState({
      playerName: playerData.name,
      playerMood: playerData.mood,
      playerPreference: playerData.preference,
      echoPersonality,
      echoMood,
      echoSprite: 'blue'
    });

    // Salvar estado do jogo no Supabase
    saveGameState();
  }, [playerData, echoPersonality, echoMood, navigate]);

  const saveGameState = async () => {
    if (!playerData) return;

    try {
      await supabase
        .from('game_state')
        .insert({
          player_name: playerData.name,
          player_mood: playerData.mood,
          player_preference: playerData.preference,
          echo_personality: echoPersonality,
          echo_mood: echoMood,
          echo_sprite: 'blue'
        });
    } catch (error) {
      console.error('Erro ao salvar estado do jogo:', error);
    }
  };

  const handleMemoryCreate = async (memory: string) => {
    try {
      await supabase
        .from('memories')
        .insert({
          player: playerData?.name || 'Unknown',
          memory,
          emotion: echoMood
        });
      
      console.log('Memória salva no Supabase');
    } catch (error) {
      console.error('Erro ao salvar memória:', error);
      toast.error('Erro ao salvar memória');
    }
  };

  const handleEchoMoodChange = useCallback((newMood: string) => {
    updateEchoMood(newMood);
    setGameState((prev: any) => ({ ...prev, echoMood: newMood }));
  }, [updateEchoMood]);

  const handleChatClose = useCallback(() => {
    console.log('Fechando chat do React');
    setShowChat(false);
  }, []);

  const handleChatToggle = useCallback((show: boolean) => {
    console.log('Toggle chat:', show);
    setShowChat(show);
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando EchoSoul...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">EchoSoul</h1>
            <div className="text-sm text-gray-400">
              Jogador: {gameState.playerName} | Echo: {echoPersonality}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="ghost"
              size="sm"
              className="text-white hover:text-cyan-400"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Menu dropdown */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 right-4 z-50 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-lg p-2 space-y-2"
        >
          <Button
            onClick={() => navigate('/mirror')}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-purple-400 hover:text-purple-300"
          >
            <Eye className="w-4 h-4 mr-2" />
            Espelho da Alma
          </Button>
          <Button
            onClick={() => navigate('/history')}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-pink-400 hover:text-pink-300"
          >
            <History className="w-4 h-4 mr-2" />
            Linha do Tempo
          </Button>
        </motion.div>
      )}

      {/* Game Container */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <PhaserGame
            gameState={gameState}
            onChatToggle={handleChatToggle}
            onMemoryTrigger={handleMemoryCreate}
            className="shadow-2xl"
          />
          
          {/* Instructions */}
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-lg p-3 inline-block">
              <p className="text-gray-300 text-sm">
                Use WASD ou setas para mover. Pressione E próximo ao Echo para conversar.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Chat */}
      <GameChat
        isVisible={showChat}
        onClose={handleChatClose}
        gameState={gameState}
        onMemoryCreate={handleMemoryCreate}
        onEchoMoodChange={handleEchoMoodChange}
      />

      {/* Chat status indicator */}
      {showChat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-cyan-500/20 border border-cyan-400 rounded-full px-4 py-2 text-cyan-400 text-sm"
        >
          Conversando com Echo - Histórico salvo automaticamente
        </motion.div>
      )}
    </div>
  );
};

export default EchoSoul;
