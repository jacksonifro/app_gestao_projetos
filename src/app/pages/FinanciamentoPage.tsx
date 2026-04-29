import { useState, useEffect } from "react";
import { DollarSign, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { modalErro, modalSucesso } from "../../lib/alerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { supabase } from "../../lib/supabase";

interface Financiamento {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  valorDisponivel: string;
  parlamentar?: string;
  ano?: string;
}

export function FinanciamentoPage() {
  const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);

  useEffect(() => {
    fetchFinanciamentos();
  }, []);

  const fetchFinanciamentos = async () => {
    const { data, error } = await supabase.from('financiamentos').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        tipo: d.tipo,
        descricao: d.descricao,
        valorDisponivel: d.valor_disponivel,
        parlamentar: d.parlamentar,
        ano: d.ano
      }));
      setFinanciamentos(formatted);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Financiamento | null>(null);
  const [viewingItem, setViewingItem] = useState<Financiamento | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Emenda Parlamentar",
    descricao: "",
    valorDisponivel: "",
    parlamentar: "",
    ano: "",
  });

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setFormData({ ...formData, valorDisponivel: "" });
      return;
    }
    const numberValue = parseInt(value, 10) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
    setFormData({ ...formData, valorDisponivel: formattedValue });
  };

  const handleView = (item: Financiamento) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: Financiamento) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      tipo: item.tipo,
      descricao: item.descricao,
      valorDisponivel: item.valorDisponivel,
      parlamentar: item.parlamentar || "",
      ano: item.ano || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este financiamento?")) {
      const { error } = await supabase.from('financiamentos').delete().eq('id', id);
      if (!error) {
        setFinanciamentos(financiamentos.filter((f) => f.id !== id));
        modalSucesso("Financiamento excluído com sucesso!");
      } else {
        modalErro("Erro ao excluir: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      descricao: formData.descricao,
      valor_disponivel: formData.valorDisponivel,
      parlamentar: formData.parlamentar,
      ano: formData.ano
    };

    if (editingItem) {
      const { error } = await supabase.from('financiamentos').update(payload).eq('id', editingItem.id);
      if (error) {
        modalErro("Erro ao atualizar: " + error.message);
        return;
      }
      modalSucesso("Financiamento atualizado com sucesso!");
    } else {
      const { error } = await supabase.from('financiamentos').insert([payload]);
      if (error) {
        modalErro("Erro ao cadastrar: " + error.message);
        return;
      }
      modalSucesso("Financiamento cadastrado com sucesso!");
    }

    setDialogOpen(false);
    resetForm();
    fetchFinanciamentos();
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nome: "",
      tipo: "Emenda Parlamentar",
      descricao: "",
      valorDisponivel: "",
      parlamentar: "",
      ano: "",
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const filteredFinanciamentos = financiamentos.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.parlamentar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Origem do Financiamento</h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie as fontes de recursos e emendas parlamentares</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122] shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Nova Origem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Nova"} Origem de Financiamento</DialogTitle>
              <DialogDescription>
                Preencha os dados da origem de financiamento ou emenda parlamentar
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Origem *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Emenda Parlamentar 2026-001"
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
                      <option value="Emenda Parlamentar">Emenda Parlamentar</option>
                      <option value="Convênio">Convênio</option>
                      <option value="Edital">Edital</option>
                      <option value="Recursos Próprios">Recursos Próprios</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a finalidade desta origem de recursos"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Disponível *</Label>
                    <Input
                      id="valor"
                      value={formData.valorDisponivel}
                      onChange={handleCurrencyChange}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parlamentar">Parlamentar (se aplicável)</Label>
                    <Input
                      id="parlamentar"
                      value={formData.parlamentar}
                      onChange={(e) => setFormData({ ...formData, parlamentar: e.target.value })}
                      placeholder="Nome do parlamentar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                      placeholder="2026"
                    />
                  </div>
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
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Origem de Financiamento</DialogTitle>
            <DialogDescription>Visualização completa dos dados cadastrados</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Nome da Origem</Label>
                  <p className="font-bold text-gray-900 text-lg mt-1">{viewingItem.nome}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Tipo</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-semibold text-sm">
                      {viewingItem.tipo}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500 text-xs uppercase">Descrição</Label>
                <p className="text-gray-900 mt-1 leading-relaxed">{viewingItem.descricao}</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Valor Disponível</Label>
                  <p className="font-bold text-[#2F6B38] text-xl mt-1">{viewingItem.valorDisponivel}</p>
                </div>
                {viewingItem.parlamentar && (
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Parlamentar</Label>
                    <p className="font-semibold text-gray-900 mt-1">{viewingItem.parlamentar}</p>
                  </div>
                )}
                {viewingItem.ano && (
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Ano</Label>
                    <p className="font-semibold text-gray-900 mt-1">{viewingItem.ano}</p>
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

      <Card className="shadow-xl">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fontes de Financiamento Cadastradas</CardTitle>
              <CardDescription>Total de {filteredFinanciamentos.length} origem(ns) de recurso</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, tipo, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold text-right">Valor Disponível</TableHead>
                <TableHead className="font-bold text-center">Detalhes</TableHead>
                <TableHead className="font-bold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinanciamentos.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">{item.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {item.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 max-w-md">{item.descricao}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-[#2F6B38]">
                    {item.valorDisponivel}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-600">
                    {item.parlamentar && <div>Parlamentar: {item.parlamentar}</div>}
                    {item.ano && <div>Ano: {item.ano}</div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(item)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="text-[#2F6B38] hover:text-[#1a4122] hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-[#ED1C24] hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
