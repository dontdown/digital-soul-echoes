
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { GameScene, GameState } from './GameScene';

interface PhaserGameProps {
  gameState: GameState;
  onChatToggle: (show: boolean) => void;
  onMemoryTrigger: (memory: string) => void;
  className?: string;
}

const PhaserGame = forwardRef<any, PhaserGameProps>(({ gameState, onChatToggle, onMemoryTrigger, className }, ref) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expor a referência da cena para o componente pai
  useImperativeHandle(ref, () => sceneRef.current);

  // Wrapper mais simples para onChatToggle
  const wrappedChatToggle = (show: boolean) => {
    console.log('=== WRAPPER CHAT TOGGLE ===');
    console.log('Chat toggle recebido:', show);
    
    // Primeiro chamar o callback do pai
    onChatToggle(show);
    
    // Se está fechando o chat, garantir que a cena pare
    if (!show && sceneRef.current) {
      console.log('Chat fechando - garantindo parada na cena');
      // Pequeno delay para garantir que o React processou a mudança
      setTimeout(() => {
        if (sceneRef.current) {
          sceneRef.current.forceStopChat();
        }
      }, 10);
    }
  };

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: []
    };

    gameRef.current = new Phaser.Game(config);
    
    const scene = new GameScene(gameState, wrappedChatToggle, onMemoryTrigger);
    sceneRef.current = scene;
    gameRef.current.scene.add('GameScene', scene, true);

    return () => {
      if (gameRef.current) {
        console.log('Destruindo jogo Phaser');
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Só atualizar o mood se a cena e o Echo existirem
    if (sceneRef.current) {
      // Usar um pequeno delay para garantir que a cena esteja completamente carregada
      const timer = setTimeout(() => {
        sceneRef.current?.updateEchoMood(gameState.echoMood);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameState.echoMood]);

  // Atualizar emoção detectada na cena do jogo
  useEffect(() => {
    if (sceneRef.current && gameState.detectedEmotion) {
      console.log('🎭 Atualizando emoção detectada no Phaser:', gameState.detectedEmotion);
      sceneRef.current.updateDetectedEmotion(gameState.detectedEmotion);
    }
  }, [gameState.detectedEmotion]);

  // Cleanup quando o componente for desmontado (navegação)
  useEffect(() => {
    return () => {
      if (gameRef.current) {
        console.log('Componente desmontado - limpando Phaser');
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`border-2 border-slate-600 rounded-lg overflow-hidden ${className}`}
      style={{ width: '800px', height: '600px' }}
    />
  );
});

PhaserGame.displayName = 'PhaserGame';

export default PhaserGame;
