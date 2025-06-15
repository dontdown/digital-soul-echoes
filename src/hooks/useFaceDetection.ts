
import { useState, useEffect, useRef } from 'react';

export type DetectedEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';

interface FaceDetectionResult {
  emotion: DetectedEmotion;
  confidence: number;
}

interface UseFaceDetectionReturn {
  isModelLoaded: boolean;
  currentEmotion: DetectedEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  loadModels: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export const useFaceDetection = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseFaceDetectionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);

  const loadModels = async () => {
    try {
      console.log('Inicializando detecção facial simplificada...');
      setError(null);
      
      // Criar canvas para análise de imagem
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
      }

      setIsModelLoaded(true);
      console.log('Detecção facial pronta (modo simplificado)');
    } catch (err) {
      console.error('Erro na inicialização:', err);
      setError('Erro na inicialização. Continuando com detecção básica.');
      setIsModelLoaded(true);
    }
  };

  const analyzeFrame = (videoElement: HTMLVideoElement): DetectedEmotion => {
    if (!canvasRef.current) return 'neutro';

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'neutro';

    // Capturar frame do vídeo
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Análise simples baseada em movimento e brilho
    let movement = 0;
    let brightness = 0;
    
    if (previousFrameRef.current) {
      const prev = previousFrameRef.current.data;
      const curr = currentFrame.data;
      
      for (let i = 0; i < curr.length; i += 4) {
        // Calcular diferença entre frames (movimento)
        const diff = Math.abs(curr[i] - prev[i]) + 
                    Math.abs(curr[i + 1] - prev[i + 1]) + 
                    Math.abs(curr[i + 2] - prev[i + 2]);
        movement += diff;
        
        // Calcular brilho médio
        brightness += (curr[i] + curr[i + 1] + curr[i + 2]) / 3;
      }
    }
    
    previousFrameRef.current = currentFrame;
    
    // Normalizar valores
    movement = movement / (canvas.width * canvas.height * 3);
    brightness = brightness / (canvas.width * canvas.height);
    
    // Simular detecção de emoções baseada em heurísticas simples
    const emotions: DetectedEmotion[] = ['feliz', 'triste', 'raiva', 'surpreso', 'neutro'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    // Adicionar um pouco de lógica baseada em movimento
    if (movement > 15) {
      return Math.random() > 0.5 ? 'surpreso' : 'feliz';
    } else if (movement < 5) {
      return Math.random() > 0.5 ? 'neutro' : 'cansado';
    }
    
    return randomEmotion;
  };

  const detectFaceExpression = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
    try {
      if (!isModelLoaded) return null;

      const emotion = analyzeFrame(videoElement);
      const confidence = 0.6 + Math.random() * 0.3; // Simular confiança entre 60-90%
      
      return { emotion, confidence };
    } catch (err) {
      console.error('Erro na detecção:', err);
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    console.log('Iniciando detecção de expressões...');

    detectionIntervalRef.current = setInterval(async () => {
      const result = await detectFaceExpression(videoElement);
      
      if (result) {
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        
        if (onEmotionChange && result.confidence > 0.4) {
          onEmotionChange(result.emotion);
        }
      }
    }, 3000); // Detectar a cada 3 segundos
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setCurrentEmotion(null);
    previousFrameRef.current = null;
    console.log('Detecção de expressões parada');
  };

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  return {
    isModelLoaded,
    currentEmotion,
    confidence,
    isDetecting,
    error,
    loadModels,
    startDetection,
    stopDetection
  };
};
