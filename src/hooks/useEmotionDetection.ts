
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const loadingRef = useRef(false);
  const simulationIntervalRef = useRef<number | null>(null);
  
  // Hooks dos modelos
  const mediaPipe = useMediaPipeEmotion(onEmotionChange);
  const tensorFlow = useTensorFlowEmotion(onEmotionChange);
  
  const switchModel = useCallback((model: EmotionModel) => {
    console.log(`🔄 Alternando para modelo ultra-otimizado: ${model}`);
    
    // Parar detecção atual
    stopDetection();
    
    setCurrentModel(model);
    setIsModelLoaded(false);
    setError(null);
    loadingRef.current = false;
  }, []);
  
  const loadModels = useCallback(async () => {
    // Prevenir carregamentos simultâneos
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setError(null);
    setIsModelLoaded(false);
    
    try {
      console.log(`📦 Carregando modelo ultra-otimizado: ${currentModel}`);
      
      if (currentModel === 'mediapipe') {
        if (!mediaPipe.isModelLoaded) {
          await mediaPipe.loadModel();
        }
        setIsModelLoaded(mediaPipe.isModelLoaded);
        setError(mediaPipe.error);
        
      } else if (currentModel === 'tensorflow') {
        if (!tensorFlow.isModelLoaded) {
          await tensorFlow.loadModel();
        }
        setIsModelLoaded(tensorFlow.isModelLoaded);
        setError(tensorFlow.error);
        
      } else if (currentModel === 'simulated') {
        console.log('📦 Modo simulado ultra-rápido ativo');
        setIsModelLoaded(true);
        setError(null);
        
      } else {
        setIsModelLoaded(false);
        setError(`Modelo ${currentModel} não implementado`);
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar modelo:', err);
      setError(`Erro ao carregar ${currentModel}: ${err.message}`);
      setIsModelLoaded(false);
    } finally {
      loadingRef.current = false;
    }
  }, [currentModel, mediaPipe, tensorFlow]);
  
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) {
      return;
    }
    
    setIsDetecting(true);
    console.log(`🎬 Iniciando detecção ultra-otimizada com ${currentModel}...`);
    
    if (currentModel === 'mediapipe') {
      mediaPipe.startDetection(videoElement);
      
    } else if (currentModel === 'tensorflow') {
      tensorFlow.startDetection(videoElement);
      
    } else if (currentModel === 'simulated') {
      // Simulação ultra-rápida
      const emotions: DetectedEmotion[] = ['feliz', 'neutro', 'surpreso', 'triste'];
      let currentIndex = 0;
      
      simulationIntervalRef.current = window.setInterval(() => {
        const emotion = emotions[currentIndex % emotions.length];
        setCurrentEmotion(emotion);
        setConfidence(0.8);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        currentIndex++;
      }, 5000); // 5 segundos para simulação
    }
  }, [isModelLoaded, isDetecting, currentModel, mediaPipe, tensorFlow, onEmotionChange]);
  
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    // Parar simulação
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    // Parar modelos reais
    if (currentModel === 'mediapipe') {
      mediaPipe.stopDetection();
    } else if (currentModel === 'tensorflow') {
      tensorFlow.stopDetection();
    }
    
    console.log('⏹️ Detecção ultra-otimizada parada');
  }, [currentModel, mediaPipe, tensorFlow]);
  
  // Sincronizar estados apenas quando necessário
  useEffect(() => {
    if (loadingRef.current) return;
    
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
  }, [
    currentModel, 
    mediaPipe.currentEmotion, 
    mediaPipe.confidence, 
    mediaPipe.isDetecting, 
    mediaPipe.error,
    tensorFlow.currentEmotion, 
    tensorFlow.confidence, 
    tensorFlow.isDetecting, 
    tensorFlow.error
  ]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);
  
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
