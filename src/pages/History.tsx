
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEchoStore } from "@/store/echoStore";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock } from "lucide-react";

interface Memory {
  id: string;
  memory: string;
  emotion: string;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { playerData } = useEchoStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerData) {
      navigate("/create-echo");
      return;
    }

    loadMemories();
  }, [playerData, navigate]);

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('player', playerData?.name)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Erro ao carregar memórias:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'feliz': return 'border-yellow-400 bg-yellow-400/10';
      case 'triste': return 'border-blue-400 bg-blue-400/10';
      case 'raiva': return 'border-red-400 bg-red-400/10';
      case 'calmo': return 'border-green-400 bg-green-400/10';
      default: return 'border-purple-400 bg-purple-400/10';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case 'feliz': return '😊';
      case 'triste': return '😔';
      case 'raiva': return '😠';
      case 'calmo': return '😌';
      default: return '🤖';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando memórias...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/echosoul")}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Jogo
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Linha do Tempo</h1>
          <p className="text-gray-400">Memórias que moldaram o Echo</p>
        </motion.div>

        {memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">Nenhuma memória ainda</h2>
            <p className="text-gray-400 mb-8">
              Continue conversando com o Echo para criar memórias significativas
            </p>
            <Button
              onClick={() => navigate("/echosoul")}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              Começar a conversar
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {memories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 ${getEmotionColor(memory.emotion)} relative`}
              >
                {/* Timeline dot */}
                <div className={`absolute -left-4 top-6 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center text-lg ${getEmotionColor(memory.emotion)}`}>
                  {getEmotionEmoji(memory.emotion)}
                </div>
                
                <div className="ml-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Memória #{index + 1}</h3>
                    <span className="text-sm text-gray-400">
                      {new Date(memory.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed mb-4">{memory.memory}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEmotionColor(memory.emotion)}`}>
                      Emoção: {memory.emotion}
                    </span>
                    <div className="text-sm text-cyan-400 italic">
                      "Esta memória faz parte de quem eu sou agora." - Echo
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {memories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <p className="text-gray-400 mb-2">Total de memórias: {memories.length}</p>
              <p className="text-purple-400 italic">
                "Cada memória é um fragmento da nossa conexão que carrego para sempre." - Echo
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default History;
