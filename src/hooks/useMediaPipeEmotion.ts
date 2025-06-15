
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

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe FaceLandmarker...');
      
      // Inicializar o FilesetResolver
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      // Criar o FaceLandmarker com blendshapes habilitadas
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
      return { emotion: 'neutro', confidence: 0.5 };
    }

    // Mapear blendshapes para emoções
    const shapes = blendshapes[0].categories;
    const shapeMap: { [key: string]: number } = {};
    
    shapes.forEach((shape: any) => {
      shapeMap[shape.categoryName] = shape.score;
    });

    // Calcular scores individuais de emoções primeiro
    const felizScore = Math.max(
      (shapeMap['mouthSmileLeft'] || 0) + (shapeMap['mouthSmileRight'] || 0),
      (shapeMap['cheekSquintLeft'] || 0) + (shapeMap['cheekSquintRight'] || 0)
    );
    
    const tristeScore = Math.max(
      (shapeMap['mouthFrownLeft'] || 0) + (shapeMap['mouthFrownRight'] || 0),
      (shapeMap['mouthLowerDownLeft'] || 0) + (shapeMap['mouthLowerDownRight'] || 0)
    );
    
    const surprsoScore = Math.max(
      (shapeMap['eyeWideLeft'] || 0) + (shapeMap['eyeWideRight'] || 0),
      (shapeMap['jawOpen'] || 0) * 0.8
    );
    
    const raivaScore = Math.max(
      (shapeMap['browDownLeft'] || 0) + (shapeMap['browDownRight'] || 0),
      (shapeMap['eyeSquintLeft'] || 0) + (shapeMap['eyeSquintRight'] || 0)
    );
    
    const cansadoScore = Math.max(
      (shapeMap['eyeBlinkLeft'] || 0) + (shapeMap['eyeBlinkRight'] || 0),
      (shapeMap['eyeLookDownLeft'] || 0) + (shapeMap['eyeLookDownRight'] || 0)
    );

    // Criar objeto de emoções com os scores calculados
    const emotions = {
      feliz: felizScore,
      triste: tristeScore,
      surpreso: surprsoScore,
      raiva: raivaScore,
      cansado: cansadoScore,
      neutro: 1 - Math.max(felizScore, tristeScore, surprsoScore, raivaScore, cansadoScore)
    };

    // Encontrar a emoção com maior pontuação
    let maxEmotion: MediaPipeEmotion = 'neutro';
    let maxScore = emotions.neutro;

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxEmotion = emotion as MediaPipeEmotion;
        maxScore = score;
      }
    });

    // Normalizar confiança para 0-1
    const normalizedConfidence = Math.min(maxScore * 3, 1);

    return { 
      emotion: maxEmotion, 
      confidence: normalizedConfidence
    };
  }, []);

  const processFrame = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isDetecting) return;

    try {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, startTimeMs);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        setCurrentEmotion(emotion);
        setConfidence(conf);
        
        if (onEmotionChange) {
          onEmotionChange(emotion);
        }
        
        console.log(`😊 MediaPipe detectou: ${emotion} (${Math.round(conf * 100)}%)`);
      } else {
        // Se não detectar rosto, definir como neutro
        setCurrentEmotion('neutro');
        setConfidence(0.3);
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
    
    processFrame(videoElement);
  }, [isModelLoaded, processFrame]);

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
