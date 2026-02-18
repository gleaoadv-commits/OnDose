import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AddMedication from "@/pages/AddMedication";
import MedicationDetail from "@/pages/MedicationDetail";
import CalendarPage from "@/pages/CalendarPage";
import AgendaPage from "@/pages/AgendaPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PlansPage from "@/pages/PlansPage";
import ProfilePage from "@/pages/ProfilePage";
import IdentifyMedicationPage from "@/pages/IdentifyMedicationPage";
import ReportsPage from "@/pages/ReportsPage";
import CaregiversPage from "@/pages/CaregiversPage";
import ExamsPage from "@/pages/ExamsPage";
import FamilyLinksPage from "@/pages/FamilyLinksPage";
import CaregiverDashboard from "@/pages/CaregiverDashboard";
import PharmaciesPage from "@/pages/PharmaciesPage";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import TermsPage from "@/pages/TermsPage";
import NotFound from "./pages/NotFound";
import MarketingAssetsPage from "@/pages/MarketingAssetsPage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-elder-sm">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function CaregiverGuard({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setAccountType((data as any)?.account_type || "primary");
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (accountType === "caregiver") return <>{fallback}</>;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <CaregiverGuard fallback={<CaregiverDashboard />}>
                    <AppProvider>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/novo-medicamento" element={<AddMedication />} />
                          <Route path="/medicamento/:id" element={<MedicationDetail />} />
                          <Route path="/agenda" element={<AgendaPage />} />
                          <Route path="/calendario" element={<CalendarPage />} />
                          <Route path="/notificacoes" element={<NotificationsPage />} />
                          <Route path="/planos" element={<PlansPage />} />
                          <Route path="/perfil" element={<ProfilePage />} />
                          <Route path="/identificar" element={<IdentifyMedicationPage />} />
                          <Route path="/relatorios" element={<ReportsPage />} />
                          <Route path="/cuidadores" element={<CaregiversPage />} />
                          <Route path="/exames" element={<ExamsPage />} />
                          <Route path="/vinculos" element={<FamilyLinksPage />} />
                          <Route path="/farmacias" element={<PharmaciesPage />} />
                          <Route path="/marketing" element={<MarketingAssetsPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </AppProvider>
                  </CaregiverGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
