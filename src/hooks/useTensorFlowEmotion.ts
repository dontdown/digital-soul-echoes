
import { useState, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

export type TensorFlowEmotion = 'feliz' | 'triste' | 'raiva' | 'surpreso' | 'neutro' | 'cansado';

interface UseTensorFlowEmotionReturn {
  isModelLoaded: boolean;
  currentEmotion: TensorFlowEmotion | null;
  confidence: number;
  isDetecting: boolean;
  error: string | null;
  loadModel: () => Promise<void>;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export const useTensorFlowEmotion = (onEmotionChange?: (emotion: TensorFlowEmotion) => void): UseTensorFlowEmotionReturn => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<TensorFlowEmotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modelRef = useRef<tf.LayersModel | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setIsModelLoaded(false);
      
      console.log('🤖 Carregando TensorFlow.js...');
      
      // Carregar TensorFlow.js
      await tf.ready();
      console.log('✅ TensorFlow.js pronto!');
      
      // Por enquanto, vamos simular o carregamento de um modelo
      // Em uma implementação real, você carregaria um modelo treinado
      console.log('📦 Simulando carregamento de modelo de emoções...');
      
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar um modelo mock para demonstração
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [128], units: 64, activation: 'relu' }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 6, activation: 'softmax' }) // 6 emoções
        ]
      });
      
      modelRef.current = model;
      setIsModelLoaded(true);
      console.log('✅ Modelo TensorFlow.js carregado com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar TensorFlow.js:', err);
      setError(`Erro ao carregar TensorFlow.js: ${err.message}`);
      setIsModelLoaded(false);
    }
  }, []);

  const extractFeaturesFromVideo = useCallback((videoElement: HTMLVideoElement): tf.Tensor => {
    // Criar canvas para capturar frame do vídeo
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Redimensionar para 48x48 (tamanho comum para modelos de emoção)
    canvas.width = 48;
    canvas.height = 48;
    
    // Desenhar frame do vídeo no canvas
    ctx.drawImage(videoElement, 0, 0, 48, 48);
    
    // Converter para tensor
    const imageData = ctx.getImageData(0, 0, 48, 48);
    const tensor = tf.browser.fromPixels(imageData, 1) // Grayscale
      .div(255.0) // Normalizar
      .expandDims(0); // Adicionar batch dimension
    
    // Simular extração de features (128 features)
    // Em uma implementação real, isso seria feito por um modelo pré-treinado
    const features = tf.randomNormal([1, 128]);
    
    tensor.dispose(); // Limpar memória
    return features;
  }, []);

  const predictEmotion = useCallback((features: tf.Tensor): { emotion: TensorFlowEmotion; confidence: number } => {
    if (!modelRef.current) {
      return { emotion: 'neutro', confidence: 0.5 };
    }

    try {
      // Fazer predição (simulada)
      const prediction = modelRef.current.predict(features) as tf.Tensor;
      const probabilities = Array.from(prediction.dataSync());
      
      // Mapear índices para emoções
      const emotions: TensorFlowEmotion[] = ['feliz', 'triste', 'raiva', 'surpreso', 'neutro', 'cansado'];
      
      // Encontrar emoção com maior probabilidade
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const emotion = emotions[maxIndex];
      const confidence = probabilities[maxIndex];
      
      prediction.dispose(); // Limpar memória
      features.dispose(); // Limpar memória
      
      return { emotion, confidence };
      
    } catch (err) {
      console.error('❌ Erro na predição:', err);
      features.dispose(); // Limpar memória em caso de erro
      return { emotion: 'neutro', confidence: 0.5 };
    }
  }, []);

  const processFrame = useCallback((videoElement: HTMLVideoElement) => {
    if (!modelRef.current || !isDetecting) return;

    try {
      // Extrair features do frame
      const features = extractFeaturesFromVideo(videoElement);
      
      // Fazer predição
      const { emotion, confidence: conf } = predictEmotion(features);
      
      setCurrentEmotion(emotion);
      setConfidence(conf);
      
      if (onEmotionChange) {
        onEmotionChange(emotion);
      }
      
      console.log(`🧠 TensorFlow.js detectou: ${emotion} (${Math.round(conf * 100)}%)`);
      
    } catch (err) {
      console.error('❌ Erro no processamento TensorFlow.js:', err);
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(videoElement));
    }
  }, [isDetecting, extractFeaturesFromVideo, predictEmotion, onEmotionChange]);

  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!modelRef.current || !isModelLoaded) {
      console.warn('⚠️ Modelo TensorFlow.js não carregado');
      return;
    }

    setIsDetecting(true);
    console.log('🎬 Iniciando detecção TensorFlow.js...');
    
    processFrame(videoElement);
  }, [isModelLoaded, processFrame]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentEmotion(null);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    console.log('⏹️ Detecção TensorFlow.js parada');
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
