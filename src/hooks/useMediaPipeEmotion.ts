
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
  
  // Sistema de estabilização mais robusto
  const lastEmotionRef = useRef<MediaPipeEmotion>('neutro');
  const emotionCountRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);
  const emotionHistoryRef = useRef<MediaPipeEmotion[]>([]);
  const confidenceHistoryRef = useRef<number[]>([]);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe estável...');
      
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
      
      console.log('✅ MediaPipe carregado com estabilização!');
      setIsModelLoaded(true);
      
    } catch (err: any) {
      console.error('❌ Erro MediaPipe:', err);
      setError(`Erro: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const analyzeEmotionFromBlendshapes = useCallback((blendshapes: any[]): { emotion: MediaPipeEmotion; confidence: number } => {
    if (!blendshapes || blendshapes.length === 0) {
      return { emotion: 'neutro', confidence: 0.3 };
    }

    const shapes = blendshapes[0].categories;
    
    // Scores para diferentes emoções com thresholds balanceados
    let smileScore = 0;
    let frownScore = 0;
    let browDownScore = 0;
    let eyeWideScore = 0;
    let mouthOpenScore = 0;
    let cheekRaiseScore = 0;

    // Analisar blendshapes mais relevantes
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const name = shape.categoryName.toLowerCase();
      const score = shape.score;
      
      // Sorriso
      if (name.includes('smile') || (name.includes('cheek') && name.includes('squint'))) {
        smileScore = Math.max(smileScore, score);
      }
      
      // Tristeza
      if (name.includes('frown') || (name.includes('mouth') && name.includes('down'))) {
        frownScore = Math.max(frownScore, score);
      }
      
      // Raiva
      if (name.includes('brow') && (name.includes('down') || name.includes('lower'))) {
        browDownScore = Math.max(browDownScore, score);
      }
      
      // Surpresa
      if (name.includes('eye') && name.includes('wide')) {
        eyeWideScore = Math.max(eyeWideScore, score);
      }
      
      if (name.includes('mouth') && name.includes('open')) {
        mouthOpenScore = Math.max(mouthOpenScore, score);
      }
      
      // Felicidade adicional
      if (name.includes('cheek') && name.includes('raise')) {
        cheekRaiseScore = Math.max(cheekRaiseScore, score);
      }
    }

    // Combinar scores
    const totalSmileScore = smileScore + (cheekRaiseScore * 0.7);
    const totalSurpriseScore = eyeWideScore + (mouthOpenScore * 0.4);

    // Thresholds mais altos para maior estabilidade
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.4;

    if (totalSmileScore > 0.08) {
      emotion = 'feliz';
      confidence = Math.min(totalSmileScore * 6, 0.95);
      
    } else if (frownScore > 0.06) {
      emotion = 'triste';
      confidence = Math.min(frownScore * 8, 0.9);
      
    } else if (browDownScore > 0.05) {
      emotion = 'raiva';
      confidence = Math.min(browDownScore * 7, 0.85);
      
    } else if (totalSurpriseScore > 0.08) {
      emotion = 'surpreso';
      confidence = Math.min(totalSurpriseScore * 5, 0.8);
      
    } else if (totalSmileScore < 0.02 && frownScore < 0.02 && eyeWideScore < 0.02) {
      emotion = 'cansado';
      confidence = 0.5;
    }

    // Sistema de estabilização com histórico
    emotionHistoryRef.current.push(emotion);
    confidenceHistoryRef.current.push(confidence);
    
    // Manter apenas os últimos 8 frames
    if (emotionHistoryRef.current.length > 8) {
      emotionHistoryRef.current.shift();
      confidenceHistoryRef.current.shift();
    }

    // Calcular emoção mais frequente nos últimos frames
    const emotionCounts: Record<MediaPipeEmotion, number> = {
      'feliz': 0, 'triste': 0, 'raiva': 0, 'surpreso': 0, 'neutro': 0, 'cansado': 0
    };

    emotionHistoryRef.current.forEach(em => {
      emotionCounts[em]++;
    });

    // Encontrar emoção mais frequente
    let mostFrequentEmotion: MediaPipeEmotion = 'neutro';
    let maxCount = 0;
    
    Object.entries(emotionCounts).forEach(([em, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentEmotion = em as MediaPipeEmotion;
      }
    });

    // Só mudar se a nova emoção aparecer pelo menos 4 vezes nos últimos 8 frames
    // ou se for diferente de neutro e aparecer pelo menos 3 vezes
    const requiredCount = mostFrequentEmotion === 'neutro' ? 4 : 3;
    
    if (maxCount >= requiredCount) {
      // Calcular confiança média para esta emoção
      const avgConfidence = confidenceHistoryRef.current
        .filter((_, idx) => emotionHistoryRef.current[idx] === mostFrequentEmotion)
        .reduce((sum, conf) => sum + conf, 0) / maxCount;
      
      return { emotion: mostFrequentEmotion, confidence: avgConfidence };
    } else {
      // Manter emoção atual se não há consenso suficiente
      return { emotion: currentEmotion || 'neutro', confidence };
    }
  }, [currentEmotion]);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoElementRef.current || !isProcessingRef.current) {
      return;
    }

    const now = performance.now();
    
    // Processar a cada 600ms para maior estabilidade
    if (now - lastProcessTimeRef.current < 600) {
      return;
    }

    const video = videoElementRef.current;

    try {
      lastProcessTimeRef.current = now;
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        // Só atualizar se há mudança significativa e confiança adequada
        if (emotion !== currentEmotion && conf > 0.4) {
          console.log(`🎭 Emoção estabilizada: ${currentEmotion} → ${emotion} (${(conf * 100).toFixed(1)}%)`);
          setCurrentEmotion(emotion);
          setConfidence(conf);
          
          if (onEmotionChange) {
            onEmotionChange(emotion);
          }
        } else if (emotion === currentEmotion) {
          // Atualizar confiança se for a mesma emoção
          setConfidence(conf);
        }
      }
      
    } catch (err) {
      console.warn('MediaPipe frame skip');
    }
  }, [analyzeEmotionFromBlendshapes, onEmotionChange, currentEmotion]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceLandmarkerRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo não carregado');
      return;
    }

    console.log('🚀 Iniciando MediaPipe ESTÁVEL (1.5 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    emotionCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // Limpar histórico
    emotionHistoryRef.current = [];
    confidenceHistoryRef.current = [];
    
    // 1.5 FPS para estabilidade
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        processFrame();
      }
    }, 666); // 666ms ≈ 1.5 FPS
    
    console.log('✅ Detecção ESTÁVEL iniciada');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe');
    
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    videoElementRef.current = null;
    emotionCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // Limpar histórico
    emotionHistoryRef.current = [];
    confidenceHistoryRef.current = [];
    
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
