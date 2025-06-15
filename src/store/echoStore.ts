
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
  setPlayerData: (data: PlayerData) => void;
  setEchoPersonality: (personality: string) => void;
  updateEchoMood: (mood: string) => void;
  addMemory: (memory: string) => void;
  clearData: () => void;
}

export const useEchoStore = create<EchoStore>()(
  persist(
    (set, get) => ({
      playerData: null,
      echoPersonality: "misterioso",
      echoMood: "neutro",
      memories: [],
      
      setPlayerData: (data) => set({ playerData: data }),
      
      setEchoPersonality: (personality) => set({ echoPersonality: personality }),
      
      updateEchoMood: (mood) => set({ echoMood: mood }),
      
      addMemory: (memory) => {
        const { memories } = get();
        if (!memories.includes(memory)) {
          set({ memories: [...memories, memory] });
        }
      },
      
      clearData: () => set({
        playerData: null,
        echoPersonality: "misterioso",
        echoMood: "neutro",
        memories: []
      }),
    }),
    {
      name: 'echo-storage',
    }
  )
);
