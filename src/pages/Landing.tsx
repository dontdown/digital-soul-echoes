
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { 
  Brain, 
  Camera, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Eye, 
  History, 
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Redirect logged-in users to home
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    console.log("Navegando para /create-echo");
    navigate("/create-echo");
  };

  const handleLogin = () => {
    console.log("Navegando para /auth");
    if (user) {
      // If user is already logged in, go to home
      navigate("/home");
    } else {
      // If not logged in, go to auth page
      navigate("/auth");
    }
  };

  const handleLearnMore = () => {
    console.log("Scroll para features");
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      const elementTop = featuresSection.getBoundingClientRect().top;
      const offsetPosition = elementTop + window.pageYOffset - 80;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: Camera,
      title: t('features.facial.title'),
      description: t('features.facial.description'),
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Brain,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageCircle,
      title: t('features.chat.title'),
      description: t('features.chat.description'),
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Eye,
      title: t('features.mirror.title'),
      description: t('features.mirror.description'),
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: History,
      title: t('features.history.title'),
      description: t('features.history.description'),
      color: "from-pink-500 to-red-500"
    },
    {
      icon: Sparkles,
      title: t('features.personality.title'),
      description: t('features.personality.description'),
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const benefits = [
    t('benefits.support'),
    t('benefits.technology'),
    t('benefits.privacy'),
    t('benefits.interface'),
    t('benefits.adaptation'),
    t('benefits.noJudgment')
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      text: t('testimonials.maria'),
      emotion: "😊"
    },
    {
      name: "João Santos",
      text: t('testimonials.joao'),
      emotion: "🤩"
    },
    {
      name: "Ana Costa",
      text: t('testimonials.ana'),
      emotion: "💫"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Brain className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">EchoSoul</span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900 transition-all duration-300 font-medium"
          >
            {user ? t('header.goToHome') : t('header.enter')}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.p 
            className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          >
            {t('hero.description')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
            >
              {t('hero.createEcho')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleLearnMore}
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg rounded-full transition-all duration-300 font-medium"
            >
              {t('hero.learnMore')}
            </Button>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          className="mt-16 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <div className="w-64 h-64 mx-auto relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-3xl animate-pulse"></div>
            <div className="absolute inset-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
            <div className="absolute inset-16 rounded-full bg-gradient-to-r from-pink-400 to-cyan-400 animate-bounce"></div>
            
            {/* Emotion indicators */}
            <div className="absolute -top-4 left-12 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>😊</div>
            <div className="absolute top-8 -right-4 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🤔</div>
            <div className="absolute -bottom-4 right-12 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>😌</div>
            <div className="absolute bottom-8 -left-4 text-2xl animate-bounce" style={{ animationDelay: '2s' }}>😃</div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('benefits.title')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-gray-300 text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('testimonials.title')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4 text-center">{testimonial.emotion}</div>
                    <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                    <p className="text-cyan-400 font-semibold">- {testimonial.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-r from-cyan-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-12 py-6 text-xl rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
            >
              {t('cta.button')}
              <Sparkles className="ml-3 w-6 h-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">EchoSoul</span>
          </div>
          
          <div className="flex space-x-6">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              {t('footer.privacy')}
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              {t('footer.terms')}
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              {t('footer.support')}
            </Button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-500">
          {t('footer.rights')}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
