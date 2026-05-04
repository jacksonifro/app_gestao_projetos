import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DemandasPage } from "./pages/DemandasPage";
import { MatchingPage } from "./pages/MatchingPage";
import { ProjetosPage } from "./pages/ProjetosPage";
import { FinanciamentoPage } from "./pages/FinanciamentoPage";
import { CampusPage } from "./pages/CampusPage";
import { ServidoresPage } from "./pages/ServidoresPage";
import { ComissaoPage } from "./pages/ComissaoPage";
import { AvaliacoesPage } from "./pages/AvaliacoesPage";
import { MeusProjetosPage } from "./pages/MeusProjetosPage";
import { AcompanhamentoPage } from "./pages/AcompanhamentoPage";

function RootRedirect() {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/cadastro",
    element: <CadastroPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "demandas", element: <DemandasPage /> },
      { path: "matching", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><MatchingPage /></ProtectedRoute> },
      { path: "projetos", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><ProjetosPage /></ProtectedRoute> },
      { path: "meus-projetos", element: <MeusProjetosPage /> },
      { path: "acompanhamento", element: <AcompanhamentoPage /> },
      { path: "avaliacoes", element: <ProtectedRoute allowedRoles={['AVALIADOR', 'ADMIN']}><AvaliacoesPage /></ProtectedRoute> },
      { path: "cadastros/financiamento", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><FinanciamentoPage /></ProtectedRoute> },
      { path: "cadastros/campus", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><CampusPage /></ProtectedRoute> },
      { path: "cadastros/servidores", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><ServidoresPage /></ProtectedRoute> },
      { path: "cadastros/comissoes", element: <ProtectedRoute allowedRoles={['REITORIA', 'ADMIN']}><ComissaoPage /></ProtectedRoute> },
    ],
  },
]);
