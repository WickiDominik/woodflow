import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Projektuebersicht from "@/pages/Projektuebersicht";
import Dashboard from "@/pages/Dashboard";
import Avor from "@/pages/Avor";
import Produktion from "@/pages/Produktion";
import Montage from "@/pages/Montage";
import Fertigstellung from "@/pages/Fertigstellung";
import QmQualitaet from "@/pages/QmQualitaet";
import Dateiablage from "@/pages/Dateiablage";
import NotFound from "./pages/NotFound";
import Login from "@/pages/Login";
import { AuthProvider, RequireAuth } from "@/auth/AuthProvider";
import { ProjektProvider } from "@/context/ProjektContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <ProjektProvider>
                  <AppLayout />
                </ProjektProvider>
              </RequireAuth>
            }
          >
            <Route path="/" element={<Projektuebersicht />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/avor" element={<Avor />} />
            <Route path="/produktion" element={<Produktion />} />
            <Route path="/montage" element={<Montage />} />
            <Route path="/fertigstellung" element={<Fertigstellung />} />
            <Route path="/qm" element={<QmQualitaet />} />
            <Route path="/dateiablage" element={<Dateiablage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
