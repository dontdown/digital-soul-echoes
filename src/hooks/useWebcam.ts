
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
      console.log('Solicitando acesso à webcam...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640, max: 1280 }, 
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Stream da webcam obtida:', mediaStream);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Aguardar o vídeo carregar completamente
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Elemento de vídeo não encontrado'));
            return;
          }

          const video = videoRef.current;
          
          const onLoadedData = () => {
            console.log('Dados do vídeo carregados');
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            setIsActive(true);
            resolve();
          };

          const onError = (e: Event) => {
            console.error('Erro ao carregar vídeo:', e);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            reject(new Error('Erro ao carregar vídeo'));
          };

          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('error', onError);
          
          video.play().catch(reject);
        });

        console.log('Webcam iniciada e vídeo reproduzindo com sucesso');
      }
    } catch (err) {
      console.error('Erro ao acessar webcam:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsActive(false);
      
      // Limpar stream em caso de erro
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopWebcam = () => {
    console.log('Parando webcam...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track parada:', track.kind);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    console.log('Webcam parada completamente');
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
