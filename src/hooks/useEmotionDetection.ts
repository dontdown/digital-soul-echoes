
import { useState, useCallback, useEffect } from 'react';
import { useMediaPipeEmotion } from './useMediaPipeEmotion';
import { useTensorFlowEmotion } from './useTensorFlowEmotion';

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
  const [currentModel, setCurrentModel] = useState<EmotionModel>('mediapipe');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks dos modelos
  const mediaPipe = useMediaPipeEmotion(onEmotionChange);
  const tensorFlow = useTensorFlowEmotion(onEmotionChange);
  
  const switchModel = useCallback((model: EmotionModel) => {
    // Parar detecção atual
    stopDetection();
    
    setCurrentModel(model);
    setIsModelLoaded(false);
    setError(null);
    console.log(`🔄 Alternando para modelo: ${model}`);
  }, []);
  
  const loadModels = useCallback(async () => {
    setError(null);
    setIsModelLoaded(false);
    
    try {
      if (currentModel === 'mediapipe') {
        console.log('📦 Carregando MediaPipe...');
        await mediaPipe.loadModel();
        setIsModelLoaded(mediaPipe.isModelLoaded);
        setError(mediaPipe.error);
      } else if (currentModel === 'tensorflow') {
        console.log('📦 Carregando TensorFlow.js...');
        await tensorFlow.loadModel();
        setIsModelLoaded(tensorFlow.isModelLoaded);
        setError(tensorFlow.error);
      } else if (currentModel === 'simulated') {
        console.log('📦 Carregando modo simulado...');
        setIsModelLoaded(true);
        setError('Modo simulado ativo');
      } else {
        console.log(`📦 Carregando modelo: ${currentModel}`);
        setIsModelLoaded(true);
        setError(`Modelo ${currentModel} ainda não implementado`);
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar modelo:', err);
      setError(`Erro ao carregar ${currentModel}: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, [currentModel, mediaPipe, tensorFlow]);
  
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!isModelLoaded) return;
    
    setIsDetecting(true);
    console.log(`🔄 Iniciando detecção com ${currentModel}...`);
    
    if (currentModel === 'mediapipe') {
      mediaPipe.startDetection(videoElement);
    } else if (currentModel === 'tensorflow') {
      tensorFlow.startDetection(videoElement);
    } else if (currentModel === 'simulated') {
      // Simulação básica
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
      
      (window as any).emotionInterval = interval;
    }
  }, [isModelLoaded, currentModel, mediaPipe, tensorFlow, onEmotionChange]);
  
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    if (currentModel === 'mediapipe') {
      mediaPipe.stopDetection();
    } else if (currentModel === 'tensorflow') {
      tensorFlow.stopDetection();
    } else if ((window as any).emotionInterval) {
      clearInterval((window as any).emotionInterval);
      delete (window as any).emotionInterval;
    }
    
    console.log('⏹️ Detecção parada');
  }, [currentModel, mediaPipe, tensorFlow]);
  
  // Sincronizar estados dos modelos
  useEffect(() => {
    if (currentModel === 'mediapipe') {
      setCurrentEmotion(mediaPipe.currentEmotion);
      setConfidence(mediaPipe.confidence);
      setIsDetecting(mediaPipe.isDetecting);
      if (mediaPipe.error) setError(mediaPipe.error);
    } else if (currentModel === 'tensorflow') {
      setCurrentEmotion(tensorFlow.currentEmotion);
      setConfidence(tensorFlow.confidence);
      setIsDetecting(tensorFlow.isDetecting);
      if (tensorFlow.error) setError(tensorFlow.error);
    }
  }, [currentModel, mediaPipe.currentEmotion, mediaPipe.confidence, mediaPipe.isDetecting, mediaPipe.error, tensorFlow.currentEmotion, tensorFlow.confidence, tensorFlow.isDetecting, tensorFlow.error]);
  
  return {
    currentModel,
    isModelLoaded,
    currentEmotion,
    confidence,
    isDetecting,
    error,
    isSimulated: currentModel === 'simulated',
    switchModel,
    loadModels,
    startDetection,
    stopDetection
  };
};
