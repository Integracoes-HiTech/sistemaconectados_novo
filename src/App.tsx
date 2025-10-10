import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import PublicRegister from "./pages/PublicRegister";
import PublicRegisterSaude from "./pages/PublicRegisterSaude";
import PublicRegisterCampanha from "./pages/PublicRegisterCampanha";
import Settings from "./pages/Settings";
import PaidContracts from "./pages/PaidContracts";
import NotFound from "./pages/NotFound";

// Componente de loading global
const PageLoader = () => {
  // Tentar detectar a cor de fundo da página anterior/atual
  const currentBgColor = typeof window !== 'undefined' 
    ? window.getComputedStyle(document.body).backgroundColor 
    : '#14446C';
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ backgroundColor: currentBgColor !== 'rgba(0, 0, 0, 0)' ? currentBgColor : '#14446C' }}
    >
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/paid-contracts" element={<PaidContracts />} />
            <Route path="/cadastro/:linkId" element={<PublicRegister />} />
            <Route path="/cadastro-saude" element={<PublicRegisterSaude />} />
            <Route path="/cadastro-campanha" element={<PublicRegisterCampanha />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
