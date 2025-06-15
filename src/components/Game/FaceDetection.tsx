import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useFaceDetection, DetectedEmotion } from '@/hooks/useFaceDetection';
import { Camera, CameraOff, Eye, AlertCircle, Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FaceDetectionProps {
  onEmotionDetected: (emotion: DetectedEmotion) => void;
  isVisible: boolean;
}

const FaceDetection = ({ onEmotionDetected, isVisible }: FaceDetectionProps) => {
  const { videoRef, isActive, error: webcamError, startWebcam, stopWebcam } = useWebcam();
  const { 
    isModelLoaded, 
    currentEmotion, 
    confidence, 
    isDetecting, 
    error: detectionError,
    loadModels, 
    startDetection, 
    stopDetection 
  } = useFaceDetection(onEmotionDetected);
  
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (isVisible) {
      console.log('🎭 Carregando modelos do face-api.js...');
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

  // Auto-iniciar detecção quando câmera estiver ativa
  useEffect(() => {
    if (isActive && videoRef.current && isModelLoaded && !isDetecting && isEnabled) {
      console.log('🔄 Iniciando detecção...');
      setTimeout(() => {
        if (videoRef.current && isActive) {
          startDetection(videoRef.current);
          toast.success('Detecção ativa!');
        }
      }, 1000);
    }
  }, [isActive, isModelLoaded, isDetecting, isEnabled, startDetection]);

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
        style={{ width: '300px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium">Face-API.js</span>
            <Zap className="w-3 h-3 text-yellow-400" />
          </div>
          <Button
            onClick={handleToggleDetection}
            variant="ghost"
            size="sm"
            className={`${isEnabled ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
          >
            {isEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </Button>
        </div>

        {/* Status */}
        <div className="space-y-2">
          {/* Status do modelo */}
          <div className="flex items-center space-x-2 text-sm">
            {isModelLoaded ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Face-API.js carregado</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">Carregando modelos IA...</span>
              </>
            )}
          </div>

          {/* Status da câmera */}
          {isEnabled && (
            <div className="flex items-center space-x-2 text-sm">
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
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
                <span className="text-gray-300 text-sm">Emoção AI:</span>
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
            
            {/* Indicador REC */}
            {isDetecting && (
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs bg-black/50 px-1 rounded">REC</span>
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
          🚀 Powered by Face-API.js - IA Real! 
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper functions
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

export default FaceDetection;
