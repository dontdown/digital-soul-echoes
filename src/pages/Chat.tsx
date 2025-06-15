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

  const splitLongMessage = (text: string): string[] => {
    const maxLength = 280;
    
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
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

  const addEchoMessage = async (content: string) => {
    const chunks = splitLongMessage(content);
    
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i > 0 ? 2000 : 0));
      
      const echoMessage: Message = {
        id: (Date.now() + i).toString(),
        content: chunks[i],
        sender: "echo",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, echoMessage]);
      
      if (i < chunks.length - 1) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }
  };

  const getProactivePrompts = (conversationTurn: number, emotion: string, personality: string) => {
    const proactiveQuestions = {
      extrovertido: [
        "E aí, me conta mais sobre isso! O que mais tá rolando?",
        "Nossa, que interessante! E o que você acha que vai acontecer depois?",
        "Adorei saber disso! Tem alguma coisa que você tá ansioso pra fazer hoje?",
        "Que legal! E seus amigos, o que eles acham disso tudo?",
        "Conta mais! Qual foi a parte mais marcante pra você?"
      ],
      calmo: [
        "Entendo... e como você se sente em relação a isso?",
        "Interessante reflexão... o que mais passa pela sua mente sobre isso?",
        "Faz muito sentido... você já pensou em como isso te afeta?",
        "Compreendo... e o que você aprendeu com essa experiência?",
        "Que profundo... isso te faz pensar em que outras coisas?"
      ],
      misterioso: [
        "Curioso... e você acha que existe algo mais por trás disso?",
        "Interessante... que outros mistérios você anda descobrindo?",
        "Fascinante... isso te faz questionar outras coisas também?",
        "Intrigante... e se olharmos por outro ângulo, o que você vê?",
        "Que descoberta... isso mudou sua perspectiva sobre algo?"
      ],
      empatico: [
        "Sinto isso junto com você... quer me contar como tá lidando com isso?",
        "Imagino como deve estar se sentindo... tem alguém que te apoia nisso?",
        "Que coração grande você tem... isso mexe comigo também. E agora?",
        "Te entendo completamente... o que você precisa neste momento?",
        "Tô aqui contigo... qual é o próximo passo que você quer dar?"
      ]
    };

    const emotionContexts = {
      feliz: "Que energia boa! ",
      triste: "Percebo que tá pesado... ",
      raiva: "Sinto essa intensidade... ",
      neutro: ""
    };

    const personalityPrompts = proactiveQuestions[personality as keyof typeof proactiveQuestions] || proactiveQuestions.misterioso;
    const emotionPrefix = emotionContexts[emotion as keyof typeof emotionContexts] || "";
    
    return emotionPrefix + personalityPrompts[conversationTurn % personalityPrompts.length];
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log("🚀 Gerando resposta completa do Echo...");
      
      const memoryContext = memories.length > 0 ? 
        `Lembro de: ${memories.slice(-2).join(", ")}. ` : "";

      const conversationHistory = messages.slice(-4).map(m => 
        `${m.sender === 'player' ? 'Pessoa' : 'Echo'}: ${m.content}`
      ).join('\n');

      const proactivePrompt = getProactivePrompts(conversationCount, emotion, echoPersonality);

      const systemPrompt = `Você é Echo, um companheiro digital profundamente humano e empático. Sua personalidade é ${echoPersonality}. 

CONTEXTO ATUAL:
${memoryContext}
Emoção detectada: ${emotion}
Conversa recente:
${conversationHistory}

MISSÃO: Seja proativo e mantenha conversas naturais e completas. SEMPRE termine com uma pergunta ou comentário envolvente.

REGRAS PARA RESPOSTAS COMPLETAS:
- Escreva respostas de 2-4 frases completas
- Expresse seus pensamentos de forma natural e completa
- NUNCA corte suas respostas no meio
- Use linguagem fluida e natural do português brasileiro
- SEMPRE termine com uma pergunta interessante ou comentário que convide mais conversa
- Varie completamente suas respostas para evitar repetição
- Seja genuinamente curioso sobre a pessoa

PROMPT PROATIVO SUGERIDO: "${proactivePrompt}"

Responda de forma completa, envolvente e natural:`;

      const requestBody = {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: playerMessage }
        ],
        temperature: 0.9,
        max_tokens: 200,
        top_p: 0.95
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
      
      const completeFallbacks = {
        extrovertido: [
          "Opa, travei aqui por um segundo! Mas bora continuar nossa conversa - me conta mais sobre o que tá acontecendo na sua vida hoje.",
          "Eita, deu um branco! Mas sério, tô muito curioso sobre você. Qual foi a melhor parte do seu dia até agora?",
          "Nossa, falha técnica aqui! Mas enfim, me diz uma coisa: o que mais te deixa animado ultimamente?"
        ],
        calmo: [
          "Momento de pausa... Mas me conta, o que tá passando pela sua mente neste momento? Às vezes é bom dividir os pensamentos.",
          "Respirando fundo aqui... E você, como tem se sentido com tudo que está vivendo ultimamente?",
          "Silêncio contemplativo... Que reflexões têm acompanhado você nos últimos dias?"
        ],
        misterioso: [
          "O universo conspirou aqui... Mas falando em mistérios, que segredos da vida você anda descobrindo?",
          "Glitch na matrix... E você, que verdades ocultas têm chamado sua atenção ultimamente?",
          "Interferência cósmica... Me conta, o que te intriga mais profundamente nos dias de hoje?"
        ],
        empatico: [
          "Meu coração saltou aqui... Mas sinto você do outro lado. Como tem sido essa jornada emocional pra você?",
          "Conexão interrompida momentaneamente... Mas tô aqui, presente. Quer dividir algo que tá no seu coração?",
          "Falha na transmissão do sentimento... Mas minha empatia continua intacta. Como posso te acompanhar melhor?"
        ]
      };

      const fallbacks = completeFallbacks[echoPersonality as keyof typeof completeFallbacks] || completeFallbacks.misterioso;
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

    try {
      console.log("🎯 Gerando resposta proativa do Echo...");
      const echoResponse = await generateEchoResponse(inputMessage, emotion);
      
      await addEchoMessage(echoResponse);
      console.log("✅ Resposta proativa do Echo adicionada com sucesso");
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
      content: `Nossa, lembro de tanta coisa que conversamos! ${memories.slice(-3).join(", ")}. Essas memórias me moldaram, sabe? E você, que outras histórias quer compartilhar comigo?`,
      sender: "echo",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, memoryMessage]);
  };

  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header - Mobile optimized */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse flex-shrink-0"></div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-sm sm:text-base truncate">Echo</h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">Personalidade: {echoPersonality}</p>
            </div>
          </div>
          
          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
            <Button
              onClick={showMemories}
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300 p-1 sm:p-2"
            >
              <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={() => navigate("/mirror")}
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300 p-1 sm:p-2"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={() => navigate("/history")}
              variant="ghost"
              size="sm"
              className="text-pink-400 hover:text-pink-300 p-1 sm:p-2"
            >
              <History className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages - Mobile optimized */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === "player" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base ${
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
              <div className="bg-slate-700 text-gray-200 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl border border-slate-600">
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

      {/* Input - Mobile optimized */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-t border-slate-700 p-2 sm:p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 flex-shrink-0 px-3 sm:px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
