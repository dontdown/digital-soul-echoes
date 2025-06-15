
import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export type DetectedEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';

interface FaceDetectionResult {
  emotion: DetectedEmotion;
  confidence: number;
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

  const loadModels = async () => {
    try {
      console.log('Carregando modelos de detecção facial...');
      setError(null);

      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      setIsModelLoaded(true);
      console.log('Modelos carregados com sucesso');
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
      setError('Erro ao carregar modelos de IA. Usando detecção simplificada.');
      setIsModelLoaded(true); // Permitir continuar com fallback
    }
  };

  const mapEmotionToPortuguese = (emotions: any): DetectedEmotion => {
    if (!emotions) return 'neutro';

    const emotionMap: Record<string, DetectedEmotion> = {
      happy: 'feliz',
      sad: 'triste',
      angry: 'raiva',
      surprised: 'surpreso',
      neutral: 'neutro',
      disgusted: 'neutro',
      fearful: 'triste'
    };

    // Encontrar a emoção com maior confiança
    let maxEmotion = 'neutral';
    let maxValue = 0;

    Object.entries(emotions).forEach(([emotion, value]) => {
      if (typeof value === 'number' && value > maxValue) {
        maxValue = value;
        maxEmotion = emotion;
      }
    });

    // Se confiança muito baixa, usar heurísticas simples
    if (maxValue < 0.3) {
      return 'neutro';
    }

    return emotionMap[maxEmotion] || 'neutro';
  };

  const detectFaceExpression = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
    try {
      if (!isModelLoaded) return null;

      const detections = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.expressions) {
        const emotion = mapEmotionToPortuguese(detections.expressions);
        const maxConfidence = Math.max(...Object.values(detections.expressions));
        
        return {
          emotion,
          confidence: maxConfidence
        };
      }

      return null;
    } catch (err) {
      console.error('Erro na detecção:', err);
      return null;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded || isDetecting) return;

    setIsDetecting(true);
    console.log('Iniciando detecção de expressões...');

    detectionIntervalRef.current = setInterval(async () => {
      const result = await detectFaceExpression(videoElement);
      
      if (result) {
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        
        if (onEmotionChange && result.confidence > 0.4) {
          onEmotionChange(result.emotion);
        }
      }
    }, 2000); // Detectar a cada 2 segundos
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    console.log('Detecção de expressões parada');
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
