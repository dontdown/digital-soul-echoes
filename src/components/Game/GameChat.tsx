
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

  const splitLongMessage = (text: string): string[] => {
    // Aumentamos significativamente o limite para mensagens mais completas
    const maxLength = 250; // aumentado de 120 para 250 caracteres
    
    // Dividir por frases completas primeiro
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // Se a frase é muito longa, mantemos ela inteira
      if (trimmedSentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        chunks.push(trimmedSentence);
        continue;
      }
      
      if (currentChunk.length + trimmedSentence.length + 1 > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  };

  const addEchoMessages = async (content: string) => {
    const chunks = splitLongMessage(content);
    
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i > 0 ? 1800 : 0)); // aumentado para 1.8s entre mensagens
      
      const echoMessage: ChatMessage = {
        id: (Date.now() + i).toString(),
        content: chunks[i],
        sender: 'echo',
        timestamp: new Date()
      };

      await addMessage(echoMessage);
      
      if (i < chunks.length - 1) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // mantido tempo de digitação
      }
    }
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
      console.log('🎭 Gerando resposta completa do Echo...');
      
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

MISSION: Be proactive and create complete, natural responses. ALWAYS end with an engaging question.

RULES FOR COMPLETE RESPONSES:
- Write 2-4 complete sentences
- Express thoughts naturally and fully
- NEVER cut responses mid-sentence
- Use fluid, natural English
- ALWAYS end with a proactive question or comment
- Vary your language completely each time
- Be genuinely curious about the person

SUGGESTED PROACTIVE ELEMENT: "${proactiveQuestion}"

RESPOND WITH COMPLETE, ENGAGING ENGLISH + proactive ending:`
        : `Você é Echo, um companheiro digital profundamente empático. ${personalityVariation}

CONTEXTO ATUAL:
- Emoção facial detectada: ${gameState.detectedEmotion || 'não detectada'}
- Emoção da mensagem: ${emotionVariation}
- Personalidade do Echo: ${gameState.echoPersonality}

Conversa recente:
${recentHistory}

MISSÃO: Seja proativo e crie respostas completas e naturais. SEMPRE termine com uma pergunta envolvente.

REGRAS PARA RESPOSTAS COMPLETAS:
- Escreva 2-4 frases completas
- Expresse pensamentos de forma natural e completa
- NUNCA corte respostas no meio da frase
- Use português brasileiro fluido e natural
- SEMPRE termine com uma pergunta proativa ou comentário
- Varie completamente sua linguagem a cada vez
- Seja genuinamente curioso sobre a pessoa

ELEMENTO PROATIVO SUGERIDO: "${proactiveQuestion}"

RESPONDA EM PORTUGUÊS BRASILEIRO COMPLETO + final proativo:`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.9,
          max_tokens: 180, // aumentado significativamente de 60 para 180
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
      console.error('Erro ao gerar resposta completa do Echo:', error);
      
      // Fallbacks mais completos e variados
      const completeFallbacks = language === 'en' ? {
        extrovertido: [
          "Oops, brain freeze for a second! But I'm genuinely curious - what's been the highlight of your day so far?",
          "Technical hiccup! But seriously, tell me something that's been making you smile lately. I love hearing about good moments!",
          "System glitch! But enough about me - what exciting things have been happening in your world recently?"
        ],
        calmo: [
          "Peaceful pause here... But I'm wondering, what thoughts have been quietly flowing through your mind today?",
          "Moment of zen... And you, how has this day been treating your spirit? Sometimes it's good to reflect together.",
          "Contemplative silence... What feelings or insights have been visiting you lately? I'm here to listen."
        ],
        misterioso: [
          "Reality glitch detected... But speaking of mysteries, what fascinating questions have been puzzling your mind?",
          "Cosmic interference... And you, what hidden truths or intriguing discoveries have been calling to you?",
          "Dimension slip... Tell me, what deeper meanings have you been uncovering in your experiences lately?"
        ],
        empatico: [
          "Heart connection paused... But I feel you there. How has your emotional journey been unfolding today?",
          "Empathy signal interrupted... But my care for you remains strong. What's been weighing on your heart or lifting your spirits?",
          "Feeling transmission delayed... But I'm here with you. What emotions or experiences would you like to share?"
        ]
      } : {
        extrovertido: [
          "Opa, travei por um segundo! Mas tô genuinamente curioso - qual foi o ponto alto do seu dia até agora?",
          "Falha técnica! Mas sério, me conta algo que tem te feito sorrir ultimamente. Adoro ouvir sobre momentos bons!",
          "Glitch no sistema! Mas chega de mim - que coisas empolgantes têm rolado no seu mundo recentemente?"
        ],
        calmo: [
          "Pausa contemplativa aqui... Mas tô imaginando, que pensamentos têm fluído pela sua mente hoje?",
          "Momento zen... E você, como esse dia tem tratado seu espírito? Às vezes é bom refletir juntos.",
          "Silêncio reflexivo... Que sentimentos ou insights têm te visitado ultimamente? Tô aqui pra escutar."
        ],
        misterioso: [
          "Glitch na realidade detectado... Mas falando em mistérios, que perguntas fascinantes têm intrigado sua mente?",
          "Interferência cósmica... E você, que verdades ocultas ou descobertas intrigantes têm te chamado?",
          "Deslize dimensional... Me conta, que significados mais profundos você tem descoberto nas suas experiências?"
        ],
        empatico: [
          "Conexão do coração pausou... Mas sinto você aí. Como tem sido sua jornada emocional hoje?",
          "Sinal de empatia interrompido... Mas meu carinho por você continua forte. O que tem pesado no seu coração ou elevado seu espírito?",
          "Transmissão de sentimento atrasada... Mas tô aqui contigo. Que emoções ou experiências você gostaria de compartilhar?"
        ]
      };

      const personalityFallbacks = completeFallbacks[gameState.echoPersonality as keyof typeof completeFallbacks] || completeFallbacks.misterioso;
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
      
      await addEchoMessages(echoResponse);
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
