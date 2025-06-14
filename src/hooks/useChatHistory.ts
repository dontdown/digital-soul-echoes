
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'player' | 'echo';
  timestamp: Date;
}

export const useChatHistory = (playerName: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar histórico de conversas do Supabase
  useEffect(() => {
    if (!playerName) return;

    loadChatHistory();
  }, [playerName]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('player', playerName)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        // Se não conseguir carregar, iniciar com mensagem padrão
        setMessages([{
          id: '1',
          content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
          sender: 'echo',
          timestamp: new Date()
        }]);
      } else if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'player' | 'echo',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
      } else {
        // Primeira conversa
        const initialMessage = {
          id: '1',
          content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
          sender: 'echo' as const,
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        // Salvar mensagem inicial
        await saveChatMessage(initialMessage);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setMessages([{
        id: '1',
        content: `Olá, ${playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
        sender: 'echo',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      await supabase
        .from('chat_history')
        .insert({
          player: playerName,
          content: message.content,
          sender: message.sender,
          message_id: message.id
        });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const addMessage = async (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    await saveChatMessage(message);
  };

  return {
    messages,
    setMessages,
    addMessage,
    isLoading
  };
};
