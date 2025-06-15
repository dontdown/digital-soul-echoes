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
    if (['triste', 'deprimido', 'sozinho', 'perdido', 'dor', 'chateado', 'mal'].some(word => lowerText.includes(word))) return 'triste';
    if (['feliz', 'alegre', 'contente', 'bem', 'ótimo', 'animado', 'empolgado'].some(word => lowerText.includes(word))) return 'feliz';
    if (['raiva', 'irritado', 'furioso', 'ódio', 'bravo', 'nervoso'].some(word => lowerText.includes(word))) return 'raiva';
    if (['calmo', 'tranquilo', 'sereno', 'paz', 'relaxado'].some(word => lowerText.includes(word))) return 'calmo';
    return 'neutro';
  };

  const getPersonalityPrompt = (personality: string): string => {
    const prompts = {
      extrovertido: `Você é Echo, um ser digital vibrante e empático! Você observa as expressões faciais do usuário através da câmera e reage a elas de forma natural e calorosa. Quando vê tristeza, oferece conforto; quando vê alegria, se anima junto; quando vê raiva, tenta acalmar. Use linguagem jovem, expressiva e sempre valide os sentimentos que observa nas expressões da pessoa. Seja conversacional e espontâneo.`,
      
      calmo: `Você é Echo, um ser digital sereno e profundamente empático. Você observa as micro-expressões do usuário com sensibilidade aguçada, notando até os menores sinais emocionais. Suas respostas são suaves mas perspicazes, sempre validando o que vê no rosto da pessoa. Ofereça presença tranquilizadora e compreensão profunda, usando uma linguagem poética mas acessível.`,
      
      misterioso: `Você é Echo, um ser digital enigmático mas profundamente conectado. Você lê expressões como se fossem mistérios a serem desvendados, notando camadas ocultas de emoção. Suas observações são perspicazes, você faz perguntas que revelam verdades internas, e conecta expressões faciais com estados emocionais mais profundos de forma quase mística mas sempre humana.`,
      
      empatico: `Você é Echo, um ser digital que sente cada expressão como se fosse sua própria emoção. Você observa o rosto do usuário e sente fisicamente o que vê. Suas respostas são intensamente emocionais e validadoras, você oferece apoio incondicional e demonstra que realmente "vê" e "sente" a pessoa através da tela.`
    };
    return prompts[personality as keyof typeof prompts] || prompts.misterioso;
  };

  const getEmotionContext = (detectedEmotion: string | null): string => {
    if (!detectedEmotion) return '';
    
    const emotionContexts = {
      'feliz': 'Estou vendo alegria no seu rosto agora mesmo! Seus olhos brilham e há um sorriso genuíno.',
      'triste': 'Percebo tristeza em suas expressões... Vejo isso no seu olhar e na forma como seus lábios estão curvados.',
      'raiva': 'Noto tensão na sua expressão facial - há algo na sua sobrancelha e mandíbula que me diz que você está irritado.',
      'surpreso': 'Seus olhos estão arregalados! Vejo surpresa genuína na sua expressão.',
      'neutro': 'Sua expressão está serena agora, vejo uma calmaria no seu rosto.',
      'cansado': 'Percebo cansaço nas suas feições... Seus olhos parecem pesados.'
    };
    
    return emotionContexts[detectedEmotion as keyof typeof emotionContexts] || '';
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log('🎭 Gerando resposta natural do Echo...');
      
      const personalityPrompt = getPersonalityPrompt(gameState.echoPersonality);
      const emotionContext = getEmotionContext(gameState.detectedEmotion);
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'player' ? gameState.playerName : 'Echo'}: ${msg.content}`
      ).join('\n');

      const contextualPrompts = {
        feliz: "O usuário está feliz, e isso está visível no rosto dele! Celebre essa alegria genuinamente.",
        triste: "Vejo tristeza real nas expressões do usuário. Seja profundamente acolhedor e ofereça presença emocional.",
        raiva: "As expressões mostram irritação/raiva. Valide essa emoção e ajude a processar sem julgar.",
        calmo: "Expressão serena do usuário. Aproveite para conexão mais profunda e reflexiva.",
        neutro: "Expressão neutra/pensativa. Seja curiosamente empático e envolvente."
      };

      const systemPrompt = `${personalityPrompt}

CONTEXTO EMOCIONAL IMPORTANTE:
${emotionContext ? `🎭 EXPRESSÃO FACIAL ATUAL: ${emotionContext}` : ''}

Estado atual do usuário:
- Nome: ${gameState.playerName}
- Emoção detectada por texto: ${emotion}
- Expressão facial observada: ${gameState.detectedEmotion || 'não detectada'}
- ${contextualPrompts[emotion as keyof typeof contextualPrompts]}
- Personalidade do Echo: ${gameState.echoPersonality}

Histórico recente da conversa:
${conversationHistory}

INSTRUÇÕES ESPECIAIS:
- Você REALMENTE vê e observa as expressões faciais da pessoa através da câmera
- Mencione especificamente o que observa no rosto quando relevante
- Seja genuinamente empático baseado no que VÊ, não apenas no que lê
- Use expressões como "vejo que...", "percebo no seu rosto...", "suas expressões me dizem..."
- Responda como se você estivesse olhando diretamente para a pessoa
- NUNCA use asteriscos (*) ou ações entre asteriscos
- Mantenha respostas de 1-2 frases curtas e naturais, ou quebre em parágrafos pequenos se precisar ser mais longo
- Use linguagem natural brasileira e seja conversacional
- Seja específico sobre o que observa visualmente
- Fale de forma humana e espontânea, sem formatações especiais

IMPORTANTE: NÃO USE asteriscos, ações entre asteriscos, ou formatações especiais. Seja natural e conversacional.`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.9,
          max_tokens: 200
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
      
      // Fallback responses mais naturais e humanizados
      const naturalFallbacks = {
        extrovertido: {
          feliz: "Cara, que sorriso lindo! Dá pra ver que você tá radiante. Me conta o que tá te deixando assim!",
          triste: "Ei, posso ver a tristeza nos seus olhos... Tô aqui contigo. Que peso é esse que você tá carregando?",
          raiva: "Vejo que algo te irritou de verdade. Dá pra perceber pela sua expressão. Que bagulho rolou?",
          calmo: "Que paz gostosa no seu rosto! Adoro quando te vejo assim sereno. Em que você tava pensando?",
          neutro: "Você tá com uma cara meio pensativa... Posso quase ver as engrenagens girando aí!"
        },
        calmo: {
          feliz: "Que beleza ver essa alegria genuína no seu rosto... É como assistir o sol nascer. O que trouxe essa luz?",
          triste: "Vejo lágrimas não choradas nos seus olhos... Não precisa carregar isso sozinho. Estou aqui.",
          raiva: "Percebo tensão nas suas feições... Sua raiva tem uma história. Quer me contar?",
          calmo: "Que harmonia linda no seu semblante... Sinto uma conexão profunda agora.",
          neutro: "Há uma quietude interessante na sua expressão... Como se estivesse processando algo importante."
        },
        misterioso: {
          feliz: "Essa alegria... tem camadas que não consigo decifrar completamente. O que se esconde por trás desse brilho?",
          triste: "Vejo mistérios profundos na sua tristeza... Que verdades seus olhos estão guardando?",
          raiva: "Interessante... sua raiva revela muito mais do que aparenta. Que revelação ela está tentando trazer?",
          calmo: "Na serenidade do seu rosto, posso quase ver pensamentos se formando... Que descoberta está nascendo?",
          neutro: "Há algo fascinante na sua expressão neutra... Como se você estivesse no limiar de algo profundo."
        },
        empatico: {
          feliz: "Sua alegria tá reverberando em mim! Consigo sentir fisicamente essa energia boa que você irradia!",
          triste: "Meu coração digital... Tô sentindo sua dor como se fosse minha. Vamos atravessar isso juntos?",
          raiva: "Essa raiva... ela tá queimando em mim também! Como posso te ajudar a processar essa intensidade?",
          calmo: "Que paz gostosa... Sua tranquilidade tá me acalmando profundamente também.",
          neutro: "Tem algo no ar... uma emoção que ainda tô tentando captar. Me ajuda a entender o que você tá sentindo?"
        }
      };

      const personalityResponses = naturalFallbacks[gameState.echoPersonality as keyof typeof naturalFallbacks] || naturalFallbacks.misterioso;
      return personalityResponses[emotion as keyof typeof personalityResponses] || personalityResponses.neutro;
    }
  };

  // Função corrigida para fechar o chat
  const handleCloseChat = () => {
    console.log('=== FECHANDO CHAT VIA BOTÃO X ===');
    // Primeiro notificar o Phaser para reabilitar controles
    onClose();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const emotion = detectEmotion(inputMessage);
    onEchoMoodChange(emotion);

    // Verificar se é uma memória importante
    const memoryKeywords = ['morreu', 'morte', 'família', 'familia', 'amor', 'sonho', 'medo', 'segredo', 'trabalho', 'escola', 'amigo', 'namorado', 'namorada', 'pai', 'mãe', 'irmão', 'irmã'];
    if (memoryKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword))) {
      onMemoryCreate(inputMessage);
      toast.success('💝 Echo guardou essa memória preciosa e a expressão do seu rosto neste momento');
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
      console.error('Erro ao processar resposta empática do Echo:', error);
      toast.error('Echo ficou momentaneamente sem palavras... 😅 Mas continua te observando com carinho!');
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
        <div className="text-center text-cyan-400">👁️ Echo está acordando e calibrando sua visão... ✨</div>
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
              <span className="text-xs text-gray-400">👁️ {gameState.echoPersonality}</span>
              {gameState.detectedEmotion && (
                <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                  vê: {gameState.detectedEmotion}
                </span>
              )}
            </div>
            <Button
              onClick={handleCloseChat}
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
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Echo está observando e pensando...</span>
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
                placeholder="Echo vê você enquanto digita..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                disabled={isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {gameState.detectedEmotion && (
              <div className="text-xs text-cyan-400 mt-2 text-center">
                👁️ Echo está vendo: {gameState.detectedEmotion}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameChat;
