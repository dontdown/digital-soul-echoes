
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
  
  // Sistema de detecção mais agressivo
  const lastEmotionRef = useRef<MediaPipeEmotion>('neutro');
  const emotionCountRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando MediaPipe sensível...');
      
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
    
    // Scores para diferentes emoções - thresholds muito baixos
    let smileScore = 0;
    let frownScore = 0;
    let browDownScore = 0;
    let eyeWideScore = 0;
    let mouthOpenScore = 0;
    let cheekRaiseScore = 0;

    // Analisar TODOS os blendshapes disponíveis
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const name = shape.categoryName.toLowerCase();
      const score = shape.score;
      
      // Debug: imprimir os blendshapes mais altos
      if (score > 0.05) {
        console.log(`Blendshape ${name}: ${score.toFixed(3)}`);
      }
      
      // Sorriso - capturar mais variações
      if (name.includes('smile') || name.includes('cheek') && name.includes('squint')) {
        smileScore = Math.max(smileScore, score);
      }
      
      // Tristeza - mais sensível
      if (name.includes('frown') || name.includes('sad') || name.includes('mouth') && name.includes('down')) {
        frownScore = Math.max(frownScore, score);
      }
      
      // Raiva - sobrancelha franzida
      if (name.includes('brow') && (name.includes('down') || name.includes('lower'))) {
        browDownScore = Math.max(browDownScore, score);
      }
      
      // Surpresa - olhos arregalados e boca aberta
      if (name.includes('eye') && name.includes('wide')) {
        eyeWideScore = Math.max(eyeWideScore, score);
      }
      
      if (name.includes('mouth') && name.includes('open')) {
        mouthOpenScore = Math.max(mouthOpenScore, score);
      }
      
      // Felicidade adicional - bochechas levantadas
      if (name.includes('cheek') && name.includes('raise')) {
        cheekRaiseScore = Math.max(cheekRaiseScore, score);
      }
    }

    // Combinar scores relacionados
    const totalSmileScore = smileScore + (cheekRaiseScore * 0.5);
    const totalSurpriseScore = eyeWideScore + (mouthOpenScore * 0.3);

    // Thresholds MUITO baixos e sensíveis
    let emotion: MediaPipeEmotion = 'neutro';
    let confidence = 0.4;

    // Priorizar detecção de emoções não-neutras
    if (totalSmileScore > 0.03) { // Extremamente baixo
      emotion = 'feliz';
      confidence = Math.min(totalSmileScore * 8, 0.95);
      console.log(`😊 FELIZ detectado! Score: ${totalSmileScore.toFixed(3)}`);
      
    } else if (frownScore > 0.02) { // Muito baixo
      emotion = 'triste';
      confidence = Math.min(frownScore * 10, 0.9);
      console.log(`😢 TRISTE detectado! Score: ${frownScore.toFixed(3)}`);
      
    } else if (browDownScore > 0.02) {
      emotion = 'raiva';
      confidence = Math.min(browDownScore * 8, 0.85);
      console.log(`😠 RAIVA detectado! Score: ${browDownScore.toFixed(3)}`);
      
    } else if (totalSurpriseScore > 0.03) {
      emotion = 'surpreso';
      confidence = Math.min(totalSurpriseScore * 6, 0.8);
      console.log(`😲 SURPRESO detectado! Score: ${totalSurpriseScore.toFixed(3)}`);
      
    } else {
      // Tentar detectar cansaço por falta de expressão
      if (smileScore < 0.01 && frownScore < 0.01 && eyeWideScore < 0.01) {
        emotion = 'cansado';
        confidence = 0.5;
        console.log(`😴 CANSADO detectado por baixa expressividade`);
      }
    }

    // Sistema de estabilização MÍNIMO - aceitar mudanças rapidamente
    if (emotion !== lastEmotionRef.current) {
      emotionCountRef.current = 0;
      lastEmotionRef.current = emotion;
    } else {
      emotionCountRef.current++;
    }

    // Só precisa de 1 frame consistente para não-neutro, 3 para neutro
    const requiredFrames = emotion === 'neutro' ? 3 : 1;
    
    if (emotionCountRef.current >= requiredFrames) {
      return { emotion, confidence };
    } else {
      // Se não temos frames suficientes, manter emoção anterior se não for neutro
      const fallback = currentEmotion && currentEmotion !== 'neutro' ? currentEmotion : emotion;
      return { emotion: fallback, confidence };
    }
  }, [currentEmotion]);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoElementRef.current || !isProcessingRef.current) {
      return;
    }

    const now = performance.now();
    
    // Processar mais frequentemente - 300ms
    if (now - lastProcessTimeRef.current < 300) {
      return;
    }

    const video = videoElementRef.current;

    try {
      lastProcessTimeRef.current = now;
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {        
        const { emotion, confidence: conf } = analyzeEmotionFromBlendshapes(results.faceBlendshapes);
        
        // Aceitar mudanças com confiança muito baixa
        if (emotion !== currentEmotion && conf > 0.1) {
          console.log(`🎭 Mudança de emoção: ${currentEmotion} → ${emotion} (${(conf * 100).toFixed(1)}%)`);
          setCurrentEmotion(emotion);
          setConfidence(conf);
          
          if (onEmotionChange) {
            onEmotionChange(emotion);
          }
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

    console.log('🚀 Iniciando MediaPipe ULTRA SENSÍVEL (3 FPS)');

    videoElementRef.current = videoElement;
    setIsDetecting(true);
    isProcessingRef.current = true;
    emotionCountRef.current = 0;
    lastProcessTimeRef.current = 0;
    
    // 3 FPS para mais responsividade
    processingIntervalRef.current = window.setInterval(() => {
      if (isProcessingRef.current && videoElement.readyState >= 2) {
        // Processar imediatamente sem setTimeout
        processFrame();
      }
    }, 333); // 333ms = 3 FPS
    
    console.log('✅ Detecção SENSÍVEL iniciada');
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Parando MediaPipe');
    
    isProcessingRef.current = false;
    setIsDetecting(false);
    setCurrentEmotion(null);
    videoElementRef.current = null;
    emotionCountRef.current = 0;
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
