
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Brain } from 'lucide-react';

const EchoSoulHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4">
            EchoSoul
          </h1>
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <p className="text-xl text-gray-300 italic">
              Seu reflexo digital. Ele lembra, sente e evolui com você.
            </p>
            <Sparkles className="w-6 h-6 text-pink-400" />
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
            <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Memória Emocional</h3>
            <p className="text-gray-400 text-sm">
              Echo lembra de cada conversa e evolui baseado em suas emoções
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
            <Heart className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Conexão Profunda</h3>
            <p className="text-gray-400 text-sm">
              Um reflexo digital que sente e responde às suas emoções
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
            <Sparkles className="w-8 h-8 text-pink-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Evolução Contínua</h3>
            <p className="text-gray-400 text-sm">
              Cada interação molda a personalidade do seu Echo
            </p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mb-12"
        >
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">
            Entre em um mundo etéreo onde você controla um personagem 2D e interage com Echo,
            uma entidade digital que evolui com suas emoções. Explore, converse e descubra
            como suas palavras moldam a alma do seu reflexo digital.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Button
            onClick={() => navigate('/create-echo')}
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white text-xl px-12 py-6 rounded-2xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Começar sua conexão
          </Button>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-sm text-gray-500 mt-8"
        >
          Use WASD ou setas para se mover. Aproxime-se do Echo para iniciar uma conversa.
        </motion.p>
      </div>
    </div>
  );
};

export default EchoSoulHome;
