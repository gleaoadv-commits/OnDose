import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AddMedication from "@/pages/AddMedication";
import MedicationDetail from "@/pages/MedicationDetail";
import CalendarPage from "@/pages/CalendarPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PlansPage from "@/pages/PlansPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/novo-medicamento" element={<AddMedication />} />
              <Route path="/medicamento/:id" element={<MedicationDetail />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
