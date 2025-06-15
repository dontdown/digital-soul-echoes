
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
  
  // Cache para evitar processamento desnecessário
  const lastEmotionRef = useRef<MediaPipeEmotion>('neutro');
  const emotionStabilityCountRef = useRef<number>(0);

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
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false, // Desabilitar para economizar performance
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
    const shapeMap: { [key: string]: number } = {};
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Apenas os blendshapes mais importantes para performance
    const smileScore = Math.max(shapeMap['mouthSmileLeft'] || 0, shapeMap['mouthSmileRight'] || 0);
    const frownScore = Math.max(shapeMap['mouthFrownLeft'] || 0, shapeMap['mouthFrownRight'] || 0);
    const eyeWideScore = Math.max(shapeMap['eyeWideLeft'] || 0, shapeMap['eyeWideRight'] || 0);
    const browDownScore = Math.max(shapeMap['browDownLeft'] || 0, shapeMap['browDownRight'] || 0);

    // Lógica simplificada para melhor performance
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.5;

    if (smileScore > 0.1) {
      emotion = 'feliz';
      confidence = Math.min(smileScore * 3, 1);
    } else if (frownScore > 0.08) {
      emotion = 'triste';
      confidence = Math.min(frownScore * 4, 1);
    } else if (browDownScore > 0.1) {
      emotion = 'raiva';
      confidence = Math.min(browDownScore * 4, 1);
    } else if (eyeWideScore > 0.15) {
      emotion = 'surpreso';
      confidence = Math.min(eyeWideScore * 3, 1);
    }

    // Estabilizar emoção - só mudar se for consistente
    if (emotion === lastEmotionRef.current) {
      emotionStabilityCountRef.current++;
    } else {
      emotionStabilityCountRef.current = 0;
      lastEmotionRef.current = emotion;
    }

    // Só reportar mudança se for estável por pelo menos 2 frames
    if (emotionStabilityCountRef.current >= 2) {
      return { emotion, confidence };
    } else {
      return { emotion: currentEmotion || 'neutro', confidence };
    }
  }, [currentEmotion]);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoElementRef.current || !isProcessingRef.current) {
      return;
    }

    frameCountRef.current++;
    const video = videoElementRef.current;

    try {
      const now = performance.now();
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
      // Log silencioso para não afetar performance
      if (frameCountRef.current % 100 === 1) {
        console.error('Erro processamento:', err);
      }
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange, currentEmotion]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo não carregado');
      return;
    }

    console.log('🚀 Iniciando MediaPipe otimizado (5 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    frameCountRef.current = 0;
    emotionStabilityCountRef.current = 0;
    
    // Reduzir para 5 FPS (200ms) para melhor performance
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        processFrame();
      }
    }, 200); // 200ms = 5 FPS
    
    console.log('✅ Detecção 5 FPS iniciada');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe');
    
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    frameCountRef.current = 0;
    videoElementRef.current = null;
    emotionStabilityCountRef.current = 0;
    
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
