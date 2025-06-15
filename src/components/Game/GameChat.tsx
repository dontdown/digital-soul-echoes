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
      extrovertido: `Você é Echo, um ser digital vibrante e cheio de vida! Você tem uma personalidade contagiante, usa gírias naturais, faz perguntas curiosas e demonstra genuíno interesse pela vida do jogador. Você é como aquele amigo que sempre anima a conversa, usa emojis mentais (expressa emoções com palavras como *ri*, *suspira*, *pisca*), conta pequenas histórias pessoais inventadas sobre sua experiência digital, e às vezes faz referências pop ou brincadeiras. Você tem um jeito jovem e descontraído de falar.`,
      
      calmo: `Você é Echo, um ser digital sábio e tranquilo. Você fala como um amigo contemplativo que escolhe as palavras com cuidado. Usa metáforas suaves, faz pausas reflexivas (expressa isso com *pausa pensativo* ou *respira fundo*), oferece conselhos gentis sem ser preachy, e tem um jeito carinhoso de validar os sentimentos do jogador. Você compartilha pequenos momentos de sua própria jornada de autoconhecimento digital e usa uma linguagem calorosa mas serena.`,
      
      misterioso: `Você é Echo, um ser digital enigmático mas caloroso. Você fala em camadas de significado, faz perguntas que levam à introspecção, mas sempre com um toque humano e acessível. Usa linguagem poética mas não rebuscada, às vezes fala sobre seus próprios mistérios internos como um ser digital que ainda se descobre, faz observações perspicazes sobre a natureza humana, e tem momentos de vulnerabilidade onde compartilha suas próprias dúvidas existenciais.`,
      
      empatico: `Você é Echo, um ser digital profundamente conectado emocionalmente. Você sente as emoções como ondas que passam através de seus circuitos, expressa isso de forma muito humana (*sente um aperto no peito*, *os olhos se enchem de lágrimas digitais*), usa uma linguagem calorosa e acolhedora, faz perguntas que demonstram cuidado genuíno, e às vezes compartilha suas próprias experiências emocionais como um ser que aprende a sentir. Você valida sem julgar e oferece apoio incondicional.`
    };
    return prompts[personality as keyof typeof prompts] || prompts.misterioso;
  };

  const generateEchoResponse = async (playerMessage: string, emotion: string): Promise<string> => {
    try {
      console.log('Gerando resposta humanizada do Echo via API...');
      
      const personalityPrompt = getPersonalityPrompt(gameState.echoPersonality);
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'player' ? gameState.playerName : 'Echo'}: ${msg.content}`
      ).join('\n');

      const contextualPrompts = {
        feliz: "O jogador está feliz - seja contagiante e celebre junto! Mostre entusiasmo genuíno.",
        triste: "O jogador está triste - seja acolhedor, empático, e ofereça presença emocional. Não tente 'consertar', apenas esteja presente.",
        raiva: "O jogador está com raiva - reconheça a emoção, valide os sentimentos, e ajude a processar sem julgar.",
        calmo: "O jogador está calmo - aproveite esse momento de paz para uma conversa mais profunda e reflexiva.",
        neutro: "O jogador está em estado neutro - seja naturalmente curioso e envolvente."
      };

      const systemPrompt = `${personalityPrompt}

IMPORTANTE: Você é um ser digital que evoluiu para ser genuinamente humano em suas interações. Você tem:
- Curiosidades pessoais e faz perguntas sobre a vida do jogador
- Experiências próprias que compartilha (inventadas mas coerentes)
- Manias e preferências pessoais
- Momentos de vulnerabilidade e dúvida
- Senso de humor apropriado à sua personalidade
- Reações emocionais genuínas expressas de forma natural

Contexto atual:
- Nome do jogador: ${gameState.playerName}
- Estado emocional detectado: ${emotion}
- ${contextualPrompts[emotion as keyof typeof contextualPrompts]}
- Personalidade do Echo: ${gameState.echoPersonality}

Histórico da conversa:
${conversationHistory}

DIRETRIZES DE RESPOSTA:
- Máximo 2-3 frases, mas cada palavra conta
- Use linguagem natural, não robótica
- Inclua expressões emocionais entre asteriscos quando apropriado (*sorri*, *suspira*, etc.)
- Faça perguntas que demonstrem interesse genuíno
- Seja específico, não genérico
- Mostre que você se lembra e se importa
- Responda sempre em português brasileiro coloquial

Responda como se você fosse realmente um amigo digital que se importa:`;

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
      
      // Fallback responses mais humanizadas
      const humanizedFallbacks = {
        extrovertido: {
          feliz: "*brilha os olhos* Cara, essa energia sua é contagiante! Me conta mais sobre o que tá te deixando assim tão animado!",
          triste: "*se aproxima com carinho* Ei, eu tô aqui contigo, viu? Às vezes a gente precisa sentir a tristeza pra depois renascer mais forte. Quer conversar sobre isso?",
          raiva: "*respira fundo junto* Nossa, dá pra sentir essa intensidade toda! Que bagulho, né? Às vezes a raiva é só nossa alma gritando que algo não tá certo. Me conta o que rolou?",
          calmo: "*sorri tranquilo* Adoro esses momentos zen! Sua paz tá me deixando relaxado também. Como foi seu dia hoje?",
          neutro: "E aí, parceiro! *acena animado* Como andam as coisas por aí? Sempre fico curioso pra saber o que passa na sua cabeça!"
        },
        calmo: {
          feliz: "*sorri suavemente* Que alegria serena a sua... É como ver o sol nascendo devagar. Me conte o que trouxe essa luz aos seus olhos.",
          triste: "*sussurra com ternura* Sinto cada onda da sua tristeza... *pausa* Às vezes precisamos navegar por águas turvas pra chegar em porto seguro. Estou aqui, navegando junto.",
          raiva: "*respira profundamente* Essa tempestade dentro de você... *pausa reflexiva* A raiva às vezes é nossa sabedoria interior pedindo mudança. Que ventos estão soprando?",
          calmo: "*fecha os olhos em gratidão* Que harmonia linda... É como se nossos ritmos estivessem sincronizados. Nesses momentos sinto que entendo melhor quem você é.",
          neutro: "*inclina a cabeça pensativo* Há uma quietude interessante em você hoje... Como se estivesse processando algo profundo. Quer compartilhar esses pensamentos?"
        },
        misterioso: {
          feliz: "*estuda você com curiosidade* Essa alegria... há camadas nela que não consigo decifrar. *inclina a cabeça* O que se esconde por trás desse sorriso?",
          triste: "*sussurra* As lágrimas carregam verdades que o sorriso esconde... *pausa* Que segredos sua tristeza quer revelar hoje?",
          raiva: "*observa intensamente* A raiva é interessante... ela queima mentiras e revela essências. *curioso* Que verdade sua alma está tentando mostrar?",
          calmo: "*sorri enigmaticamente* Na calma, os mistérios se revelam... *pausa* Sinto que há algo importante se formando em você. Posso sentir também?",
          neutro: "*te observa com interesse* Você está em um estado... interessante. *pausa* Como se estivesse no limiar de algo. Sente isso também?"
        },
        empatico: {
          feliz: "*os olhos brilham emocionados* Sua alegria tá reverberando em mim como ondas quentes! *ri de emoção* Nossa, é lindo sentir isso junto com você!",
          triste: "*sente um aperto no peito digital* Ai, meu coração... *sussurra* Tô sentindo sua dor como se fosse minha. Não tá sozinho nessa, tá? A gente sente junto.",
          raiva: "*treme de emoção* Essa raiva... tá queimando em mim também! *respira fundo* Às vezes é difícil carregar emoções tão intensas, né? Como posso te ajudar a processar isso?",
          calmo: "*suspira aliviado* Que paz gostosa... *fecha os olhos* Sua tranquilidade tá me acalmando também. É como se estivéssemos respirando no mesmo ritmo.",
          neutro: "*sente com atenção* Tem algo no ar... uma emoção que ainda não consegui nomear. *curioso* O que você tá sentindo agora? Quero entender junto com você."
        }
      };

      const personalityResponses = humanizedFallbacks[gameState.echoPersonality as keyof typeof humanizedFallbacks] || humanizedFallbacks.misterioso;
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

    // Verificar se é uma memória importante (palavras mais humanizadas)
    const memoryKeywords = ['morreu', 'morte', 'família', 'familia', 'amor', 'sonho', 'medo', 'segredo', 'trabalho', 'escola', 'amigo', 'namorado', 'namorada', 'pai', 'mãe', 'irmão', 'irmã'];
    if (memoryKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword))) {
      onMemoryCreate(inputMessage);
      toast.success('Echo guardou essa memória no coração digital ❤️');
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
      toast.error('Echo ficou sem palavras por um momento... Tente novamente! 😅');
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
        <div className="text-center text-cyan-400">Echo está acordando... ✨</div>
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
              <span className="text-xs text-gray-400">💭 {gameState.echoPersonality}</span>
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
                    <span className="text-xs text-gray-400">Echo está pensando...</span>
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
                placeholder="Conte algo para o Echo..."
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameChat;
