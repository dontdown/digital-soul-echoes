
import { useState, useRef, useEffect } from 'react';

interface UseWebcamReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  error: string | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
}

export const useWebcam = (): UseWebcamReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startWebcam = async () => {
    try {
      setError(null);
      setIsActive(false);
      console.log('🎥 Iniciando webcam...');
      
      // Verificar suporte
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera');
      }

      // Solicitar acesso à câmera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 320 }, 
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('✅ Stream obtida:', mediaStream);
      
      // Verificar se há tracks de vídeo
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }

      console.log('🎬 Track de vídeo:', videoTracks[0].label);
      
      setStream(mediaStream);

      // Conectar ao elemento de vídeo
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        console.log('🖥️ Conectando ao elemento de vídeo...');
        
        // Aguardar o vídeo carregar e reproduzir
        const playVideo = () => {
          return new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              console.log('▶️ Vídeo pronto para reprodução');
              video.removeEventListener('canplay', onCanPlay);
              video.removeEventListener('error', onError);
              
              video.play()
                .then(() => {
                  console.log('🎉 Vídeo reproduzindo!');
                  setIsActive(true);
                  resolve();
                })
                .catch((playError) => {
                  console.error('❌ Erro ao reproduzir:', playError);
                  reject(playError);
                });
            };

            const onError = (e: Event) => {
              console.error('❌ Erro no vídeo:', e);
              video.removeEventListener('canplay', onCanPlay);
              video.removeEventListener('error', onError);
              reject(new Error('Erro ao carregar vídeo'));
            };

            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);
            
            // Forçar load se necessário
            if (video.readyState >= 3) {
              onCanPlay();
            } else {
              video.load();
            }
          });
        };

        await playVideo();
      } else {
        console.warn('⚠️ Elemento de vídeo não encontrado');
        setIsActive(true); // Ativar mesmo sem vídeo para teste
      }

    } catch (err: any) {
      console.error('💥 Erro na webcam:', err);
      
      let errorMessage = 'Erro ao acessar a câmera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Permita o acesso à câmera e recarregue a página.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Câmera não encontrada. Verifique se há uma câmera conectada.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Câmera em uso. Feche outros programas que usam a câmera.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsActive(false);
      
      // Limpar stream em caso de erro
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopWebcam = () => {
    console.log('🛑 Parando webcam...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Track parada:', track.label);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
    console.log('✅ Webcam parada');
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return {
    stream,
    videoRef,
    isActive,
    error,
    startWebcam,
    stopWebcam
  };
};
