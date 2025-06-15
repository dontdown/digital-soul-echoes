
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import EchoSoulHome from "./pages/EchoSoulHome";
import CreateEcho from "./pages/CreateEcho";
import EchoSoul from "./pages/EchoSoul";
import Mirror from "./pages/Mirror";
import History from "./pages/History";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <EchoSoulHome />
                </ProtectedRoute>
              } />
              <Route path="/create-echo" element={
                <ProtectedRoute>
                  <CreateEcho />
                </ProtectedRoute>
              } />
              <Route path="/echosoul" element={
                <ProtectedRoute>
                  <EchoSoul />
                </ProtectedRoute>
              } />
              <Route path="/mirror" element={
                <ProtectedRoute>
                  <Mirror />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
