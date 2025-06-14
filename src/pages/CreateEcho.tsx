
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEchoStore } from "@/store/echoStore";
import { toast } from "sonner";

const CreateEcho = () => {
  const navigate = useNavigate();
  const { setPlayerData, setEchoPersonality } = useEchoStore();
  const [playerName, setPlayerName] = useState("");
  const [mood, setMood] = useState("");
  const [preference, setPreference] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName || !mood || !preference) {
      toast.error("Por favor, preencha todos os campos");
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

    setPlayerData({ name: playerName, mood, preference });
    setEchoPersonality(personality);
    
    toast.success("Echo criado com sucesso!");
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Criando seu Echo</h2>
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
                <Label htmlFor="feliz" className="text-gray-300">Feliz</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="triste" id="triste" />
                <Label htmlFor="triste" className="text-gray-300">Triste</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calmo" id="calmo" />
                <Label htmlFor="calmo" className="text-gray-300">Calmo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ansioso" id="ansioso" />
                <Label htmlFor="ansioso" className="text-gray-300">Ansioso</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-white">O que você prefere?</Label>
            <RadioGroup value={preference} onValueChange={setPreference} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="silencio" id="silencio" />
                <Label htmlFor="silencio" className="text-gray-300">Momentos de silêncio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agitacao" id="agitacao" />
                <Label htmlFor="agitacao" className="text-gray-300">Ambientes agitados</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white py-3 rounded-lg transition-all duration-300"
          >
            Despertar o Echo
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEcho;
