import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useEmotionDetection, EmotionModel, DetectedEmotion } from '@/hooks/useEmotionDetection';
import { Camera, CameraOff, Eye, AlertCircle, Play, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface FaceDetectionProps {
  onEmotionDetected: (emotion: DetectedEmotion) => void;
  isVisible: boolean;
}

const FaceDetection = ({ onEmotionDetected, isVisible }: FaceDetectionProps) => {
  const { videoRef, isActive, error: webcamError, startWebcam, stopWebcam } = useWebcam();
  const { 
    currentModel,
    isModelLoaded, 
    currentEmotion, 
    confidence, 
    isDetecting, 
    error: detectionError,
    isSimulated,
    switchModel,
    loadModels, 
    startDetection, 
    stopDetection
  } = useEmotionDetection(onEmotionDetected);
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Memoizar dados dos modelos para evitar re-renders
  const availableModels = useMemo(() => [
    {
      id: 'mediapipe' as EmotionModel,
      name: 'MediaPipe',
      description: 'Google MediaPipe - Ultra-otimizado 1 FPS',
      status: '🤖 Real'
    },
    {
      id: 'tensorflow' as EmotionModel,
      name: 'TensorFlow.js',
      description: 'TensorFlow.js com modelos customizados',
      status: '🧠 Real'
    },
    {
      id: 'simulated' as EmotionModel,
      name: 'Simulado',
      description: 'Modo demo com emoções simuladas',
      status: '🎭 Demo'
    }
  ], []);

  // Carregar modelo inicial apenas uma vez quando visível
  useEffect(() => {
    if (isVisible && !isModelLoaded) {
      console.log('🔄 FaceDetection: Carregando modelo inicial...');
      loadModels();
    }
  }, [isVisible, isModelLoaded, loadModels]);

  const handleToggleDetection = useCallback(async () => {
    if (!isEnabled) {
      try {
        console.log('🚀 FaceDetection: Ativando detecção otimizada...');
        setIsEnabled(true);
        
        await startWebcam();
        
        if (!isModelLoaded) {
          await loadModels();
        }
        
        toast.success('Detecção ativada! Performance otimizada', { duration: 2000 });
      } catch (err) {
        console.error('💥 Erro ao ativar detecção:', err);
        toast.error('Erro ao ativar detecção');
        setIsEnabled(false);
      }
    } else {
      console.log('🛑 FaceDetection: Desativando detecção...');
      stopWebcam();
      stopDetection();
      setIsEnabled(false);
      toast.info('Detecção desativada');
    }
  }, [isEnabled, startWebcam, loadModels, isModelLoaded, stopWebcam, stopDetection]);

  // Memoizar cores e emojis
  const emotionDisplay = useMemo(() => {
    const getEmotionColor = (emotion: DetectedEmotion | null) => {
      switch (emotion) {
        case 'feliz': return 'text-yellow-400';
        case 'triste': return 'text-blue-400';
        case 'raiva': return 'text-red-400';
        case 'surpreso': return 'text-purple-400';
        case 'cansado': return 'text-gray-400';
        default: return 'text-green-400';
      }
    };

    const getEmotionEmoji = (emotion: DetectedEmotion | null) => {
      switch (emotion) {
        case 'feliz': return '😊';
        case 'triste': return '😢';
        case 'raiva': return '😠';
        case 'surpreso': return '😲';
        case 'cansado': return '😴';
        default: return '😐';
      }
    };

    return {
      color: getEmotionColor(currentEmotion),
      emoji: getEmotionEmoji(currentEmotion)
    };
  }, [currentEmotion]);

  // Auto-iniciar detecção estável
  useEffect(() => {    
    if (isActive && videoRef.current && isModelLoaded && !isDetecting && isEnabled) {
      console.log('🎬 FaceDetection: Auto-iniciando detecção ESTÁVEL...');
      
      const video = videoRef.current;
      
      // Delay para estabilização
      setTimeout(() => {
        if (videoRef.current && isActive && isModelLoaded && video.readyState >= 2 && video.videoWidth > 0) {
          console.log('✅ FaceDetection: Iniciando detecção ESTÁVEL...');
          startDetection(videoRef.current);
          toast.success(`${currentModel} ESTÁVEL iniciado! 1.5 FPS`, {
            duration: 1500
          });
        }
      }, 500);
    }
  }, [isActive, isModelLoaded, isEnabled, currentModel, startDetection, isDetecting]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed top-20 right-4 z-30 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-lg p-4 space-y-3"
        style={{ width: '300px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium text-sm">
              Detecção Estável
            </span>
            {!isSimulated && <Play className="w-3 h-3 text-green-400" />}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={() => setShowModelSelector(!showModelSelector)}
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300"
              title="Escolher modelo de IA"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleToggleDetection}
              variant="ghost"
              size="sm"
              className={`${isEnabled ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
            >
              {isEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Seletor de Modelos Simplificado */}
        {showModelSelector && (
          <div className="bg-slate-700/50 rounded-lg p-2 space-y-1">
            <div className="text-cyan-400 text-xs font-medium mb-1">
              🤖 Modelos:
            </div>
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                  currentModel === model.id 
                    ? 'bg-purple-600/30 border border-purple-500/50' 
                    : 'bg-slate-600/30 hover:bg-slate-600/50'
                }`}
                onClick={() => {
                  switchModel(model.id);
                  setShowModelSelector(false);
                  toast.info(`Modelo: ${model.name}`, { duration: 1500 });
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{model.name}</span>
                  <span className="text-xs">{model.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Simplificado */}
        <div className="space-y-2">
          {/* Status do modelo compacto */}
          {currentModel === 'mediapipe' ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-2">
              <div className="text-green-400 text-sm font-medium">
                🤖 MediaPipe Estável (1.5 FPS)
              </div>
            </div>
          ) : currentModel === 'tensorflow' ? (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-2">
              <div className="text-blue-400 text-sm font-medium">
                🧠 TensorFlow.js Ativo
              </div>
            </div>
          ) : currentModel === 'simulated' ? (
            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-2">
              <div className="text-orange-400 text-sm font-medium">
                🎭 Modo Demo
              </div>
            </div>
          ) : null}

          {/* Status de carregamento compacto */}
          {isEnabled && !isModelLoaded && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 text-xs">Carregando...</span>
            </div>
          )}

          {/* Erros compactos */}
          {(webcamError || detectionError) && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2">
              <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{webcamError || detectionError}</span>
              </div>
            </div>
          )}

          {/* Emoção detectada compacta */}
          {isEnabled && isActive && (
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">
                  {isSimulated ? 'Demo:' : 'Estável:'}
                </span>
                <span className="text-lg">{emotionDisplay.emoji}</span>
              </div>
              
              {currentEmotion ? (
                <>
                  <div className={`font-medium text-sm ${emotionDisplay.color}`}>
                    {currentEmotion}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(confidence * 100)}% conf
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">
                  {isDetecting ? 'Aguardando expressão...' : 'Inativo'}
                </div>
              )}
              
              {/* Indicador de estabilidade */}
              {currentModel === 'mediapipe' && isDetecting && (
                <div className="text-xs text-blue-400 mt-1">
                  🎯 Modo Estável Ativo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vídeo compacto */}
        {isEnabled && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-24 bg-black rounded-lg object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {isDetecting && (
              <div className="absolute top-1 left-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
            
            {!isActive && isEnabled && !webcamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 text-center">
          🎯 Estável (1.5 FPS) - Mantenha a expressão por alguns segundos
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceDetection;
