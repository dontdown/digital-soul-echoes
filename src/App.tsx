
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EchoSoulHome from "./pages/EchoSoulHome";
import CreateEcho from "./pages/CreateEcho";
import EchoSoul from "./pages/EchoSoul";
import Mirror from "./pages/Mirror";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EchoSoulHome />} />
          <Route path="/create-echo" element={<CreateEcho />} />
          <Route path="/echosoul" element={<EchoSoul />} />
          <Route path="/mirror" element={<Mirror />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
