
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
  
  // Cache otimizado mas mais responsivo
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
      
      console.log('✅ MediaPipe carregado!');
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
    
    // Análise mais sensível - thresholds mais baixos
    let smileScore = 0;
    let frownScore = 0;
    let browDownScore = 0;
    let eyeWideScore = 0;

    // Verificar mais blendshapes para melhor detecção
    for (let i = 0; i < Math.min(shapes.length, 20); i++) {
      const shape = shapes[i];
      const name = shape.categoryName;
      const score = shape.score;
      
      if (name.includes('mouthSmile') || name.includes('cheekSquint')) {
        smileScore = Math.max(smileScore, score);
      } else if (name.includes('mouthFrown') || name.includes('mouthSad')) {
        frownScore = Math.max(frownScore, score);
      } else if (name.includes('browDown') || name.includes('browLowerer')) {
        browDownScore = Math.max(browDownScore, score);
      } else if (name.includes('eyeWide') || name.includes('eyeSquint')) {
        eyeWideScore = Math.max(eyeWideScore, score);
      }
    }

    // Thresholds mais baixos e sensíveis
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.3;

    if (smileScore > 0.08) { // Reduzido de 0.15 para 0.08
      emotion = 'feliz';
      confidence = Math.min(smileScore * 3, 0.9);
    } else if (frownScore > 0.06) { // Reduzido de 0.12 para 0.06
      emotion = 'triste';
      confidence = Math.min(frownScore * 4, 0.9);
    } else if (browDownScore > 0.05) {
      emotion = 'raiva';
      confidence = Math.min(browDownScore * 4, 0.8);
    } else if (eyeWideScore > 0.07) {
      emotion = 'surpreso';
      confidence = Math.min(eyeWideScore * 3, 0.8);
    }

    // Estabilização reduzida - só mudar após 2 frames consistentes
    if (emotion === lastEmotionRef.current) {
      emotionStabilityCountRef.current++;
    } else {
      emotionStabilityCountRef.current = 0;
      lastEmotionRef.current = emotion;
    }

    if (emotionStabilityCountRef.current >= 2) { // Reduzido de 6 para 2
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
    
    // Throttling menos agressivo: 500ms entre processamentos
    if (now - lastProcessTimeRef.current < 500) { // Reduzido de 1000ms para 500ms
      return;
    }

    // Skip menos frames (processa 1 a cada 2 frames)
    frameSkipCountRef.current++;
    if (frameSkipCountRef.current % 2 !== 0) { // Reduzido de 5 para 2
      return;
    }

    const video = videoElementRef.current;

    try {
      lastProcessTimeRef.current = now;
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        // Atualizar com confiança menor
        if (emotion !== currentEmotion && conf > 0.2) { // Reduzido de 0.3 para 0.2
          setCurrentEmotion(emotion);
          setConfidence(conf);
          
          if (onEmotionChange) {
            onEmotionChange(emotion);
          }
        }
      }
      
    } catch (err) {
      // Log reduzido
      if (frameSkipCountRef.current % 100 === 1) {
        console.warn('MediaPipe skip:', frameSkipCountRef.current);
      }
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange, currentEmotion]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo não carregado');
      return;
    }

    console.log('🚀 Iniciando MediaPipe otimizado (2 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    emotionStabilityCountRef.current = 0;
    frameSkipCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // Aumentar para 2 FPS (500ms)
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        // Usar requestIdleCallback se disponível
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
    }, 500); // 500ms = 2 FPS
    
    console.log('✅ Detecção 2 FPS iniciada');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe');
    
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
