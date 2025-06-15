
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import PhaserGame from '@/components/Game/PhaserGame';
import GameChat from '@/components/Game/GameChat';
import FaceDetection from '@/components/Game/FaceDetection';
import { useEchoStore } from '@/store/echoStore';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { Eye, History, Menu, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { DetectedEmotion } from '@/hooks/useEmotionDetection';

const EchoSoul = () => {
  const navigate = useNavigate();
  const { playerData, echoPersonality, echoMood, updateEchoMood } = useEchoStore();
  const { t } = useLanguage();
  const [showChat, setShowChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFaceDetection, setShowFaceDetection] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [lastDetectedEmotion, setLastDetectedEmotion] = useState<DetectedEmotion | null>(null);
  const [emotionChangeCount, setEmotionChangeCount] = useState(0);
  const sceneRef = useRef<any>(null);

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
    }
  };

  const handleEchoMoodChange = useCallback((newMood: string) => {
    updateEchoMood(newMood);
    setGameState((prev: any) => ({ ...prev, echoMood: newMood }));
  }, [updateEchoMood]);

  const handleChatClose = useCallback(() => {
    console.log('=== HANDLE CHAT CLOSE ===');
    console.log('Fechando chat do React');
    setShowChat(false);
    
    // Garantir que o Phaser seja notificado para reabilitar controles
    if (sceneRef.current) {
      console.log('Notificando Phaser para reabilitar controles');
      setTimeout(() => {
        if (sceneRef.current) {
          sceneRef.current.forceStopChat();
        }
      }, 50);
    }
  }, []);

  const handleChatToggle = useCallback((show: boolean) => {
    console.log('=== HANDLE CHAT TOGGLE ===');
    console.log('Toggle chat recebido:', show);
    console.log('Estado atual do showChat antes da mudança:', showChat);
    
    // Só atualizar se realmente houver mudança
    setShowChat(prevState => {
      if (prevState !== show) {
        console.log('Mudando showChat de', prevState, 'para', show);
        return show;
      }
      console.log('Estado já é', show, '- não alterando');
      return prevState;
    });
  }, []); // Remover dependência showChat

  const handleFaceEmotionDetected = useCallback((emotion: DetectedEmotion) => {
    console.log('🎭 Emoção detectada pela webcam:', emotion);
    
    // Mapear emoções detectadas para o sistema do Echo
    const emotionMap: Record<DetectedEmotion, string> = {
      'feliz': 'feliz',
      'triste': 'triste', 
      'raiva': 'raiva',
      'surpreso': 'feliz', // Surpresa pode ser positiva
      'neutro': 'calmo',
      'cansado': 'triste'
    };

    const newMood = emotionMap[emotion];
    
    // Só reagir se a emoção mudou significativamente
    if (emotion !== lastDetectedEmotion) {
      setLastDetectedEmotion(emotion);
      setEmotionChangeCount(prev => prev + 1);
      
      if (newMood !== echoMood) {
        updateEchoMood(newMood);
        console.log(`✨ Echo detectou: ${emotion} → mood atualizado para: ${newMood}`);
      }
    }
  }, [echoMood, updateEchoMood, lastDetectedEmotion]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('common.loading')}</div>
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
              {t('common.name')}: {gameState.playerName} | Echo: {echoPersonality}
            </div>
            {/* Indicador de emoção detectada */}
            {lastDetectedEmotion && showFaceDetection && (
              <div className="flex items-center space-x-2 bg-cyan-900/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-400 text-xs">
                  {t('game.echoSees')} {lastDetectedEmotion}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            <Button
              onClick={() => setShowFaceDetection(!showFaceDetection)}
              variant="ghost"
              size="sm"
              className={`${showFaceDetection ? 'text-cyan-400' : 'text-white'} hover:text-cyan-400`}
              title="Detecção Facial"
            >
              <Camera className="w-4 h-4" />
              {emotionChangeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {emotionChangeCount}
                </span>
              )}
            </Button>
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
            {t('home.mirror')}
          </Button>
          <Button
            onClick={() => navigate('/history')}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-pink-400 hover:text-pink-300"
          >
            <History className="w-4 h-4 mr-2" />
            {t('home.timeline')}
          </Button>
        </motion.div>
      )}

      {/* Face Detection Component */}
      <FaceDetection 
        isVisible={showFaceDetection}
        onEmotionDetected={handleFaceEmotionDetected}
      />

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
            ref={sceneRef}
          />
          
          {/* Instructions */}
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-lg p-3 inline-block">
              <p className="text-gray-300 text-sm">
                {t('game.instructions')}
                {showFaceDetection && (
                  <span className="block text-cyan-400 mt-1">
                    👁️ {t('game.faceDetection')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Chat */}
      <GameChat
        isVisible={showChat}
        onClose={handleChatClose}
        gameState={{
          ...gameState,
          detectedEmotion: lastDetectedEmotion,
          emotionHistory: emotionChangeCount
        }}
        onMemoryCreate={handleMemoryCreate}
        onEchoMoodChange={handleEchoMoodChange}
      />

      {/* Status silencioso no canto */}
      {showChat && lastDetectedEmotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 left-4 bg-slate-800/70 border border-cyan-400/30 rounded-lg px-3 py-2 text-cyan-400 text-xs"
        >
          🎭 {t('game.echoSees')} {lastDetectedEmotion}
        </motion.div>
      )}
    </div>
  );
};

export default EchoSoul;
