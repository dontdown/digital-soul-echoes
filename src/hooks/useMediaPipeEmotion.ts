
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
  const animationFrameRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameCountRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

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
      console.log('🔧 Configurações:', {
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      setIsModelLoaded(true);
      
    } catch (err: any) {
      console.error('❌ ERRO CRÍTICO ao carregar MediaPipe:', err);
      setError(`Erro ao carregar MediaPipe: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    if (!blendshapes || blendshapes.length === 0) {
      console.log('⚠️ Nenhum blendshape detectado');
      return { emotion: 'neutro', confidence: 0.1 };
    }

    const shapes = blendshapes[0].categories;
    const shapeMap: { [key: string]: number } = {};
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Log dos blendshapes mais relevantes
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
    
    console.log('🎭 BLENDSHAPES RELEVANTES:', relevantShapes);

    // Cálculos de emoção mais sensíveis
    const felizScore = Math.max(relevantShapes.smileLeft, relevantShapes.smileRight);
    const tristeScore = Math.max(relevantShapes.frownLeft, relevantShapes.frownRight);
    const surprsoScore = Math.max(relevantShapes.eyeWideLeft, relevantShapes.eyeWideRight, relevantShapes.browUp);
    const raivaScore = relevantShapes.browDown;
    
    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      neutro: 0.2 // Base neutra reduzida
    };

    console.log('🎯 SCORES CALCULADOS:', {
      feliz: emotions.feliz.toFixed(4),
      triste: emotions.triste.toFixed(4),
      surpreso: emotions.surpreso.toFixed(4),
      raiva: emotions.raiva.toFixed(4)
    });

    // Encontrar emoção dominante com threshold muito baixo
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore && score > 0.015) { // Threshold ultra baixo
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    const confidence = Math.min(Math.max(maxScore * 8, 0.1), 1); // Amplificar mais a confiança

    console.log(`🎯 RESULTADO: ${maxEmotion} (score: ${maxScore.toFixed(4)}, confiança: ${confidence.toFixed(4)})`);

    return { emotion: maxEmotion, confidence };
  }, []);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current) {
      console.log('❌ FaceLandmarker não disponível');
      return;
    }
    
    if (!videoElementRef.current) {
      console.log('❌ Elemento de vídeo não disponível');
      return;
    }

    // Verificar se deve continuar processando
    if (!isProcessingRef.current) {
      console.log('🛑 Processamento parado por flag');
      return;
    }

    frameCountRef.current++;
    const video = videoElementRef.current;
    
    // Debug a cada 30 frames para não poluir o console
    if (frameCountRef.current % 30 === 1) {
      console.log(`🎬 PROCESSANDO FRAME ${frameCountRef.current}`);
      console.log(`📊 Estado do vídeo:`, {
        readyState: video.readyState,
        currentTime: video.currentTime.toFixed(3),
        paused: video.paused,
        width: video.videoWidth,
        height: video.videoHeight,
        isProcessing: isProcessingRef.current
      });
    }

    try {
      const now = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        if (frameCountRef.current % 30 === 1) {
          console.log('✅ ROSTO DETECTADO! Analisando emoção...');
        }
        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        if (frameCountRef.current % 30 === 1) {
          console.log(`🎭 EMOÇÃO DETECTADA: ${emotion} (${Math.round(conf * 100)}%)`);
        }
      } else {
        if (frameCountRef.current % 60 === 1) {
          console.log('❌ NENHUM ROSTO DETECTADO no frame atual');
        }
      }
      
    } catch (err) {
      console.error('💥 ERRO no processamento do frame:', err);
    }

    // Continuar processamento se ainda estiver ativo
    if (isProcessingRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      console.log('🛑 Parando processamento - flag desativada');
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ ERRO: Modelo MediaPipe não carregado');
      return;
    }

    console.log('🚀 INICIANDO DETECÇÃO MEDIAPIPE');
    console.log('📹 Elemento de vídeo detalhado:', {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      readyState: videoElement.readyState,
      currentTime: videoElement.currentTime,
      paused: videoElement.paused,
      muted: videoElement.muted,
      srcObject: !!videoElement.srcObject
    });

    // Configurar estados e referências
    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    frameCountRef.current = 0;
    
    console.log('✅ Estado alterado para isDetecting = true');
    console.log('✅ isProcessingRef definido como true');
    
    // Aguardar um momento e iniciar processamento
    setTimeout(() => {
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
        console.log('✅ Vídeo confirmado como pronto, iniciando loop de processamento...');
        processFrame();
      } else {
        console.error('❌ Vídeo não está pronto:', {
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth
        });
      }
    }, 100);
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 PARANDO DETECÇÃO MEDIAPIPE');
    
    // Parar processamento imediatamente
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    frameCountRef.current = 0;
    videoElementRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('✅ AnimationFrame cancelado');
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
