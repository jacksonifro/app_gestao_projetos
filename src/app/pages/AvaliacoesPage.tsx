import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Shield,
  ThumbsDown,
  ThumbsUp,
  AlertCircle,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { modalErro, modalSucesso, modalAlerta } from "../../lib/alerts";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Avaliacao {
  id?: string;
  avaliadorNome: string;
  nota: number;
  parecer: string;
  data: string;
  status: "aprovado" | "rejeitado";
}

interface Demanda {
  id: string;
  titulo: string;
  empresa: string;
  descricao: string;
  investimento: string;
  prazo: string;
  comissao: string;
  avaliacoes: Avaliacao[];
  minhaAvaliacao?: Avaliacao;
}

export function AvaliacoesPage() {
  const { user } = useAuth();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [notaAvaliacao, setNotaAvaliacao] = useState(0);
  const [parecerAvaliacao, setParecerAvaliacao] = useState("");
  const [decisaoAvaliacao, setDecisaoAvaliacao] = useState<"aprovado" | "rejeitado" | null>(null);

  const usuarioAtual = user?.user_metadata?.nomeCompleto || "Avaliador Logado";

  useEffect(() => {
    fetchDemandas();
  }, [user]);

  const fetchDemandas = async () => {
    // Buscar projetos em análise
    const { data: projetos, error: errorProjetos } = await supabase
      .from("projetos")
      .select("*")
      .eq("status", "EM ANÁLISE");

    if (errorProjetos || !projetos) return;

    // Buscar avaliações
    const { data: avaliacoes, error: errorAvaliacoes } = await supabase
      .from("avaliacoes")
      .select("*");

    const formatado = projetos.map((proj) => {
      const projAvaliacoes = (avaliacoes || []).filter(a => a.projeto_id === proj.id).map(a => ({
        id: a.id,
        avaliadorNome: a.avaliador_nome,
        nota: a.nota,
        parecer: a.parecer,
        status: a.status as "aprovado" | "rejeitado",
        data: new Date(a.created_at).toLocaleDateString("pt-BR")
      }));

      const minha = projAvaliacoes.find(a => a.avaliadorNome === usuarioAtual);

      return {
        id: proj.id,
        titulo: proj.titulo,
        empresa: proj.coord_geral_campus || "IFRO",
        descricao: proj.objeto_projeto || "Sem descrição",
        investimento: "A definir",
        prazo: proj.duracao_meses ? `${proj.duracao_meses} Meses` : "N/D",
        comissao: proj.acao_estrategica || "Comissão Padrão",
        avaliacoes: projAvaliacoes,
        minhaAvaliacao: minha
      };
    });

    setDemandas(formatado);
  };

  const handleAbrirAvaliacao = (demanda: Demanda) => {
    setDemandaSelecionada(demanda);
    if (demanda.minhaAvaliacao) {
      setNotaAvaliacao(demanda.minhaAvaliacao.nota);
      setParecerAvaliacao(demanda.minhaAvaliacao.parecer);
      setDecisaoAvaliacao(demanda.minhaAvaliacao.status);
    } else {
      setNotaAvaliacao(0);
      setParecerAvaliacao("");
      setDecisaoAvaliacao(null);
    }
    setDialogOpen(true);
  };

  const handleSubmeterAvaliacao = async (decisao: "aprovado" | "rejeitado") => {
    if (!demandaSelecionada || !parecerAvaliacao || notaAvaliacao === 0) {
      modalAlerta("Preencha todos os campos obrigatórios!");
      return;
    }

    const payload = {
      projeto_id: demandaSelecionada.id,
      avaliador_nome: usuarioAtual,
      nota: notaAvaliacao,
      parecer: parecerAvaliacao,
      status: decisao
    };

    let error;

    if (demandaSelecionada.minhaAvaliacao && demandaSelecionada.minhaAvaliacao.id) {
      // Update
      const res = await supabase.from("avaliacoes").update(payload).eq("id", demandaSelecionada.minhaAvaliacao.id);
      error = res.error;
    } else {
      // Insert
      const res = await supabase.from("avaliacoes").insert([payload]);
      error = res.error;
    }

    if (error) {
      modalErro("Erro ao salvar avaliação: " + error.message);
      return;
    }

    modalSucesso("Avaliação salva com sucesso!");

    setDialogOpen(false);
    setDemandaSelecionada(null);
    setNotaAvaliacao(0);
    setParecerAvaliacao("");
    setDecisaoAvaliacao(null);
    fetchDemandas();
  };

  const calcularMediaNotas = (avaliacoes: Avaliacao[]) => {
    if (avaliacoes.length === 0) return 0;
    const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    return (soma / avaliacoes.length).toFixed(1);
  };

  const verificarStatusGeral = (avaliacoes: Avaliacao[]) => {
    if (avaliacoes.length === 0) return "pendente";
    const aprovadas = avaliacoes.filter((a) => a.status === "aprovado").length;
    const rejeitadas = avaliacoes.filter((a) => a.status === "rejeitado").length;

    if (aprovadas > rejeitadas) return "aprovado";
    if (rejeitadas > aprovadas) return "rejeitado";
    return "em_analise";
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Minhas Avaliações</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Avalie as propostas vinculadas às comissões das quais você é membro
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {demandas.map((demanda) => {
          const jaAvaliada = demanda.minhaAvaliacao !== undefined;
          const mediaNotas = calcularMediaNotas(demanda.avaliacoes);
          const statusGeral = verificarStatusGeral(demanda.avaliacoes);
          const totalAvaliacoes = demanda.avaliacoes.length;

          return (
            <Card key={demanda.id} className="shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{demanda.titulo}</CardTitle>
                      {jaAvaliada ? (
                        <Badge className="bg-green-100 text-green-700 border-0 font-bold">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          AVALIADO
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 border-0 font-bold">
                          <Clock className="w-3 h-3 mr-1" />
                          PENDENTE
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      <strong>Empresa:</strong> {demanda.empresa}
                    </CardDescription>
                    <div className="mt-2">
                      <Badge variant="outline" className="font-semibold">
                        <Shield className="w-3 h-3 mr-1" />
                        {demanda.comissao}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAbrirAvaliacao(demanda)}
                    variant={jaAvaliada ? "outline" : "default"}
                    className={jaAvaliada ? "" : "bg-[#2F6B38] hover:bg-[#1a4122]"}
                  >
                    {jaAvaliada ? "Revisar Avaliação" : "Avaliar Proposta"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Descrição da Demanda
                      </Label>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{demanda.descricao}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-700" />
                          <p className="text-xs text-green-700 font-bold uppercase">Investimento</p>
                        </div>
                        <p className="text-xl font-black text-green-900">{demanda.investimento}</p>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-700" />
                          <p className="text-xs text-blue-700 font-bold uppercase">Prazo</p>
                        </div>
                        <p className="text-xl font-black text-blue-900">{demanda.prazo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Status da Avaliação
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Avaliações Recebidas</p>
                          <p className="text-2xl font-black text-gray-900">{totalAvaliacoes}/3</p>
                          <Progress value={(totalAvaliacoes / 3) * 100} className="h-2 mt-2" />
                        </div>

                        {totalAvaliacoes > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Nota Média</p>
                            <p className="text-3xl font-black text-[#2F6B38]">{mediaNotas}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {demanda.avaliacoes.length > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-3 text-sm">Avaliadores</h4>
                        <div className="space-y-2">
                          {demanda.avaliacoes.map((av, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Avatar className="w-8 h-8 border border-blue-300">
                                <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-xs">
                                  {getInitials(av.avaliadorNome)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900">{av.avaliadorNome}</p>
                                <p className="text-xs text-gray-600">Nota: {av.nota}</p>
                              </div>
                              {av.status === "aprovado" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Avaliação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Avaliação Técnica da Proposta</DialogTitle>
            <DialogDescription>
              {demandaSelecionada?.minhaAvaliacao
                ? "Revise ou atualize sua avaliação desta proposta"
                : "Forneça sua análise técnica e parecer sobre esta proposta"}
            </DialogDescription>
          </DialogHeader>

          {demandaSelecionada && (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-blue-900 mb-2">{demandaSelecionada.titulo}</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Empresa:</strong> {demandaSelecionada.empresa}
                  </p>
                  <p>
                    <strong>Investimento:</strong> {demandaSelecionada.investimento}
                  </p>
                  <p>
                    <strong>Prazo:</strong> {demandaSelecionada.prazo}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-gray-900">Nota de Viabilidade Técnica (0-10) *</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={notaAvaliacao}
                    onChange={(e) => setNotaAvaliacao(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-4xl font-black text-[#2F6B38] w-20 text-center">{notaAvaliacao}</span>
                </div>
                <Progress value={notaAvaliacao * 10} className="h-3" />
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-gray-900">Seu Parecer Técnico *</Label>
                <Textarea
                  value={parecerAvaliacao}
                  onChange={(e) => setParecerAvaliacao(e.target.value)}
                  placeholder="Descreva sua análise técnica, considerando viabilidade, riscos, recursos necessários, alinhamento com objetivos, etc..."
                  rows={8}
                  className="resize-none"
                />
              </div>

              {decisaoAvaliacao && (
                <div
                  className={`border-2 p-4 rounded-xl ${
                    decisaoAvaliacao === "aprovado" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                  }`}
                >
                  <p
                    className={`font-bold ${decisaoAvaliacao === "aprovado" ? "text-green-900" : "text-red-900"}`}
                  >
                    {decisaoAvaliacao === "aprovado" ? "Você aprovou esta proposta" : "Você rejeitou esta proposta"}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleSubmeterAvaliacao("rejeitado")}
                disabled={!parecerAvaliacao || notaAvaliacao === 0}
                variant="outline"
                className="flex-1 border-2 border-red-500 text-red-700 hover:bg-red-50 font-bold"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={() => handleSubmeterAvaliacao("aprovado")}
                disabled={!parecerAvaliacao || notaAvaliacao === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
