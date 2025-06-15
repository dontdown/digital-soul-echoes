
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
  isDownloading: boolean;
  downloadProgress: number;
  needsDownload: boolean;
  switchModel: (model: EmotionModel) => void;
  loadModels: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
  downloadModels: () => Promise<void>;
}

export const useEmotionDetection = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseEmotionDetectionReturn => {
  const [currentModel, setCurrentModel] = useState<EmotionModel>('face-api');
  
  const faceApiHook = useFaceDetection(onEmotionChange);
  const huggingFaceHook = useHuggingFaceEmotion(onEmotionChange);
  
  const getCurrentHook = useCallback(() => {
    return currentModel === 'face-api' ? faceApiHook : huggingFaceHook;
  }, [currentModel, faceApiHook, huggingFaceHook]);
  
  const switchModel = useCallback((model: EmotionModel) => {
    getCurrentHook().stopDetection();
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
  
  const downloadModels = useCallback(async () => {
    if (currentModel === 'face-api') {
      await faceApiHook.downloadModels();
    }
  }, [currentModel, faceApiHook]);
  
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
    isDownloading: currentModel === 'face-api' ? faceApiHook.isDownloading : false,
    downloadProgress: currentModel === 'face-api' ? faceApiHook.downloadProgress : 0,
    needsDownload: currentModel === 'face-api' ? faceApiHook.needsDownload : false,
    switchModel,
    loadModels,
    startDetection,
    stopDetection,
    downloadModels
  };
};
