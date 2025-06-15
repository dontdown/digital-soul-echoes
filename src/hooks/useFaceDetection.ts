
import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export type DetectedEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';

interface FaceDetectionResult {
  emotion: DetectedEmotion;
  confidence: number;
}

interface EmotionHistory {
  emotion: DetectedEmotion;
  confidence: number;
  timestamp: number;
}

interface UseFaceDetectionReturn {
  isModelLoaded: boolean;
  currentEmotion: DetectedEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  loadModels: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export const useFaceDetection = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseFaceDetectionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Histórico para suavização
  const emotionHistoryRef = useRef<EmotionHistory[]>([]);
  const lastEmotionChangeRef = useRef<number>(0);
  
  // Configurações de estabilidade
  const HISTORY_SIZE = 5;
  const MIN_CONFIDENCE_THRESHOLD = 0.6;
  const EMOTION_CHANGE_COOLDOWN = 3000; // 3 segundos
  const STABILITY_BONUS = 0.15;

  const loadModels = async () => {
    try {
      console.log('🤖 Carregando modelos do face-api.js...');
      setError(null);
      
      // Carregar modelos do face-api.js
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);

      setIsModelLoaded(true);
      console.log('✅ Modelos carregados com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao carregar modelos:', err);
      setError('Erro ao carregar modelos de IA. Usando detecção básica.');
      setIsModelLoaded(true); // Permitir uso mesmo com erro
    }
  };

  const mapFaceApiToEmotion = (expressions: faceapi.FaceExpressions): FaceDetectionResult => {
    // Mapear expressões do face-api.js para nossas emoções
    const emotionScores = {
      feliz: expressions.happy,
      triste: expressions.sad,
      raiva: expressions.angry,
      surpreso: expressions.surprised,
      neutro: expressions.neutral,
      cansado: expressions.disgusted // Aproximação
    };

    // Encontrar a emoção com maior confiança
    const [emotion, confidence] = Object.entries(emotionScores).reduce(
      (max, [key, value]) => value > max[1] ? [key as DetectedEmotion, value] : max,
      ['neutro' as DetectedEmotion, 0]
    );

    return { emotion, confidence };
  };

  const smoothEmotionDetection = (newResult: FaceDetectionResult): FaceDetectionResult | null => {
    const now = Date.now();
    
    // Adicionar ao histórico
    emotionHistoryRef.current.push({
      emotion: newResult.emotion,
      confidence: newResult.confidence,
      timestamp: now
    });
    
    // Manter apenas as últimas detecções
    if (emotionHistoryRef.current.length > HISTORY_SIZE) {
      emotionHistoryRef.current.shift();
    }
    
    // Calcular consenso das últimas detecções
    const recentHistory = emotionHistoryRef.current.slice(-3);
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    
    recentHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
      totalConfidence += entry.confidence;
    });
    
    // Encontrar emoção mais frequente
    const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    ) as DetectedEmotion;
    
    // Calcular confiança suavizada
    const avgConfidence = totalConfidence / recentHistory.length;
    
    // Aplicar bônus de estabilidade
    let finalConfidence = avgConfidence;
    const consistency = emotionCounts[mostFrequentEmotion] / recentHistory.length;
    if (consistency >= 0.6) {
      finalConfidence += STABILITY_BONUS * consistency;
      finalConfidence = Math.min(finalConfidence, 0.95);
    }
    
    // Verificar se deve aplicar mudança
    const timeSinceLastChange = now - lastEmotionChangeRef.current;
    const shouldChange = finalConfidence >= MIN_CONFIDENCE_THRESHOLD && 
                        (mostFrequentEmotion !== currentEmotion || 
                         timeSinceLastChange > EMOTION_CHANGE_COOLDOWN);
    
    if (shouldChange) {
      lastEmotionChangeRef.current = now;
      console.log(`🎭 Emoção detectada: ${mostFrequentEmotion} (${Math.round(finalConfidence * 100)}%)`);
      return { emotion: mostFrequentEmotion, confidence: finalConfidence };
    }
    
    return null;
  };

  const detectFaceExpression = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
    try {
      if (!isModelLoaded) return null;

      // Usar face-api.js para detectar expressões
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length === 0) {
        console.log('👤 Nenhuma face detectada');
        return null;
      }

      // Usar a primeira face detectada
      const expressions = detections[0].expressions;
      const rawResult = mapFaceApiToEmotion(expressions);
      
      // Aplicar suavização
      const smoothedResult = smoothEmotionDetection(rawResult);
      
      return smoothedResult || { emotion: currentEmotion || 'neutro', confidence };
    } catch (err) {
      console.error('❌ Erro na detecção:', err);
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    console.log('🔄 Iniciando detecção com face-api.js...');
    
    // Limpar histórico anterior
    emotionHistoryRef.current = [];
    lastEmotionChangeRef.current = 0;

    detectionIntervalRef.current = setInterval(async () => {
      const result = await detectFaceExpression(videoElement);
      
      if (result) {
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        
        if (onEmotionChange && result.confidence > MIN_CONFIDENCE_THRESHOLD) {
          onEmotionChange(result.emotion);
        }
      }
    }, 1500); // Detectar a cada 1.5 segundos
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setCurrentEmotion(null);
    emotionHistoryRef.current = [];
    console.log('⏹️ Detecção parada');
  };

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  return {
    isModelLoaded,
    currentEmotion,
    confidence,
    isDetecting,
    error,
    loadModels,
    startDetection,
    stopDetection
  };
};
