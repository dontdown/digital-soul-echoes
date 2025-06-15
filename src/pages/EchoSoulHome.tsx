
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEchoStore } from '@/store/echoStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import LanguageSelector from '@/components/LanguageSelector';
import { Sparkles, MessageCircle, User, Heart, Eye, History, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const EchoSoulHome = () => {
  const navigate = useNavigate();
  const { playerData, echoPersonality, echoMood, echoCreated } = useEchoStore();
  const { t } = useLanguage();
  const { signOut } = useAuth();

  const handleConversar = () => {
    console.log('Tentando acessar conversa. Echo criado:', echoCreated, 'Player data:', playerData);
    
    if (!echoCreated || !playerData) {
      toast.error('Você precisa criar seu Echo primeiro! 🎭', {
        description: 'Vá para "Criar Echo" antes de começar a conversar.',
        action: {
          label: 'Criar Echo',
          onClick: () => navigate('/create-echo')
        }
      });
      return;
    }
    
    navigate('/echosoul');
  };

  const handleCriarEcho = () => {
    navigate('/create-echo');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navigation */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-slate-900"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
              Echo<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Soul</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>

            {/* Status do Echo */}
            {echoCreated && playerData ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-600 rounded-2xl p-6 max-w-md mx-auto mb-8"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-cyan-400 font-semibold">{t('home.echoActive')}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('common.name')}:</span>
                    <span className="text-white">{playerData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('common.personality')}:</span>
                    <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">
                      {echoPersonality}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('common.mood')}:</span>
                    <Badge variant="secondary" className="bg-cyan-900/50 text-cyan-300">
                      {echoMood}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800/30 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 max-w-md mx-auto mb-8"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-gray-400 font-semibold">{t('home.noEcho')}</span>
                </div>
                <p className="text-gray-500 text-sm">
                  {t('home.createEchoDesc')}
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleConversar}
                className={`${
                  echoCreated && playerData 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed hover:bg-gray-600'
                } px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105`}
                disabled={!echoCreated || !playerData}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('home.chat')}
                {(!echoCreated || !playerData) && (
                  <span className="ml-2 text-xs opacity-75">{t('home.createFirst')}</span>
                )}
              </Button>
              
              <Button
                onClick={handleCriarEcho}
                variant="outline"
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
              >
                <User className="w-5 h-5 mr-2" />
                {echoCreated ? t('home.recreateEcho') : t('home.createEcho')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Feature Cards */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-600 hover:border-cyan-400/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-cyan-400">
                <Eye className="w-6 h-6 mr-2" />
                {t('home.facial.title')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('home.facial.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-600 hover:border-purple-400/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-400">
                <Heart className="w-6 h-6 mr-2" />
                {t('home.emotional.title')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('home.emotional.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-600 hover:border-pink-400/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-pink-400">
                <History className="w-6 h-6 mr-2" />
                {t('home.memories.title')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('home.memories.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {/* Additional Actions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-8">{t('home.explore')}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/mirror')}
              variant="outline"
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-slate-900 px-6 py-2 rounded-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('home.mirror')}
            </Button>
            
            <Button
              onClick={() => navigate('/history')}
              variant="outline"
              className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-slate-900 px-6 py-2 rounded-full"
            >
              <History className="w-4 h-4 mr-2" />
              {t('home.timeline')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EchoSoulHome;
