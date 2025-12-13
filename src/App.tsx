import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { RequireAuth } from "./components/guards/RequireAuth";
import { RequireRole } from "./components/guards/RequireRole";
import Index from "./pages/Index";
import MyWorkspace from "./pages/MyWorkspace";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
import { AppLayout } from "./components/AppLayout";

// Audit Core Pages
import AuditUniverse from "./pages/audit/AuditUniverse";
import RiskAssessments from "./pages/audit/RiskAssessments";
import AuditPlans from "./pages/audit/AuditPlans";
import ActiveAuditsList from "./pages/audit/ActiveAuditsList";
import FindingsManagement from "./pages/audit/FindingsManagement";
import AuditWorkpapers from "./pages/audit/AuditWorkpapers";
import WorkpapersLanding from "./pages/audit/WorkpapersLanding";
import WorkpaperEditor from "./pages/audit/WorkpaperEditor";
import ProgramLibrary from "./pages/audit/ProgramLibrary";
import ProgramDetail from "./pages/audit/ProgramDetail";
import ProcedureLibrary from "./pages/audit/ProcedureLibrary";
import ProcedureAssignment from "./pages/audit/ProcedureAssignment";
import MyProcedures from "./pages/audit/MyProcedures";
import ProgramAnalytics from "./pages/audit/ProgramAnalytics";
import ProcedureReviewQueue from "./pages/audit/ProcedureReviewQueue";
import QualityControlDashboard from "./pages/audit/QualityControlDashboard";
import EvidenceLibrary from "./pages/audit/EvidenceLibrary";
import TaskBoard from "./pages/audit/TaskBoard";
import InformationRequests from "./pages/audit/InformationRequests";

// Audit Tools
import MaterialityCalculatorPage from "./pages/audit-tools/MaterialityCalculatorPage";
import SamplingCalculatorPage from "./pages/audit-tools/SamplingCalculatorPage";
import ConfirmationTrackerPage from "./pages/audit-tools/ConfirmationTrackerPage";
import AnalyticalProceduresPage from "./pages/audit-tools/AnalyticalProceduresPage";

// Engagement (Audit context only)
import EngagementList from "./pages/engagement/EngagementList";
import EngagementDetail from "./pages/engagement/EngagementDetail";
import EngagementDetailAudit from "./pages/engagement/EngagementDetailAudit";
import EngagementTemplates from "./pages/engagement/EngagementTemplates";
import ApprovalDashboard from "./pages/engagement/ApprovalDashboard";

// Admin
import UserManagement from "./pages/admin/UserManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/accept-invite/:token" element={<AcceptInvitation />} />

              {/* Main Workspace */}
              <Route path="/workspace" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<MyWorkspace />} />
              </Route>

              {/* Redirects */}
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />

              {/* ===== AUDIT EXECUTION CORE ===== */}

              {/* Audit Universe & Planning */}
              <Route path="/universe" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<AuditUniverse />} />
              </Route>
              <Route path="/risks" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<RiskAssessments />} />
              </Route>
              <Route path="/plans" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<AuditPlans />} />
              </Route>

              {/* Active Audits */}
              <Route path="/audits" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ActiveAuditsList />} />
              </Route>
              <Route path="/audits/:auditId/workpapers" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<AuditWorkpapers />} />
              </Route>

              {/* Audit Programs & Procedures */}
              <Route path="/programs" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProgramLibrary />} />
              </Route>
              <Route path="/programs/:id" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProgramDetail />} />
              </Route>
              <Route path="/procedures" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProcedureLibrary />} />
              </Route>
              <Route path="/my-procedures" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<MyProcedures />} />
              </Route>

              {/* Workpapers */}
              <Route path="/workpapers" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<WorkpapersLanding />} />
              </Route>
              <Route path="/workpapers/:id" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<WorkpaperEditor />} />
              </Route>

              {/* Findings & Evidence */}
              <Route path="/findings" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<FindingsManagement />} />
              </Route>
              <Route path="/evidence" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<EvidenceLibrary />} />
              </Route>

              {/* Review & Quality Control */}
              <Route path="/review-queue" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProcedureReviewQueue />} />
              </Route>
              <Route path="/quality-control" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<QualityControlDashboard />} />
              </Route>

              {/* Tasks & Requests */}
              <Route path="/tasks" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<TaskBoard />} />
              </Route>
              <Route path="/information-requests" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<InformationRequests />} />
              </Route>

              {/* Analytics */}
              <Route path="/analytics" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProgramAnalytics />} />
              </Route>

              {/* ===== AUDIT TOOLS ===== */}
              <Route path="/tools/materiality" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<MaterialityCalculatorPage />} />
              </Route>
              <Route path="/tools/sampling" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<SamplingCalculatorPage />} />
              </Route>
              <Route path="/tools/confirmations" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ConfirmationTrackerPage />} />
              </Route>
              <Route path="/tools/analytical-procedures" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<AnalyticalProceduresPage />} />
              </Route>

              {/* ===== ENGAGEMENTS (Audit Context) ===== */}
              <Route path="/engagements" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<EngagementList />} />
              </Route>
              <Route path="/engagements/:id" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<EngagementDetail />} />
              </Route>
              <Route path="/engagements/:id/audit" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<EngagementDetailAudit />} />
              </Route>
              <Route path="/engagements/:engagementId/assign-procedures" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ProcedureAssignment />} />
              </Route>
              <Route path="/engagements/templates" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<EngagementTemplates />} />
              </Route>
              <Route path="/engagements/approvals" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<ApprovalDashboard />} />
              </Route>

              {/* ===== ADMIN ===== */}
              <Route path="/settings" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Settings />} />
              </Route>
              <Route path="/admin" element={<RequireAuth><RequireRole allowedRoles={['partner', 'firm_administrator']}><AppLayout /></RequireRole></RequireAuth>}>
                <Route index element={<AdminDashboard />} />
              </Route>
              <Route path="/admin/users" element={<RequireAuth><RequireRole allowedRoles={['partner', 'firm_administrator']}><AppLayout /></RequireRole></RequireAuth>}>
                <Route index element={<UserManagement />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
