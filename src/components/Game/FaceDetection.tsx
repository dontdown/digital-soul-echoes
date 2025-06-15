
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useFaceDetection, DetectedEmotion } from '@/hooks/useFaceDetection';
import { Camera, CameraOff, Eye, AlertCircle, Zap } from 'lucide-react';
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
      loadModels();
    }
  }, [isVisible]);

  const handleToggleDetection = async () => {
    if (!isEnabled) {
      try {
        await startWebcam();
        setIsEnabled(true);
        toast.success('Detecção facial ativada! (Modo simplificado)');
        
        // Aguardar um pouco para o vídeo carregar
        setTimeout(() => {
          if (videoRef.current && isModelLoaded) {
            startDetection(videoRef.current);
          }
        }, 1000);
      } catch (err) {
        toast.error('Erro ao ativar câmera');
      }
    } else {
      stopWebcam();
      stopDetection();
      setIsEnabled(false);
      toast.info('Detecção facial desativada');
    }
  };

  useEffect(() => {
    if (isActive && videoRef.current && isModelLoaded && !isDetecting) {
      startDetection(videoRef.current);
    }
  }, [isActive, isModelLoaded]);

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
        style={{ width: '280px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium">Detecção Facial</span>
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
          {!isModelLoaded && (
            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Inicializando detecção...</span>
            </div>
          )}

          {isModelLoaded && !isEnabled && (
            <div className="flex items-center space-x-2 text-cyan-400 text-sm">
              <Zap className="w-3 h-3" />
              <span>Modo simplificado pronto</span>
            </div>
          )}

          {(webcamError || detectionError) && (
            <div className="flex items-center space-x-2 text-orange-400 text-sm">
              <AlertCircle className="w-3 h-3" />
              <span>Usando detecção básica</span>
            </div>
          )}

          {isEnabled && isActive && (
            <div className="space-y-2">
              <div className="text-green-400 text-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Câmera ativa</span>
              </div>

              {currentEmotion && (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Emoção detectada:</span>
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
          )}
        </div>

        {/* Vídeo preview pequeno */}
        {isEnabled && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-32 bg-black rounded-lg object-cover"
            />
            {isDetecting && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400">
          Echo está usando detecção simplificada para ver suas expressões! ⚡
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceDetection;
