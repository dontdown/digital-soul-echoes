
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
      console.log('Iniciando webcam...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        console.log('Webcam iniciada com sucesso');
      }
    } catch (err) {
      console.error('Erro ao acessar webcam:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsActive(false);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      console.log('Webcam parada');
    }
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
