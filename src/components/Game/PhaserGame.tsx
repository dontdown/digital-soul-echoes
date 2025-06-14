
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

  // Função para fechar o chat
  const handleChatClose = () => {
    if (sceneRef.current) {
      sceneRef.current.stopChat();
    }
  };

  // Wrapper para onChatToggle que também gerencia o estado do Echo
  const wrappedChatToggle = (show: boolean) => {
    onChatToggle(show);
    if (!show && sceneRef.current) {
      // Quando o chat é fechado externamente, notificar a cena
      sceneRef.current.stopChat();
    }
  };

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'phaser-game',
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
        gameRef.current.destroy(true);
        gameRef.current = null;
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

  return (
    <div 
      id="phaser-game" 
      className={`border-2 border-slate-600 rounded-lg overflow-hidden ${className}`}
      style={{ width: '800px', height: '600px' }}
    />
  );
};

export default PhaserGame;
