import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import RegistrationManagementPage from "./pages/RegistrationManagementPage";
import AssuresPage from "./pages/AssuresPage";
import AssureDetailsPage from "./pages/AssureDetailsPage";
import NewAssurePage from "./pages/NewAssurePage";
import PolicesPage from "./pages/PolicesPage";
import NewPolicePage from "./pages/NewPolicePage";
import SinistresPage from "./pages/SinistresPage";
import SinistreDetailsPage from "./pages/SinistreDetailsPage";
import RemboursementsPage from "./pages/RemboursementsPage";
import PrestatairesPage from "./pages/PrestatairesPage";
import NewPrestatairePage from "./pages/NewPrestatairePage";
import EditPrestatairePage from "./pages/EditPrestatairePage";
import CartesPage from "./pages/CartesPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import NewConsultationPage from "./pages/NewConsultationPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import NewPrescriptionPage from "./pages/NewPrescriptionPage";
import PrescriptionDetailsPage from "./pages/PrescriptionDetailsPage";
import MaladieGroupePage from "./pages/MaladieGroupePage";
import NewGroupePage from "./pages/NewGroupePage";
import MaladieFamillePage from "./pages/MaladieFamillePage";
import NewFamillePage from "./pages/NewFamillePage";
import AdminProfilePage from "./pages/AdminProfilePage";
import ArchivePage from "./pages/ArchivePage";
import ConditionsGeneralesPage from "./pages/ConditionsGeneralesPage";
import ContactPage from "./pages/ContactPage";
import UsersPage from "./pages/UsersPage";
import StatistiquesPage from "./pages/StatistiquesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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

            {/* Routes accessibles à tous les utilisateurs connectés */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<AdminProfilePage />} />} />
            <Route path="/polices" element={<ProtectedRoute element={<PolicesPage />} />} />
            <Route path="/sinistres" element={<ProtectedRoute element={<SinistresPage />} />} />
            <Route path="/sinistres/:id" element={<ProtectedRoute element={<SinistreDetailsPage />} />} />
            <Route path="/remboursements" element={<ProtectedRoute element={<RemboursementsPage />} />} />
            <Route path="/cartes" element={<ProtectedRoute element={<CartesPage />} />} />
            <Route path="/prescriptions" element={<ProtectedRoute element={<PrescriptionsPage />} />} />
            <Route path="/prescriptions/:id" element={<ProtectedRoute element={<PrescriptionDetailsPage />} />} />

            {/* Routes admin uniquement */}
            <Route path="/statistiques" element={<ProtectedRoute element={<StatistiquesPage />} requiredRoles={['admin']} />} />
            <Route path="/users" element={<ProtectedRoute element={<UsersPage />} requiredRoles={['admin']} />} />
            <Route path="/registrations" element={<ProtectedRoute element={<RegistrationManagementPage />} requiredRoles={['admin']} />} />
            <Route path="/assures" element={<ProtectedRoute element={<AssuresPage />} requiredRoles={['admin']} />} />
            <Route path="/assures/new" element={<ProtectedRoute element={<NewAssurePage />} requiredRoles={['admin']} />} />
            <Route path="/assures/:id" element={<ProtectedRoute element={<AssureDetailsPage />} requiredRoles={['admin']} />} />
            <Route path="/polices/new" element={<ProtectedRoute element={<NewPolicePage />} requiredRoles={['admin']} />} />
            <Route path="/maladie-famille" element={<ProtectedRoute element={<MaladieFamillePage />} requiredRoles={['admin']} />} />
            <Route path="/maladie-famille/new" element={<ProtectedRoute element={<NewFamillePage />} requiredRoles={['admin']} />} />
            <Route path="/maladie-groupe" element={<ProtectedRoute element={<MaladieGroupePage />} requiredRoles={['admin']} />} />
            <Route path="/maladie-groupe/new" element={<ProtectedRoute element={<NewGroupePage />} requiredRoles={['admin']} />} />
            <Route path="/conditions-generales" element={<ConditionsGeneralesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/prestataires" element={<ProtectedRoute element={<PrestatairesPage />} requiredRoles={['admin']} />} />
            <Route path="/prestataires/new" element={<ProtectedRoute element={<NewPrestatairePage />} requiredRoles={['admin']} />} />
            <Route path="/prestataires/:id" element={<ProtectedRoute element={<EditPrestatairePage />} requiredRoles={['admin']} />} />
            <Route path="/archives" element={<ProtectedRoute element={<ArchivePage />} requiredRoles={['admin']} />} />

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
);

export default App;
