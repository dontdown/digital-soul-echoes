
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerData {
  name: string;
  mood: string;
  preference: string;
}

interface EchoStore {
  playerData: PlayerData | null;
  echoPersonality: string;
  echoMood: string;
  memories: string[];
  echoCreated: boolean; // Nova flag para rastrear se Echo foi criado
  setPlayerData: (data: PlayerData) => void;
  setEchoPersonality: (personality: string) => void;
  updateEchoMood: (mood: string) => void;
  addMemory: (memory: string) => void;
  markEchoAsCreated: () => void; // Nova função
  clearData: () => void;
}

export const useEchoStore = create<EchoStore>()(
  persist(
    (set, get) => ({
      playerData: null,
      echoPersonality: "misterioso",
      echoMood: "neutro",
      memories: [],
      echoCreated: false,
      
      setPlayerData: (data) => {
        set({ playerData: data, echoCreated: true }); // Marcar como criado quando dados são definidos
      },
      
      setEchoPersonality: (personality) => set({ echoPersonality: personality }),
      
      updateEchoMood: (mood) => set({ echoMood: mood }),
      
      addMemory: (memory) => {
        const { memories } = get();
        if (!memories.includes(memory)) {
          set({ memories: [...memories, memory] });
        }
      },
      
      markEchoAsCreated: () => set({ echoCreated: true }),
      
      clearData: () => set({
        playerData: null,
        echoPersonality: "misterioso",
        echoMood: "neutro",
        memories: [],
        echoCreated: false
      }),
    }),
    {
      name: 'echo-storage',
    }
  )
);
