
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

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe FaceLandmarker...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
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
      
      setIsModelLoaded(true);
      console.log('✅ MediaPipe carregado com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar MediaPipe:', err);
      setError(`Erro ao carregar MediaPipe: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    if (!blendshapes || blendshapes.length === 0) {
      console.log('⚠️ Nenhum blendshape detectado');
      return { emotion: 'neutro', confidence: 0.3 };
    }

    const shapes = blendshapes[0].categories;
    const shapeMap: { [key: string]: number } = {};
    
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Log todos os blendshapes relevantes para debug
    const relevantShapes = [
      'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
      'browDownLeft', 'browDownRight', 'eyeWideLeft', 'eyeWideRight',
      'jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight', 'cheekSquintLeft', 'cheekSquintRight',
      'mouthUpperUpLeft', 'mouthUpperUpRight', 'browOuterUpLeft', 'browOuterUpRight'
    ];
    
    const shapeDebug: any = {};
    relevantShapes.forEach(shape => {
      if (shapeMap[shape] > 0.01) { // Só mostrar valores significativos
        shapeDebug[shape] = shapeMap[shape].toFixed(3);
      }
    });
    
    if (Object.keys(shapeDebug).length > 0) {
      console.log('📊 Blendshapes ativos:', shapeDebug);
    }

    // Cálculos de emoção com thresholds muito baixos para maior sensibilidade
    const felizScore = Math.max(
      (shapeMap['mouthSmileLeft'] || 0),
      (shapeMap['mouthSmileRight'] || 0),
      ((shapeMap['cheekSquintLeft'] || 0) + (shapeMap['cheekSquintRight'] || 0)) * 0.5
    );
    
    const tristeScore = Math.max(
      (shapeMap['mouthFrownLeft'] || 0),
      (shapeMap['mouthFrownRight'] || 0),
      ((shapeMap['mouthLowerDownLeft'] || 0) + (shapeMap['mouthLowerDownRight'] || 0)) * 0.5
    );
    
    const surprsoScore = Math.max(
      ((shapeMap['eyeWideLeft'] || 0) + (shapeMap['eyeWideRight'] || 0)) * 0.5,
      (shapeMap['jawOpen'] || 0),
      ((shapeMap['browOuterUpLeft'] || 0) + (shapeMap['browOuterUpRight'] || 0)) * 0.5,
      ((shapeMap['mouthUpperUpLeft'] || 0) + (shapeMap['mouthUpperUpRight'] || 0)) * 0.5
    );
    
    const raivaScore = Math.max(
      ((shapeMap['browDownLeft'] || 0) + (shapeMap['browDownRight'] || 0)) * 0.5,
      ((shapeMap['eyeSquintLeft'] || 0) + (shapeMap['eyeSquintRight'] || 0)) * 0.5,
      ((shapeMap['browLowererLeft'] || 0) + (shapeMap['browLowererRight'] || 0)) * 0.5
    );
    
    const cansadoScore = Math.max(
      ((shapeMap['eyeBlinkLeft'] || 0) + (shapeMap['eyeBlinkRight'] || 0)) * 0.5,
      ((shapeMap['eyeLookDownLeft'] || 0) + (shapeMap['eyeLookDownRight'] || 0)) * 0.5,
      ((shapeMap['upperLidRaiserLeft'] || 0) + (shapeMap['upperLidRaiserRight'] || 0)) * 0.5
    );

    // Calcular score geral de atividade facial
    const totalActivity = felizScore + tristeScore + surprsoScore + raivaScore + cansadoScore;
    
    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      cansado: cansadoScore,
      neutro: Math.max(0.1, 0.3 - totalActivity) // Neutro diminui com atividade facial
    };

    console.log('🎭 Scores calculados:', {
      feliz: emotions.feliz.toFixed(3),
      triste: emotions.triste.toFixed(3),
      surpreso: emotions.surpreso.toFixed(3),
      raiva: emotions.raiva.toFixed(3),
      cansado: emotions.cansado.toFixed(3),
      neutro: emotions.neutro.toFixed(3),
      atividade: totalActivity.toFixed(3)
    });

    // Encontrar emoção dominante com threshold muito baixo
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore && score > 0.02) { // Threshold muito baixo: 2%
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    // Amplificar confiança para melhor feedback
    const normalizedConfidence = Math.min(Math.max(maxScore * 3, 0.1), 1);

    console.log(`🎯 Emoção final: ${maxEmotion} (score: ${maxScore.toFixed(3)}, confiança: ${normalizedConfidence.toFixed(3)})`);

    return { 
      emotion: maxEmotion, 
      confidence: normalizedConfidence
    };
  }, []);

  const processFrame = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isDetecting) return;

    try {
      const now = performance.now();
      
      // Throttle para processar a cada 200ms para evitar sobrecarga
      if (now - lastEmotionTimeRef.current < 200) {
        if (isDetecting) {
          animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
        }
        return;
      }
      
      lastEmotionTimeRef.current = now;
      
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        console.log('👤 Rosto detectado, analisando blendshapes...');
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        console.log(`😊 MediaPipe resultado: ${emotion} (${Math.round(conf * 100)}%)`);
      } else {
        console.log('❌ Nenhum rosto detectado no frame');
        setCurrentEmotion('neutro');
        setConfidence(0.1);
      }
      
    } catch (err) {
      console.error('❌ Erro no processamento MediaPipe:', err);
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
    }
  }, [isDetecting, analyzeEmotionFromBlendshapes, onEmotionChange]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo MediaPipe não carregado');
      return;
    }

    setIsDetecting(true);
    console.log('🎬 Iniciando detecção MediaPipe...');
    console.log('📹 Elemento de vídeo:', {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      readyState: videoElement.readyState,
      currentTime: videoElement.currentTime
    });
    
    // Aguardar um pouco para garantir que o vídeo está pronto
    setTimeout(() => {
      if (isDetecting && videoElement.readyState >= 2) {
        console.log('▶️ Iniciando processamento de frames...');
        processFrame(videoElement);
      } else {
        console.warn('⚠️ Vídeo não está pronto ainda');
      }
    }, 300);
  }, [isModelLoaded, processFrame, isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    console.log('⏹️ Detecção MediaPipe parada');
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
