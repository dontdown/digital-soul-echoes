
import { useState, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type MediaPipeEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';

interface UseMediaPipeEmotionReturn {
  isModelLoaded: boolean;
  currentEmotion: MediaPipeEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  loadModel: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export const useMediaPipeEmotion = (onEmotionChange?: (emotion: MediaPipeEmotion) => void): UseMediaPipeEmotionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<MediaPipeEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const processingIntervalRef = useRef<number | null>(null);
  
  // Cache ultra-agressivo para máxima performance
  const lastEmotionRef = useRef<MediaPipeEmotion>('neutro');
  const emotionStabilityCountRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);
  const frameSkipCountRef = useRef<number>(0);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe otimizado...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      console.log('✅ MediaPipe ultra-otimizado carregado!');
      setIsModelLoaded(true);
      
    } catch (err: any) {
      console.error('❌ Erro MediaPipe:', err);
      setError(`Erro: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    if (!blendshapes || blendshapes.length === 0) {
      return { emotion: 'neutro', confidence: 0.1 };
    }

    const shapes = blendshapes[0].categories;
    
    // Análise SUPER simplificada - apenas 4 blendshapes essenciais
    let smileScore = 0;
    let frownScore = 0;

    // Loop mínimo - apenas os 10 primeiros shapes
    for (let i = 0; i < Math.min(shapes.length, 10); i++) {
      const shape = shapes[i];
      const name = shape.categoryName;
      const score = shape.score;
      
      if (name.includes('mouthSmile')) {
        smileScore = Math.max(smileScore, score);
      } else if (name.includes('mouthFrown')) {
        frownScore = Math.max(frownScore, score);
      }
    }

    // Lógica mínima
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.5;

    if (smileScore > 0.15) {
      emotion = 'feliz';
      confidence = Math.min(smileScore * 2, 1);
    } else if (frownScore > 0.12) {
      emotion = 'triste';
      confidence = Math.min(frownScore * 2.5, 1);
    }

    // Estabilização extrema - só mudar após 6 frames consistentes
    if (emotion === lastEmotionRef.current) {
      emotionStabilityCountRef.current++;
    } else {
      emotionStabilityCountRef.current = 0;
      lastEmotionRef.current = emotion;
    }

    if (emotionStabilityCountRef.current >= 6) {
      return { emotion, confidence };
    } else {
      return { emotion: currentEmotion || 'neutro', confidence };
    }
  }, [currentEmotion]);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoElementRef.current || !isProcessingRef.current) {
      return;
    }

    const now = performance.now();
    
    // Throttling ultra-agressivo: mínimo 1 segundo entre processamentos
    if (now - lastProcessTimeRef.current < 1000) {
      return;
    }

    // Skip 80% dos frames (processa apenas 1 a cada 5)
    frameSkipCountRef.current++;
    if (frameSkipCountRef.current % 5 !== 0) {
      return;
    }

    const video = videoElementRef.current;

    try {
      lastProcessTimeRef.current = now;
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        // Só atualizar se realmente mudou E tem confiança mínima
        if (emotion !== currentEmotion && conf > 0.3) {
          setCurrentEmotion(emotion);
          setConfidence(conf);
          
          if (onEmotionChange) {
            onEmotionChange(emotion);
          }
        }
      }
      
    } catch (err) {
      // Log mínimo apenas a cada 500 frames
      if (frameSkipCountRef.current % 500 === 1) {
        console.warn('MediaPipe skip:', frameSkipCountRef.current);
      }
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange, currentEmotion]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo não carregado');
      return;
    }

    console.log('🚀 Iniciando MediaPipe ULTRA-otimizado (1 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    emotionStabilityCountRef.current = 0;
    frameSkipCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // Reduzir para 1 FPS (1000ms) com processamento assíncrono
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        // Usar requestIdleCallback se disponível, senão setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            processFrame();
          }, { timeout: 50 });
        } else {
          setTimeout(() => {
            processFrame();
          }, 10);
        }
      }
    }, 1000); // 1000ms = 1 FPS
    
    console.log('✅ Detecção 1 FPS ultra-otimizada iniciada');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe ultra-otimizado');
    
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    videoElementRef.current = null;
    emotionStabilityCountRef.current = 0;
    frameSkipCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
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
