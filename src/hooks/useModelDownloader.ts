
import { useState, useCallback } from 'react';

interface ModelFile {
  name: string;
  url: string;
  size: number;
}

const FACE_API_MODELS: ModelFile[] = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
    size: 1024
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
    size: 181000
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json',
    size: 1024
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1',
    size: 317000
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
    size: 1024
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
    size: 1400000
  }
];

interface UseModelDownloaderReturn {
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  downloadModels: () => Promise<boolean>;
  checkModelsIntegrity: () => Promise<boolean>;
}

export const useModelDownloader = (): UseModelDownloaderReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = async (model: ModelFile): Promise<Blob> => {
    const response = await fetch(model.url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar ${model.name}: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log(`✅ Baixado: ${model.name} (${blob.size} bytes)`);
    return blob;
  };

  const saveToIndexedDB = async (filename: string, blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FaceAPIModels', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        
        store.put(blob, filename);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  };

  const loadFromIndexedDB = async (filename: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FaceAPIModels', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        
        const getRequest = store.get(filename);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  };

  const createModelURL = async (filename: string): Promise<string> => {
    const blob = await loadFromIndexedDB(filename);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    throw new Error(`Modelo não encontrado: ${filename}`);
  };

  const checkModelsIntegrity = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Verificando integridade dos modelos...');
      
      for (const model of FACE_API_MODELS) {
        const blob = await loadFromIndexedDB(model.name);
        
        if (!blob) {
          console.log(`❌ Modelo ausente: ${model.name}`);
          return false;
        }
        
        // Verificar tamanho aproximado
        if (blob.size < model.size * 0.8) { // Permitir 20% de variação
          console.log(`❌ Modelo corrompido (tamanho): ${model.name} - Esperado: ~${model.size}, Atual: ${blob.size}`);
          return false;
        }
        
        console.log(`✅ Modelo OK: ${model.name} (${blob.size} bytes)`);
      }
      
      console.log('🎉 Todos os modelos estão íntegros!');
      return true;
      
    } catch (err) {
      console.error('❌ Erro ao verificar modelos:', err);
      setError(`Erro na verificação: ${err}`);
      return false;
    }
  }, []);

  const downloadModels = useCallback(async (): Promise<boolean> => {
    if (isDownloading) return false;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);
    
    try {
      console.log('📥 Iniciando download dos modelos Face-API.js...');
      
      for (let i = 0; i < FACE_API_MODELS.length; i++) {
        const model = FACE_API_MODELS[i];
        console.log(`📥 Baixando ${model.name}...`);
        
        const blob = await downloadFile(model);
        await saveToIndexedDB(model.name, blob);
        
        const progress = ((i + 1) / FACE_API_MODELS.length) * 100;
        setDownloadProgress(progress);
        console.log(`📊 Progresso: ${Math.round(progress)}%`);
      }
      
      console.log('🎉 Download completo! Verificando integridade...');
      const isValid = await checkModelsIntegrity();
      
      if (isValid) {
        console.log('✅ Modelos baixados e validados com sucesso!');
        return true;
      } else {
        throw new Error('Modelos baixados estão corrompidos');
      }
      
    } catch (err: any) {
      console.error('❌ Erro no download:', err);
      setError(`Erro no download: ${err.message}`);
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, checkModelsIntegrity]);

  return {
    isDownloading,
    downloadProgress,
    error,
    downloadModels,
    checkModelsIntegrity
  };
};

// Helper para criar URLs dos modelos salvos
export const createModelURLs = async (): Promise<Record<string, string>> => {
  const modelURLs: Record<string, string> = {};
  
  for (const model of FACE_API_MODELS) {
    try {
      const request = indexedDB.open('FaceAPIModels', 1);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['models'], 'readonly');
          const store = transaction.objectStore('models');
          
          const getRequest = store.get(model.name);
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(getRequest.result);
            } else {
              reject(new Error(`Modelo não encontrado: ${model.name}`));
            }
          };
          getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
      
      modelURLs[model.name] = URL.createObjectURL(blob);
    } catch (err) {
      console.error(`Erro ao criar URL para ${model.name}:`, err);
    }
  }
  
  return modelURLs;
};
