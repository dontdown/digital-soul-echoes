import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { useModelDownloader, createModelURLs } from './useModelDownloader';

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
  isSimulated: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  needsDownload: boolean;
  loadModels: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
  downloadModels: () => Promise<void>;
}

// Global flags
let isLoadingModels = false;
let globalModelsLoaded = false;
let globalIsSimulated = false;
let globalModelURLs: Record<string, string> = {};

export const useFaceDetection = (onEmotionChange?: (emotion: DetectedEmotion) => void): UseFaceDetectionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(globalModelsLoaded);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(globalIsSimulated);
  const [needsDownload, setNeedsDownload] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isDownloading, downloadProgress, downloadModels: downloadModelFiles, checkModelsIntegrity } = useModelDownloader();
  
  // Histórico para suavização
  const emotionHistoryRef = useRef<EmotionHistory[]>([]);
  const lastEmotionChangeRef = useRef<number>(0);
  
  // Configurações de estabilidade
  const HISTORY_SIZE = 5;
  const MIN_CONFIDENCE_THRESHOLD = 0.6;
  const EMOTION_CHANGE_COOLDOWN = 3000; // 3 segundos
  const STABILITY_BONUS = 0.15;

  const downloadModels = async () => {
    const success = await downloadModelFiles();
    if (success) {
      setNeedsDownload(false);
      // Tentar carregar os modelos novamente
      await loadModels();
    }
  };

  const loadModels = async () => {
    if (globalModelsLoaded) {
      setIsModelLoaded(true);
      setIsSimulated(globalIsSimulated);
      setNeedsDownload(false);
      return;
    }

    if (isLoadingModels) return;
    isLoadingModels = true;
    
    try {
      console.log('🤖 Verificando modelos salvos...');
      setError(null);
      setIsSimulated(false);
      setNeedsDownload(false);
      
      // Primeiro verificar se temos modelos salvos válidos
      const hasValidModels = await checkModelsIntegrity();
      
      if (!hasValidModels) {
        console.log('❌ Modelos não encontrados ou corrompidos');
        setNeedsDownload(true);
        throw new Error('Modelos precisam ser baixados');
      }
      
      // Criar URLs dos modelos salvos
      console.log('🔧 Criando URLs dos modelos...');
      globalModelURLs = await createModelURLs();
      
      // Criar um servidor local temporário para os modelos
      const modelBaseURL = 'blob:';
      
      // Carregar modelos um por vez
      console.log('📥 Carregando TinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.load(globalModelURLs['tiny_face_detector_model-weights_manifest.json']);
      console.log('✅ TinyFaceDetector carregado');

      console.log('📥 Carregando FaceExpressionNet...');
      await faceapi.nets.faceExpressionNet.load(globalModelURLs['face_expression_model-weights_manifest.json']);
      console.log('✅ FaceExpressionNet carregado');

      console.log('📥 Carregando FaceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.load(globalModelURLs['face_landmark_68_model-weights_manifest.json']);
      console.log('✅ FaceLandmark68Net carregado');

      globalModelsLoaded = true;
      globalIsSimulated = false;
      setIsModelLoaded(true);
      setIsSimulated(false);
      setNeedsDownload(false);
      console.log('🎉 Todos os modelos reais carregados com sucesso!');
      
    } catch (err: any) {
      console.log('⚠️ Erro ao carregar modelos reais:', err);
      
      if (err.message.includes('baixados')) {
        console.log('📦 Modelos precisam ser baixados');
        setNeedsDownload(true);
        setError('Modelos precisam ser baixados pela primeira vez');
      } else {
        console.log('🔄 Ativando modo simulado como fallback...');
        globalModelsLoaded = true;
        globalIsSimulated = true;
        setIsModelLoaded(true);
        setIsSimulated(true);
        setError(`Usando simulação: ${err.message}`);
      }
    } finally {
      isLoadingModels = false;
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

  const generateSimulatedEmotion = (): FaceDetectionResult => {
    const emotions: DetectedEmotion[] = ['feliz', 'triste', 'raiva', 'surpreso', 'neutro', 'cansado'];
    const weights = [0.3, 0.1, 0.05, 0.15, 0.35, 0.05]; // neutro e feliz mais prováveis
    
    let random = Math.random();
    for (let i = 0; i < emotions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return {
          emotion: emotions[i],
          confidence: 0.7 + Math.random() * 0.25 // 70-95%
        };
      }
    }
    
    return { emotion: 'neutro', confidence: 0.8 };
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
      console.log(`🎭 Emoção detectada (${isSimulated ? 'SIMULADO' : 'REAL'}): ${mostFrequentEmotion} (${Math.round(finalConfidence * 100)}%)`);
      return { emotion: mostFrequentEmotion, confidence: finalConfidence };
    }
    
    return null;
  };

  const detectFaceExpression = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
    try {
      if (!isModelLoaded) return null;

      let rawResult: FaceDetectionResult;

      if (isSimulated) {
        // Modo simulado
        rawResult = generateSimulatedEmotion();
      } else {
        // Usar face-api.js real
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length === 0) {
          console.log('👤 Nenhuma face detectada');
          return null;
        }

        // Usar a primeira face detectada
        const expressions = detections[0].expressions;
        rawResult = mapFaceApiToEmotion(expressions);
      }
      
      // Aplicar suavização
      const smoothedResult = smoothEmotionDetection(rawResult);
      
      return smoothedResult || { emotion: currentEmotion || 'neutro', confidence };
    } catch (err) {
      console.error('❌ Erro na detecção:', err);
      setError('Erro durante a detecção facial');
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    console.log(`🔄 Iniciando detecção ${isSimulated ? 'simulada' : 'real'}...`);
    
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
      // Limpar URLs quando componente for desmontado
      Object.values(globalModelURLs).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return {
    isModelLoaded,
    currentEmotion,
    confidence,
    isDetecting,
    error,
    isSimulated,
    isDownloading,
    downloadProgress,
    needsDownload,
    loadModels,
    startDetection,
    stopDetection,
    downloadModels
  };
};
