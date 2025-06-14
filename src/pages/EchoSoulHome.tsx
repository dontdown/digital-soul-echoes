
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";

const EchoSoulHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header com informações do usuário */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-blue-600 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">
              {user?.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className="text-blue-200 text-sm">{user?.email}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="text-white border-white hover:bg-white hover:text-blue-900"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">
            ECHOSOUL
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            Conecte-se com seu eco interior
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white text-xl">Criar Echo</CardTitle>
              <CardDescription className="text-blue-200">
                Configure sua personalidade digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/create-echo')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Começar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white text-xl">Conversar</CardTitle>
              <CardDescription className="text-blue-200">
                Interaja com seu Echo pessoal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/echosoul')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Conversar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white text-xl">Espelho</CardTitle>
              <CardDescription className="text-blue-200">
                Reflexões sobre suas conversas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/mirror')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Refletir
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white text-xl">Histórico</CardTitle>
              <CardDescription className="text-blue-200">
                Reveja suas conversas passadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/history')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-blue-200 text-sm">
            Bem-vindo de volta, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EchoSoulHome;
