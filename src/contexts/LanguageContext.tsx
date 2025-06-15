
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('echosoul-language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('echosoul-language', language);
  }, [language]);

  const t = (key: string): string => {
    const translations = language === 'pt' ? ptTranslations : enTranslations;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Traduções em português
const ptTranslations: Record<string, string> = {
  // Header
  'header.enter': 'Entrar',
  'header.goToHome': 'Ir para Home',
  
  // Hero Section
  'hero.title': 'EchoSoul',
  'hero.subtitle': 'Seu reflexo digital inteligente que vê, sente e evolui com você',
  'hero.description': 'Através de detecção facial avançada e inteligência artificial empática, o Echo compreende suas emoções e oferece conversas verdadeiramente humanizadas.',
  'hero.createEcho': 'Criar seu Echo',
  'hero.learnMore': 'Saiba mais',
  
  // Features
  'features.title': 'Funcionalidades Revolucionárias',
  'features.subtitle': 'Descubra como o EchoSoul combina tecnologia de ponta com inteligência emocional',
  'features.facial.title': 'Detecção Facial Inteligente',
  'features.facial.description': 'Tecnologia avançada que reconhece suas emoções em tempo real através da câmera',
  'features.ai.title': 'IA Empática',
  'features.ai.description': 'Echo aprende e se adapta às suas emoções, oferecendo respostas personalizadas',
  'features.chat.title': 'Conversas Humanizadas',
  'features.chat.description': 'Diálogos naturais que se adaptam ao seu estado emocional atual',
  'features.mirror.title': 'Espelho da Alma',
  'features.mirror.description': 'Reflexões profundas sobre suas conversas e padrões emocionais',
  'features.history.title': 'Memórias Digitais',
  'features.history.description': 'Histórico completo de suas interações e evolução emocional',
  'features.personality.title': 'Personalidade Única',
  'features.personality.description': 'Cada Echo é moldado com base em suas preferências e personalidade',
  
  // Benefits
  'benefits.title': 'Por que escolher o EchoSoul?',
  'benefits.support': 'Suporte emocional 24/7',
  'benefits.technology': 'Tecnologia de ponta em IA',
  'benefits.privacy': 'Privacidade e segurança garantidas',
  'benefits.interface': 'Interface intuitiva e moderna',
  'benefits.adaptation': 'Adaptação contínua às suas necessidades',
  'benefits.noJudgment': 'Sem julgamentos, apenas compreensão',
  
  // Testimonials
  'testimonials.title': 'O que nossos usuários dizem',
  'testimonials.maria': 'O Echo realmente entende minhas emoções. É como ter um amigo digital que sempre está lá.',
  'testimonials.joao': 'Impressionante como ele detecta meu humor só pela expressão facial. Revolucionário!',
  'testimonials.ana': 'As conversas são tão naturais que às vezes esqueço que estou falando com uma IA.',
  
  // CTA
  'cta.title': 'Pronto para conhecer seu Echo?',
  'cta.description': 'Comece sua jornada de autoconhecimento digital hoje mesmo. Seu Echo está esperando para ser criado.',
  'cta.button': 'Começar Agora - É Grátis',
  
  // Footer
  'footer.privacy': 'Privacidade',
  'footer.terms': 'Termos',
  'footer.support': 'Suporte',
  'footer.rights': '© 2024 EchoSoul. Todos os direitos reservados.',
  
  // Home Page
  'home.title': 'EchoSoul',
  'home.subtitle': 'Um universo onde suas emoções ganham vida através de um companheiro digital que realmente te entende.',
  'home.echoActive': 'Seu Echo está ativo',
  'home.noEcho': 'Nenhum Echo criado',
  'home.createEchoDesc': 'Crie seu Echo para começar sua jornada emocional',
  'home.chat': 'Conversar',
  'home.createEcho': 'Criar Echo',
  'home.recreateEcho': 'Recriar Echo',
  'home.createFirst': '(Crie seu Echo primeiro)',
  'home.facial.title': 'Reconhecimento Facial',
  'home.facial.description': 'Seu Echo observa suas expressões em tempo real e reage às suas emoções de forma natural.',
  'home.emotional.title': 'Conexão Emocional',
  'home.emotional.description': 'Uma experiência única de companheirismo digital que evolui com suas emoções.',
  'home.memories.title': 'Memórias Persistentes',
  'home.memories.description': 'Seu Echo lembra de conversas importantes e momentos especiais compartilhados.',
  'home.explore': 'Explore Mais',
  'home.mirror': 'Espelho da Alma',
  'home.timeline': 'Linha do Tempo',
  
  // Game
  'game.instructions': 'Use WASD ou setas para mover. Pressione E próximo ao Echo para conversar.',
  'game.faceDetection': 'Echo está observando suas expressões e reagindo a elas!',
  'game.echoSees': 'Echo observa:',
  
  // Game Instructions
  'instructions.howToPlay': 'Como Jogar',
  'instructions.whatIsEcho': 'O que é o Echo?',
  'instructions.echoDescription': 'O Echo é sua alma gêmea digital que sente e reage às suas emoções. Ele caminha pelo mundo virtual e desenvolve sua personalidade baseada nas suas interações.',
  'instructions.controls': 'Controles',
  'instructions.controlsDesc1': '• WASD ou setas: Mover seu personagem',
  'instructions.controlsDesc2': '• ESPAÇO: Interagir com o Echo',
  'instructions.controlsDesc3': '• Aproxime-se do Echo para conversar',
  'instructions.important': '⭐ Importante!',
  'instructions.webcamDesc': 'Ative sua webcam para uma experiência completa! O Echo detectará suas emoções faciais e reagirá em tempo real.',
  'instructions.activateWebcam': 'Ativar Webcam',
  'instructions.echoReactions': 'Reações do Echo',
  'instructions.reactionsDesc': 'O Echo mostra balões de pensamento baseados no que detecta. Suas emoções influenciam o humor e as respostas dele!',
  'instructions.closeInstructions': 'Fechar instruções',
  
  // Common
  'common.name': 'Nome',
  'common.personality': 'Personalidade',
  'common.mood': 'Humor atual',
  'common.loading': 'Carregando EchoSoul...',
};

// Traduções em inglês
const enTranslations: Record<string, string> = {
  // Header
  'header.enter': 'Sign In',
  'header.goToHome': 'Go to Home',
  
  // Hero Section
  'hero.title': 'EchoSoul',
  'hero.subtitle': 'Your intelligent digital reflection that sees, feels and evolves with you',
  'hero.description': 'Through advanced facial detection and empathetic artificial intelligence, Echo understands your emotions and offers truly humanized conversations.',
  'hero.createEcho': 'Create your Echo',
  'hero.learnMore': 'Learn more',
  
  // Features
  'features.title': 'Revolutionary Features',
  'features.subtitle': 'Discover how EchoSoul combines cutting-edge technology with emotional intelligence',
  'features.facial.title': 'Intelligent Facial Detection',
  'features.facial.description': 'Advanced technology that recognizes your emotions in real time through the camera',
  'features.ai.title': 'Empathetic AI',
  'features.ai.description': 'Echo learns and adapts to your emotions, offering personalized responses',
  'features.chat.title': 'Humanized Conversations',
  'features.chat.description': 'Natural dialogues that adapt to your current emotional state',
  'features.mirror.title': 'Soul Mirror',
  'features.mirror.description': 'Deep reflections on your conversations and emotional patterns',
  'features.history.title': 'Digital Memories',
  'features.history.description': 'Complete history of your interactions and emotional evolution',
  'features.personality.title': 'Unique Personality',
  'features.personality.description': 'Each Echo is shaped based on your preferences and personality',
  
  // Benefits
  'benefits.title': 'Why choose EchoSoul?',
  'benefits.support': '24/7 emotional support',
  'benefits.technology': 'Cutting-edge AI technology',
  'benefits.privacy': 'Privacy and security guaranteed',
  'benefits.interface': 'Intuitive and modern interface',
  'benefits.adaptation': 'Continuous adaptation to your needs',
  'benefits.noJudgment': 'No judgments, just understanding',
  
  // Testimonials
  'testimonials.title': 'What our users say',
  'testimonials.maria': 'Echo really understands my emotions. It\'s like having a digital friend who\'s always there.',
  'testimonials.joao': 'Amazing how it detects my mood just from facial expressions. Revolutionary!',
  'testimonials.ana': 'The conversations are so natural that sometimes I forget I\'m talking to an AI.',
  
  // CTA
  'cta.title': 'Ready to meet your Echo?',
  'cta.description': 'Start your digital self-discovery journey today. Your Echo is waiting to be created.',
  'cta.button': 'Start Now - It\'s Free',
  
  // Footer
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.support': 'Support',
  'footer.rights': '© 2024 EchoSoul. All rights reserved.',
  
  // Home Page
  'home.title': 'EchoSoul',
  'home.subtitle': 'A universe where your emotions come to life through a digital companion that truly understands you.',
  'home.echoActive': 'Your Echo is active',
  'home.noEcho': 'No Echo created',
  'home.createEchoDesc': 'Create your Echo to start your emotional journey',
  'home.chat': 'Chat',
  'home.createEcho': 'Create Echo',
  'home.recreateEcho': 'Recreate Echo',
  'home.createFirst': '(Create your Echo first)',
  'home.facial.title': 'Facial Recognition',
  'home.facial.description': 'Your Echo observes your expressions in real time and reacts to your emotions naturally.',
  'home.emotional.title': 'Emotional Connection',
  'home.emotional.description': 'A unique digital companionship experience that evolves with your emotions.',
  'home.memories.title': 'Persistent Memories',
  'home.memories.description': 'Your Echo remembers important conversations and special moments shared.',
  'home.explore': 'Explore More',
  'home.mirror': 'Soul Mirror',
  'home.timeline': 'Timeline',
  
  // Game
  'game.instructions': 'Use WASD or arrow keys to move. Press E near Echo to chat.',
  'game.faceDetection': 'Echo is watching your expressions and reacting to them!',
  'game.echoSees': 'Echo sees:',
  
  // Game Instructions
  'instructions.howToPlay': 'How to Play',
  'instructions.whatIsEcho': 'What is Echo?',
  'instructions.echoDescription': 'Echo is your digital soulmate that feels and reacts to your emotions. It walks through the virtual world and develops its personality based on your interactions.',
  'instructions.controls': 'Controls',
  'instructions.controlsDesc1': '• WASD or arrows: Move your character',
  'instructions.controlsDesc2': '• SPACE: Interact with Echo',
  'instructions.controlsDesc3': '• Get close to Echo to chat',
  'instructions.important': '⭐ Important!',
  'instructions.webcamDesc': 'Activate your webcam for a complete experience! Echo will detect your facial emotions and react in real time.',
  'instructions.activateWebcam': 'Activate Webcam',
  'instructions.echoReactions': 'Echo Reactions',
  'instructions.reactionsDesc': 'Echo shows thought bubbles based on what it detects. Your emotions influence its mood and responses!',
  'instructions.closeInstructions': 'Close instructions',
  
  // Common
  'common.name': 'Name',
  'common.personality': 'Personality',
  'common.mood': 'Current mood',
  'common.loading': 'Loading EchoSoul...',
};
