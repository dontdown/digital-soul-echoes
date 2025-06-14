
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
    
    const scene = new GameScene(gameState, onChatToggle, onMemoryTrigger);
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
    if (sceneRef.current) {
      sceneRef.current.updateEchoMood(gameState.echoMood);
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
