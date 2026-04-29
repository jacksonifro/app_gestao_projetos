import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  X,
  FileText,
  ThumbsUp,
  ThumbsDown,
  GitBranch,
  List,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { supabase } from "../../lib/supabase";



import { modalErro, modalSucesso } from "../../lib/alerts";

export function MatchingPage() {
  const [comissoes, setComissoes] = useState<{id: string, nome: string, membros: string[]}[]>([]);

  const [projetosAnalise, setProjetosAnalise] = useState<any[]>([]);
  const [avaliacoesComissao, setAvaliacoesComissao] = useState<any[]>([]);
  const [financiamentos, setFinanciamentos] = useState<any[]>([]);
  const [campi, setCampi] = useState<any[]>([]);
  const [selectedFinanciamento, setSelectedFinanciamento] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedProjetoId, setSelectedProjetoId] = useState("");

  useEffect(() => {
    fetchComissoes();
    fetchProjetos();
    fetchFinanciamentosE_Campus();
  }, []);

  const fetchFinanciamentosE_Campus = async () => {
    const { data: finData } = await supabase.from('financiamentos').select('*');
    if (finData) setFinanciamentos(finData);
    
    const { data: camData } = await supabase.from('campus').select('*');
    if (camData) setCampi(camData);
  };

  useEffect(() => {
    if (selectedProjetoId) {
      const proj = projetosAnalise.find(p => p.id.toString() === selectedProjetoId);
      if (proj && proj.comissao_id) {
        setSelectedComissao(proj.comissao_id);
        
        // Auto-set tab based on status
        const avaliacoesCount = proj.avaliacoes ? proj.avaliacoes.length : 0;
        if (proj.status === 'APROVADO' || avaliacoesCount >= 3) {
          setCurrentTab("passo3");
        } else {
          setCurrentTab("passo2");
        }
      } else {
        setSelectedComissao("");
        setCurrentTab("passo1");
      }
      fetchAvaliacoes(selectedProjetoId);
    } else {
      setAvaliacoesComissao([]);
      setSelectedComissao("");
    }
  }, [selectedProjetoId]);

  const fetchAvaliacoes = async (projId: string) => {
    const { data } = await supabase.from('avaliacoes').select('*').eq('projeto_id', projId);
    if (data) {
      setAvaliacoesComissao(data.map(d => ({
        avaliadorNome: d.avaliador_nome,
        nota: Number(d.nota),
        parecer: d.parecer,
        data: new Date(d.created_at).toLocaleDateString('pt-BR'),
        status: d.status
      })));
    }
  };

  const fetchProjetos = async () => {
    const { data: projData } = await supabase.from('projetos').select(`
      *,
      avaliacoes (id, nota)
    `).in('status', ['EM ANÁLISE', 'APROVADO']);
    if (projData) {
      setProjetosAnalise(projData);
    }
  };

  const fetchComissoes = async () => {
    const { data: comissoesData, error } = await supabase.from('comissoes').select('id, nome');
    if (error || !comissoesData) return;

    const { data: relacoes } = await supabase.from('comissao_especialistas').select(`
      comissao_id,
      especialista:especialistas (nome)
    `);

    const formatadas = comissoesData.map((c: any) => {
      const espRel = relacoes?.filter((r: any) => r.comissao_id === c.id) || [];
      const nomes = espRel.map((r: any) => r.especialista?.nome || "Desconhecido");
      
      return {
        id: c.id,
        nome: c.nome,
        membros: nomes
      };
    });

    setComissoes(formatadas);
  };

  const [currentTab, setCurrentTab] = useState("passo1");
  const [selectedComissao, setSelectedComissao] = useState("");
  
  const selectedProjeto = projetosAnalise.find(p => p.id.toString() === selectedProjetoId);

  const mediaNotas = avaliacoesComissao.length > 0 ? avaliacoesComissao.reduce((acc, av) => acc + av.nota, 0) / avaliacoesComissao.length : 0;
  const avaliacaoStatus = mediaNotas >= 7 ? "aprovado" : "rejeitado";
  const totalMembros = comissoes.find((c) => c.id.toString() === selectedComissao)?.membros.length || 3;
  const avaliacoesRecebidas = avaliacoesComissao.length;

  const handleVincularComissao = async () => {
    if (selectedComissao && selectedProjetoId) {
      const { error } = await supabase.from('projetos').update({ comissao_id: selectedComissao }).eq('id', selectedProjetoId);
      if (error) {
        modalErro("Erro ao vincular comissão");
        return;
      }
      modalSucesso("Comissão vinculada com sucesso!");
      setCurrentTab("passo2");
      fetchProjetos();
    }
  };

  const handleDesvincularComissao = async () => {
    if (!selectedProjetoId) return;
    const { error } = await supabase.from('projetos').update({ comissao_id: null }).eq('id', selectedProjetoId);
    if (error) {
      modalErro("Erro ao desvincular comissão");
      return;
    }
    modalSucesso("Comissão desvinculada com sucesso!");
    setSelectedComissao("");
    setCurrentTab("passo1");
    fetchProjetos();
  };

  const handleAvancarParaFinanciamento = () => {
    if (avaliacaoStatus === "aprovado") {
      setCurrentTab("passo3");
    }
  };
  
  const handleVincularRecursosEFinalizar = async () => {
    if (!selectedFinanciamento || !selectedCampus) {
      modalErro("Selecione a origem de financiamento e o campus executor.");
      return;
    }
    const { error } = await supabase.from('projetos').update({ 
      financiamento_id: selectedFinanciamento,
      campus_executor_id: selectedCampus,
      status: "APROVADO"
    }).eq('id', selectedProjetoId);
    
    if (error) {
      modalErro("Erro ao vincular recursos.");
      return;
    }
    modalSucesso("Projeto aprovado e recursos vinculados com sucesso!");
    fetchProjetos();
    setSelectedProjetoId("");
    setCurrentTab("passo1");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-4">
          <GitBranch className="w-4 h-4" />
          <span className="text-sm font-semibold">Sistema de Matching e Avaliação</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Processo de Análise e Aprovação</h1>
        <p className="text-gray-600 text-lg">
          Gestão completa do fluxo: Demanda → Avaliação pela Comissão → Vinculação de Recursos
        </p>
      </div>

      
      {/* DASHBOARD DE VISÃO GERAL */}
      <Card className="mb-8 shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <List className="w-5 h-5 text-[#2F6B38]" />
            Visão Geral dos Projetos (Consulta)
          </CardTitle>
          <CardDescription>
            Acompanhe o status de todos os projetos que estão passando ou já passaram pelo processo de Matching
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Projeto / Coordenador</th>
                  <th className="px-6 py-4">Fase Atual (Status)</th>
                  <th className="px-6 py-4 text-center">Progresso Avaliação</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projetosAnalise.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum projeto encontrado.</td></tr>
                ) : projetosAnalise.map(proj => {
                  
                  // Calcular o Status da Fase
                  let fase = "Pendente de Comissão";
                  let badgeColor = "bg-yellow-100 text-yellow-800";
                  let avaliacoesCount = proj.avaliacoes ? proj.avaliacoes.length : 0;
                  
                  if (proj.status === 'APROVADO') {
                    fase = "Vinculado (Finalizado)";
                    badgeColor = "bg-green-100 text-green-800";
                  } else if (proj.comissao_id && avaliacoesCount >= 3) {
                    fase = "Aprovado pela Comissão, Falta Recurso";
                    badgeColor = "bg-blue-100 text-blue-800";
                  } else if (proj.comissao_id && avaliacoesCount < 3) {
                    fase = "Em Avaliação";
                    badgeColor = "bg-orange-100 text-orange-800";
                  }

                  return (
                    <tr key={proj.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{proj.titulo}</p>
                        <p className="text-xs text-gray-500">{proj.coord_geral_nome}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 font-bold ${badgeColor}`}>{fase}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-700">{avaliacoesCount} / 3</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant={selectedProjetoId === proj.id.toString() ? "default" : "outline"}
                          className={selectedProjetoId === proj.id.toString() ? "bg-[#2F6B38] hover:bg-[#1a4122]" : ""}
                          onClick={() => setSelectedProjetoId(proj.id.toString())}
                        >
                          Gerenciar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedProjetoId && (
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100">
          <TabsTrigger value="passo1" className="data-[state=active]:bg-white py-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#2F6B38] text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div className="text-left">
                <p className="font-bold text-sm">Demanda</p>
                <p className="text-xs text-gray-500">Visualizar proposta</p>
              </div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="passo2"
            disabled={!selectedComissao}
            className="data-[state=active]:bg-white py-3 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedComissao ? "bg-[#2F6B38] text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </span>
              <div className="text-left">
                <p className="font-bold text-sm">Avaliação</p>
                <p className="text-xs text-gray-500">Comissão avalia</p>
              </div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="passo3"
            disabled={avaliacaoStatus !== "aprovado"}
            className="data-[state=active]:bg-white py-3 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  avaliacaoStatus === "aprovado" ? "bg-[#2F6B38] text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                3
              </span>
              <div className="text-left">
                <p className="font-bold text-sm">Financiamento</p>
                <p className="text-xs text-gray-500">Vincular recursos</p>
              </div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* PASSO 1: DEMANDA */}
        <TabsContent value="passo1" className="mt-6">
          {/* A seleção de projeto agora é feita pela tabela acima, mas mantemos o state visualmente integrado */}

          {!selectedProjeto ? (
            <div className="text-center p-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
              Selecione um projeto acima para iniciar o processo de matching.
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-xl border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{selectedProjeto.titulo}</CardTitle>
                    <CardDescription className="text-base mt-1 italic">
                      Coordenador(a): {selectedProjeto.coord_geral_nome}
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-0 font-bold">EM ANÁLISE</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Resumo do Projeto
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedProjeto.objeto_projeto || selectedProjeto.introducao || "Nenhuma descrição fornecida."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-[#2F6B38]" />
                      <p className="text-xs text-[#2F6B38] font-bold uppercase tracking-wider">Ação Estratégica</p>
                    </div>
                    <p className="text-lg font-black text-[#1a4122]">{selectedProjeto.acao_estrategica || "N/A"}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Prazo Desejado</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{selectedProjeto.duracao_meses || 0} Meses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-2 border-[#2F6B38]">
              <CardHeader className="bg-gradient-to-r from-[#2F6B38] to-[#1a4122] text-white">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Vincular Comissão Avaliadora
                </CardTitle>
                <CardDescription className="text-white/80">
                  Selecione a comissão que fará a análise técnica
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900">Comissão Avaliadora *</Label>
                  <Select value={selectedComissao} onValueChange={setSelectedComissao}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-300">
                      <SelectValue placeholder="--- Selecione uma Comissão ---" />
                    </SelectTrigger>
                    <SelectContent>
                      {comissoes.map((comissao) => (
                        <SelectItem key={comissao.id} value={comissao.id.toString()}>
                          {comissao.nome} ({comissao.membros.length} membros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedComissao && (
                  <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-xl">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Membros da Comissão Selecionada
                    </h4>
                    <div className="mt-3 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDesvincularComissao}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Desvincular Comissão
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {comissoes
                        .find((c) => c.id.toString() === selectedComissao)
                        ?.membros.map((membro, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                            <Avatar className="w-10 h-10 border-2 border-blue-200">
                              <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-sm">
                                {getInitials(membro)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-gray-900 text-sm">{membro}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    size="lg"
                    onClick={handleVincularComissao}
                    disabled={!selectedComissao}
                    className="w-full bg-[#2F6B38] hover:bg-[#1a4122] font-bold py-6 text-base shadow-lg"
                  >
                    Enviar para Avaliação da Comissão
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-center text-xs text-gray-500 mt-3 leading-relaxed">
                    A demanda será enviada para análise técnica pela comissão selecionada
                  </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* PASSO 2: AVALIAÇÃO DA COMISSÃO */}
        <TabsContent value="passo2" className="mt-6">
          <Card className="shadow-2xl border-2 border-[#2F6B38]">
            <CardHeader className="bg-gradient-to-r from-[#2F6B38] to-[#1a4122] text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Resultado da Avaliação Técnica
              </CardTitle>
              <CardDescription className="text-white/90 text-base">
                Consolidação das avaliações individuais dos membros da comissão
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Resumo da Demanda
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>
                        <strong>Título:</strong> Otimização de Processo Térmico
                      </p>
                      <p>
                        <strong>Empresa:</strong> Metalúrgica Rondônia S.A.
                      </p>
                      <p>
                        <strong>Investimento:</strong> R$ 85.000,00
                      </p>
                      <p>
                        <strong>Prazo:</strong> 6 Meses
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-green-900 text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Nota Média da Comissão
                      </h4>
                      <span className="text-5xl font-black text-green-900">{mediaNotas.toFixed(1)}</span>
                    </div>
                    <Progress value={mediaNotas * 10} className="h-4 mb-3" />
                    <p className="text-sm text-green-800">
                      Baseado em {avaliacoesRecebidas} de {totalMembros} avaliações recebidas
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Avaliações Individuais dos Membros</h4>
                    <div className="space-y-4">
                      {avaliacoesComissao.map((avaliacao, idx) => (
                        <Card key={idx} className="border-2 border-gray-200">
                          <CardHeader className="bg-gray-50 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-green-200">
                                  <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-sm">
                                    {getInitials(avaliacao.avaliadorNome)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-gray-900">{avaliacao.avaliadorNome}</p>
                                  <p className="text-xs text-gray-600">Avaliado em {avaliacao.data}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-black text-[#2F6B38]">{avaliacao.nota}</p>
                                <Badge
                                  className={`${
                                    avaliacao.status === "aprovado"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  } border-0 font-bold`}
                                >
                                  {avaliacao.status === "aprovado" ? "APROVOU" : "REJEITOU"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Parecer Técnico
                            </Label>
                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{avaliacao.parecer}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#2F6B38]" />
                      Comissão Avaliadora
                    </h4>
                    <p className="font-semibold text-sm text-gray-700 mb-3">
                      {comissoes.find((c) => c.id.toString() === selectedComissao)?.nome}
                    </p>
                    <div className="mt-3 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDesvincularComissao}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Desvincular Comissão
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {comissoes
                        .find((c) => c.id.toString() === selectedComissao)
                        ?.membros.map((membro, idx) => {
                          const avaliou = avaliacoesComissao.find((a) => a.avaliadorNome === membro);
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Avatar className="w-8 h-8 border border-gray-300">
                                <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-xs">
                                  {getInitials(membro)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-gray-700 flex-1">{membro}</span>
                              {avaliou ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-3">Status da Avaliação</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Progresso</p>
                        <Progress value={(avaliacoesRecebidas / totalMembros) * 100} className="h-2.5 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">
                          {avaliacoesRecebidas}/{totalMembros} avaliadores
                        </p>
                      </div>

                      {avaliacoesRecebidas === totalMembros && (
                        <div className="pt-2 border-t border-gray-300">
                          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                            Avaliação Concluída
                          </p>
                          <Badge className="bg-green-100 text-green-700 border-0 font-bold w-full justify-center py-2">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Todos avaliaram
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`border-2 p-5 rounded-xl ${
                      avaliacaoStatus === "aprovado" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {avaliacaoStatus === "aprovado" ? (
                        <CheckCircle className="w-6 h-6 text-green-700" />
                      ) : (
                        <X className="w-6 h-6 text-red-700" />
                      )}
                      <h4 className={`font-bold ${avaliacaoStatus === "aprovado" ? "text-green-900" : "text-red-900"}`}>
                        {avaliacaoStatus === "aprovado" ? "Proposta Aprovada!" : "Proposta Rejeitada"}
                      </h4>
                    </div>
                    <p className={`text-sm mb-3 ${avaliacaoStatus === "aprovado" ? "text-green-700" : "text-red-700"}`}>
                      {avaliacaoStatus === "aprovado"
                        ? "A nota média da comissão atingiu o critério mínimo. A proposta pode prosseguir para vinculação de financiamento."
                        : "A nota média da comissão ficou abaixo do critério mínimo de aprovação."}
                    </p>
                    {avaliacaoStatus === "aprovado" && (
                      <Button
                        onClick={handleAvancarParaFinanciamento}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700 font-bold"
                      >
                        Avançar para Financiamento
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PASSO 3: VINCULAÇÃO DE FINANCIAMENTO */}
        <TabsContent value="passo3" className="mt-6">
          <Card className="shadow-2xl border-2 border-[#2F6B38]">
            <CardHeader className="bg-gradient-to-r from-[#2F6B38] to-[#1a4122] text-white">
              <CardTitle className="text-2xl">Configuração de Financiamento e Executor</CardTitle>
              <CardDescription className="text-white/80 text-base">
                Vincule a origem de recursos e o campus executor do projeto
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-700" />
                      <h4 className="font-bold text-green-900">Proposta Aprovada pela Comissão</h4>
                    </div>
                    <p className="text-sm text-green-700">Nota Média: {mediaNotas.toFixed(1)}/10</p>
                    <p className="text-xs text-green-600 mt-1">{avaliacoesRecebidas} avaliações consolidadas</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-900">Origem do Financiamento *</Label>
                    <Select value={selectedFinanciamento} onValueChange={setSelectedFinanciamento}>
    <SelectTrigger className="h-12 bg-gray-50 border-gray-300">
      <SelectValue placeholder="--- Selecione uma Linha ---" />
    </SelectTrigger>
    <SelectContent>
      {financiamentos.map(f => (
        <SelectItem key={f.id} value={f.id.toString()}>{f.nome} ({f.tipo})</SelectItem>
      ))}
    </SelectContent>
  </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-900">Polo/Câmpus Executor *</Label>
                    <Select value={selectedFinanciamento} onValueChange={setSelectedFinanciamento}>
                      <SelectTrigger className="h-12 bg-gray-50 border-gray-300">
                        <SelectValue placeholder="--- Selecione um Campus ---" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jiparana">Câmpus Ji-Paraná (Automação Industrial)</SelectItem>
                        <SelectItem value="pvelho">Câmpus Porto Velho Calama (Informática)</SelectItem>
                        <SelectItem value="vilhena">Câmpus Vilhena (Mecânica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-5 rounded-r-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-blue-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Matching Score
                      </p>
                      <span className="font-black text-blue-900 text-xl">88%</span>
                    </div>
                    <Progress value={88} className="h-3 mb-3" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      O Câmpus selecionado possui laboratórios e especialistas compatíveis com a demanda
                    </p>
                  </div>

                  <Button size="lg" onClick={handleVincularRecursosEFinalizar} className="w-full bg-[#2F6B38] hover:bg-[#1a4122] font-bold py-6 text-base shadow-lg">
                    Gerar Plano de Trabalho e Vincular
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Histórico do Processo</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Demanda Cadastrada</p>
                        <p className="text-xs text-gray-600">Proposta submetida pela empresa</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Comissão Vinculada</p>
                        <p className="text-xs text-gray-600">
                          {comissoes.find((c) => c.id.toString() === selectedComissao)?.nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Proposta Aprovada</p>
                        <p className="text-xs text-gray-600">Nota Média: {mediaNotas.toFixed(1)}/10</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Vinculação de Recursos</p>
                        <p className="text-xs text-gray-600">Em andamento...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
