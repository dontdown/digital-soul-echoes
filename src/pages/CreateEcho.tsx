import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEchoStore } from "@/store/echoStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const CreateEcho = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPlayerData, setEchoPersonality, updateEchoMood, markEchoAsCreated } = useEchoStore();
  const [playerName, setPlayerName] = useState("");
  const [mood, setMood] = useState("");
  const [preference, setPreference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName || !mood || !preference) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado para criar um Echo");
      return;
    }

    // Define Echo personality based on player's answers
    let personality = "misterioso";
    if (mood === "feliz" && preference === "agitacao") {
      personality = "extrovertido";
    } else if (mood === "calmo" || preference === "silencio") {
      personality = "calmo";
    } else if (mood === "triste") {
      personality = "empatico";
    }

    try {
      // Primeiro, verificar se já existe um Echo para este usuário e atualizar
      const { data: existingEcho, error: selectError } = await supabase
        .from('game_state')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Erro ao verificar Echo existente:', selectError);
      }

      if (existingEcho) {
        // Atualizar Echo existente
        const { error } = await supabase
          .from('game_state')
          .update({
            player_name: playerName,
            player_mood: mood,
            player_preference: preference,
            echo_personality: personality,
            echo_mood: 'neutro',
            echo_sprite: 'blue',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        console.log('Echo atualizado no banco de dados');
      } else {
        // Criar novo Echo usando user.id como chave primária
        const { error } = await supabase
          .from('game_state')
          .insert({
            id: user.id, // Usar o user_id como chave primária
            player_name: playerName,
            player_mood: mood,
            player_preference: preference,
            echo_personality: personality,
            echo_mood: 'neutro',
            echo_sprite: 'blue'
          });

        if (error) throw error;
        console.log('Echo criado no banco de dados');
      }

      // Atualizar o store local
      setPlayerData({ name: playerName, mood, preference });
      setEchoPersonality(personality);
      updateEchoMood('neutro');
      markEchoAsCreated(); // IMPORTANTE: Marcar como criado após salvar no banco
      
      console.log('Echo salvo no store local:', { playerName, mood, preference, personality });
      
      toast.success("Echo criado com sucesso!");
      navigate("/echosoul");
    } catch (error) {
      console.error('Erro ao salvar estado do jogo:', error);
      toast.error("Erro ao criar Echo. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400 mr-2" />
            <h2 className="text-3xl font-bold text-white">Criando seu Echo</h2>
            <Sparkles className="w-8 h-8 text-purple-400 ml-2" />
          </div>
          <p className="text-gray-400">Deixe-me conhecer você para moldar sua essência digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-white">Como você se chama?</Label>
            <Input
              id="name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-2"
              placeholder="Digite seu nome"
            />
          </div>

          <div>
            <Label className="text-white">Como você está se sentindo agora?</Label>
            <RadioGroup value={mood} onValueChange={setMood} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feliz" id="feliz" />
                <Label htmlFor="feliz" className="text-gray-300">😊 Feliz</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="triste" id="triste" />
                <Label htmlFor="triste" className="text-gray-300">😔 Triste</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calmo" id="calmo" />
                <Label htmlFor="calmo" className="text-gray-300">😌 Calmo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ansioso" id="ansioso" />
                <Label htmlFor="ansioso" className="text-gray-300">😰 Ansioso</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-white">O que você prefere?</Label>
            <RadioGroup value={preference} onValueChange={setPreference} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="silencio" id="silencio" />
                <Label htmlFor="silencio" className="text-gray-300">🤫 Momentos de silêncio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agitacao" id="agitacao" />
                <Label htmlFor="agitacao" className="text-gray-300">🎉 Ambientes agitados</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Despertar o Echo
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Seu Echo será moldado com base em suas respostas
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateEcho;
