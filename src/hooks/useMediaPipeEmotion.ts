
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
  const lastEmotionTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

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
      console.error('❌ ERRO CRÍTICO ao carregar MediaPipe:', err);
      setError(`Erro ao carregar MediaPipe: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    console.log('🔍 Analisando blendshapes para emoção...');
    
    if (!blendshapes || blendshapes.length === 0) {
      console.log('⚠️ PROBLEMA: Nenhum blendshape detectado');
      return { emotion: 'neutro', confidence: 0.1 };
    }

    const shapes = blendshapes[0].categories;
    console.log('📋 Número de categorias de blendshapes encontradas:', shapes.length);
    
    const shapeMap: { [key: string]: number } = {};
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Log apenas os blendshapes mais relevantes para emoções
    const emotionRelevantShapes = [
      'mouthSmileLeft', 'mouthSmileRight', 
      'mouthFrownLeft', 'mouthFrownRight',
      'eyeWideLeft', 'eyeWideRight',
      'browDownLeft', 'browDownRight',
      'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight'
    ];
    
    const relevantShapes: { [key: string]: number } = {};
    emotionRelevantShapes.forEach(shapeName => {
      if (shapeMap[shapeName] !== undefined) {
        relevantShapes[shapeName] = shapeMap[shapeName];
      }
    });
    
    console.log('🎭 BLENDSHAPES RELEVANTES:', relevantShapes);

    // Cálculos de emoção simplificados e mais sensíveis
    const felizScore = Math.max(
      (shapeMap['mouthSmileLeft'] || 0),
      (shapeMap['mouthSmileRight'] || 0)
    );
    
    const tristeScore = Math.max(
      (shapeMap['mouthFrownLeft'] || 0),
      (shapeMap['mouthFrownRight'] || 0)
    );
    
    const surprsoScore = Math.max(
      ((shapeMap['eyeWideLeft'] || 0) + (shapeMap['eyeWideRight'] || 0)) / 2,
      ((shapeMap['browOuterUpLeft'] || 0) + (shapeMap['browOuterUpRight'] || 0)) / 2
    );
    
    const raivaScore = Math.max(
      ((shapeMap['browDownLeft'] || 0) + (shapeMap['browDownRight'] || 0)) / 2
    );
    
    const cansadoScore = Math.max(
      ((shapeMap['eyeBlinkLeft'] || 0) + (shapeMap['eyeBlinkRight'] || 0)) / 2
    );

    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      cansado: cansadoScore,
      neutro: 0.3 // Base neutra
    };

    console.log('🎯 SCORES CALCULADOS:', {
      feliz: emotions.feliz.toFixed(4),
      triste: emotions.triste.toFixed(4),
      surpreso: emotions.surpreso.toFixed(4),
      raiva: emotions.raiva.toFixed(4),
      cansado: emotions.cansado.toFixed(4),
      neutro: emotions.neutro.toFixed(4)
    });

    // Encontrar emoção dominante (lowered threshold to 0.01)
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore && score > 0.01) { // Threshold muito baixo para capturar micro-expressões
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    const confidence = Math.min(Math.max(maxScore * 5, 0.1), 1); // Amplificar confiança

    console.log(`🎯 RESULTADO FINAL: ${maxEmotion} (score: ${maxScore.toFixed(4)}, confiança: ${confidence.toFixed(4)})`);

    return { emotion: maxEmotion, confidence };
  }, []);

  const processFrame = useCallback((videoElement: HTMLVideoElement) => {
    frameCountRef.current++;
    
    console.log(`🎬 PROCESSANDO FRAME ${frameCountRef.current}`);
    
    if (!faceLandmarkerRef.current) {
      console.log('❌ FaceLandmarker não disponível');
      return;
    }
    
    if (!isDetecting) {
      console.log('❌ Detecção não está ativa');
      return;
    }

    try {
      const now = performance.now();
      
      console.log(`📹 Processando frame ${frameCountRef.current} - timestamp: ${now}`);
      console.log(`📊 Estado do vídeo:`, {
        readyState: videoElement.readyState,
        currentTime: videoElement.currentTime.toFixed(3),
        paused: videoElement.paused,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight
      });
      
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, now);
      
      console.log('📊 Resultados da detecção MediaPipe:', {
        faceLandmarks: results.faceLandmarks?.length || 0,
        faceBlendshapes: results.faceBlendshapes?.length || 0,
        facialTransformationMatrixes: results.facialTransformationMatrixes?.length || 0
      });
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        console.log('✅ ROSTO DETECTADO! Analisando emoção...');
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        console.log(`🎭 EMOÇÃO DETECTADA: ${emotion} (${Math.round(conf * 100)}%)`);
      } else {
        console.log('❌ NENHUM ROSTO DETECTADO no frame atual');
        // Manter emoção anterior por alguns frames
        if (frameCountRef.current % 30 === 0) {
          console.log('🔄 Reset para neutro após 30 frames sem detecção');
          setCurrentEmotion('neutro');
          setConfidence(0.1);
        }
      }
      
    } catch (err) {
      console.error('💥 ERRO CRÍTICO no processamento do frame:', err);
      console.error('📊 Detalhes completos do erro:', {
        message: (err as Error).message,
        stack: (err as Error).stack,
        videoState: {
          readyState: videoElement.readyState,
          currentTime: videoElement.currentTime,
          paused: videoElement.paused
        }
      });
    }

    // Continuar processamento
    if (isDetecting) {
      console.log('🔄 Agendando próximo frame...');
      animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
    } else {
      console.log('⏹️ Parando processamento - isDetecting = false');
    }
  }, [isDetecting, analyzeEmotionFromBlendshapes, onEmotionChange]);

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
      srcObject: !!videoElement.srcObject,
      duration: videoElement.duration
    });

    setIsDetecting(true);
    frameCountRef.current = 0;
    
    console.log('✅ Estado alterado para isDetecting = true');
    console.log('🎬 Iniciando processamento de frames...');
    
    // Aguardar um momento e iniciar processamento
    setTimeout(() => {
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
        console.log('✅ Vídeo confirmado como pronto, iniciando loop de processamento...');
        processFrame(videoElement);
      } else {
        console.error('❌ PROBLEMA: Vídeo não está pronto para processamento');
        console.log('📊 Estado completo do vídeo:', {
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          networkState: videoElement.networkState,
          currentSrc: videoElement.currentSrc,
          srcObject: videoElement.srcObject
        });
      }
    }, 100);
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 PARANDO DETECÇÃO MEDIAPIPE');
    setIsDetecting(false);
    setCurrentEmotion(null);
    frameCountRef.current = 0;
    
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
