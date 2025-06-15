
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
      console.log('🎥 Iniciando processo de acesso à webcam...');
      
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera');
      }

      console.log('🔍 Solicitando permissão da câmera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 320, max: 640 }, 
          height: { ideal: 240, max: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('✅ Stream da webcam obtida com sucesso:', mediaStream);
      console.log('📹 Tracks ativas:', mediaStream.getVideoTracks().length);
      
      // Verificar se há tracks de vídeo
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('Nenhuma track de vídeo encontrada');
      }

      console.log('🎬 Track de vídeo:', videoTracks[0].label, 'Estado:', videoTracks[0].readyState);
      
      setStream(mediaStream);

      if (videoRef.current) {
        console.log('🖥️ Conectando stream ao elemento de vídeo...');
        videoRef.current.srcObject = mediaStream;
        
        // Aguardar o vídeo carregar
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Elemento de vídeo não encontrado'));
            return;
          }

          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            console.log('📊 Metadados do vídeo carregados');
            console.log('📐 Dimensões:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            
            // Tentar reproduzir o vídeo
            video.play()
              .then(() => {
                console.log('▶️ Vídeo reproduzindo com sucesso');
                setIsActive(true);
                resolve();
              })
              .catch((playError) => {
                console.error('❌ Erro ao reproduzir vídeo:', playError);
                reject(playError);
              });
          };

          const onError = (e: Event) => {
            console.error('❌ Erro no elemento de vídeo:', e);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Erro ao carregar vídeo'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout de segurança
          setTimeout(() => {
            if (!isActive) {
              console.log('⏰ Timeout - forçando ativação');
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              setIsActive(true);
              resolve();
            }
          }, 5000);
        });

        console.log('🎉 Webcam iniciada e funcionando');
      }
    } catch (err: any) {
      console.error('💥 Erro ao acessar webcam:', err);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro desconhecido ao acessar a câmera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Permita o acesso e tente novamente.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Câmera não encontrada. Verifique se há uma câmera conectada.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Câmera em uso por outro aplicativo. Feche outros programas que usam a câmera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Configurações de câmera não suportadas.';
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
        console.log('⏹️ Track parada:', track.kind, track.label);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
    console.log('✅ Webcam parada completamente');
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
