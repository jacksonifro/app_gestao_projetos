import { useState, useEffect } from "react";
import { Shield, Edit, Eye, Plus, Trash2, Users, UserCheck, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { modalErro, modalSucesso } from "../../lib/alerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { supabase } from "../../lib/supabase";

interface Especialista {
  id: string;
  nome: string;
  titulacao: string;
  campus: string;
  especialidades: string;
}

interface Comissao {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
  dataCriacao: string;
  especialistas: Especialista[];
}

export function ComissaoPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [especialistasDisponiveis, setEspecialistasDisponiveis] = useState<Especialista[]>([]);

  useEffect(() => {
    fetchComissoes();
    fetchEspecialistas();
  }, []);

  const fetchEspecialistas = async () => {
    const { data, error } = await supabase.from("perfis").select("id, nome_completo, titulacao, campus, especialidades, role").in('role', ['AVALIADOR', 'ADMIN', 'REITORIA']);
    console.log("fetchEspecialistas - data:", data, "error:", error);
    if (data) {
      setEspecialistasDisponiveis(data.map((d: any) => ({
        id: d.id,
        nome: d.nome_completo || "",
        titulacao: d.titulacao || "Graduado",
        campus: d.campus || "",
        especialidades: d.especialidades || "",
      })));
    }
  };

  const fetchComissoes = async () => {
    const { data: comissoesData, error } = await supabase.from('comissoes').select('*').order('data_criacao', { ascending: false });
    if (error || !comissoesData) return;

    const { data: relacoes } = await supabase.from('comissao_especialistas').select(`
      comissao_id,
      especialista:perfis (id, nome_completo, titulacao, campus, especialidades)
    `);

    const formatadas = comissoesData.map((c: any) => {
      const espRel = relacoes?.filter((r: any) => r.comissao_id === c.id) || [];
      const especialistas = espRel.map((r: any) => ({
        id: r.especialista?.id,
        nome: r.especialista?.nome_completo || "",
        titulacao: r.especialista?.titulacao || "Graduado",
        campus: r.especialista?.campus || "",
        especialidades: r.especialista?.especialidades || "",
      }));
      
      return {
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        tipo: c.tipo,
        status: c.status,
        dataCriacao: new Date(c.data_criacao).toLocaleDateString("pt-BR"),
        especialistas: especialistas
      };
    });

    setComissoes(formatadas);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Comissao | null>(null);
  const [viewingItem, setViewingItem] = useState<Comissao | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "Permanente",
    status: "Ativa",
  });
  const [selectedEspecialistas, setSelectedEspecialistas] = useState<Especialista[]>([]);
  const [showEspecialistaDialog, setShowEspecialistaDialog] = useState(false);

  const handleView = (item: Comissao) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: Comissao) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      descricao: item.descricao,
      tipo: item.tipo,
      status: item.status,
    });
    setSelectedEspecialistas([...item.especialistas]);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta comissão?")) {
      const { error } = await supabase.from('comissoes').delete().eq('id', id);
      if (!error) {
        setComissoes(comissoes.filter((c) => c.id !== id));
        modalSucesso("Comissão excluída com sucesso!");
      } else {
        modalErro("Erro ao excluir comissão: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: formData.nome,
      descricao: formData.descricao,
      tipo: formData.tipo,
      status: formData.status
    };

    let comissaoId = editingItem?.id;

    if (editingItem) {
      const { error } = await supabase.from('comissoes').update(payload).eq('id', editingItem.id);
      if (error) {
        modalErro("Erro ao atualizar comissão.");
        return;
      }
      
      // Limpar especialistas antigos
      await supabase.from('comissao_especialistas').delete().eq('comissao_id', editingItem.id);
    } else {
      const { data, error } = await supabase.from('comissoes').insert([payload]).select().single();
      if (error || !data) {
        modalErro("Erro ao criar comissão.");
        return;
      }
      comissaoId = data.id;
    }

    // Inserir especialistas selecionados
    if (selectedEspecialistas.length > 0 && comissaoId) {
      const relacoes = selectedEspecialistas.map(esp => ({
        comissao_id: comissaoId,
        especialista_id: esp.id
      }));
      await supabase.from('comissao_especialistas').insert(relacoes);
    }

    setDialogOpen(false);
    resetForm();
    fetchComissoes();
    modalSucesso("Comissão salva com sucesso!");
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nome: "",
      descricao: "",
      tipo: "Permanente",
      status: "Ativa",
    });
    setSelectedEspecialistas([]);
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const addEspecialista = (especialista: Especialista) => {
    if (!selectedEspecialistas.find((e) => e.id === especialista.id)) {
      setSelectedEspecialistas([...selectedEspecialistas, especialista]);
    }
    setShowEspecialistaDialog(false);
  };

  const removeEspecialista = (id: string) => {
    setSelectedEspecialistas(selectedEspecialistas.filter((e) => e.id !== id));
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Comissões Avaliadoras</h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie as comissões e seus membros especialistas</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122] shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Nova Comissão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Nova"} Comissão Avaliadora</DialogTitle>
              <DialogDescription>Preencha os dados da comissão e adicione os especialistas membros</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Comissão *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Comissão de Inovação Tecnológica"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      required
                    >
                      <option value="Permanente">Permanente</option>
                      <option value="Temporária">Temporária</option>
                      <option value="Ad Hoc">Ad Hoc</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição e Finalidade *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a finalidade e escopo de atuação desta comissão"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    required
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                    <option value="Suspensa">Suspensa</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-bold">Especialistas Membros</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEspecialistaDialog(true)}
                      className="text-[#2F6B38] border-[#2F6B38]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Especialista
                    </Button>
                  </div>

                  {selectedEspecialistas.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">Nenhum especialista adicionado</p>
                      <p className="text-sm text-gray-400 mt-1">Clique em "Adicionar Especialista" para começar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedEspecialistas.map((esp) => (
                        <div
                          key={esp.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <Avatar className="w-10 h-10 border-2 border-white shadow">
                            <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-sm">
                              {getInitials(esp.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{esp.nome}</p>
                            <p className="text-xs text-gray-600">
                              {esp.titulacao} - {esp.campus}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEspecialista(esp.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#2F6B38] hover:bg-[#1a4122]">
                  {editingItem ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showEspecialistaDialog} onOpenChange={setShowEspecialistaDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Especialista à Comissão</DialogTitle>
              <DialogDescription>Selecione um especialista da lista disponível</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto py-4">
              {especialistasDisponiveis
                .filter((esp) => !selectedEspecialistas.find((s) => s.id === esp.id))
                .map((especialista) => (
                  <div
                    key={especialista.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => addEspecialista(especialista)}
                  >
                    <Avatar className="w-12 h-12 border-2 border-white shadow">
                      <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold">
                        {getInitials(especialista.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{especialista.nome}</p>
                      <p className="text-sm text-gray-600">
                        {especialista.titulacao} - {especialista.campus}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{especialista.especialidades}</p>
                    </div>
                    <UserCheck className="w-5 h-5 text-[#2F6B38]" />
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Comissão Avaliadora</DialogTitle>
              <DialogDescription>Visualização completa dos dados cadastrados</DialogDescription>
            </DialogHeader>

            {viewingItem && (
              <div className="space-y-6 py-4">
                <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2F6B38]/10 to-[#2F6B38]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-[#2F6B38]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl text-gray-900 mb-2">{viewingItem.nome}</h3>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${
                          viewingItem.status === "Ativa"
                            ? "bg-green-100 text-green-700"
                            : viewingItem.status === "Inativa"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        } border-0 font-bold`}
                      >
                        {viewingItem.status}
                      </Badge>
                      <Badge variant="outline" className="font-semibold">
                        {viewingItem.tipo}
                      </Badge>
                      <span className="text-sm text-gray-600">Criada em: {viewingItem.dataCriacao}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500 text-xs uppercase">Descrição e Finalidade</Label>
                  <p className="text-gray-900 mt-2 leading-relaxed">{viewingItem.descricao}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-[#2F6B38]" />
                    <Label className="text-base font-bold text-gray-900">
                      Membros da Comissão ({viewingItem.especialistas.length})
                    </Label>
                  </div>

                  {viewingItem.especialistas.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">Nenhum especialista vinculado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingItem.especialistas.map((especialista) => (
                        <div
                          key={especialista.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <Avatar className="w-14 h-14 border-2 border-white shadow">
                            <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-lg">
                              {getInitials(especialista.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{especialista.nome}</p>
                            <p className="text-sm text-gray-600 truncate">{especialista.titulacao}</p>
                            <p className="text-xs text-gray-500 truncate">{especialista.campus}</p>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {especialista.especialidades.split(",")[0].trim()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {comissoes.map((comissao) => (
          <Card key={comissao.id} className="shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2F6B38]/10 to-[#2F6B38]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-[#2F6B38]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{comissao.nome}</CardTitle>
                      <Badge
                        className={`${
                          comissao.status === "Ativa"
                            ? "bg-green-100 text-green-700"
                            : comissao.status === "Inativa"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        } border-0 font-bold`}
                      >
                        {comissao.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">{comissao.descricao}</CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <Badge variant="outline" className="font-semibold">
                        {comissao.tipo}
                      </Badge>
                      <span>Criada em: {comissao.dataCriacao}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(comissao)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(comissao)}
                    className="text-[#2F6B38] border-[#2F6B38] hover:bg-green-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(comissao.id)}
                    className="text-[#ED1C24] border-[#ED1C24] hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Membros da Comissão ({comissao.especialistas.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comissao.especialistas.map((especialista) => (
                    <div
                      key={especialista.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <Avatar className="w-12 h-12 border-2 border-white shadow">
                        <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold">
                          {getInitials(especialista.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{especialista.nome}</p>
                        <p className="text-xs text-gray-600 truncate">{especialista.campus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
