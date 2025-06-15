
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

const openDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FaceAPIModels', 1);
    
    request.onerror = () => {
      console.error('Erro ao abrir IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('🔧 Atualizando estrutura do IndexedDB...');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Verificar se o object store já existe antes de criar
      if (!db.objectStoreNames.contains('models')) {
        const store = db.createObjectStore('models');
        console.log('✅ Object store "models" criado');
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log('✅ IndexedDB aberto com sucesso');
      
      // Verificar se o object store existe
      if (!db.objectStoreNames.contains('models')) {
        console.error('❌ Object store "models" não encontrado');
        db.close();
        
        // Forçar recriação do banco
        const deleteRequest = indexedDB.deleteDatabase('FaceAPIModels');
        deleteRequest.onsuccess = () => {
          console.log('🗑️ Banco deletado, tentando recriar...');
          openDatabase().then(resolve).catch(reject);
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
        return;
      }
      
      resolve(db);
    };
  });
};

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
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');
      
      const request = store.put(blob, filename);
      
      transaction.oncomplete = () => {
        console.log(`💾 Salvo no IndexedDB: ${filename}`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error(`❌ Erro ao salvar ${filename}:`, transaction.error);
        reject(transaction.error);
      };
      
      request.onerror = () => {
        console.error(`❌ Erro na requisição para ${filename}:`, request.error);
        reject(request.error);
      };
    });
  };

  const loadFromIndexedDB = async (filename: string): Promise<Blob | null> => {
    try {
      const db = await openDatabase();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        
        const request = store.get(filename);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          console.error(`❌ Erro ao carregar ${filename}:`, request.error);
          reject(request.error);
        };
      });
    } catch (err) {
      console.error(`❌ Erro ao acessar IndexedDB para ${filename}:`, err);
      return null;
    }
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
  
  try {
    const db = await openDatabase();
    
    for (const model of FACE_API_MODELS) {
      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
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
        });
        
        modelURLs[model.name] = URL.createObjectURL(blob);
        console.log(`🔗 URL criada para: ${model.name}`);
      } catch (err) {
        console.error(`❌ Erro ao criar URL para ${model.name}:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Erro ao acessar IndexedDB para criar URLs:', err);
  }
  
  return modelURLs;
};
