import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  FileText,
  GitBranch,
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const initialMetricas = [
  {
    titulo: "Meus Projetos",
    valor: "0",
    subtitulo: "Carregando...",
    icone: LayoutDashboard,
    cor: "text-[#2F6B38]",
    bgCor: "bg-[#2F6B38]/10",
  },
  {
    titulo: "Demandas Submetidas",
    valor: "0",
    subtitulo: "Carregando...",
    icone: FileText,
    cor: "text-blue-600",
    bgCor: "bg-blue-100",
  },
  {
    titulo: "Orçamento Aprovado",
    valor: "R$ 0",
    subtitulo: "Carregando...",
    icone: DollarSign,
    cor: "text-green-600",
    bgCor: "bg-green-100",
  },
  {
    titulo: "Taxa de Aprovação",
    valor: "0%",
    subtitulo: "Carregando...",
    icone: TrendingUp,
    cor: "text-purple-600",
    bgCor: "bg-purple-100",
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [metricas, setMetricas] = useState(initialMetricas);
  const [projetosRecentes, setProjetosRecentes] = useState<any[]>([]);
  const [acoesPendentes, setAcoesPendentes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    // Buscar projetos do usuário
    const { data: meusProjetos } = await supabase
      .from('projetos')
      .select('id, titulo, status, created_at')
      .eq('user_id', user?.id);

    // Buscar todas as demandas submetidas
    const { data: todasDemandas } = await supabase
      .from('projetos')
      .select('id, status');

    // Buscar metas (orçamento)
    const { data: metas } = await supabase
      .from('metas')
      .select('custo_estimado');

    const totalMeusProjetos = meusProjetos?.length || 0;
    const projetosEmAndamento = meusProjetos?.filter(p => p.status === 'EM EXECUÇÃO' || p.status === 'APROVADO').length || 0;
    
    const totalDemandas = todasDemandas?.length || 0;
    const demandasEmAnalise = todasDemandas?.filter(d => d.status === 'EM ANÁLISE').length || 0;
    const demandasAprovadas = todasDemandas?.filter(d => d.status === 'APROVADO').length || 0;

    const orcamentoTotal = metas?.reduce((acc, curr) => acc + (curr.custo_estimado || 0), 0) || 0;
    const orcamentoFormatado = orcamentoTotal > 1000 ? `R$ ${(orcamentoTotal / 1000).toFixed(0)}k` : `R$ ${orcamentoTotal}`;

    const taxaAprovacao = totalDemandas > 0 ? Math.round((demandasAprovadas / totalDemandas) * 100) : 0;

    setMetricas([
      {
        titulo: "Meus Projetos",
        valor: totalMeusProjetos.toString().padStart(2, '0'),
        subtitulo: `${projetosEmAndamento} em andamento`,
        icone: LayoutDashboard,
        cor: "text-[#2F6B38]",
        bgCor: "bg-[#2F6B38]/10",
      },
      {
        titulo: "Demandas Submetidas",
        valor: totalDemandas.toString().padStart(2, '0'),
        subtitulo: `${demandasEmAnalise} aguardando análise`,
        icone: FileText,
        cor: "text-blue-600",
        bgCor: "bg-blue-100",
      },
      {
        titulo: "Orçamento Aprovado",
        valor: orcamentoFormatado,
        subtitulo: "Total dos projetos",
        icone: DollarSign,
        cor: "text-green-600",
        bgCor: "bg-green-100",
      },
      {
        titulo: "Taxa de Aprovação",
        valor: `${taxaAprovacao}%`,
        subtitulo: "Geral",
        icone: TrendingUp,
        cor: "text-purple-600",
        bgCor: "bg-purple-100",
      },
    ]);

    if (meusProjetos) {
      const recentes = meusProjetos.slice(0, 3).map(p => ({
        id: p.id,
        titulo: p.titulo,
        status: p.status,
        statusColor: p.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
        prazo: "A definir",
        valor: "R$ ---",
        progresso: p.status === 'APROVADO' ? 50 : 10
      }));
      setProjetosRecentes(recentes);
    }
  };
  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Bem-vindo ao Sistema de Projetos</h1>
        <p className="text-gray-600 text-lg">Visão geral dos seus projetos e atividades</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {metricas.map((metrica, index) => {
          const Icone = metrica.icone;
          return (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${metrica.bgCor} flex items-center justify-center`}>
                    <Icone className={`w-6 h-6 ${metrica.cor}`} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">{metrica.valor}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{metrica.titulo}</p>
                <p className="text-sm text-gray-600">{metrica.subtitulo}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Meus Projetos</CardTitle>
                <CardDescription>Acompanhe o status dos seus projetos ativos</CardDescription>
              </div>
              <Button size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]">
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {projetosRecentes.map((projeto) => (
                <div key={projeto.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{projeto.titulo}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {projeto.prazo}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {projeto.valor}
                        </span>
                      </div>
                    </div>
                    <Badge className={`${projeto.statusColor} border-0 font-bold`}>{projeto.status}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-semibold">Progresso</span>
                      <span className="font-bold text-gray-900">{projeto.progresso}%</span>
                    </div>
                    <Progress value={projeto.progresso} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader className="bg-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Ações Pendentes
            </CardTitle>
            <CardDescription>Tarefas que requerem sua atenção</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {acoesPendentes.map((acao) => (
                <div
                  key={acao.id}
                  className={`border-l-4 ${
                    acao.prioridade === "ALTA"
                      ? "border-[#ED1C24]"
                      : acao.prioridade === "MÉDIA"
                      ? "border-yellow-500"
                      : "border-gray-300"
                  } bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition-colors cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{acao.titulo}</h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {acao.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {acao.prazo}
                    </p>
                    <span
                      className={`text-xs font-bold ${
                        acao.prioridade === "ALTA"
                          ? "text-[#ED1C24]"
                          : acao.prioridade === "MÉDIA"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {acao.prioridade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#2F6B38] cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">Nova Demanda</h3>
            <p className="text-gray-600 text-sm mb-4">Cadastre uma nova demanda do setor produtivo</p>
            <Link to="/demandas">
              <Button className="w-full bg-[#2F6B38] hover:bg-[#1a4122]">
                Cadastrar Demanda
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#2F6B38] cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">Matching</h3>
            <p className="text-gray-600 text-sm mb-4">Conecte demandas com fontes de financiamento</p>
            <Link to="/matching">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Acessar Matching
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#2F6B38] cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">Projetos</h3>
            <p className="text-gray-600 text-sm mb-4">Gerencie seus projetos e acompanhe metas</p>
            <Link to="/projetos">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Ver Projetos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
