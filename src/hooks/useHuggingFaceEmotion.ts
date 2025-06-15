
import { useState, useRef, useEffect } from 'react';
import { pipeline, env } from '@huggingface/transformers';
import { DetectedEmotion } from './useFaceDetection';

interface HuggingFaceEmotionResult {
  emotion: DetectedEmotion;
  confidence: number;
}

interface UseHuggingFaceEmotionReturn {
  isModelLoaded: boolean;
  currentEmotion: DetectedEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  loadModel: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

// Configurar para usar local (sem CDN)
env.allowRemoteModels = false;
env.allowLocalModels = true;

// Global state para evitar múltiplos carregamentos
let globalPipeline: any = null;
let isLoadingModel = false;

export const useHuggingFaceEmotion = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseHuggingFaceEmotionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mapHuggingFaceToEmotion = (label: string): DetectedEmotion => {
    const labelLower = label.toLowerCase();
    
    if (labelLower.includes('joy') || labelLower.includes('happy')) return 'feliz';
    if (labelLower.includes('sad') || labelLower.includes('sorrow')) return 'triste';
    if (labelLower.includes('anger') || labelLower.includes('angry')) return 'raiva';
    if (labelLower.includes('surprise') || labelLower.includes('surprised')) return 'surpreso';
    if (labelLower.includes('fear') || labelLower.includes('disgust')) return 'cansado';
    
    return 'neutro';
  };

  const loadModel = async () => {
    if (globalPipeline) {
      setIsModelLoaded(true);
      return;
    }

    if (isLoadingModel) return;

    isLoadingModel = true;
    
    try {
      console.log('🤗 Carregando modelo Hugging Face para emoções...');
      setError(null);
      
      // Usar um modelo mais leve para classificação de emoções
      globalPipeline = await pipeline(
        'image-classification',
        'onnx-community/emotion-ferplus-8',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );
      
      setIsModelLoaded(true);
      console.log('✅ Modelo Hugging Face carregado com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar modelo Hugging Face:', err);
      
      // Fallback para CPU se WebGPU falhar
      try {
        console.log('🔄 Tentando carregar em CPU...');
        globalPipeline = await pipeline(
          'image-classification',
          'onnx-community/emotion-ferplus-8'
        );
        
        setIsModelLoaded(true);
        console.log('✅ Modelo Hugging Face carregado em CPU!');
        
      } catch (cpuErr: any) {
        console.error('❌ Erro também em CPU:', cpuErr);
        setError(`Erro ao carregar modelo: ${cpuErr.message}`);
      }
    } finally {
      isLoadingModel = false;
    }
  };

  const captureFrame = (videoElement: HTMLVideoElement): HTMLCanvasElement => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas;
  };

  const detectEmotion = async (videoElement: HTMLVideoElement): Promise<HuggingFaceEmotionResult | null> => {
    try {
      if (!globalPipeline || !isModelLoaded) return null;
      
      // Capturar frame do vídeo
      const canvas = captureFrame(videoElement);
      
      // Converter para ImageData
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Classificar emoção
      const results = await globalPipeline(canvas);
      
      if (results && results.length > 0) {
        const topResult = results[0];
        const emotion = mapHuggingFaceToEmotion(topResult.label);
        
        console.log(`🤗 Emoção Hugging Face: ${emotion} (${Math.round(topResult.score * 100)}%)`);
        
        return {
          emotion,
          confidence: topResult.score
        };
      }
      
      return null;
      
    } catch (err) {
      console.error('❌ Erro na detecção Hugging Face:', err);
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    console.log('🔄 Iniciando detecção Hugging Face...');

    detectionIntervalRef.current = setInterval(async () => {
      const result = await detectEmotion(videoElement);
      
      if (result && result.confidence > 0.4) { // Threshold mais baixo
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        
        if (onEmotionChange) {
          onEmotionChange(result.emotion);
        }
      }
    }, 2000); // A cada 2 segundos
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setCurrentEmotion(null);
    console.log('⏹️ Detecção Hugging Face parada');
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
    loadModel,
    startDetection,
    stopDetection
  };
};
