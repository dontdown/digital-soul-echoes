import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useEmotionDetection, EmotionModel, DetectedEmotion } from '@/hooks/useEmotionDetection';
import { Camera, CameraOff, Eye, AlertCircle, Zap, Play, Settings } from 'lucide-react';
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

  useEffect(() => {
    if (isVisible) {
      loadModels();
    }
  }, [isVisible, loadModels]);

  const handleToggleDetection = async () => {
    if (!isEnabled) {
      try {
        console.log('🚀 Ativando câmera...');
        setIsEnabled(true);
        await startWebcam();
        toast.success('Câmera ativada!');
      } catch (err) {
        console.error('💥 Erro:', err);
        toast.error('Erro ao ativar câmera');
        setIsEnabled(false);
      }
    } else {
      console.log('🛑 Desativando câmera...');
      stopWebcam();
      stopDetection();
      setIsEnabled(false);
      toast.info('Câmera desativada');
    }
  };

  const availableModels: { id: EmotionModel; name: string; description: string; status: string }[] = [
    {
      id: 'mediapipe',
      name: 'MediaPipe',
      description: 'Google MediaPipe - Detecção facial avançada',
      status: '✅ Implementado'
    },
    {
      id: 'tensorflow',
      name: 'TensorFlow.js',
      description: 'TensorFlow.js com modelos customizados',
      status: '✅ Implementado'
    },
    {
      id: 'opencv',
      name: 'OpenCV.js',
      description: 'OpenCV.js para visão computacional',
      status: '🔧 Implementar'
    },
    {
      id: 'simulated',
      name: 'Simulado',
      description: 'Modo demo com emoções simuladas',
      status: '✅ Ativo'
    }
  ];

  // Auto-iniciar detecção quando câmera estiver ativa
  useEffect(() => {
    if (isActive && videoRef.current && isModelLoaded && !isDetecting && isEnabled) {
      console.log('🔄 Iniciando detecção...');
      setTimeout(() => {
        if (videoRef.current && isActive) {
          startDetection(videoRef.current);
          toast.success(`Detecção ${currentModel} ativa!`);
        }
      }, 1000);
    }
  }, [isActive, isModelLoaded, isDetecting, isEnabled, currentModel, startDetection]);

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

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed top-20 right-4 z-30 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-lg p-4 space-y-3"
        style={{ width: '320px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium">
              Detecção de Emoção
            </span>
            <Play className="w-3 h-3 text-orange-400" />
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

        {/* Seletor de Modelos */}
        {showModelSelector && (
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
            <div className="text-cyan-400 text-sm font-medium mb-2">
              📋 Modelos Disponíveis:
            </div>
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  currentModel === model.id 
                    ? 'bg-purple-600/30 border border-purple-500/50' 
                    : 'bg-slate-600/30 hover:bg-slate-600/50'
                }`}
                onClick={() => {
                  switchModel(model.id);
                  setShowModelSelector(false);
                  toast.info(`Modelo alterado para: ${model.name}`);
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">{model.name}</span>
                  <span className="text-xs">{model.status}</span>
                </div>
                <div className="text-gray-300 text-xs mt-1">{model.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          {/* Status do modelo */}
          {currentModel === 'mediapipe' ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3">
              <div className="text-green-400 text-sm font-medium">
                🤖 MediaPipe Ativo
              </div>
              <div className="text-green-300 text-xs mt-1">
                Detecção de emoções em tempo real usando IA do Google
              </div>
            </div>
          ) : currentModel === 'tensorflow' ? (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3">
              <div className="text-blue-400 text-sm font-medium">
                🧠 TensorFlow.js Ativo
              </div>
              <div className="text-blue-300 text-xs mt-1">
                Detecção de emoções usando modelos de deep learning
              </div>
            </div>
          ) : currentModel === 'simulated' ? (
            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-3">
              <div className="text-orange-400 text-sm font-medium">
                🎭 Modo Simulado Ativo
              </div>
              <div className="text-orange-300 text-xs mt-1">
                Escolha MediaPipe ou TensorFlow.js para detecção real
              </div>
            </div>
          ) : (
            <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-3">
              <div className="text-purple-400 text-sm font-medium">
                🔧 Modelo {currentModel}
              </div>
              <div className="text-purple-300 text-xs mt-1">
                Este modelo ainda precisa ser implementado
              </div>
            </div>
          )}

          {/* Status da câmera */}
          {isEnabled && (
            <div className="flex items-center space-x-2 text-sm">
              {isActive ? (
                <>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">Câmera funcionando</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400">Inicializando câmera...</span>
                </>
              )}
            </div>
          )}

          {/* Erro da webcam */}
          {webcamError && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2">
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-3 h-3" />
                <span>Erro:</span>
              </div>
              <div className="text-red-300 text-xs mt-1">{webcamError}</div>
            </div>
          )}

          {/* Emoção detectada */}
          {isEnabled && isActive && currentEmotion && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Emoção Demo:</span>
                <span className="text-xl">{getEmotionEmoji(currentEmotion)}</span>
              </div>
              <div className={`font-medium ${getEmotionColor(currentEmotion)}`}>
                {currentEmotion}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Confiança: {Math.round(confidence * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Vídeo */}
        {isEnabled && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-32 bg-black rounded-lg object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Indicador DEMO */}
            {isDetecting && (
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs bg-black/50 px-1 rounded">DEMO</span>
              </div>
            )}
            
            {/* Loading da câmera */}
            {!isActive && isEnabled && !webcamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <div className="text-white text-sm">Carregando câmera...</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 text-center">
          {currentModel === 'mediapipe' ? 
            '🤖 MediaPipe carregado - detecção real ativa!' : 
            currentModel === 'tensorflow' ?
            '🧠 TensorFlow.js carregado - modelo demo ativo!' :
            '🔧 Clique em ⚙️ para escolher um modelo de IA'
          }
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceDetection;
