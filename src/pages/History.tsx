
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEchoStore } from "@/store/echoStore";
import { ArrowLeft, Clock } from "lucide-react";

const History = () => {
  const navigate = useNavigate();
  const { memories, playerData } = useEchoStore();

  if (!playerData) {
    navigate("/create-echo");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/chat")}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Chat
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
              onClick={() => navigate("/chat")}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              Começar a conversar
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {memories.map((memory, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 border-4 border-slate-900"></div>
                
                <div className="ml-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Memória #{index + 1}</h3>
                    <span className="text-sm text-gray-400">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed">{memory}</p>
                  
                  <div className="mt-4 text-sm text-cyan-400 italic">
                    "Esta memória faz parte de quem eu sou agora." - Echo
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
