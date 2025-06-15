
import { create } from 'zustand';

interface PlayerData {
  name: string;
  mood: string;
  preference: string;
  model?: string;
}

interface EchoStore {
  playerData: PlayerData | null;
  echoPersonality: string;
  echoMood: string;
  setPlayerData: (data: PlayerData) => void;
  setEchoPersonality: (personality: string) => void;
  updateEchoMood: (mood: string) => void;
  reset: () => void;
}

export const useEchoStore = create<EchoStore>((set) => ({
  playerData: null,
  echoPersonality: 'misterioso',
  echoMood: 'neutro',
  setPlayerData: (data) => set({ playerData: data }),
  setEchoPersonality: (personality) => set({ echoPersonality: personality }),
  updateEchoMood: (mood) => set({ echoMood: mood }),
  reset: () => set({ 
    playerData: null, 
    echoPersonality: 'misterioso', 
    echoMood: 'neutro' 
  }),
}));
