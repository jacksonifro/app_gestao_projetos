import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { FileText, GitBranch, LayoutDashboard, LogOut, Settings, Building2, Users, DollarSign, ChevronRight, Shield, ClipboardCheck, FolderKanban, UserCog } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userRole, perfil } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("userLoggedIn");
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const canSeeMatching = userRole === 'ADMIN' || userRole === 'REITORIA';
  const canSeeProjetos = userRole === 'ADMIN' || userRole === 'REITORIA';
  const canSeeAvaliacoes = userRole === 'ADMIN' || userRole === 'AVALIADOR';
  const canSeeCadastros = userRole === 'ADMIN' || userRole === 'REITORIA';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-black text-lg">IF</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900 text-sm leading-tight">INSTITUTO FEDERAL</span>
                <span className="text-xs text-gray-600 font-semibold">Rondônia</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className={`text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'Principal' : '•'}
          </div>

          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive("/dashboard")
                ? "bg-[#2F6B38] text-white font-bold shadow-md"
                : "text-gray-700 hover:bg-gray-100 font-semibold"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Dashboard</span>}
          </Link>

          <Link
            to="/demandas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive("/demandas")
                ? "bg-[#2F6B38] text-white font-bold shadow-md"
                : "text-gray-700 hover:bg-gray-100 font-semibold"
            }`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Demandas</span>}
          </Link>

          {canSeeMatching && (
            <Link
              to="/matching"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive("/matching")
                  ? "bg-[#2F6B38] text-white font-bold shadow-md"
                  : "text-gray-700 hover:bg-gray-100 font-semibold"
              }`}
            >
              <GitBranch className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Matching</span>}
            </Link>
          )}

          {canSeeProjetos && (
            <Link
              to="/projetos"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive("/projetos")
                  ? "bg-[#2F6B38] text-white font-bold shadow-md"
                  : "text-gray-700 hover:bg-gray-100 font-semibold"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Projetos</span>}
            </Link>
          )}

          <Link
            to="/meus-projetos"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive("/meus-projetos")
                ? "bg-[#2F6B38] text-white font-bold shadow-md"
                : "text-gray-700 hover:bg-gray-100 font-semibold"
            }`}
          >
            <FolderKanban className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Meus Projetos</span>}
          </Link>

          <Link
            to="/acompanhamento"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive("/acompanhamento")
                ? "bg-[#2F6B38] text-white font-bold shadow-md"
                : "text-gray-700 hover:bg-gray-100 font-semibold"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Acompanhamento</span>}
          </Link>

          {canSeeAvaliacoes && (
            <Link
              to="/avaliacoes"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive("/avaliacoes")
                  ? "bg-[#2F6B38] text-white font-bold shadow-md"
                  : "text-gray-700 hover:bg-gray-100 font-semibold"
              }`}
            >
              <ClipboardCheck className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Avaliações</span>}
            </Link>
          )}

          {canSeeCadastros && (
            <>
              <div className={`text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-3 ${!sidebarOpen && 'text-center'}`}>
                {sidebarOpen ? 'Cadastros' : '•'}
              </div>

              <Link
                to="/cadastros/financiamento"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive("/cadastros/financiamento")
                    ? "bg-[#2F6B38] text-white font-bold shadow-md"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                }`}
              >
                <DollarSign className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">Financiamento</span>}
              </Link>

              <Link
                to="/cadastros/campus"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive("/cadastros/campus")
                    ? "bg-[#2F6B38] text-white font-bold shadow-md"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                }`}
              >
                <Building2 className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">Campus</span>}
              </Link>

              <Link
                to="/cadastros/servidores"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive("/cadastros/servidores")
                    ? "bg-[#2F6B38] text-white font-bold shadow-md"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">Servidores</span>}
              </Link>

              <Link
                to="/cadastros/comissoes"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive("/cadastros/comissoes")
                    ? "bg-[#2F6B38] text-white font-bold shadow-md"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                }`}
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">Comissões</span>}
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-semibold"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            {sidebarOpen && <span className="text-sm">Recolher</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Sistema de Gestão de Projetos</h1>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Olá, <span className="font-semibold text-gray-900">{perfil?.nome_completo?.split(' ')[0] || 'Usuário'}</span>
                <span className="ml-1 text-xs font-bold text-[#2F6B38]">• {userRole}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2F6B38] to-[#1a4122] flex items-center justify-center text-white font-bold shadow-md">
                {perfil?.nome_completo ? perfil.nome_completo.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-[#ED1C24] transition-colors flex items-center gap-1.5 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
          <div className="px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-black">IF</span>
              </div>
              <span className="font-bold text-gray-100 text-sm">Instituto Federal de Rondônia</span>
            </div>
            <p className="text-xs text-gray-400">&copy; 2026 IFRO. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
