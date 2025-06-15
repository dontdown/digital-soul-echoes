
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
  const frameCountRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const processingIntervalRef = useRef<number | null>(null);
  
  // Cache mais agressivo para evitar processamento desnecessário
  const lastEmotionRef = useRef<MediaPipeEmotion>('neutro');
  const emotionStabilityCountRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);
  const skipFramesRef = useRef<number>(0);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU' // Mudando para CPU para evitar problemas de GPU
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      console.log('✅ MediaPipe carregado com CPU!');
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
    
    // Processamento super simplificado - apenas os essenciais
    let smileScore = 0;
    let frownScore = 0;
    let eyeWideScore = 0;
    let browDownScore = 0;

    // Buscar apenas os blendshapes críticos (mais rápido)
    for (let i = 0; i < shapes.length && i < 20; i++) { // Limitar a 20 primeiros
      const shape = shapes[i];
      const name = shape.categoryName;
      const score = shape.score;
      
      if (name.includes('mouthSmile')) {
        smileScore = Math.max(smileScore, score);
      } else if (name.includes('mouthFrown')) {
        frownScore = Math.max(frownScore, score);
      } else if (name.includes('eyeWide')) {
        eyeWideScore = Math.max(eyeWideScore, score);
      } else if (name.includes('browDown')) {
        browDownScore = Math.max(browDownScore, score);
      }
    }

    // Lógica ultra-simplificada
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.5;

    if (smileScore > 0.12) {
      emotion = 'feliz';
      confidence = Math.min(smileScore * 2.5, 1);
    } else if (frownScore > 0.1) {
      emotion = 'triste';
      confidence = Math.min(frownScore * 3, 1);
    } else if (browDownScore > 0.12) {
      emotion = 'raiva';
      confidence = Math.min(browDownScore * 3, 1);
    } else if (eyeWideScore > 0.2) {
      emotion = 'surpreso';
      confidence = Math.min(eyeWideScore * 2.5, 1);
    }

    // Super estabilização - só mudar após 4 frames consistentes
    if (emotion === lastEmotionRef.current) {
      emotionStabilityCountRef.current++;
    } else {
      emotionStabilityCountRef.current = 0;
      lastEmotionRef.current = emotion;
    }

    if (emotionStabilityCountRef.current >= 4) {
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
    
    // Skip frames se o processamento anterior foi muito recente (throttling agressivo)
    if (now - lastProcessTimeRef.current < 500) { // Mínimo 500ms entre processamentos
      return;
    }

    // Skip frames ocasionais para dar respiro ao CPU
    skipFramesRef.current++;
    if (skipFramesRef.current % 3 !== 0) { // Processa apenas 1 a cada 3 tentativas
      return;
    }

    frameCountRef.current++;
    const video = videoElementRef.current;

    try {
      lastProcessTimeRef.current = now;
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        // Só atualizar se realmente mudou
        if (emotion !== currentEmotion) {
          setCurrentEmotion(emotion);
          setConfidence(conf);
          
          if (onEmotionChange) {
            onEmotionChange(emotion);
          }
        }
      }
      
    } catch (err) {
      // Log mínimo para não afetar performance
      if (frameCountRef.current % 200 === 1) {
        console.warn('MediaPipe skip frame:', frameCountRef.current);
      }
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange, currentEmotion]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo não carregado');
      return;
    }

    console.log('🚀 Iniciando MediaPipe ultra-otimizado (2 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    frameCountRef.current = 0;
    emotionStabilityCountRef.current = 0;
    skipFramesRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // Reduzir drasticamente para 2 FPS (500ms)
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        // Usar setTimeout para não bloquear o thread principal
        setTimeout(() => {
          processFrame();
        }, 0);
      }
    }, 500); // 500ms = 2 FPS
    
    console.log('✅ Detecção 2 FPS iniciada com throttling');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe');
    
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    frameCountRef.current = 0;
    videoElementRef.current = null;
    emotionStabilityCountRef.current = 0;
    skipFramesRef.current = 0;
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
