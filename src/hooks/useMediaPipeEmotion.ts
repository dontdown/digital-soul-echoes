
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
  const lastProcessTimeRef = useRef<number>(0);
  const processingIntervalRef = useRef<number | null>(null);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Iniciando carregamento do MediaPipe FaceLandmarker...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      console.log('📦 FilesetResolver carregado, criando FaceLandmarker...');
      
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      console.log('✅ MediaPipe FaceLandmarker criado com sucesso!');
      setIsModelLoaded(true);
      
    } catch (err: any) {
      console.error('❌ ERRO ao carregar MediaPipe:', err);
      setError(`Erro ao carregar MediaPipe: ${err.message}`);
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

    // Blendshapes mais relevantes
    const relevantShapes = {
      smileLeft: shapeMap['mouthSmileLeft'] || 0,
      smileRight: shapeMap['mouthSmileRight'] || 0,
      frownLeft: shapeMap['mouthFrownLeft'] || 0,
      frownRight: shapeMap['mouthFrownRight'] || 0,
      eyeWideLeft: shapeMap['eyeWideLeft'] || 0,
      eyeWideRight: shapeMap['eyeWideRight'] || 0,
      browDown: Math.max(shapeMap['browDownLeft'] || 0, shapeMap['browDownRight'] || 0),
      browUp: Math.max(shapeMap['browOuterUpLeft'] || 0, shapeMap['browOuterUpRight'] || 0)
    };
    
    // Log apenas a cada 60 frames para reduzir spam
    if (frameCountRef.current % 60 === 1) {
      console.log('🎭 BLENDSHAPES:', relevantShapes);
    }

    // Cálculos de emoção
    const felizScore = Math.max(relevantShapes.smileLeft, relevantShapes.smileRight);
    const tristeScore = Math.max(relevantShapes.frownLeft, relevantShapes.frownRight);
    const surprsoScore = Math.max(relevantShapes.eyeWideLeft, relevantShapes.eyeWideRight, relevantShapes.browUp);
    const raivaScore = relevantShapes.browDown;
    
    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      neutro: 0.2
    };

    // Log apenas a cada 60 frames
    if (frameCountRef.current % 60 === 1) {
      console.log('🎯 SCORES:', {
        feliz: emotions.feliz.toFixed(3),
        triste: emotions.triste.toFixed(3),
        surpreso: emotions.surpreso.toFixed(3),
        raiva: emotions.raiva.toFixed(3)
      });
    }

    // Encontrar emoção dominante
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore && score > 0.02) {
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    const confidence = Math.min(Math.max(maxScore * 6, 0.1), 1);

    // Log resultado apenas a cada 60 frames
    if (frameCountRef.current % 60 === 1) {
      console.log(`🎯 RESULTADO: ${maxEmotion} (${confidence.toFixed(3)})`);
    }

    return { emotion: maxEmotion, confidence };
  }, []);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoElementRef.current || !isProcessingRef.current) {
      return;
    }

    frameCountRef.current++;
    const video = videoElementRef.current;
    
    // Log apenas a cada 120 frames para reduzir muito o spam
    if (frameCountRef.current % 120 === 1) {
      console.log(`🎬 Processando frame ${frameCountRef.current}`);
    }

    try {
      const now = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
      }
      
    } catch (err) {
      console.error('💥 ERRO no processamento:', err);
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo MediaPipe não carregado');
      return;
    }

    console.log('🚀 INICIANDO DETECÇÃO MEDIAPIPE');

    // Configurar estados e referências
    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    frameCountRef.current = 0;
    
    // Usar setInterval em vez de requestAnimationFrame para controlar melhor a frequência
    // Processar apenas 10 FPS em vez de 60 FPS para reduzir lag
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        processFrame();
      }
    }, 100); // 100ms = 10 FPS
    
    console.log('✅ Detecção iniciada com 10 FPS');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 PARANDO DETECÇÃO MEDIAPIPE');
    
    // Parar processamento
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    frameCountRef.current = 0;
    videoElementRef.current = null;
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
      console.log('✅ Interval cancelado');
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
