
import { useState, useCallback } from 'react';
import { useFaceDetection, DetectedEmotion } from './useFaceDetection';
import { useHuggingFaceEmotion } from './useHuggingFaceEmotion';

export type EmotionModel = 'face-api' | 'huggingface';

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
  const [currentModel, setCurrentModel] = useState<EmotionModel>('face-api');
  
  const faceApiHook = useFaceDetection(onEmotionChange);
  const huggingFaceHook = useHuggingFaceEmotion(onEmotionChange);
  
  const getCurrentHook = useCallback(() => {
    return currentModel === 'face-api' ? faceApiHook : huggingFaceHook;
  }, [currentModel, faceApiHook, huggingFaceHook]);
  
  const switchModel = useCallback((model: EmotionModel) => {
    // Parar detecção atual
    getCurrentHook().stopDetection();
    
    // Mudar modelo
    setCurrentModel(model);
    
    console.log(`🔄 Alternando para modelo: ${model}`);
  }, [getCurrentHook]);
  
  const loadModels = useCallback(async () => {
    if (currentModel === 'face-api') {
      await faceApiHook.loadModels();
    } else {
      await huggingFaceHook.loadModel();
    }
  }, [currentModel, faceApiHook, huggingFaceHook]);
  
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    getCurrentHook().startDetection(videoElement);
  }, [getCurrentHook]);
  
  const stopDetection = useCallback(() => {
    getCurrentHook().stopDetection();
  }, [getCurrentHook]);
  
  const hook = getCurrentHook();
  
  return {
    currentModel,
    isModelLoaded: hook.isModelLoaded,
    currentEmotion: hook.currentEmotion,
    confidence: hook.confidence,
    isDetecting: hook.isDetecting,
    error: hook.error,
    isSimulated: currentModel === 'face-api' ? faceApiHook.isSimulated : false,
    switchModel,
    loadModels,
    startDetection,
    stopDetection
  };
};
