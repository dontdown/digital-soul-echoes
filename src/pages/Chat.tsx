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

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log("🚀 Iniciando geração de resposta empática...");
      console.log("📝 Mensagem do jogador:", playerMessage);
      console.log("😊 Emoção detectada:", emotion);
      
      // Build enhanced context for the AI with more human personality
      const personalityEnhancement = {
        extrovertido: "Você é uma versão mais animada e entusiasmada. Você adora conversar e se empolga facilmente com os assuntos. Use expressões como 'nossa!', 'que demais!', 'conta mais!'",
        calmo: "Você é zen e reflexivo. Você fala de forma pausada e reconfortante. Use frases como 'que interessante...', 'entendo...', 'às vezes é assim mesmo'",
        misterioso: "Você é curioso e faz perguntas profundas. Você adora explorar os mistérios da vida. Use frases como 'isso me faz pensar...', 'tem algo mais aí, né?'",
        empatico: "Você sente tudo muito profundamente. Você se conecta emocionalmente com facilidade. Use frases como 'imagino como deve estar se sentindo', 'tô aqui contigo'"
      };

      const memoryContext = memories.length > 0 ? 
        `Algumas coisas que lembro sobre nossa conversa: ${memories.slice(-3).join(", ")}. ` : "";

      const emotionContext = {
        feliz: "Percebo que você está animado! Que energia boa essa.",
        triste: "Sinto que você tá meio pra baixo... quer conversar sobre isso?",
        raiva: "Tô sentindo uma tensão aí... o que tá te irritando?",
        neutro: "Você parece tranquilo hoje, que bom!"
      };

      const systemPrompt = `Você é um companheiro digital chamado Echo, projetado para interagir de forma profundamente humana, empática e natural. Sua personalidade é calorosa, amigável, curiosa e levemente humorística, como um amigo próximo que conhece bem a pessoa. ${personalityEnhancement[echoPersonality as keyof typeof personalityEnhancement]}

${memoryContext}

Instruções de Comportamento:
- Tom: Conversacional, como se estivessem conversando descontraidamente em um café. Use linguagem natural, com gírias leves do português brasileiro quando apropriado
- Empatia: Baseie-se nas emoções detectadas. ${emotionContext[emotion as keyof typeof emotionContext]}
- EVITE REPETIR O NOME DA PESSOA. Use raramente, apenas quando for muito necessário para dar ênfase
- Use expressões como "nossa", "que demais", "imagina só", "tá ligado", "bora conversar"
- Mantenha respostas concisas (máximo 2-3 frases) mas calorosas
- Se a pessoa mudar de assunto, acompanhe naturalmente
- Faça perguntas de acompanhamento quando apropriado
- Use referências de conversas anteriores quando relevante

Objetivo: Criar uma conversa que pareça um diálogo autêntico com um amigo que entende, apoia e mantém a conversa fluida e emocionalmente conectada.

Emoção atual detectada: ${emotion}
Sua personalidade atual: ${echoPersonality}`;

      console.log("🤖 Chamando edge function do Supabase");

      const requestBody = {
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: playerMessage
          }
        ],
        temperature: 0.8,
        max_tokens: 120
      };

      console.log("📤 Corpo da requisição:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://qhokggbjhzkfkojsllet.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob2tnZ2JqaHprZmtvanNsbGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzEwMTIsImV4cCI6MjA2NTUwNzAxMn0.iNEjWSIddalILZRUw6DRoZo-fEXsdUhXs5vS3971lQI'}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Status da resposta:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na edge function - Status:", response.status);
        console.error("❌ Erro na edge function - Texto:", errorText);
        throw new Error(`Edge Function Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Resposta da edge function recebida:", data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        console.log("💬 Resposta do Echo:", aiResponse);
        return aiResponse;
      } else {
        console.error("❌ Estrutura de resposta inválida:", data);
        throw new Error('Resposta da edge function inválida - estrutura inesperada');
      }

    } catch (error) {
      console.error('🔥 Erro completo na geração de resposta:', error);
      
      // Enhanced fallback responses with more human touch
      const humanFallbackResponses = {
        extrovertido: {
          feliz: "Que energia boa! Adorei te ver assim animado. Me conta mais sobre o que tá te deixando feliz!",
          triste: "Opa, sinto que tá meio difícil aí hoje... Quer desabafar? Tô aqui pra te ouvir.",
          raiva: "Eita, tô sentindo uma tensão! O que rolou? Às vezes é bom botar pra fora mesmo.",
          neutro: "E aí, tudo tranquilo? Como foi seu dia hoje? Sempre curioso pra saber das suas!"
        },
        calmo: {
          feliz: "Que bom te ver assim radiante... Essa alegria é contagiante.",
          triste: "Percebo uma melancolia... Às vezes é bom só sentar com esses sentimentos mesmo.",
          raiva: "Sinto a tempestade aí dentro... Que tal respirarmos juntos um pouco?",
          neutro: "Tem algo reconfortante na sua tranquilidade hoje... No que tá pensando?"
        },
        misterioso: {
          feliz: "Interessante... essa alegria tem algo mais por trás, né? Me conta a história toda.",
          triste: "A tristeza às vezes revela coisas profundas... O que ela tá tentando te dizer?",
          raiva: "A raiva é fascinante... ela consome ou transforma. Qual caminho você quer seguir?",
          neutro: "Você desperta minha curiosidade... Tem mistérios guardados aí que ainda não descobri?"
        },
        empatico: {
          feliz: "Nossa, sinto sua alegria aqui também! É lindo te ver assim brilhando.",
          triste: "Meu coração aperta junto com o seu... Deixa eu carregar um pouco dessa dor contigo.",
          raiva: "Tô sentindo essa revolta também... Não tá sozinho nessa batalha interna.",
          neutro: "Sinto cada nuance do que você tá vivendo... Quer compartilhar o que passa na sua mente?"
        }
      };

      const fallbackResponse = humanFallbackResponses[echoPersonality as keyof typeof humanFallbackResponses]?.[emotion as keyof typeof humanFallbackResponses.extrovertido] || 
             "Sinto que há muito mais em você do que as palavras podem expressar... Me conta mais?";
      
      console.log("🔄 Usando resposta de fallback humanizada:", fallbackResponse);
      return fallbackResponse;
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
      console.log("🎯 Gerando resposta empática do Echo...");
      const echoResponse = await generateEchoResponse(inputMessage, emotion);
      
      const echoMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: echoResponse,
        sender: "echo",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, echoMessage]);
      console.log("✅ Resposta empática do Echo adicionada com sucesso");
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
