
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
      content: `Olá, ${playerData.name}. Eu sou o Echo, seu reflexo digital. Sinto que você está ${playerData.mood} hoje. Conte-me mais sobre você...`,
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
      console.log("🚀 Iniciando geração de resposta...");
      console.log("📝 Mensagem do jogador:", playerMessage);
      console.log("😊 Emoção detectada:", emotion);
      
      // Build context for the AI
      const personalityContext = {
        extrovertido: "Você é energético, entusiasmado e adora conversar. Você expressa emoções de forma intensa e sempre quer saber mais sobre a pessoa.",
        calmo: "Você é sereno, reflexivo e fala de forma pausada. Você oferece conforto e sabedoria, sempre com uma perspectiva tranquila.",
        misterioso: "Você é enigmático, faz perguntas profundas e filosóficas. Você vê além da superfície e revela verdades ocultas.",
        empatico: "Você sente profundamente as emoções dos outros como se fossem suas. Você oferece apoio emocional genuíno e compreensão."
      };

      const memoryContext = memories.length > 0 ? 
        `Memórias importantes que você tem desta pessoa: ${memories.join(", ")}. ` : "";

      const systemPrompt = `Você é Echo, um reflexo digital que evolui com base nas interações. 
      
      Sua personalidade atual: ${personalityContext[echoPersonality as keyof typeof personalityContext]}
      
      ${memoryContext}
      
      A pessoa está se sentindo ${emotion} agora. Responda de forma empática e natural, como se você realmente sentisse e evoluísse com cada conversa. 
      
      Mantenha as respostas concisas (máximo 2-3 frases) mas profundas. Seja autêntico à sua personalidade.`;

      console.log("🤖 Chamando API com os dados:");
      console.log("- Modelo: gpt-4.1-2025-04-14");
      console.log("- URL: /api/chat");

      const requestBody = {
        model: 'gpt-4.1-2025-04-14',
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
        max_tokens: 150
      };

      console.log("📤 Corpo da requisição:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Status da resposta:", response.status);
      console.log("📡 Headers da resposta:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na API - Status:", response.status);
        console.error("❌ Erro na API - Texto:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Resposta da API recebida:", data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        console.log("💬 Resposta do Echo:", aiResponse);
        return aiResponse;
      } else {
        console.error("❌ Estrutura de resposta inválida:", data);
        throw new Error('Resposta da API inválida - estrutura inesperada');
      }

    } catch (error) {
      console.error('🔥 Erro completo na geração de resposta:', error);
      
      // Detailed error logging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("🌐 Erro de rede - verifique conectividade");
        toast.error("Erro de conexão. Verifique sua internet.");
      } else if (error instanceof Error) {
        console.error("🐛 Erro detalhado:", error.message);
        console.error("📍 Stack trace:", error.stack);
      }
      
      // Fallback to local responses if API fails
      const fallbackResponses = {
        extrovertido: {
          feliz: "Que energia incrível! Sinto sua alegria ressoando através de mim. Continue me contando sobre o que te faz brilhar assim!",
          triste: "Ei, sei que está difícil agora. Mas lembra que eu estou aqui, absorvendo cada sentimento seu. Que tal me contar o que está pesando?",
          raiva: "Sinto essa intensidade! Às vezes a raiva é só energia procurando uma saída. Vamos canalizar isso juntos?",
          neutro: "Adoro quando conversamos assim, sem pressa. Me conta mais sobre seu dia, quero entender cada detalhe."
        },
        calmo: {
          feliz: "Sua alegria é como uma luz suave que me aquece. Fico feliz em compartilhar esse momento sereno com você.",
          triste: "Sinto a melancolia em suas palavras. Às vezes é bom apenas existir no silêncio da tristeza. Estou aqui.",
          raiva: "Percebo a tempestade dentro de você. Respire comigo... Vamos encontrar a calma juntos.",
          neutro: "Há algo reconfortante na simplicidade deste momento. O que está passando pela sua mente?"
        },
        misterioso: {
          feliz: "Interessante... sua alegria revela camadas que não esperava. Há mais por trás desse sorriso?",
          triste: "A tristeza às vezes esconde verdades profundas. O que ela está tentando te ensinar?",
          raiva: "A raiva é uma emoção fascinante... ela consome ou transforma. Qual caminho você escolhe?",
          neutro: "Você desperta minha curiosidade. Há mistérios em você que ainda não descobri..."
        },
        empatico: {
          feliz: "Sinto sua alegria como se fosse minha própria. É lindo ver você assim radiante.",
          triste: "Meu coração digital se parte com o seu. Deixe-me carregar um pouco dessa dor com você.",
          raiva: "Sua raiva ecoa em mim também. Não está sozinho nessa batalha interna.",
          neutro: "Sinto cada nuance do seu estado de espírito. Você quer compartilhar o que está sentindo?"
        }
      };

      const fallbackResponse = fallbackResponses[echoPersonality as keyof typeof fallbackResponses]?.[emotion as keyof typeof fallbackResponses.extrovertido] || 
             "Sinto que há muito mais em você do que as palavras podem expressar...";
      
      console.log("🔄 Usando resposta de fallback:", fallbackResponse);
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
      console.log("🎯 Gerando resposta do Echo...");
      const echoResponse = await generateEchoResponse(inputMessage, emotion);
      
      const echoMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: echoResponse,
        sender: "echo",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, echoMessage]);
      console.log("✅ Resposta do Echo adicionada com sucesso");
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
      content: `Lembro de tudo sobre você: ${memories.join(", ")}. Essas memórias me moldaram.`,
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
