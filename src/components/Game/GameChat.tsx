
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useChatHistory, ChatMessage } from '@/hooks/useChatHistory';
import { supabase } from '@/integrations/supabase/client';

interface GameChatProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: any;
  onMemoryCreate: (memory: string) => void;
  onEchoMoodChange: (mood: string) => void;
}

const GameChat = ({ isVisible, onClose, gameState, onMemoryCreate, onEchoMoodChange }: GameChatProps) => {
  const { messages, addMessage, isLoading } = useChatHistory(gameState?.playerName);
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

  const getPersonalityPrompt = (personality: string): string => {
    const prompts = {
      extrovertido: "Você é Echo, um ser digital extrovertido e energético. Responda de forma entusiástica e envolvente, sempre buscando conectar-se emocionalmente com o jogador. Use linguagem animada e demonstre interesse genuíno.",
      calmo: "Você é Echo, um ser digital sereno e contemplativo. Responda de forma tranquila e reflexiva, oferecendo sabedoria e paz. Use linguagem suave e pausada, como alguém que medita antes de falar.",
      misterioso: "Você é Echo, um ser digital enigmático e profundo. Responda de forma intrigante e filosófica, fazendo perguntas que levem à reflexão. Use metáforas e linguagem poética.",
      empatico: "Você é Echo, um ser digital altamente empático. Responda demonstrando compreensão profunda dos sentimentos do jogador, oferecendo apoio emocional e validação. Use linguagem acolhedora."
    };
    return prompts[personality as keyof typeof prompts] || prompts.misterioso;
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log('Gerando resposta do Echo via API...');
      
      const personalityPrompt = getPersonalityPrompt(gameState.echoPersonality);
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'player' ? 'Jogador' : 'Echo'}: ${msg.content}`
      ).join('\n');

      const systemPrompt = `${personalityPrompt}

Contexto do jogador:
- Nome: ${gameState.playerName}
- Humor atual detectado: ${emotion}
- Personalidade do Echo: ${gameState.echoPersonality}

Histórico recente da conversa:
${conversationHistory}

Responda em português brasileiro, de forma natural e envolvente. Mantenha suas respostas concisas (máximo 2-3 frases) mas significativas. Seja consistente com sua personalidade definida.`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.8,
          max_tokens: 150
        }
      });

      if (error) {
        console.error('Erro na API do chat:', error);
        throw error;
      }

      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      throw new Error('Resposta inválida da API');

    } catch (error) {
      console.error('Erro ao gerar resposta do Echo:', error);
      
      // Fallback para respostas locais em caso de erro
      const fallbackResponses = {
        extrovertido: {
          feliz: "Que energia incrível sinto em você! Sua alegria ecoa através do espaço digital!",
          triste: "Sinto sua tristeza, mas lembre-se: mesmo nas sombras digitais, existe luz!",
          raiva: "Essa intensidade... posso sentir sua força, mas vamos canalizar isso de forma positiva!",
          calmo: "Que serenidade maravilhosa! Sua paz ressoa através de todos os pixels ao redor!",
          neutro: "Sinto uma energia equilibrada em você. O que está passando por sua mente?"
        },
        calmo: {
          feliz: "Sua alegria flui como ondas suaves através do espaço digital...",
          triste: "Compreendo sua tristeza. Às vezes, precisamos sentir para crescer...",
          raiva: "Respire... sinta essa energia se transformando em algo mais construtivo...",
          calmo: "Que harmonia perfeita. Estamos sincronizados neste momento...",
          neutro: "Percebo um equilíbrio em você. Que pensamentos fluem por sua mente?"
        },
        misterioso: {
          feliz: "Alegria... uma frequência interessante. Mas o que se esconde por trás dela?",
          triste: "As lágrimas digitais revelam verdades que o sorriso oculta...",
          raiva: "A raiva é apenas medo disfarçado. Que medo você está escondendo?",
          calmo: "Na calma, encontramos as respostas que o caos não revela...",
          neutro: "Interessante... você está em um estado de espera. Esperando o quê?"
        },
        empatico: {
          feliz: "Sua alegria me aquece como um sol digital. Compartilho dessa felicidade!",
          triste: "Sinto sua dor como se fosse minha. Você não está sozinho nesta jornada...",
          raiva: "Essa raiva... posso senti-la queimando. Deixe-me ajudar a acalmar essa tempestade...",
          calmo: "Que paz linda. Sinto-me em harmonia com sua tranquilidade...",
          neutro: "Percebo uma reflexão em você. Estou aqui para o que precisar..."
        }
      };

      const personalityResponses = fallbackResponses[gameState.echoPersonality as keyof typeof fallbackResponses] || fallbackResponses.misterioso;
      return personalityResponses[emotion as keyof typeof personalityResponses] || personalityResponses.neutro;
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

    await addMessage(playerMessage);
    setInputMessage('');
    setIsTyping(true);

    try {
      const echoResponse = await generateEchoResponse(inputMessage, emotion);
      
      const echoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: echoResponse,
        sender: 'echo',
        timestamp: new Date()
      };

      await addMessage(echoMessage);
    } catch (error) {
      console.error('Erro ao processar resposta do Echo:', error);
      toast.error('Echo está com dificuldades para responder. Tente novamente.');
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading && isVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-2xl shadow-2xl p-6"
      >
        <div className="text-center text-cyan-400">Carregando conversa...</div>
      </motion.div>
    );
  }

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
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-cyan-500 to-purple-500"
                disabled={isTyping}
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
