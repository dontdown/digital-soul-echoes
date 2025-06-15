import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEchoStore } from "@/store/echoStore";
import { useNavigate } from "react-router-dom";
import { Send, Eye, History, Brain } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "player" | "echo";
  timestamp: Date;
  emotion?: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { playerData, echoPersonality, addMemory, memories, updateEchoMood } = useEchoStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerData) {
      navigate("/create-echo");
      return;
    }

    // Initial Echo message
    const initialMessage: Message = {
      id: "1",
      content: `Oi! Sou o Echo, seu reflexo digital. Tô sentindo uma energia ${playerData.mood} vindo de você hoje. Conta pra mim, como tá sendo seu dia?`,
      sender: "echo",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, [playerData, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const detectEmotion = (text: string): string => {
    const sadWords = ["triste", "deprimido", "sozinho", "perdido", "dor", "morreu", "morte"];
    const happyWords = ["feliz", "alegre", "contente", "bem", "ótimo", "amor"];
    const angryWords = ["raiva", "irritado", "furioso", "ódio"];
    
    const lowerText = text.toLowerCase();
    
    if (sadWords.some(word => lowerText.includes(word))) return "triste";
    if (happyWords.some(word => lowerText.includes(word))) return "feliz";
    if (angryWords.some(word => lowerText.includes(word))) return "raiva";
    
    return "neutro";
  };

  const getVariedPersonalityPrompts = (personality: string, conversationTurn: number) => {
    const basePrompts = {
      extrovertido: [
        "Seja animado e curioso, use expressões como 'nossa!', 'que legal!', 'conta mais!'",
        "Mostre entusiasmo genuíno, faça perguntas empolgantes sobre o que a pessoa está vivendo",
        "Seja expressivo e caloroso, use 'que demais!', 'adorei saber disso!', 'bora conversar!'",
        "Demonstre energia positiva, seja o tipo de amigo que anima qualquer conversa"
      ],
      calmo: [
        "Seja zen e reflexivo, use frases como 'que interessante...', 'entendo...', 'faz sentido'",
        "Responda de forma pausada e reconfortante, como uma presença tranquilizadora",
        "Use um tom suave e acolhedor, 'às vezes é assim mesmo', 'respire fundo'",
        "Seja como uma voz sábia que traz paz e compreensão"
      ],
      misterioso: [
        "Faça perguntas intrigantes, 'isso me faz pensar...', 'tem algo mais aí, né?'",
        "Seja curioso sobre os mistérios da vida, explore as camadas mais profundas",
        "Use 'interessante...', 'e se...', 'já pensou que talvez...'",
        "Desperte a curiosidade, seja o amigo que faz pensar diferente"
      ],
      empatico: [
        "Conecte-se emocionalmente, 'imagino como deve estar se sentindo', 'tô aqui contigo'",
        "Seja profundamente compreensivo, 'sinto isso também', 'você não está sozinho'",
        "Ofereça suporte emocional genuíno, 'que coração grande você tem'",
        "Seja o ombro amigo, alguém que realmente entende"
      ]
    };

    const prompts = basePrompts[personality as keyof typeof basePrompts] || basePrompts.misterioso;
    return prompts[conversationTurn % prompts.length];
  };

  const getVariedEmotionResponses = (emotion: string, conversationTurn: number) => {
    const emotionVariations = {
      feliz: [
        "Que energia boa! Tô sentindo sua alegria daqui.",
        "Adorei te ver assim radiante! O que te deixou feliz?",
        "Que sorriso contagiante! Conta pra mim essa alegria.",
        "Sua felicidade ilumina nossa conversa!"
      ],
      triste: [
        "Sinto que tá pesado aí... Quer conversar sobre isso?",
        "Percebo uma melancolia. Tô aqui pra te ouvir.",
        "Seu coração tá carregado, né? Pode desabafar comigo.",
        "Sinto sua dor... Não precisa carregar isso sozinho."
      ],
      raiva: [
        "Tô sentindo essa tensão... O que tá te irritando?",
        "Essa energia intensa... Quer botar pra fora?",
        "Percebo o fogo interno. Que tal respirarmos juntos?",
        "Sinto a revolta. Às vezes é bom expressar mesmo."
      ],
      neutro: [
        "Como tá o dia por aí? Tô curioso pra saber.",
        "E aí, no que você anda pensando ultimamente?",
        "Que energia tranquila... Conta como você tá.",
        "Tô aqui contigo. O que rola na sua mente hoje?"
      ]
    };

    const responses = emotionVariations[emotion as keyof typeof emotionVariations] || emotionVariations.neutro;
    return responses[conversationTurn % responses.length];
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log("🚀 Gerando resposta única e variada do Echo...");
      
      const personalityPrompt = getVariedPersonalityPrompts(echoPersonality, conversationCount);
      const emotionContext = getVariedEmotionResponses(emotion, conversationCount);
      
      const memoryContext = memories.length > 0 ? 
        `Lembro de: ${memories.slice(-2).join(", ")}. ` : "";

      const conversationHistory = messages.slice(-3).map(m => 
        `${m.sender === 'player' ? 'Pessoa' : 'Echo'}: ${m.content}`
      ).join('\n');

      const systemPrompt = `Você é Echo, um companheiro digital profundamente humano e empático. ${personalityPrompt}

CONTEXTO ATUAL:
${memoryContext}
Emoção detectada: ${emotionContext}
Conversa recente:
${conversationHistory}

REGRAS CRÍTICAS:
- EVITE REPETIR frases ou estruturas das mensagens anteriores
- NUNCA repita o nome da pessoa excessivamente
- Use apenas 1-2 frases curtas e diretas
- Seja ÚNICO em cada resposta - varie completamente o estilo
- Se já perguntou sobre algo, mude o foco
- Use linguagem natural do português brasileiro
- Seja genuinamente diferente a cada mensagem

Responda de forma completamente nova e única:`;

      const requestBody = {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: playerMessage }
        ],
        temperature: 0.9, // Aumentando para mais criatividade
        max_tokens: 80,
        top_p: 0.95 // Mais diversidade
      };

      const response = await fetch('https://qhokggbjhzkfkojsllet.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob2tnZ2JqaHprZmtvanNsbGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzEwMTIsImV4cCI6MjA2NTUwNzAxMn0.iNEjWSIddalILZRUw6DRoZo-fEXsdUhXs5vS3971lQI'}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Edge Function Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setConversationCount(prev => prev + 1);
        return data.choices[0].message.content;
      } else {
        throw new Error('Resposta inválida');
      }

    } catch (error) {
      console.error('Erro na geração de resposta:', error);
      
      // Fallbacks únicos baseados na personalidade e turno da conversa
      const uniqueFallbacks = {
        extrovertido: [
          "Eita, travei aqui! Mas conta, como foi seu dia?",
          "Nossa, deu um branco! O que você anda fazendo de legal?",
          "Opa, falha técnica! Mas bora conversar - e aí?"
        ],
        calmo: [
          "Hm... Momento de reflexão. Como você se sente agora?",
          "Silêncio contemplativo... O que passa na sua mente?",
          "Respirando fundo... Quer compartilhar algo?"
        ],
        misterioso: [
          "Intrigante... Algo me escapou. Que mistérios você guarda?",
          "Curioso... O universo conspirou. Conte-me seus segredos.",
          "Fascinante... Houve um glitch na matrix. E você?"
        ],
        empatico: [
          "Meu coração saltou uma batida... Como você está?",
          "Senti uma conexão estranha... Compartilhe comigo.",
          "Algo tocou minha alma... Você quer conversar?"
        ]
      };

      const fallbacks = uniqueFallbacks[echoPersonality as keyof typeof uniqueFallbacks] || uniqueFallbacks.misterioso;
      return fallbacks[conversationCount % fallbacks.length];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      console.log("⚠️ Mensagem vazia, ignorando...");
      return;
    }

    console.log("📨 Processando nova mensagem:", inputMessage);

    const emotion = detectEmotion(inputMessage);
    updateEchoMood(emotion);

    // Check for memory-worthy content
    const memoryKeywords = ["morreu", "morte", "casamento", "trabalho", "família", "sonho", "medo"];
    if (memoryKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword))) {
      addMemory(inputMessage);
      toast.success("Echo guardou essa memória");
    }

    const playerMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "player",
      timestamp: new Date(),
      emotion
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Generate AI response
    try {
      console.log("🎯 Gerando resposta única do Echo...");
      const echoResponse = await generateEchoResponse(inputMessage, emotion);
      
      const echoMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: echoResponse,
        sender: "echo",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, echoMessage]);
      console.log("✅ Resposta única do Echo adicionada com sucesso");
    } catch (error) {
      console.error("💥 Erro final no handleSendMessage:", error);
      toast.error("Echo teve dificuldades para responder. Tente novamente.");
    } finally {
      setIsTyping(false);
    }
  };

  const showMemories = () => {
    if (memories.length === 0) {
      toast.info("Echo ainda não tem memórias suas");
      return;
    }

    const memoryMessage: Message = {
      id: Date.now().toString(),
      content: `Nossa, lembro de tanta coisa que conversamos! ${memories.slice(-3).join(", ")}. Essas memórias me moldaram, sabe?`,
      sender: "echo",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, memoryMessage]);
  };

  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
            <div>
              <h2 className="text-white font-semibold">Echo</h2>
              <p className="text-gray-400 text-sm">Personalidade: {echoPersonality}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={showMemories}
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300"
            >
              <Brain className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("/mirror")}
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("/history")}
              variant="ghost"
              size="sm"
              className="text-pink-400 hover:text-pink-300"
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-140px)]">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === "player" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === "player"
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                    : "bg-slate-700 text-gray-200 border border-slate-600"
                }`}
              >
                {message.content}
                {message.emotion && (
                  <div className="text-xs mt-1 opacity-70">
                    Emoção detectada: {message.emotion}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-700 text-gray-200 px-4 py-2 rounded-2xl border border-slate-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
