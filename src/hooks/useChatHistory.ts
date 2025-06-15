
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'player' | 'echo';
  timestamp: Date;
}

export const useChatHistory = (playerName: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullHistory, setFullHistory] = useState<ChatMessage[]>([]); // Histórico completo em memória
  const { user } = useAuth();

  // Sempre iniciar uma nova sessão visual quando entrar no site
  const initializeNewVisualSession = () => {
    // Marcar que uma nova sessão foi iniciada
    const sessionKey = `session_${user?.id}_${playerName}_${Date.now()}`;
    localStorage.setItem(`current_session_${user?.id}_${playerName}`, sessionKey);
    return true;
  };

  // Carregar histórico de conversas do Supabase
  useEffect(() => {
    if (!playerName || !user) return;

    loadChatHistory();
  }, [playerName, user]);

  const loadChatHistory = async () => {
    try {
      const playerKey = `${user?.id}_${playerName}`;
      
      const { data, error } = await supabase
        .from('chat_history' as any)
        .select('*')
        .eq('player', playerKey)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        // Se não conseguir carregar, iniciar com mensagem padrão
        const initialMessage = {
          id: '1',
          content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
          sender: 'echo' as const,
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        setFullHistory([initialMessage]);
      } else if (data && data.length > 0) {
        const loadedMessages = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'player' | 'echo',
          timestamp: new Date(msg.created_at)
        }));
        
        // SEMPRE carregar o histórico completo em memória para contexto do Echo
        setFullHistory(loadedMessages);
        
        // SEMPRE limpar o chat visual e começar com mensagem de boas-vindas
        initializeNewVisualSession();
        
        const welcomeMessage = {
          id: Date.now().toString(),
          content: `Olá ${playerName}. Posso sentir que você voltou... Como se sente agora?`,
          sender: 'echo' as const,
          timestamp: new Date()
        };
        
        // Mostrar apenas a mensagem de boas-vindas no chat visual
        setMessages([welcomeMessage]);
        
        // Adicionar a mensagem de boas-vindas ao histórico completo também
        setFullHistory(prev => [...prev, welcomeMessage]);
        await saveChatMessage(welcomeMessage);
        
      } else {
        // Primeira conversa
        const initialMessage = {
          id: '1',
          content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
          sender: 'echo' as const,
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        setFullHistory([initialMessage]);
        await saveChatMessage(initialMessage);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      const fallbackMessage = {
        id: '1',
        content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
        sender: 'echo' as const,
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setFullHistory([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatMessage = async (message: ChatMessage) => {
    if (!user) return;
    
    try {
      const playerKey = `${user.id}_${playerName}`;
      
      await supabase
        .from('chat_history' as any)
        .insert({
          player: playerKey,
          content: message.content,
          sender: message.sender,
          message_id: message.id
        });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const addMessage = async (message: ChatMessage) => {
    // Adicionar à exibição atual (chat visual)
    setMessages(prev => [...prev, message]);
    // Adicionar ao histórico completo em memória
    setFullHistory(prev => [...prev, message]);
    await saveChatMessage(message);
  };

  // Função para obter contexto completo para o Echo (todas as mensagens do histórico)
  const getEchoContext = () => {
    // Retornar todo o histórico para que o Echo tenha contexto completo
    return fullHistory;
  };

  return {
    messages, // Chat visual (sempre limpo ao entrar)
    setMessages,
    addMessage,
    isLoading,
    getEchoContext, // Histórico completo para contexto do Echo
    fullHistoryLength: fullHistory.length // Para debug/estatísticas
  };
};
