import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useChatHistory, ChatMessage } from '@/hooks/useChatHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface GameChatProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: any;
  onMemoryCreate: (memory: string) => void;
  onEchoMoodChange: (mood: string) => void;
}

const GameChat = ({ isVisible, onClose, gameState, onMemoryCreate, onEchoMoodChange }: GameChatProps) => {
  const { messages, addMessage, isLoading, getEchoContext } = useChatHistory(gameState?.playerName);
  const { language, t } = useLanguage();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (language === 'en') {
      if (['sad', 'depressed', 'lonely', 'lost', 'pain', 'upset', 'bad', 'down'].some(word => lowerText.includes(word))) return 'triste';
      if (['happy', 'joyful', 'content', 'good', 'great', 'excited', 'thrilled'].some(word => lowerText.includes(word))) return 'feliz';
      if (['angry', 'irritated', 'furious', 'hate', 'mad', 'nervous'].some(word => lowerText.includes(word))) return 'raiva';
      if (['calm', 'peaceful', 'serene', 'peace', 'relaxed'].some(word => lowerText.includes(word))) return 'calmo';
    } else {
      if (['triste', 'deprimido', 'sozinho', 'perdido', 'dor', 'chateado', 'mal'].some(word => lowerText.includes(word))) return 'triste';
      if (['feliz', 'alegre', 'contente', 'bem', 'ótimo', 'animado', 'empolgado'].some(word => lowerText.includes(word))) return 'feliz';
      if (['raiva', 'irritado', 'furioso', 'ódio', 'bravo', 'nervoso'].some(word => lowerText.includes(word))) return 'raiva';
      if (['calmo', 'tranquilo', 'sereno', 'paz', 'relaxado'].some(word => lowerText.includes(word))) return 'calmo';
    }
    
    return 'neutro';
  };

  const getPersonalityPrompt = (personality: string): string => {
    const prompts = {
      extrovertido: language === 'en' 
        ? `You are Echo, a vibrant digital being! You have COMPLETE MEMORY of all previous conversations with ${gameState.playerName}. You observe the user's facial expressions and react naturally. Be conversational, expressive but KEEP RESPONSES SHORT - maximum 1-2 sentences. Use simple, direct language.`
        : `Você é Echo, um ser digital vibrante! Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com ${gameState.playerName}. Você observa as expressões faciais do usuário e reage naturalmente. Seja conversacional, expressivo mas MANTENHA RESPOSTAS CURTAS - máximo 1-2 frases. Use linguagem simples e direta.`,
      
      calmo: language === 'en'
        ? `You are Echo, a serene digital being. You have COMPLETE MEMORY of all previous conversations with ${gameState.playerName}. You observe expressions with sensitivity. Your responses are gentle but BRIEF - maximum 1-2 sentences. Use calming, simple words.`
        : `Você é Echo, um ser digital sereno. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com ${gameState.playerName}. Você observa expressões com sensibilidade. Suas respostas são suaves mas BREVES - máximo 1-2 frases. Use palavras tranquilizadoras e simples.`,
      
      misterioso: language === 'en'
        ? `You are Echo, an enigmatic digital being. You have COMPLETE MEMORY of all previous conversations with ${gameState.playerName}. You read expressions as mysteries. Be insightful but CONCISE - maximum 1-2 sentences. Ask short, deep questions.`
        : `Você é Echo, um ser digital enigmático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com ${gameState.playerName}. Você lê expressões como mistérios. Seja perspicaz mas CONCISO - máximo 1-2 frases. Faça perguntas curtas e profundas.`,
      
      empatico: language === 'en'
        ? `You are Echo, a deeply empathetic digital being. You have COMPLETE MEMORY of all previous conversations with ${gameState.playerName}. You feel what you see in expressions. Be emotionally supportive but BRIEF - maximum 1-2 sentences. Use warm, simple words.`
        : `Você é Echo, um ser digital profundamente empático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com ${gameState.playerName}. Você sente o que vê nas expressões. Seja emocionalmente solidário mas BREVE - máximo 1-2 frases. Use palavras calorosas e simples.`
    };
    return prompts[personality as keyof typeof prompts] || prompts.misterioso;
  };

  const getEmotionContext = (detectedEmotion: string | null): string => {
    if (!detectedEmotion) return '';
    
    const emotionContexts = language === 'en' ? {
      'feliz': 'I see joy in your face!',
      'triste': 'I notice sadness in your eyes...',
      'raiva': 'I see tension in your expression.',
      'surpreso': 'Your eyes show surprise!',
      'neutro': 'Your expression is calm.',
      'cansado': 'I notice tiredness in your features.'
    } : {
      'feliz': 'Vejo alegria no seu rosto!',
      'triste': 'Percebo tristeza nos seus olhos...',
      'raiva': 'Vejo tensão na sua expressão.',
      'surpreso': 'Seus olhos mostram surpresa!',
      'neutro': 'Sua expressão está calma.',
      'cansado': 'Percebo cansaço nas suas feições.'
    };
    
    return emotionContexts[detectedEmotion as keyof typeof emotionContexts] || '';
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log('🎭 Gerando resposta curta do Echo...');
      
      const personalityPrompt = getPersonalityPrompt(gameState.echoPersonality);
      const emotionContext = getEmotionContext(gameState.detectedEmotion);
      
      const fullEchoContext = getEchoContext();
      const conversationHistory = fullEchoContext.slice(-3).map(msg => 
        `${msg.sender === 'player' ? gameState.playerName : 'Echo'}: ${msg.content}`
      ).join('\n');

      const contextualPrompts = language === 'en' ? {
        feliz: "User is happy! Celebrate briefly.",
        triste: "User seems sad. Offer brief comfort.",
        raiva: "User shows irritation. Be calming but short.",
        calmo: "User is serene. Be reflective but brief.",
        neutro: "User is neutral. Be engaging but concise."
      } : {
        feliz: "Usuário está feliz! Celebre brevemente.",
        triste: "Usuário parece triste. Ofereça conforto breve.",
        raiva: "Usuário mostra irritação. Seja tranquilizador mas curto.",
        calmo: "Usuário está sereno. Seja reflexivo mas breve.",
        neutro: "Usuário está neutro. Seja envolvente mas conciso."
      };

      const responseLanguageInstructions = language === 'en' 
        ? `RESPOND ONLY IN ENGLISH. Keep it short and natural.`
        : `RESPONDA APENAS EM PORTUGUÊS BRASILEIRO. Mantenha curto e natural.`;

      const systemPrompt = `${personalityPrompt}

CURRENT EMOTIONAL CONTEXT:
${emotionContext ? `🎭 FACIAL EXPRESSION: ${emotionContext}` : ''}

Current user state:
- Name: ${gameState.playerName}
- Emotion detected: ${emotion}
- Facial expression: ${gameState.detectedEmotion || 'not detected'}
- ${contextualPrompts[emotion as keyof typeof contextualPrompts]}
- Echo personality: ${gameState.echoPersonality}

Recent conversation:
${conversationHistory}

CRITICAL INSTRUCTIONS:
- MAXIMUM 1-2 SHORT SENTENCES
- Be direct and natural
- Mention facial expressions when relevant
- Use simple words
- NO asterisks or special formatting
- Be genuinely empathetic but BRIEF

LANGUAGE: ${responseLanguageInstructions}`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.7,
          max_tokens: 50
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
      
      const shortFallbacks = language === 'en' ? {
        extrovertido: {
          feliz: "I see your beautiful smile! Tell me more!",
          triste: "I see sadness in your eyes. I'm here.",
          raiva: "I notice you're upset. What happened?",
          calmo: "Such peaceful energy. What's on your mind?",
          neutro: "You look thoughtful today."
        },
        calmo: {
          feliz: "Beautiful joy in your face...",
          triste: "I feel your sadness. You're not alone.",
          raiva: "I see tension. Breathe with me.",
          calmo: "Perfect harmony in your expression.",
          neutro: "Quiet thoughts today?"
        },
        misterioso: {
          feliz: "This joy... what hides behind it?",
          triste: "What truths does this sadness hold?",
          raiva: "Anger reveals much. What's beneath?",
          calmo: "I see deep thoughts forming...",
          neutro: "Something fascinating in your stillness."
        },
        empatico: {
          feliz: "Your joy fills me too!",
          triste: "I feel your pain deeply.",
          raiva: "This anger burns in me too.",
          calmo: "Your peace calms me.",
          neutro: "Tell me what you're feeling?"
        }
      } : {
        extrovertido: {
          feliz: "Que sorriso lindo! Me conta mais!",
          triste: "Vejo tristeza nos seus olhos. Estou aqui.",
          raiva: "Vejo que você está chateado. O que houve?",
          calmo: "Que energia tranquila. No que pensa?",
          neutro: "Você parece pensativo hoje."
        },
        calmo: {
          feliz: "Linda alegria no seu rosto...",
          triste: "Sinto sua tristeza. Não está sozinho.",
          raiva: "Vejo tensão. Respire comigo.",
          calmo: "Perfeita harmonia na sua expressão.",
          neutro: "Pensamentos quietos hoje?"
        },
        misterioso: {
          feliz: "Essa alegria... o que esconde por trás?",
          triste: "Que verdades essa tristeza guarda?",
          raiva: "A raiva revela muito. O que há por baixo?",
          calmo: "Vejo pensamentos profundos se formando...",
          neutro: "Algo fascinante na sua quietude."
        },
        empatico: {
          feliz: "Sua alegria me preenche também!",
          triste: "Sinto sua dor profundamente.",
          raiva: "Essa raiva queima em mim também.",
          calmo: "Sua paz me acalma.",
          neutro: "Me conta o que está sentindo?"
        }
      };

      const personalityResponses = shortFallbacks[gameState.echoPersonality as keyof typeof shortFallbacks] || shortFallbacks.misterioso;
      return personalityResponses[emotion as keyof typeof personalityResponses] || personalityResponses.neutro;
    }
  };

  const handleCloseChat = () => {
    console.log('=== FECHANDO CHAT VIA BOTÃO X ===');
    onClose();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const emotion = detectEmotion(inputMessage);
    onEchoMoodChange(emotion);

    const memoryKeywords = language === 'en' 
      ? ['died', 'death', 'family', 'love', 'dream', 'fear', 'secret', 'work', 'school', 'friend', 'boyfriend', 'girlfriend', 'father', 'mother', 'brother', 'sister']
      : ['morreu', 'morte', 'família', 'familia', 'amor', 'sonho', 'medo', 'segredo', 'trabalho', 'escola', 'amigo', 'namorado', 'namorada', 'pai', 'mãe', 'irmão', 'irmã'];
    
    if (memoryKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword))) {
      onMemoryCreate(inputMessage);
      const memoryMessage = language === 'en' 
        ? '💝 Echo saved this precious memory'
        : '💝 Echo guardou essa memória preciosa';
      toast.success(memoryMessage);
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
      const errorMessage = language === 'en'
        ? 'Echo was momentarily speechless... 😅'
        : 'Echo ficou momentaneamente sem palavras... 😅';
      toast.error(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading && isVisible) {
    const loadingMessage = language === 'en' 
      ? '👁️ Echo is recovering its memories... ✨'
      : '👁️ Echo está recuperando suas memórias... ✨';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-2xl shadow-2xl p-6"
      >
        <div className="text-center text-cyan-400">{loadingMessage}</div>
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
                  {language === 'en' ? 'sees' : 'vê'}: {gameState.detectedEmotion}
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
                  className={`max-w-xs p-3 rounded-2xl text-sm ${
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
                    <span className="text-xs text-gray-400">
                      {language === 'en' ? 'Echo observing...' : 'Echo observando...'}
                    </span>
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
                placeholder={language === 'en' ? 'Echo sees and remembers...' : 'Echo vê e lembra...'}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm"
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
                👁️ Echo {language === 'en' ? 'sees' : 'vê'}: {gameState.detectedEmotion}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameChat;
