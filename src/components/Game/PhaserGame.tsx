
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene, GameState } from './GameScene';

interface PhaserGameProps {
  gameState: GameState;
  onChatToggle: (show: boolean) => void;
  onMemoryTrigger: (memory: string) => void;
  className?: string;
}

const PhaserGame = ({ gameState, onChatToggle, onMemoryTrigger, className }: PhaserGameProps) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Wrapper para onChatToggle que também gerencia o estado do Echo
  const wrappedChatToggle = (show: boolean) => {
    console.log('=== WRAPPER CHAT TOGGLE ===');
    console.log('Chat toggle recebido:', show);
    console.log('Scene ref existe:', !!sceneRef.current);
    
    onChatToggle(show);
    
    if (!show && sceneRef.current) {
      console.log('Chat fechando - chamando stopChat na cena');
      // Chamar stopChat imediatamente, sem delay
      sceneRef.current.stopChat();
      
      // Garantir que o forceStopChat seja chamado também após um pequeno delay
      setTimeout(() => {
        if (sceneRef.current) {
          console.log('Executando forceStopChat como backup');
          sceneRef.current.forceStopChat();
        }
      }, 50);
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
};

export default PhaserGame;
