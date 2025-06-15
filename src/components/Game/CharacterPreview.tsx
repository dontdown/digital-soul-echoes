
import { useEffect, useRef } from 'react';
import { CharacterSprites } from './CharacterSprites';

interface CharacterPreviewProps {
  modelId: string;
  className?: string;
}

const CharacterPreview = ({ modelId, className }: CharacterPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasId = `preview-${modelId}-${Math.random()}`;
      canvasRef.current.id = canvasId;
      
      // Aguardar um tick para garantir que o canvas esteja no DOM
      setTimeout(() => {
        CharacterSprites.createPreviewSprite(canvasId, modelId);
      }, 10);
    }
  }, [modelId]);

  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={90}
      className={`border border-slate-600 rounded bg-slate-800 ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default CharacterPreview;
