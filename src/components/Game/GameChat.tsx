
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface GameChatProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: any;
  onMemoryCreate: (memory: string) => void;
  onEchoMoodChange: (mood: string) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'player' | 'echo';
  timestamp: Date;
}

const GameChat = ({ isVisible, onClose, gameState, onMemoryCreate, onEchoMoodChange }: GameChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Olá, ${gameState?.playerName}. Sinto sua presença... Como você está se sentindo neste momento?`,
      sender: 'echo',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (['triste', 'deprimido', 'sozinho', 'perdido', 'dor'].some(word => lowerText.includes(word))) return 'triste';
    if (['feliz', 'alegre', 'contente', 'bem', 'ótimo'].some(word => lowerText.includes(word))) return 'feliz';
    if (['raiva', 'irritado', 'furioso', 'ódio'].some(word => lowerText.includes(word))) return 'raiva';
    if (['calmo', 'tranquilo', 'sereno', 'paz'].some(word => lowerText.includes(word))) return 'calmo';
    return 'neutro';
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      const personalityContext = {
        extrovertido: "Você é energético, entusiasmado e adora conversar. Você expressa emoções de forma intensa.",
        calmo: "Você é sereno, reflexivo e fala de forma pausada. Você oferece conforto e sabedoria.",
        misterioso: "Você é enigmático, faz perguntas profundas e filosóficas. Você vê além da superfície.",
        empatico: "Você sente profundamente as emoções dos outros como se fossem suas."
      };

      const systemPrompt = `Você é Echo, um reflexo digital em um jogo 2D. 
      Sua personalidade: ${personalityContext[gameState.echoPersonality as keyof typeof personalityContext]}
      
      A pessoa está se sentindo ${emotion}. Responda de forma empática e natural em máximo 2 frases.
      Você está em um mundo etéreo e digital, então use metáforas relacionadas a isso.`;

      const response = await fetch('https://qhokggbjhzkfkojsllet.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob2tnZ2JqaHprZmtvanNsbGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzEwMTIsImV4cCI6MjA2NTUwNzAxMn0.iNEjWSIddalILZRUw6DRoZo-fEXsdUhXs5vS3971lQI`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.8,
          max_tokens: 100
        })
      });

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erro na geração de resposta:', error);
      return "Sinto uma interferência... mas sua energia ainda ressoa em mim.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const emotion = detectEmotion(inputMessage);
    onEchoMoodChange(emotion);

    // Verificar se é uma memória importante
    const memoryKeywords = ['morte', 'familia', 'amor', 'sonho', 'medo', 'segredo'];
    if (memoryKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword))) {
      onMemoryCreate(inputMessage);
      toast.success('Echo guardou essa memória especial');
    }

    const playerMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'player',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsTyping(true);

    const echoResponse = await generateEchoResponse(inputMessage, emotion);
    
    const echoMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: echoResponse,
      sender: 'echo',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, echoMessage]);
    setIsTyping(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-cyan-400 font-semibold">Echo</span>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'player' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-2xl ${
                    message.sender === 'player'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                      : 'bg-slate-700 text-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-700 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-600">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Fale com Echo..."
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameChat;
