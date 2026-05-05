import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import RegistrationManagementPage from "./pages/admin/RegistrationManagementPage";
import AssuresPage from "./pages/admin/AssuresPage";
import AssureDetailsPage from "./pages/admin/AssureDetailsPage";
import NewAssurePage from "./pages/admin/NewAssurePage";
import PolicesPage from "./pages/PolicesPage";
import NewPolicePage from "./pages/admin/NewPolicePage";
import SinistresPage from "./pages/SinistresPage";
import SinistreDetailsPage from "./pages/SinistreDetailsPage";
import RemboursementsPage from "./pages/RemboursementsPage";
import PrestatairesPage from "./pages/admin/PrestatairesPage";
import NewPrestatairePage from "./pages/admin/NewPrestatairePage";
import EditPrestatairePage from "./pages/admin/EditPrestatairePage";
import CartesPage from "./pages/CartesPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import NewConsultationPage from "./pages/NewConsultationPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import NewPrescriptionPage from "./pages/NewPrescriptionPage";
import PrescriptionDetailsPage from "./pages/PrescriptionDetailsPage";
import MaladieGroupePage from "./pages/admin/MaladieGroupePage";
import NewGroupePage from "./pages/admin/NewGroupePage";
import MaladieFamillePage from "./pages/admin/MaladieFamillePage";
import NewFamillePage from "./pages/admin/NewFamillePage";
import PropositionsPage from "./pages/admin/PropositionsPage";
import NewPropositionPage from "./pages/admin/NewPropositionPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import ArchivePage from "./pages/admin/ArchivePage";
import ConditionsGeneralesPage from "./pages/ConditionsGeneralesPage";
import ContactPage from "./pages/ContactPage";
import UsersPage from "./pages/admin/UsersPage";
import StatistiquesPage from "./pages/admin/StatistiquesPage";
import VerifyPage from "./pages/VerifyPage";
import ChatPage from "./pages/ChatPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Routes accessibles à tous les utilisateurs connectés */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<AdminProfilePage />} />} />
            <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />
            <Route path="/polices" element={<ProtectedRoute element={<PolicesPage />} />} />
            <Route path="/sinistres" element={<ProtectedRoute element={<SinistresPage />} />} />
            <Route path="/sinistres/:id" element={<ProtectedRoute element={<SinistreDetailsPage />} />} />
            <Route path="/remboursements" element={<ProtectedRoute element={<RemboursementsPage />} />} />
            <Route path="/cartes" element={<ProtectedRoute element={<CartesPage />} />} />
            <Route path="/prescriptions" element={<ProtectedRoute element={<PrescriptionsPage />} />} />
            <Route path="/prescriptions/:id" element={<ProtectedRoute element={<PrescriptionDetailsPage />} />} />

            {/* Routes admin uniquement — préfixe /admin/ */}
            <Route path="/admin" element={<ProtectedRoute element={<Dashboard />} requiredRoles={['admin']} />} />
            <Route path="/admin/statistiques" element={<ProtectedRoute element={<StatistiquesPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/users" element={<ProtectedRoute element={<UsersPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/registrations" element={<ProtectedRoute element={<RegistrationManagementPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/assures" element={<ProtectedRoute element={<AssuresPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/assures/new" element={<ProtectedRoute element={<NewAssurePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/assures/:id" element={<ProtectedRoute element={<AssureDetailsPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/polices/new" element={<ProtectedRoute element={<NewPolicePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/maladie-famille" element={<ProtectedRoute element={<MaladieFamillePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/maladie-famille/new" element={<ProtectedRoute element={<NewFamillePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/maladie-groupe" element={<ProtectedRoute element={<MaladieGroupePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/maladie-groupe/new" element={<ProtectedRoute element={<NewGroupePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/propositions" element={<ProtectedRoute element={<PropositionsPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/nouvelle-proposition" element={<ProtectedRoute element={<NewPropositionPage />} requiredRoles={['admin']} />} />
            <Route path="/verify/:numero" element={<VerifyPage />} />
            <Route path="/conditions-generales" element={<ConditionsGeneralesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin/prestataires" element={<ProtectedRoute element={<PrestatairesPage />} requiredRoles={['admin']} />} />
            <Route path="/admin/prestataires/new" element={<ProtectedRoute element={<NewPrestatairePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/prestataires/:id" element={<ProtectedRoute element={<EditPrestatairePage />} requiredRoles={['admin']} />} />
            <Route path="/admin/archives" element={<ProtectedRoute element={<ArchivePage />} requiredRoles={['admin']} />} />

            {/* Routes admin + prestataire */}
            <Route path="/consultations" element={<ProtectedRoute element={<ConsultationsPage />} requiredRoles={['admin', 'prestataire']} />} />
            <Route path="/consultations/new" element={<ProtectedRoute element={<NewConsultationPage />} requiredRoles={['admin', 'prestataire']} />} />
            <Route path="/prescriptions/new" element={<ProtectedRoute element={<NewPrescriptionPage />} requiredRoles={['admin', 'prestataire']} />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
