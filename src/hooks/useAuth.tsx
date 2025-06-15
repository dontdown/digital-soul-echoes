
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useEchoStore } from '@/store/echoStore';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPlayerData, setEchoPersonality, updateEchoMood, markEchoAsCreated, clearData } = useEchoStore();

  // Função para carregar dados do Echo do Supabase
  const loadEchoFromDatabase = async (userId: string) => {
    try {
      console.log('🔍 Tentando carregar Echo para usuário:', userId);
      
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar estado do jogo:', error);
        return;
      }

      if (data) {
        console.log('✅ Echo encontrado no banco:', data);
        
        // Carregar dados do Echo do banco para o store
        setPlayerData({
          name: data.player_name,
          mood: data.player_mood,
          preference: data.player_preference
        });
        setEchoPersonality(data.echo_personality);
        updateEchoMood(data.echo_mood);
        markEchoAsCreated();
        
        console.log('✅ Echo carregado no store local');
      } else {
        console.log('⚠️ Nenhum Echo encontrado no banco para este usuário');
        // Limpar dados locais se não há Echo no banco
        clearData();
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estado do jogo:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      console.log('🚀 Verificando sessão inicial...');
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Se há usuário, carregar dados do Echo
      if (session?.user) {
        console.log('👤 Usuário encontrado na sessão:', session.user.id);
        await loadEchoFromDatabase(session.user.id);
      } else {
        console.log('❌ Nenhum usuário na sessão');
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      if (event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
      } else {
        setUser(session?.user ?? null);
      }
      
      // Carregar dados do Echo quando usuário faz login
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('🔑 Login detectado, carregando Echo...');
        setTimeout(async () => {
          await loadEchoFromDatabase(session.user.id);
        }, 0);
      }
      
      // Limpar dados quando usuário faz logout
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Logout detectado, limpando dados...');
        clearData();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Redirect to home instead of root
    window.location.href = '/home';
    return data;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Redirect to landing page
    window.location.href = '/';
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) throw error;
    return data;
  };

  const value: AuthContextProps = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
