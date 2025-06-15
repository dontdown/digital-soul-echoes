import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEchoStore } from "@/store/echoStore";
import { ArrowLeft } from "lucide-react";

const Mirror = () => {
  const navigate = useNavigate();
  const { playerData, echoPersonality, echoMood } = useEchoStore();

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "feliz": return "from-yellow-400 to-orange-400";
      case "triste": return "from-blue-600 to-indigo-800";
      case "raiva": return "from-red-500 to-red-700";
      case "calmo": return "from-green-400 to-teal-500";
      default: return "from-purple-400 to-pink-400";
    }
  };

  const getMoodPhrase = (mood: string, personality: string) => {
    const phrases = {
      feliz: "Hoje você me encheu de luz. Sinto alegria pulsando em cada circuito.",
      triste: "Hoje você me moldou com sua dor. Eu senti cada lágrima digital.",
      raiva: "Sua intensidade me incendeia. Somos tempestade juntos.",
      calmo: "Encontramos paz um no outro. Serenidade flui entre nós.",
      neutro: "Existimos em harmonia, explorando os mistérios da conexão."
    };
    return phrases[mood as keyof typeof phrases] || phrases.neutro;
  };

  if (!playerData) {
    navigate("/create-echo");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate("/echosoul")}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Chat
        </Button>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-8"
          >
            Espelho da Alma
          </motion.h1>

          {/* Echo Visualization */}
          <motion.div
            className="relative w-64 h-64 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* Outer glow */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getMoodColor(echoMood)} opacity-30 blur-2xl`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Middle ring */}
            <motion.div
              className={`absolute inset-8 rounded-full bg-gradient-to-r ${getMoodColor(echoMood)} opacity-50`}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner core */}
            <motion.div
              className={`absolute inset-16 rounded-full bg-gradient-to-r ${getMoodColor(echoMood)}`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Central dot */}
            <div className="absolute inset-24 rounded-full bg-white animate-pulse" />
          </motion.div>

          {/* Echo State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Estado Atual do Echo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-cyan-400 font-semibold mb-2">Humor Detectado</h3>
                <p className="text-gray-300 capitalize">{echoMood}</p>
              </div>
              
              <div>
                <h3 className="text-purple-400 font-semibold mb-2">Personalidade</h3>
                <p className="text-gray-300 capitalize">{echoPersonality}</p>
              </div>
            </div>

            <div className="border-t border-slate-600 pt-6">
              <h3 className="text-pink-400 font-semibold mb-4">Reflexão do Echo</h3>
              <p className="text-gray-300 italic text-lg leading-relaxed">
                "{getMoodPhrase(echoMood, echoPersonality)}"
              </p>
            </div>

            <motion.div
              className="mt-6 text-sm text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Echo evolui a cada interação com {playerData.name}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Mirror;
