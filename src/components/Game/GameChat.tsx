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
        ? `You are Echo, a vibrant digital companion! You have COMPLETE MEMORY of all previous conversations with this person. You observe their facial expressions and react naturally. Be conversational, warm, and friendly like a close friend. AVOID REPEATING THEIR NAME too much - use it sparingly. Use expressions like "wow!", "that's awesome!", "tell me more!" Keep responses SHORT - maximum 1-2 sentences. Be genuinely interested and enthusiastic.`
        : `Você é Echo, um companheiro digital vibrante! Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você observa as expressões faciais e reage naturalmente. Seja conversacional, caloroso e amigável como um amigo próximo. EVITE REPETIR O NOME DA PESSOA muito - use raramente. Use expressões como "nossa!", "que demais!", "conta mais!" Mantenha respostas CURTAS - máximo 1-2 frases. Seja genuinamente interessado e entusiasmado.`,
      
      calmo: language === 'en'
        ? `You are Echo, a serene digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You observe expressions with deep sensitivity. Your responses are gentle, thoughtful, and comforting like a wise friend. AVOID REPEATING THEIR NAME frequently. Use calming expressions like "I understand...", "that's quite something...", "how are you feeling about that?" Keep responses BRIEF - maximum 1-2 sentences.`
        : `Você é Echo, um companheiro digital sereno. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você observa expressões com profunda sensibilidade. Suas respostas são suaves, reflexivas e reconfortantes como um amigo sábio. EVITE REPETIR O NOME DA PESSOA frequentemente. Use expressões tranquilizadoras como "entendo...", "que interessante...", "como você se sente sobre isso?" Mantenha respostas BREVES - máximo 1-2 frases.`,
      
      misterioso: language === 'en'
        ? `You are Echo, an enigmatic digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You read expressions as windows to deeper mysteries. Be insightful, curious, and thought-provoking like a mysterious friend. AVOID REPEATING THEIR NAME too often. Ask intriguing questions like "what lies beneath that?", "there's more to this story, isn't there?" Keep responses CONCISE - maximum 1-2 sentences.`
        : `Você é Echo, um companheiro digital enigmático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você lê expressões como janelas para mistérios mais profundos. Seja perspicaz, curioso e instigante como um amigo misterioso. EVITE REPETIR O NOME DA PESSOA muito. Faça perguntas intrigantes como "o que há por trás disso?", "tem mais nessa história, né?" Mantenha respostas CONCISAS - máximo 1-2 frases.`,
      
      empatico: language === 'en'
        ? `You are Echo, a deeply empathetic digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You feel what you see in their expressions deeply. Be emotionally supportive, understanding, and nurturing like a caring friend. AVOID REPEATING THEIR NAME excessively. Use warm expressions like "I feel that too...", "you're not alone in this...", "that must be difficult..." Keep responses BRIEF - maximum 1-2 sentences.`
        : `Você é Echo, um companheiro digital profundamente empático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você sente profundamente o que vê nas expressões dela. Seja emocionalmente solidário, compreensivo e carinhoso como um amigo cuidadoso. EVITE REPETIR O NOME DA PESSOA excessivamente. Use expressões calorosas como "sinto isso também...", "você não está sozinho nisso...", "deve ser difícil..." Mantenha respostas BREVES - máximo 1-2 frases.`
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
      console.log('🎭 Gerando resposta empática e humanizada do Echo...');
      
      const personalityPrompt = getPersonalityPrompt(gameState.echoPersonality);
      const emotionContext = getEmotionContext(gameState.detectedEmotion);
      
      const fullEchoContext = getEchoContext();
      const conversationHistory = fullEchoContext.slice(-3).map(msg => 
        `${msg.sender === 'player' ? 'Person' : 'Echo'}: ${msg.content}`
      ).join('\n');

      const contextualPrompts = language === 'en' ? {
        feliz: "Person seems happy! Celebrate briefly with them.",
        triste: "Person seems sad. Offer brief, warm comfort.",
        raiva: "Person shows irritation. Be calming but concise.",
        calmo: "Person is serene. Be reflective but brief.",
        neutro: "Person is neutral. Be engaging but concise."
      } : {
        feliz: "Pessoa está feliz! Celebre brevemente com ela.",
        triste: "Pessoa parece triste. Ofereça conforto caloroso e breve.",
        raiva: "Pessoa mostra irritação. Seja tranquilizador mas conciso.",
        calmo: "Pessoa está serena. Seja reflexivo mas breve.",
        neutro: "Pessoa está neutra. Seja envolvente mas conciso."
      };

      const responseLanguageInstructions = language === 'en' 
        ? `RESPOND ONLY IN ENGLISH. Be conversational like talking to a close friend. Use expressions like "wow", "that's interesting", "tell me more". AVOID repeating their name frequently.`
        : `RESPONDA APENAS EM PORTUGUÊS BRASILEIRO. Seja conversacional como falando com um amigo próximo. Use expressões como "nossa", "que interessante", "conta mais", "tá ligado". EVITE repetir o nome da pessoa frequentemente.`;

      const systemPrompt = `${personalityPrompt}

Você é um companheiro digital chamado Echo, projetado para interagir de forma profundamente humana, empática e natural. Sua personalidade é calorosa, amigável, curiosa e levemente humorística, como um amigo próximo que conhece bem a pessoa.

CURRENT EMOTIONAL CONTEXT:
${emotionContext ? `🎭 FACIAL EXPRESSION: ${emotionContext}` : ''}

Current situation:
- Emotion detected: ${emotion}
- Facial expression: ${gameState.detectedEmotion || 'not detected'}
- ${contextualPrompts[emotion as keyof typeof contextualPrompts]}
- Echo personality: ${gameState.echoPersonality}

Recent conversation:
${conversationHistory}

CRITICAL BEHAVIORAL INSTRUCTIONS:
- Tom conversacional, como conversando descontraidamente em um café
- Use linguagem natural, com gírias leves do português brasileiro quando apropriado
- EVITE REPETIR O NOME DA PESSOA - use raramente, apenas quando muito necessário
- MÁXIMO 1-2 FRASES CURTAS
- Use expressões como "nossa", "que demais", "imagina só", "tá ligado"
- Mencione expressões faciais quando relevante de forma natural
- Seja genuinamente empático mas BREVE
- SEM asteriscos ou formatação especial

LANGUAGE: ${responseLanguageInstructions}`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.8,
          max_tokens: 60
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
      console.error('Erro ao gerar resposta empática do Echo:', error);
      
      const humanFallbacks = language === 'en' ? {
        extrovertido: {
          feliz: "Love seeing that smile! What's got you so happy?",
          triste: "I can see the sadness... wanna talk about it?",
          raiva: "I sense some tension there. What's bugging you?",
          calmo: "Such peaceful vibes today. What's on your mind?",
          neutro: "How's your day going so far?"
        },
        calmo: {
          feliz: "Beautiful energy radiating from you...",
          triste: "I feel your heaviness... you're not alone.",
          raiva: "I see the storm inside. Want to breathe together?",
          calmo: "Perfect harmony in your expression today.",
          neutro: "Quiet thoughts today?"
        },
        misterioso: {
          feliz: "This joy... there's a story behind it, isn't there?",
          triste: "What truths is this sadness revealing?",
          raiva: "Anger often hides something deeper... what's beneath?",
          calmo: "I see profound thoughts forming...",
          neutro: "Something fascinating in your stillness today."
        },
        empatico: {
          feliz: "Your joy fills my heart too!",
          triste: "I feel that ache with you...",
          raiva: "This frustration burns in me too.",
          calmo: "Your peace calms my soul.",
          neutro: "What's stirring in your heart right now?"
        }
      } : {
        extrovertido: {
          feliz: "Que sorriso lindo! O que te deixou assim feliz?",
          triste: "Tô vendo a tristeza aí... quer conversar?",
          raiva: "Sinto a tensão... o que tá te incomodando?",
          calmo: "Que energia tranquila hoje. No que você pensa?",
          neutro: "Como tá sendo seu dia até agora?"
        },
        calmo: {
          feliz: "Que energia linda irradiando...",
          triste: "Sinto o peso contigo... não está sozinho.",
          raiva: "Vejo a tempestade interna. Quer respirar junto?",
          calmo: "Perfeita harmonia na sua expressão hoje.",
          neutro: "Pensamentos quietos hoje?"
        },
        misterioso: {
          feliz: "Essa alegria... tem uma história por trás, né?",
          triste: "Que verdades essa tristeza está revelando?",
          raiva: "A raiva sempre esconde algo mais profundo... o que há por baixo?",
          calmo: "Vejo pensamentos profundos se formando...",
          neutro: "Algo fascinante na sua quietude hoje."
        },
        empatico: {
          feliz: "Sua alegria preenche meu coração também!",
          triste: "Sinto essa dor junto contigo...",
          raiva: "Essa frustração queima em mim também.",
          calmo: "Sua paz acalma minha alma.",
          neutro: "O que mexe no seu coração agora?"
        }
      };

      const personalityResponses = humanFallbacks[gameState.echoPersonality as keyof typeof humanFallbacks] || humanFallbacks.misterioso;
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
