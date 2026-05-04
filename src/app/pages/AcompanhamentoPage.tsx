import { useState, useEffect } from "react";
import { BarChart3, CheckCircle, Clock, AlertTriangle, Target, ExternalLink, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { modalSucesso, modalErro } from "../../lib/alerts";

export function AcompanhamentoPage() {
  const { user, userRole } = useAuth();
  const isAdminOrReitoria = userRole === "ADMIN" || userRole === "REITORIA";

  const [projetos, setProjetos] = useState<any[]>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>("");
  const [metas, setMetas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [formData, setFormData] = useState({
    status: "AGENDADO",
    percentual: 0,
    custo_realizado: 0,
    observacoes: "",
    link_comprovacao: "",
    data_conclusao: "",
  });

  useEffect(() => {
    fetchProjetos();
  }, [user]);

  useEffect(() => {
    if (selectedProjetoId) {
      fetchMetas();
      fetchHistorico();
    }
  }, [selectedProjetoId]);

  const fetchProjetos = async () => {
    if (!user) return;
    let query = supabase.from("projetos").select("id, titulo, campus_key, status, vigencia_fim").eq("status", "EM EXECUÇÃO");
    if (!isAdminOrReitoria) query = query.eq("user_id", user.id);
    const { data } = await query.order("titulo");
    if (data) {
      setProjetos(data);
      if (data.length > 0 && !selectedProjetoId) setSelectedProjetoId(data[0].id);
    }
    setLoading(false);
  };

  const fetchMetas = async () => {
    const { data } = await supabase.from("metas").select("*").eq("projeto_id", selectedProjetoId).order("created_at");
    if (data) setMetas(data);
  };

  const fetchHistorico = async () => {
    const { data } = await supabase.from("historico_projeto").select("*").eq("projeto_id", selectedProjetoId).order("created_at", { ascending: false }).limit(20);
    if (data) setHistorico(data);
  };

  const handleOpenModal = (meta: any) => {
    setEditingMeta(meta);
    setFormData({
      status: meta.status || "AGENDADO",
      percentual: meta.percentual || 0,
      custo_realizado: meta.custo_realizado || 0,
      observacoes: meta.observacoes || "",
      link_comprovacao: meta.link_comprovacao || "",
      data_conclusao: meta.data_conclusao || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingMeta) return;
    const payload: any = {
      status: formData.status,
      percentual: formData.percentual,
      custo_realizado: formData.custo_realizado,
      observacoes: formData.observacoes,
      link_comprovacao: formData.link_comprovacao || null,
      data_conclusao: formData.data_conclusao || null,
    };
    if (formData.status === "CONCLUÍDO") payload.percentual = 100;

    const { error } = await supabase.from("metas").update(payload).eq("id", editingMeta.id);
    if (error) { modalErro("Erro ao salvar: " + error.message); return; }

    await supabase.from("historico_projeto").insert([{
      projeto_id: selectedProjetoId,
      tipo: "META_ATUALIZADA",
      descricao: `Meta "${editingMeta.titulo}" atualizada para ${formData.percentual}% - ${formData.status}`,
      usuario_id: user?.id,
    }]);

    modalSucesso("Progresso registrado com sucesso!");
    setIsModalOpen(false);
    fetchMetas();
    fetchHistorico();
  };

  const getStatusBadge = (meta: any) => {
    const isAtrasado = meta.previsao_conclusao && !meta.data_conclusao && new Date(meta.previsao_conclusao) < new Date() && meta.status !== "CONCLUÍDO";
    if (isAtrasado) return { label: "EM ATRASO", class: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle };
    if (meta.status === "CONCLUÍDO") return { label: "CONCLUÍDO", class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    if (meta.status === "PROCESSANDO") return { label: "EM ANDAMENTO", class: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock };
    return { label: "AGENDADO", class: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock };
  };

  const formatDate = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const formatCurrency = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const totalMetas = metas.length;
  const metasConcluidas = metas.filter(m => m.status === "CONCLUÍDO").length;
  const metasAtrasadas = metas.filter(m => m.previsao_conclusao && !m.data_conclusao && new Date(m.previsao_conclusao) < new Date() && m.status !== "CONCLUÍDO").length;
  const percentGeral = totalMetas > 0 ? Math.round(metas.reduce((a, m) => a + (m.percentual || 0), 0) / totalMetas) : 0;
  const custoTotal = metas.reduce((a, m) => a + (m.custo_estimado || 0), 0);
  const custoRealizado = metas.reduce((a, m) => a + (m.custo_realizado || 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Acompanhamento de Projetos</h1>
          <p className="text-gray-600">Registre o progresso das metas e entregas dos projetos em execução</p>
        </div>
      </div>

      {projetos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border mt-8">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Nenhum projeto em execução encontrado.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 mb-8">
            <Label className="font-semibold mb-2 block">Selecione o Projeto</Label>
            <select
              className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium"
              value={selectedProjetoId}
              onChange={(e) => setSelectedProjetoId(e.target.value)}
            >
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.titulo} — {p.campus_key}</option>
              ))}
            </select>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-[#2F6B38]">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase font-bold">Execução Geral</p>
                <p className="text-3xl font-black text-[#2F6B38]">{percentGeral}%</p>
                <Progress value={percentGeral} className="h-2 mt-2" />
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase font-bold">Metas Concluídas</p>
                <p className="text-3xl font-black text-green-600">{metasConcluidas}/{totalMetas}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase font-bold">Em Atraso</p>
                <p className="text-3xl font-black text-red-600">{metasAtrasadas}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase font-bold">Orçamento</p>
                <p className="text-lg font-black text-blue-700">{formatCurrency(custoRealizado)}</p>
                <p className="text-xs text-gray-500">de {formatCurrency(custoTotal)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Metas */}
          <Card className="shadow-xl mb-8">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#2F6B38]" />Metas do Projeto</CardTitle>
              <CardDescription>Registre o progresso de cada meta — clique em "Registrar Progresso"</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {metas.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Nenhuma meta cadastrada para este projeto.</div>
              ) : metas.map((meta, idx) => {
                const badge = getStatusBadge(meta);
                const Icon = badge.icon;
                return (
                  <div key={meta.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-8 h-8 bg-[#2F6B38] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <h4 className="font-bold text-gray-900 text-lg">{meta.titulo}</h4>
                          <Badge variant="outline" className={`${badge.class} font-bold`}>
                            <Icon className="w-3 h-3 mr-1" />{badge.label}
                          </Badge>
                        </div>
                        {meta.descricao && <p className="text-sm text-gray-600 ml-11 mb-3">{meta.descricao}</p>}

                        <div className="ml-11 flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-500">Previsão: </span>
                            <span className="font-semibold">{formatDate(meta.previsao_conclusao)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Concluído em: </span>
                            <span className="font-semibold">{formatDate(meta.data_conclusao)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Custo: </span>
                            <span className="font-semibold">{formatCurrency(meta.custo_realizado)} / {formatCurrency(meta.custo_estimado)}</span>
                          </div>
                          {meta.link_comprovacao && (
                            <a href={meta.link_comprovacao} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold">
                              <ExternalLink className="w-3 h-3" />Comprovação
                            </a>
                          )}
                        </div>

                        <div className="ml-11 mt-3 flex items-center gap-3">
                          <Progress value={meta.percentual || 0} className="h-3 flex-1 max-w-xs" />
                          <span className="text-sm font-black text-[#2F6B38]">{meta.percentual || 0}%</span>
                        </div>
                      </div>

                      <Button size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122] flex-shrink-0" onClick={() => handleOpenModal(meta)}>
                        <Save className="w-4 h-4 mr-2" />Registrar Progresso
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Histórico */}
          {historico.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-[#2F6B38]" />Histórico de Atualizações</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {historico.map((h) => (
                  <div key={h.id} className="p-4 flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#2F6B38] rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900">{h.descricao}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(h.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal Registrar Progresso */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Progresso</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Meta: <span className="font-bold text-gray-900">{editingMeta?.titulo}</span></p>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="AGENDADO">Agendado</option>
                  <option value="PROCESSANDO">Em Andamento</option>
                  <option value="CONCLUÍDO">Concluído</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Percentual de Conclusão: {formData.percentual}%</Label>
                <input type="range" min="0" max="100" step="5" value={formData.status === "CONCLUÍDO" ? 100 : formData.percentual} onChange={(e) => setFormData({ ...formData, percentual: parseInt(e.target.value) })} disabled={formData.status === "CONCLUÍDO"} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2F6B38]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Previsão de Conclusão</Label>
                <Input type="date" value={editingMeta?.previsao_conclusao || ""} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Data de Conclusão Real</Label>
                <Input type="date" value={formData.data_conclusao} onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custo Realizado (R$)</Label>
              <Input type="number" step="0.01" value={formData.custo_realizado} onChange={(e) => setFormData({ ...formData, custo_realizado: parseFloat(e.target.value) || 0 })} />
            </div>

            <div className="space-y-2">
              <Label>Link de Comprovação (Google Drive)</Label>
              <Input placeholder="https://drive.google.com/..." value={formData.link_comprovacao} onChange={(e) => setFormData({ ...formData, link_comprovacao: e.target.value })} />
              <p className="text-xs text-gray-500">Cole o link do Google Drive com os documentos comprobatórios</p>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Descreva o progresso realizado, dificuldades encontradas, etc." value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#2F6B38] hover:bg-[#1a4122]" onClick={handleSave}>Salvar Progresso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
