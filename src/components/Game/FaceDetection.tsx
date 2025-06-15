import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useEmotionDetection, EmotionModel, DetectedEmotion } from '@/hooks/useEmotionDetection';
import { Camera, CameraOff, Eye, AlertCircle, Play, Settings, Bug } from 'lucide-react';
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
  const [debugMode, setDebugMode] = useState(false);

  // Carregar modelo inicial apenas uma vez quando visível
  useEffect(() => {
    if (isVisible && !isModelLoaded) {
      console.log('🔄 FaceDetection: Carregando modelo inicial...');
      loadModels();
    }
  }, [isVisible, isModelLoaded, loadModels]);

  const handleToggleDetection = async () => {
    if (!isEnabled) {
      try {
        console.log('🚀 FaceDetection: Ativando detecção...');
        setIsEnabled(true);
        
        console.log('📷 Iniciando webcam...');
        await startWebcam();
        
        if (!isModelLoaded) {
          console.log('📦 Modelo não carregado, carregando...');
          await loadModels();
        }
        
        toast.success('Detecção ativada!');
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
  };

  const availableModels: { id: EmotionModel; name: string; description: string; status: string }[] = [
    {
      id: 'mediapipe',
      name: 'MediaPipe',
      description: 'Google MediaPipe - Detecção facial avançada',
      status: '🤖 Real'
    },
    {
      id: 'tensorflow',
      name: 'TensorFlow.js',
      description: 'TensorFlow.js com modelos customizados',
      status: '🧠 Real'
    },
    {
      id: 'opencv',
      name: 'OpenCV.js',
      description: 'OpenCV.js para visão computacional',
      status: '🔧 Em breve'
    },
    {
      id: 'simulated',
      name: 'Simulado',
      description: 'Modo demo com emoções simuladas',
      status: '🎭 Demo'
    }
  ];

  // Auto-iniciar detecção quando câmera e modelo estiverem prontos
  useEffect(() => {
    console.log('🔍 FaceDetection: Verificando condições para auto-start:', {
      isActive,
      videoElement: !!videoRef.current,
      isModelLoaded,
      isDetecting,
      isEnabled,
      videoReady: videoRef.current?.readyState,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight
    });
    
    if (isActive && videoRef.current && isModelLoaded && !isDetecting && isEnabled) {
      console.log('🎬 FaceDetection: Condições atendidas - Auto-iniciando detecção...');
      
      const video = videoRef.current;
      console.log('📹 Status completo do vídeo:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime,
        paused: video.paused,
        muted: video.muted,
        srcObject: !!video.srcObject,
        networkState: video.networkState
      });
      
      // Aguardar mais tempo para garantir que o vídeo está completamente pronto
      setTimeout(() => {
        if (videoRef.current && isActive && isModelLoaded && video.readyState >= 2 && video.videoWidth > 0) {
          console.log('✅ FaceDetection: Iniciando detecção real...');
          startDetection(videoRef.current);
          toast.success(`Detecção ${currentModel} iniciada!`, {
            description: debugMode ? 'Modo debug ativo - veja o console' : 'Faça expressões para testar'
          });
        } else {
          console.warn('⚠️ FaceDetection: Vídeo ainda não está completamente pronto');
          console.log('📊 Estado atual:', {
            videoRef: !!videoRef.current,
            isActive,
            isModelLoaded,
            readyState: video.readyState,
            videoWidth: video.videoWidth
          });
        }
      }, 1000); // Aumentar para 1 segundo
    }
  }, [isActive, isModelLoaded, isEnabled, currentModel, startDetection]);

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
            {!isSimulated && <Play className="w-3 h-3 text-green-400" />}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={() => setDebugMode(!debugMode)}
              variant="ghost"
              size="sm"
              className={`${debugMode ? 'text-orange-400' : 'text-gray-400'} hover:text-orange-300`}
              title="Modo Debug"
            >
              <Bug className="w-4 h-4" />
            </Button>
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

        {debugMode && (
          <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-2">
            <div className="text-orange-400 text-xs font-medium mb-1">🐛 Debug Info:</div>
            <div className="text-orange-300 text-xs space-y-1">
              <div>Modelo: {currentModel}</div>
              <div>Carregado: {isModelLoaded ? '✅' : '❌'}</div>
              <div>Câmera: {isActive ? '✅' : '❌'}</div>
              <div>Detectando: {isDetecting ? '✅' : '❌'}</div>
              <div>Vídeo: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</div>
              <div className="text-xs text-orange-200">Veja o console para logs detalhados</div>
            </div>
          </div>
        )}

        {/* Seletor de Modelos */}
        {showModelSelector && (
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
            <div className="text-cyan-400 text-sm font-medium mb-2">
              🤖 Modelos Disponíveis:
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
                  if (model.id !== 'opencv') {
                    switchModel(model.id);
                    setShowModelSelector(false);
                    toast.info(`Modelo alterado para: ${model.name}`);
                  }
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
                🤖 MediaPipe Real Ativo
              </div>
              <div className="text-green-300 text-xs mt-1">
                Detecção facial avançada com análise de blendshapes
              </div>
              {isDetecting && (
                <div className="text-green-300 text-xs mt-1">
                  ▶️ Processando frames em tempo real
                </div>
              )}
            </div>
          ) : currentModel === 'tensorflow' ? (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3">
              <div className="text-blue-400 text-sm font-medium">
                🧠 TensorFlow.js Real Ativo
              </div>
              <div className="text-blue-300 text-xs mt-1">
                Análise de emoções com deep learning em tempo real
              </div>
            </div>
          ) : currentModel === 'simulated' ? (
            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-3">
              <div className="text-orange-400 text-sm font-medium">
                🎭 Modo Demo Ativo
              </div>
              <div className="text-orange-300 text-xs mt-1">
                Escolha MediaPipe ou TensorFlow.js para detecção real
              </div>
            </div>
          ) : (
            <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-3">
              <div className="text-purple-400 text-sm font-medium">
                🔧 {currentModel} em desenvolvimento
              </div>
              <div className="text-purple-300 text-xs mt-1">
                Este modelo será implementado em breve
              </div>
            </div>
          )}

          {/* Status de carregamento */}
          {isEnabled && !isModelLoaded && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400">Carregando modelo {currentModel}...</span>
            </div>
          )}

          {/* Status da câmera */}
          {isEnabled && (
            <div className="flex items-center space-x-2 text-sm">
              {isActive ? (
                <>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">Câmera ativa</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400">Inicializando câmera...</span>
                </>
              )}
            </div>
          )}

          {/* Erros */}
          {(webcamError || detectionError) && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2">
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-3 h-3" />
                <span>Erro:</span>
              </div>
              <div className="text-red-300 text-xs mt-1">
                {webcamError || detectionError}
              </div>
            </div>
          )}

          {/* Emoção detectada */}
          {isEnabled && isActive && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">
                  {isSimulated ? 'Simulação:' : 'Detectado:'}
                </span>
                <span className="text-xl">{getEmotionEmoji(currentEmotion)}</span>
              </div>
              
              {currentEmotion ? (
                <>
                  <div className={`font-medium ${getEmotionColor(currentEmotion)}`}>
                    {currentEmotion}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Confiança: {Math.round(confidence * 100)}%
                  </div>
                  {confidence < 0.3 && !isSimulated && (
                    <div className="text-xs text-yellow-400 mt-1">
                      💡 Tente fazer expressões mais marcantes
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm">
                  {isDetecting ? 'Aguardando detecção...' : 'Não detectando'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vídeo com indicadores de status */}
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
            
            {/* Indicadores visuais */}
            {isDetecting && (
              <div className="absolute top-2 left-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs bg-black/50 px-1 rounded">
                  {debugMode ? 'DEBUG' : 'REAL'}
                </span>
              </div>
            )}
            
            {isActive && (
              <div className="absolute bottom-2 right-2 text-white text-xs bg-black/50 px-1 rounded">
                {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}
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
            '🤖 MediaPipe - Detecção real com blendshapes' : 
            currentModel === 'tensorflow' ?
            '🧠 TensorFlow.js - Análise de emoções real' :
            currentModel === 'simulated' ?
            '🎭 Modo demo - Escolha um modelo real acima' :
            '🔧 Modelo em desenvolvimento'
          }
          {debugMode && <div className="text-orange-400 mt-1">🐛 Debug ativo - veja console</div>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceDetection;
