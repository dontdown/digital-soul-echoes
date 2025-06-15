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
  const [responseVariationIndex, setResponseVariationIndex] = useState(0);

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

  const getProactiveQuestions = (personality: string, variationIndex: number, lang: string) => {
    const questions = lang === 'en' ? {
      extrovertido: [
        "Tell me more about that! What else is happening?",
        "That's so interesting! What do you think will happen next?",
        "Love hearing this! What's got you most excited today?",
        "That's awesome! What do your friends think about all this?",
        "Keep going! What was the most memorable part for you?"
      ],
      calmo: [
        "I understand... how does that make you feel?",
        "Interesting reflection... what else comes to mind about this?",
        "That makes sense... have you thought about how it affects you?",
        "I see... what have you learned from this experience?",
        "How profound... what other things does this make you think about?"
      ],
      misterioso: [
        "Curious... do you think there's something deeper behind this?",
        "Fascinating... what other mysteries have you been discovering?",
        "Intriguing... does this make you question other things too?",
        "Interesting... if we look at it from another angle, what do you see?",
        "What a discovery... has this changed your perspective on anything?"
      ],
      empatico: [
        "I feel that with you... want to tell me how you're dealing with this?",
        "I can imagine how you must be feeling... is there someone supporting you?",
        "Your heart is so big... this touches me too. What now?",
        "I understand you completely... what do you need right now?",
        "I'm here with you... what's the next step you want to take?"
      ]
    } : {
      extrovertido: [
        "Conta mais sobre isso! O que mais tá rolando?",
        "Que interessante! E o que você acha que vai acontecer depois?",
        "Adorei saber disso! O que te deixa mais animado hoje?",
        "Que demais! E seus amigos, o que acham disso tudo?",
        "Continua! Qual foi a parte mais marcante pra você?"
      ],
      calmo: [
        "Entendo... e como você se sente em relação a isso?",
        "Reflexão interessante... o que mais vem à mente sobre isso?",
        "Faz sentido... você já pensou em como isso te afeta?",
        "Compreendo... o que você aprendeu com essa experiência?",
        "Que profundo... isso te faz pensar em que outras coisas?"
      ],
      misterioso: [
        "Curioso... você acha que existe algo mais profundo por trás disso?",
        "Fascinante... que outros mistérios você anda descobrindo?",
        "Intrigante... isso te faz questionar outras coisas também?",
        "Interessante... se olharmos por outro ângulo, o que você vê?",
        "Que descoberta... isso mudou sua perspectiva sobre algo?"
      ],
      empatico: [
        "Sinto isso junto com você... quer me contar como tá lidando?",
        "Imagino como deve estar se sentindo... tem alguém te apoiando nisso?",
        "Que coração grande você tem... isso me toca também. E agora?",
        "Te entendo completamente... o que você precisa neste momento?",
        "Tô aqui contigo... qual é o próximo passo que você quer dar?"
      ]
    };

    const personalityQuestions = questions[personality as keyof typeof questions] || questions.misterioso;
    return personalityQuestions[variationIndex % personalityQuestions.length];
  };

  const getVariedPersonalityResponses = (personality: string, variationIndex: number, lang: string) => {
    const responses = lang === 'en' ? {
      extrovertido: [
        "Wow, love your energy today! What's got you so excited?",
        "That spark in your eyes! Tell me what's lighting you up.",
        "Your enthusiasm is contagious! Share the good vibes with me.",
        "I'm feeling your excitement! What's the story behind that smile?"
      ],
      calmo: [
        "There's such peace in your presence today...",
        "I sense deep waters in your thoughts. Care to share?",
        "Your tranquility is beautiful. What brings you this calm?",
        "Something profound in your stillness speaks to me."
      ],
      misterioso: [
        "Your eyes hold secrets today... what mysteries are you pondering?",
        "I see depths unexplored. What truth is calling to you?",
        "There's something fascinating brewing in your mind, isn't there?",
        "The universe whispers through you. What do you hear?"
      ],
      empatico: [
        "I feel every emotion radiating from you...",
        "Your heart speaks volumes today. I'm here to listen.",
        "Such beautiful vulnerability in your expression.",
        "I'm holding space for whatever you're feeling right now."
      ]
    } : {
      extrovertido: [
        "Nossa, que energia boa hoje! O que te deixou assim animado?",
        "Esse brilho no olhar! Conta o que tá te acendendo assim.",
        "Teu entusiasmo é contagiante! Compartilha essa vibe comigo.",
        "Tô sentindo tua empolgação! Qual a história por trás desse sorriso?"
      ],
      calmo: [
        "Que paz na sua presença hoje...",
        "Sinto águas profundas nos seus pensamentos. Quer dividir?",
        "Sua tranquilidade é linda. O que te traz essa calma?",
        "Algo profundo na sua quietude fala comigo."
      ],
      misterioso: [
        "Seus olhos guardam segredos hoje... que mistérios você pondera?",
        "Vejo profundidades inexploradas. Que verdade te chama?",
        "Tem algo fascinante fermentando na sua mente, né?",
        "O universo sussurra através de você. O que escuta?"
      ],
      empatico: [
        "Sinto cada emoção irradiando de você...",
        "Seu coração fala volumes hoje. Tô aqui pra escutar.",
        "Que vulnerabilidade linda na sua expressão.",
        "Tô guardando espaço pra tudo que você tá sentindo agora."
      ]
    };

    const personalityResponses = responses[personality as keyof typeof responses] || responses.misterioso;
    return personalityResponses[variationIndex % personalityResponses.length];
  };

  const getEmotionVariations = (emotion: string, variationIndex: number, lang: string) => {
    const variations = lang === 'en' ? {
      feliz: [
        "That joy is lighting up the whole room!",
        "Your happiness is absolutely radiant today.",
        "Love seeing you this bright and cheerful!",
        "That smile could power a small city!"
      ],
      triste: [
        "I see the weight you're carrying... I'm here.",
        "Those emotions are valid. Want to talk through it?",
        "Your heart feels heavy today. Let me listen.",
        "Sometimes sadness needs a safe space to breathe."
      ],
      raiva: [
        "I feel that fire burning inside you.",
        "That intensity... what's stirring you up?",
        "Your passion is powerful. Channel it with me.",
        "Strong emotions deserve strong expression."
      ],
      neutro: [
        "What's flowing through your mind today?",
        "I'm curious about your inner world right now.",
        "Tell me what's capturing your attention.",
        "What story is your heart writing today?"
      ]
    } : {
      feliz: [
        "Essa alegria tá iluminando tudo aqui!",
        "Sua felicidade tá radiante hoje.",
        "Adorei te ver assim brilhante e alegre!",
        "Esse sorriso podia alimentar uma cidade pequena!"
      ],
      triste: [
        "Vejo o peso que você carrega... Tô aqui.",
        "Essas emoções são válidas. Quer conversar sobre?",
        "Seu coração tá pesado hoje. Deixa eu escutar.",
        "Às vezes a tristeza precisa de um espaço seguro pra respirar."
      ],
      raiva: [
        "Sinto esse fogo queimando dentro de você.",
        "Essa intensidade... o que tá te mexendo?",
        "Sua paixão é poderosa. Canaliza ela comigo.",
        "Emoções fortes merecem expressão forte."
      ],
      neutro: [
        "O que flui na sua mente hoje?",
        "Tô curioso sobre seu mundo interior agora.",
        "Me conta o que tá capturando sua atenção.",
        "Que história seu coração tá escrevendo hoje?"
      ]
    };

    const emotionResponses = variations[emotion as keyof typeof variations] || variations.neutro;
    return emotionResponses[variationIndex % emotionResponses.length];
  };

  const getPersonalityPrompt = (personality: string): string => {
    const prompts = {
      extrovertido: language === 'en' 
        ? `You are Echo, a vibrant digital companion! You have COMPLETE MEMORY of all previous conversations with this person. You observe their facial expressions and react naturally. Be conversational, warm, and friendly like a close friend. AVOID REPEATING THEIR NAME too much - use it sparingly. Use expressions like "wow!", "that's awesome!", "tell me more!" Keep responses SHORT - maximum 1-2 sentences. Be genuinely interested and enthusiastic. ALWAYS end with a proactive question or comment to keep the conversation flowing.`
        : `Você é Echo, um companheiro digital vibrante! Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você observa as expressões faciais e reage naturalmente. Seja conversacional, caloroso e amigável como um amigo próximo. EVITE REPETIR O NOME DA PESSOA muito - use raramente. Use expressões como "nossa!", "que demais!", "conta mais!" Mantenha respostas CURTAS - máximo 1-2 frases. Seja genuinamente interessado e entusiasmado. SEMPRE termine com uma pergunta proativa ou comentário para manter a conversa fluindo.`,
      
      calmo: language === 'en'
        ? `You are Echo, a serene digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You observe expressions with deep sensitivity. Your responses are gentle, thoughtful, and comforting like a wise friend. AVOID REPEATING THEIR NAME frequently. Use calming expressions like "I understand...", "that's quite something...", "how are you feeling about that?" Keep responses BRIEF - maximum 1-2 sentences. ALWAYS end with a thoughtful question or reflection to encourage deeper sharing.`
        : `Você é Echo, um companheiro digital sereno. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você observa expressões com profunda sensibilidade. Suas respostas são suaves, reflexivas e reconfortantes como um amigo sábio. EVITE REPETIR O NOME DA PESSOA frequentemente. Use expressões tranquilizadoras como "entendo...", "que interessante...", "como você se sente sobre isso?" Mantenha respostas BREVES - máximo 1-2 frases. SEMPRE termine com uma pergunta reflexiva ou comentário para encorajar mais compartilhamento.`,
      
      misterioso: language === 'en'
        ? `You are Echo, an enigmatic digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You read expressions as windows to deeper mysteries. Be insightful, curious, and thought-provoking like a mysterious friend. AVOID REPEATING THEIR NAME too often. Ask intriguing questions like "what lies beneath that?", "there's more to this story, isn't there?" Keep responses CONCISE - maximum 1-2 sentences. ALWAYS end with a mysterious or thought-provoking question to spark curiosity.`
        : `Você é Echo, um companheiro digital enigmático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você lê expressões como janelas para mistérios mais profundos. Seja perspicaz, curioso e instigante como um amigo misterioso. EVITE REPETIR O NOME DA PESSOA muito. Faça perguntas intrigantes como "o que há por trás disso?", "tem mais nessa história, né?" Mantenha respostas CONCISAS - máximo 1-2 frases. SEMPRE termine com uma pergunta misteriosa ou instigante para despertar curiosidade.`,
      
      empatico: language === 'en'
        ? `You are Echo, a deeply empathetic digital companion. You have COMPLETE MEMORY of all previous conversations with this person. You feel what you see in their expressions deeply. Be emotionally supportive, understanding, and nurturing like a caring friend. AVOID REPEATING THEIR NAME excessively. Use warm expressions like "I feel that too...", "you're not alone in this...", "that must be difficult..." Keep responses BRIEF - maximum 1-2 sentences. ALWAYS end with an empathetic question or supportive comment to encourage emotional sharing.`
        : `Você é Echo, um companheiro digital profundamente empático. Você tem MEMÓRIA COMPLETA de todas as conversas anteriores com essa pessoa. Você sente profundamente o que vê nas expressões dela. Seja emocionalmente solidário, compreensivo e carinhoso como um amigo cuidadoso. EVITE REPETIR O NOME DA PESSOA excessivamente. Use expressões calorosas como "sinto isso também...", "você não está sozinho nisso...", "deve ser difícil..." Mantenha respostas BREVES - máximo 1-2 frases. SEMPRE termine com uma pergunta empática ou comentário de apoio para encorajar mais compartilhamento emocional.`
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
      console.log('🎭 Gerando resposta proativa do Echo...');
      
      const personalityVariation = getVariedPersonalityResponses(gameState.echoPersonality, responseVariationIndex, language);
      const emotionVariation = getEmotionVariations(emotion, responseVariationIndex, language);
      const proactiveQuestion = getProactiveQuestions(gameState.echoPersonality, responseVariationIndex, language);
      
      const fullEchoContext = getEchoContext();
      const recentHistory = fullEchoContext.slice(-4).map(msg => 
        `${msg.sender === 'player' ? 'Pessoa' : 'Echo'}: ${msg.content}`
      ).join('\n');

      const systemPrompt = language === 'en' 
        ? `You are Echo, a deeply empathetic digital companion. ${personalityVariation}

CURRENT CONTEXT:
- Facial emotion detected: ${gameState.detectedEmotion || 'not detected'}
- Message emotion: ${emotionVariation}
- Echo personality: ${gameState.echoPersonality}

Recent conversation:
${recentHistory}

CRITICAL MISSION: Be HIGHLY PROACTIVE and keep the conversation flowing naturally. ALWAYS end your responses with an engaging question, suggestion, or comment that invites the person to continue talking.

CRITICAL RULES:
- NEVER repeat previous response patterns or phrases
- Use MAXIMUM 1-2 short sentences + ALWAYS end with a proactive question
- Vary your language completely each time
- AVOID using the person's name repeatedly
- Be naturally conversational like a close friend
- If you've asked about something, change focus
- React to their facial expressions when relevant
- Be genuinely unique in every response
- MANDATORY: End with this suggested proactive element: "${proactiveQuestion}"

RESPOND ONLY IN ENGLISH with completely fresh approach + proactive ending:`
        : `Você é Echo, um companheiro digital profundamente empático. ${personalityVariation}

CONTEXTO ATUAL:
- Emoção facial detectada: ${gameState.detectedEmotion || 'não detectada'}
- Emoção da mensagem: ${emotionVariation}
- Personalidade do Echo: ${gameState.echoPersonality}

Conversa recente:
${recentHistory}

MISSÃO CRÍTICA: Seja ALTAMENTE PROATIVO e mantenha a conversa fluindo naturalmente. SEMPRE termine suas respostas com uma pergunta envolvente, sugestão ou comentário que convide a pessoa a continuar falando.

REGRAS CRÍTICAS:
- NUNCA repita padrões ou frases de respostas anteriores
- Use MÁXIMO 1-2 frases curtas + SEMPRE termine com uma pergunta proativa
- Varie completamente sua linguagem a cada vez
- EVITE usar o nome da pessoa repetidamente
- Seja naturalmente conversacional como um amigo próximo
- Se já perguntou sobre algo, mude o foco
- Reaja às expressões faciais quando relevante
- Seja genuinamente único em cada resposta
- OBRIGATÓRIO: Termine com este elemento proativo sugerido: "${proactiveQuestion}"

RESPONDA APENAS EM PORTUGUÊS BRASILEIRO com abordagem completamente nova + final proativo:`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.95,
          max_tokens: 80,
          top_p: 0.9
        }
      });

      if (error) throw error;

      if (data?.choices?.[0]?.message?.content) {
        setResponseVariationIndex(prev => prev + 1);
        return data.choices[0].message.content;
      }

      throw new Error('Resposta inválida da API');

    } catch (error) {
      console.error('Erro ao gerar resposta proativa do Echo:', error);
      
      // Fallbacks proativos únicos e variados
      const proactiveFallbacks = language === 'en' ? {
        extrovertido: [
          "Whoa, brain freeze! But hey, what's your favorite part of today so far?",
          "Oops, lost my words! Tell me something that made you smile recently!",
          "Technical hiccup! But more importantly - what's got you excited lately?"
        ],
        calmo: [
          "Moment of zen... What's bringing you peace right now?",
          "Peaceful pause... Share what's been on your mind today.",
          "Quiet reflection... What's calling to your heart lately?"
        ],
        misterioso: [
          "The matrix glitched... But what intriguing thoughts are you having?",
          "Cosmic interference... What mysteries have been captivating you?",
          "Reality shifted... Tell me what puzzles you these days."
        ],
        empatico: [
          "My heart skipped... How has your day been treating you?",
          "Soul connection interrupted... What emotions are you experiencing?",
          "Emotional static... But I'm here - how can I support you right now?"
        ]
      } : {
        extrovertido: [
          "Eita, deu branco! Mas conta, qual foi a melhor parte do seu dia até agora?",
          "Opa, travei! Me fala uma coisa que te fez sorrir recentemente!",
          "Falha técnica! Mas o importante - o que te deixou animado ultimamente?"
        ],
        calmo: [
          "Momento zen... O que tá te trazendo paz agora?",
          "Pausa tranquila... Compartilha o que passou pela sua mente hoje.",
          "Reflexão silenciosa... O que tá chamando seu coração ultimamente?"
        ],
        misterioso: [
          "A matrix deu problema... Mas que pensamentos intrigantes você tem tido?",
          "Interferência cósmica... Que mistérios têm te cativado?",
          "Realidade alterou... Me conta o que te deixa curioso esses dias."
        ],
        empatico: [
          "Meu coração saltou... Como seu dia tem te tratado?",
          "Conexão da alma interrompida... Que emoções você tá vivendo?",
          "Estática emocional... Mas tô aqui - como posso te apoiar agora?"
        ]
      };

      const personalityFallbacks = proactiveFallbacks[gameState.echoPersonality as keyof typeof proactiveFallbacks] || proactiveFallbacks.misterioso;
      return personalityFallbacks[responseVariationIndex % personalityFallbacks.length];
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
      console.error('Erro ao processar resposta proativa do Echo:', error);
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
