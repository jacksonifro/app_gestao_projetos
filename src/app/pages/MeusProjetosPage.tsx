import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
  Plus,
  TrendingUp,
  PlayCircle,
  BarChart3,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { modalSucesso, modalErro, modalConfirmacao } from "../../lib/alerts";

const metricasIniciais = [
  {
    titulo: "Orçamento Total Alocado",
    valor: "R$ 0,00",
    subtitulo: "Carregando...",
    cor: "border-l-[#2F6B38]",
    icone: DollarSign,
  },
  {
    titulo: "Meus Projetos Aprovados",
    valor: "0",
    subtitulo: "Projetos financiados",
    cor: "border-l-[#2F6B38]",
    icone: TrendingUp,
  },
  {
    titulo: "Projetos em Execução",
    valor: "0",
    subtitulo: "Em andamento",
    cor: "border-l-blue-500",
    icone: PlayCircle,
  },
  {
    titulo: "Demandas em Análise",
    valor: "0",
    subtitulo: "Aguardando avaliação",
    cor: "border-l-yellow-500",
    icone: Clock,
  },
];

export function MeusProjetosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [metasAPI, setMetasAPI] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: projData, error: projError } = await supabase
        .from("projetos")
        .select("*")
        .eq("user_id", user.id);
        
      if (!projError && projData) setProjetos(projData);

      const { data: metaData, error: metaError } = await supabase
        .from("metas")
        .select("*");
        
      if (!metaError && metaData) setMetasAPI(metaData);

      setLoading(false);
    }
    fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "CONCLUÍDO": return "bg-green-100 text-green-700";
      case "PROCESSANDO": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const formatCurrency = (val: any) => {
    if (typeof val === 'number') {
      return `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }
    return val || "-";
  };

  const getMetricas = () => {
    if (!projetos.length) return metricasIniciais;

    const orcamentoTotal = metasAPI.reduce((acc, meta) => acc + (meta.custo_estimado || 0), 0);
    const emAnalise = projetos.filter(p => p.status === 'EM ANÁLISE' || p.status === 'EM AVALIAÇÃO').length;
    const aprovados = projetos.filter(p => p.status === 'APROVADO').length;
    const emExecucao = projetos.filter(p => p.status === 'EM EXECUÇÃO').length;

    return [
      { titulo: "Orçamento Total", valor: formatCurrency(orcamentoTotal), subtitulo: "Nas suas demandas", cor: "border-l-[#2F6B38]", icone: DollarSign },
      { titulo: "Projetos Aprovados", valor: aprovados.toString(), subtitulo: "Aguardando execução", cor: "border-l-[#2F6B38]", icone: TrendingUp },
      { titulo: "Em Execução", valor: emExecucao.toString(), subtitulo: "Em fase de desenvolvimento", cor: "border-l-blue-500", icone: PlayCircle },
      { titulo: "Demandas em Análise", valor: emAnalise.toString(), subtitulo: "Aguardando avaliação técnica", cor: "border-l-yellow-500", icone: Clock },
    ];
  };

  const metricasGerais = getMetricas();

  const handleIniciarExecucao = async (projeto: any) => {
    const result = await modalConfirmacao(
      "Deseja iniciar a execução deste projeto? O status mudará para 'EM EXECUÇÃO'.",
      "Iniciar Execução",
      "Sim, iniciar"
    );
    if (result.isConfirmed) {
      const { error } = await supabase.from('projetos').update({ status: 'EM EXECUÇÃO' }).eq('id', projeto.id);
      if (error) {
        modalErro("Erro ao iniciar execução: " + error.message);
      } else {
        modalSucesso("Projeto iniciado com sucesso!");
        setProjetos(projetos.map(p => p.id === projeto.id ? { ...p, status: 'EM EXECUÇÃO' } : p));
      }
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-10 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-950 mb-2">Meus Projetos</h1>
        <p className="text-gray-600 text-lg">
          Acompanhe e gerencie a execução das suas demandas e projetos aprovados.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {metricasGerais.map((metrica: any, index) => {
          const Icone = metrica.icone;
          return (
            <Card key={index} className={`shadow-md border-l-4 ${metrica.cor} hover:shadow-xl transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-gray-600 uppercase font-bold tracking-wider">{metrica.titulo}</p>
                  <Icone className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-3xl font-black text-gray-900 mb-2">{metrica.valor}</p>
                {metrica.progresso !== undefined && (
                  <Progress value={metrica.progresso} className="h-2.5 mb-2" />
                )}
                {metrica.subtitulo && <p className="text-sm text-gray-600">{metrica.subtitulo}</p>}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {loading ? (
        <div className="text-center py-10">Carregando seus projetos...</div>
      ) : projetos.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 text-gray-500">Nenhum projeto encontrado no seu usuário.</div>
      ) : (
        projetos.map(projeto => {
          const projetoMetas = metasAPI.filter(m => m.projeto_id === projeto.id);
          const custoTotal = projetoMetas.reduce((acc, m) => acc + (m.custo_estimado || 0), 0);
          
          return (
            <Card key={projeto.id} className="shadow-2xl border border-gray-200 overflow-hidden mb-8">
              <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${projeto.status === 'APROVADO' ? 'bg-green-600' : 'bg-[#2F6B38]'} hover:bg-opacity-90 text-white font-bold px-3 py-1`}>
                        {projeto.status}
                      </Badge>
                      <span className="text-sm text-gray-500 font-mono font-semibold">Câmpus: {projeto.campus_key}</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-950 mb-2">
                      {projeto.titulo}
                    </h2>
                    <p className="text-gray-700 max-w-3xl leading-relaxed">
                      {projeto.objeto_projeto || projeto.objetivo_geral || "Sem descrição"}
                    </p>
                  </div>
      
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Orçamento do Projeto</p>
                    <p className="text-4xl font-black text-[#2F6B38] mb-3">{formatCurrency(custoTotal)}</p>
                    <div className="flex flex-col gap-2">
                      {projeto.status === 'APROVADO' && (
                        <Button onClick={() => handleIniciarExecucao(projeto)} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold w-full">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Iniciar Execução
                        </Button>
                      )}
                      {projeto.status === 'EM EXECUÇÃO' && (
                        <Button onClick={() => navigate('/acompanhamento')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Acompanhamento
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-[#2F6B38] border-[#2F6B38] hover:bg-[#2F6B38]/5 w-full" onClick={() => navigate(`/projeto/${projeto.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualização
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
      
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="w-6 h-6 text-[#2F6B38]" />
                    Detalhamento das Metas
                  </h3>
                </div>
      
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableHead className="font-bold text-gray-700">Meta / Atividade</TableHead>
                        <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right">Custo Estimado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projetoMetas.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8">Nenhuma meta cadastrada.</TableCell></TableRow>
                      ) : projetoMetas.map((meta: any, index: number) => (
                        <TableRow key={meta.id} className="hover:bg-gray-50">
                          <TableCell className="max-w-md">
                            <div className="flex items-start gap-3">
                              <span className="w-7 h-7 bg-[#2F6B38] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{meta.titulo}</p>
                                <p className="text-sm text-gray-600 mt-1">{meta.descricao}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getStatusColor(meta.status)} border-0 font-bold px-3 py-1`}>{meta.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-gray-900">
                            {formatCurrency(meta.custo_estimado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
