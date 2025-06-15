
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
      console.log('🔧 Configurações:', {
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      setIsModelLoaded(true);
      
    } catch (err: any) {
      console.error('❌ ERRO CRÍTICO ao carregar MediaPipe:', err);
      console.error('📊 Detalhes do erro:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(`Erro ao carregar MediaPipe: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    console.log('🔍 Analisando blendshapes...');
    console.log('📊 Número de faces detectadas:', blendshapes.length);
    
    if (!blendshapes || blendshapes.length === 0) {
      console.log('⚠️ PROBLEMA: Nenhum blendshape detectado');
      return { emotion: 'neutro', confidence: 0.1 };
    }

    const shapes = blendshapes[0].categories;
    console.log('📋 Número de categorias de blendshapes:', shapes.length);
    
    const shapeMap: { [key: string]: number } = {};
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Log TODOS os blendshapes para debug completo
    console.log('🎭 TODOS OS BLENDSHAPES:', shapeMap);

    // Encontrar os top 10 blendshapes mais ativos
    const sortedShapes = Object.entries(shapeMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('🏆 TOP 10 blendshapes mais ativos:', sortedShapes);

    // Cálculos de emoção com análise mais robusta
    const felizScore = Math.max(
      (shapeMap['mouthSmileLeft'] || 0),
      (shapeMap['mouthSmileRight'] || 0),
      ((shapeMap['cheekSquintLeft'] || 0) + (shapeMap['cheekSquintRight'] || 0)) / 2,
      ((shapeMap['mouthCornerPullLeft'] || 0) + (shapeMap['mouthCornerPullRight'] || 0)) / 2
    );
    
    const tristeScore = Math.max(
      (shapeMap['mouthFrownLeft'] || 0),
      (shapeMap['mouthFrownRight'] || 0),
      ((shapeMap['mouthLowerDownLeft'] || 0) + (shapeMap['mouthLowerDownRight'] || 0)) / 2,
      ((shapeMap['mouthCornerDownLeft'] || 0) + (shapeMap['mouthCornerDownRight'] || 0)) / 2
    );
    
    const surprsoScore = Math.max(
      ((shapeMap['eyeWideLeft'] || 0) + (shapeMap['eyeWideRight'] || 0)) / 2,
      (shapeMap['jawOpen'] || 0),
      ((shapeMap['browOuterUpLeft'] || 0) + (shapeMap['browOuterUpRight'] || 0)) / 2,
      ((shapeMap['browInnerUp'] || 0))
    );
    
    const raivaScore = Math.max(
      ((shapeMap['browDownLeft'] || 0) + (shapeMap['browDownRight'] || 0)) / 2,
      ((shapeMap['eyeSquintLeft'] || 0) + (shapeMap['eyeSquintRight'] || 0)) / 2,
      ((shapeMap['browLowererLeft'] || 0) + (shapeMap['browLowererRight'] || 0)) / 2,
      (shapeMap['noseSneerLeft'] || 0) + (shapeMap['noseSneerRight'] || 0)
    );
    
    const cansadoScore = Math.max(
      ((shapeMap['eyeBlinkLeft'] || 0) + (shapeMap['eyeBlinkRight'] || 0)) / 2,
      ((shapeMap['eyeLookDownLeft'] || 0) + (shapeMap['eyeLookDownRight'] || 0)) / 2,
      ((shapeMap['upperLidRaiserLeft'] || 0) + (shapeMap['upperLidRaiserRight'] || 0)) / 2
    );

    // Atividade facial geral
    const totalActivity = felizScore + tristeScore + surprsoScore + raivaScore + cansadoScore;
    
    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      cansado: cansadoScore,
      neutro: Math.max(0.1, 0.4 - totalActivity)
    };

    console.log('🎯 SCORES CALCULADOS:', {
      feliz: emotions.feliz.toFixed(4),
      triste: emotions.triste.toFixed(4),
      surpreso: emotions.surpreso.toFixed(4),
      raiva: emotions.raiva.toFixed(4),
      cansado: emotions.cansado.toFixed(4),
      neutro: emotions.neutro.toFixed(4),
      atividadeTotal: totalActivity.toFixed(4)
    });

    // Encontrar emoção dominante
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    // Confiança baseada na diferença entre a primeira e segunda emoção
    const sortedEmotions = Object.entries(emotions).sort(([,a], [,b]) => b - a);
    const confidence = Math.min(Math.max((sortedEmotions[0][1] - sortedEmotions[1][1]) * 5, 0.1), 1);

    console.log(`🎯 RESULTADO FINAL: ${maxEmotion} (score: ${maxScore.toFixed(4)}, confiança: ${confidence.toFixed(4)})`);
    console.log('🏁 Ranking de emoções:', sortedEmotions.map(([e, s]) => `${e}: ${s.toFixed(4)}`));

    return { 
      emotion: maxEmotion, 
      confidence
    };
  }, []);

  const processFrame = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isDetecting) {
      console.log('⚠️ Processamento parado: modelo ou detecção inativa');
      return;
    }

    frameCountRef.current++;
    
    try {
      const now = performance.now();
      
      // Log a cada 30 frames (aproximadamente 1 segundo)
      if (frameCountRef.current % 30 === 0) {
        console.log(`📹 Processando frame ${frameCountRef.current} - Vídeo: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        console.log(`📊 Estado do vídeo:`, {
          readyState: videoElement.readyState,
          currentTime: videoElement.currentTime,
          paused: videoElement.paused,
          duration: videoElement.duration
        });
      }
      
      // Processar a cada 100ms para reduzir carga
      if (now - lastEmotionTimeRef.current < 100) {
        if (isDetecting) {
          animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
        }
        return;
      }
      
      lastEmotionTimeRef.current = now;
      
      console.log('🔄 Executando detectForVideo...');
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, now);
      
      console.log('📊 Resultados da detecção:', {
        faceLandmarks: results.faceLandmarks?.length || 0,
        faceBlendshapes: results.faceBlendshapes?.length || 0,
        facialTransformationMatrixes: results.facialTransformationMatrixes?.length || 0
      });
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        console.log('✅ ROSTO DETECTADO! Analisando blendshapes...');
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        console.log(`🎭 EMOÇÃO DETECTADA: ${emotion} (${Math.round(conf * 100)}%)`);
      } else {
        console.log('❌ NENHUM ROSTO DETECTADO no frame atual');
        // Não resetar emoção imediatamente, manter por alguns frames
        if (frameCountRef.current % 60 === 0) { // Reset a cada 2 segundos sem detecção
          setCurrentEmotion('neutro');
          setConfidence(0.1);
        }
      }
      
    } catch (err) {
      console.error('💥 ERRO CRÍTICO no processamento:', err);
      console.error('📊 Detalhes do erro:', {
        message: (err as Error).message,
        stack: (err as Error).stack
      });
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
    }
  }, [isDetecting, analyzeEmotionFromBlendshapes, onEmotionChange]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ ERRO: Modelo MediaPipe não carregado');
      console.log('📊 Estado atual:', {
        faceLandmarker: !!faceLandmarkerRef.current,
        isModelLoaded
      });
      return;
    }

    console.log('🚀 INICIANDO DETECÇÃO MEDIAPIPE');
    console.log('📹 Elemento de vídeo recebido:', {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      readyState: videoElement.readyState,
      currentTime: videoElement.currentTime,
      paused: videoElement.paused,
      srcObject: !!videoElement.srcObject
    });

    setIsDetecting(true);
    frameCountRef.current = 0;
    
    // Aguardar um pouco e verificar se o vídeo está realmente pronto
    setTimeout(() => {
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
        console.log('✅ Vídeo confirmado como pronto, iniciando processamento...');
        processFrame(videoElement);
      } else {
        console.error('❌ PROBLEMA: Vídeo não está pronto para processamento');
        console.log('📊 Estado detalhado do vídeo:', {
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          networkState: videoElement.networkState
        });
      }
    }, 500);
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
