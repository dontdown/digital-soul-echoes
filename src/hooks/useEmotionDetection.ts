
import { useState, useCallback } from 'react';

export type DetectedEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';
export type EmotionModel = 'mediapipe' | 'opencv' | 'tensorflow' | 'simulated';

interface UseEmotionDetectionReturn {
  currentModel: EmotionModel;
  isModelLoaded: boolean;
  currentEmotion: DetectedEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  isSimulated: boolean;
  switchModel: (model: EmotionModel) => void;
  loadModels: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export const useEmotionDetection = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseEmotionDetectionReturn => {
  const [currentModel, setCurrentModel] = useState<EmotionModel>('simulated');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const switchModel = useCallback((model: EmotionModel) => {
    setCurrentModel(model);
    setIsModelLoaded(false);
    setError(null);
    console.log(`🔄 Alternando para modelo: ${model}`);
  }, []);
  
  const loadModels = useCallback(async () => {
    setError(null);
    setIsModelLoaded(false);
    
    // Por enquanto, apenas modo simulado até implementarmos um modelo
    console.log(`📦 Carregando modelo: ${currentModel}`);
    setIsModelLoaded(true);
    setError('Modo simulado ativo - escolha um modelo para implementar');
  }, [currentModel]);
  
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!isModelLoaded) return;
    
    setIsDetecting(true);
    console.log('🔄 Iniciando detecção simulada...');
    
    // Simulação básica por enquanto
    const emotions: DetectedEmotion[] = ['feliz', 'neutro', 'surpreso'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      const emotion = emotions[currentIndex % emotions.length];
      setCurrentEmotion(emotion);
      setConfidence(0.8);
      
      if (onEmotionChange) {
        onEmotionChange(emotion);
      }
      
      currentIndex++;
    }, 3000);
    
    // Store interval for cleanup
    (window as any).emotionInterval = interval;
  }, [isModelLoaded, onEmotionChange]);
  
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    if ((window as any).emotionInterval) {
      clearInterval((window as any).emotionInterval);
      delete (window as any).emotionInterval;
    }
    
    console.log('⏹️ Detecção parada');
  }, []);
  
  return {
    currentModel,
    isModelLoaded,
    currentEmotion,
    confidence,
    isDetecting,
    error,
    isSimulated: true, // Por enquanto sempre simulado
    switchModel,
    loadModels,
    startDetection,
    stopDetection
  };
};
