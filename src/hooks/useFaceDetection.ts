
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

  // Fallback: simulação básica quando modelos não carregam
  const [useFallback, setUseFallback] = useState(false);

  const loadModels = async () => {
    try {
      console.log('🤖 Tentando carregar modelos reais do face-api.js...');
      setError(null);
      setUseFallback(false);
      
      const MODEL_URL = '/models';
      
      // Verificar se os arquivos existem antes de tentar carregar
      const checkModel = async (url: string) => {
        try {
          const response = await fetch(`${MODEL_URL}/${url}`);
          if (!response.ok) {
            throw new Error(`Modelo não encontrado: ${url}`);
          }
          return response;
        } catch (err) {
          console.warn(`⚠️ Modelo não disponível: ${url}`);
          throw err;
        }
      };

      // Tentar carregar modelos
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);

      setIsModelLoaded(true);
      console.log('✅ Modelos reais carregados com sucesso!');
      
    } catch (err) {
      console.error('❌ Erro ao carregar modelos reais:', err);
      console.log('🔄 Ativando modo fallback...');
      
      setUseFallback(true);
      setIsModelLoaded(true);
      setError('Usando detecção simulada. Para precisão real, baixe os modelos.');
    }
  };

  const mapFaceApiToEmotion = (expressions: faceapi.FaceExpressions): FaceDetectionResult => {
    // Mapear expressões do face-api.js para nossas emoções
    const emotionScores: Record<DetectedEmotion, number> = {
      feliz: expressions.happy,
      triste: expressions.sad,
      raiva: expressions.angry,
      surpreso: expressions.surprised,
      neutro: expressions.neutral,
      cansado: expressions.disgusted // Aproximação
    };

    // Encontrar a emoção com maior confiança
    let bestEmotion: DetectedEmotion = 'neutro';
    let bestConfidence = 0;

    for (const [emotion, confidence] of Object.entries(emotionScores) as [DetectedEmotion, number][]) {
      if (confidence > bestConfidence) {
        bestEmotion = emotion;
        bestConfidence = confidence;
      }
    }

    return { emotion: bestEmotion, confidence: bestConfidence };
  };

  // Simulação básica para fallback
  const simulateEmotionDetection = (): FaceDetectionResult => {
    const emotions: DetectedEmotion[] = ['feliz', 'neutro', 'triste', 'surpreso', 'cansado', 'raiva'];
    const weights = [0.3, 0.25, 0.15, 0.1, 0.1, 0.1]; // Mais provável ser feliz ou neutro
    
    let random = Math.random();
    let selectedEmotion: DetectedEmotion = 'neutro';
    
    for (let i = 0; i < emotions.length; i++) {
      if (random < weights[i]) {
        selectedEmotion = emotions[i];
        break;
      }
      random -= weights[i];
    }
    
    // Simular confiança variável
    const confidence = 0.5 + Math.random() * 0.4; // Entre 50% e 90%
    
    return { emotion: selectedEmotion, confidence };
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
      const mode = useFallback ? 'SIMULADO' : 'REAL';
      console.log(`🎭 Emoção detectada (${mode}): ${mostFrequentEmotion} (${Math.round(finalConfidence * 100)}%)`);
      return { emotion: mostFrequentEmotion, confidence: finalConfidence };
    }
    
    return null;
  };

  const detectFaceExpression = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
    try {
      if (!isModelLoaded) return null;

      // Se usando fallback, simular detecção
      if (useFallback) {
        const rawResult = simulateEmotionDetection();
        const smoothedResult = smoothEmotionDetection(rawResult);
        return smoothedResult || { emotion: currentEmotion || 'neutro', confidence };
      }

      // Usar face-api.js real para detectar expressões
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
      
      // Em caso de erro, usar fallback
      if (!useFallback) {
        console.log('🔄 Mudando para modo fallback devido a erro');
        setUseFallback(true);
        setError('Erro na IA real. Usando simulação.');
      }
      
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    const mode = useFallback ? 'simulado' : 'real';
    console.log(`🔄 Iniciando detecção ${mode}...`);
    
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
