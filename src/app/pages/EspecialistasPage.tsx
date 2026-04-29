import { useState, useEffect } from "react";
import { Award, Edit, Eye, ExternalLink, Mail, Phone, Plus, Search, Trash2, User, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { modalErro, modalSucesso } from "../../lib/alerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { supabase } from "../../lib/supabase";
import { formatTelefone } from "../../lib/masks";

interface Especialista {
  id: string;
  nome: string;
  titulacao: string;
  campus: string;
  especialidades: string;
  email: string;
  telefone: string;
  lattes?: string;
  projetosAtivos: number;
}

export function EspecialistasPage() {
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetchEspecialistas();
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    const { data, error } = await supabase.from('campus').select('id, nome').order('nome');
    if (!error && data) {
      setCampuses(data);
    }
  };

  const fetchEspecialistas = async () => {
    const { data, error } = await supabase.from('especialistas').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        titulacao: d.titulacao,
        campus: d.campus,
        especialidades: d.especialidades,
        email: d.email,
        telefone: d.telefone,
        lattes: d.lattes,
        projetosAtivos: d.projetos_ativos || 0
      }));
      setEspecialistas(formatted);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Especialista | null>(null);
  const [viewingItem, setViewingItem] = useState<Especialista | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    titulacao: "Graduado",
    campus: "",
    especialidades: "",
    email: "",
    telefone: "",
    lattes: "",
  });

  const handleView = (item: Especialista) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: Especialista) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      titulacao: item.titulacao,
      campus: item.campus,
      especialidades: item.especialidades,
      email: item.email,
      telefone: item.telefone,
      lattes: item.lattes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este especialista?")) {
      const { error } = await supabase.from('especialistas').delete().eq('id', id);
      if (!error) {
        setEspecialistas(especialistas.filter((e) => e.id !== id));
        modalSucesso("Especialista excluído com sucesso!");
      } else {
        modalErro("Erro ao excluir: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: formData.nome,
      titulacao: formData.titulacao,
      campus: formData.campus,
      especialidades: formData.especialidades,
      email: formData.email,
      telefone: formData.telefone,
      lattes: formData.lattes
    };

    if (editingItem) {
      const { error } = await supabase.from('especialistas').update(payload).eq('id', editingItem.id);
      if (error) {
        modalErro("Erro ao atualizar: " + error.message);
        return;
      }
      modalSucesso("Especialista atualizado com sucesso!");
    } else {
      const { error } = await supabase.from('especialistas').insert([{ ...payload, projetos_ativos: 0 }]);
      if (error) {
        modalErro("Erro ao cadastrar: " + error.message);
        return;
      }
      modalSucesso("Especialista cadastrado com sucesso!");
    }

    setDialogOpen(false);
    resetForm();
    fetchEspecialistas();
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nome: "",
      titulacao: "Graduado",
      campus: "",
      especialidades: "",
      email: "",
      telefone: "",
      lattes: "",
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const filteredEspecialistas = especialistas.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.titulacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.especialidades.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Especialistas em Projetos</h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie os especialistas e pesquisadores dos campus</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122] shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Novo Especialista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Novo"} Especialista</DialogTitle>
              <DialogDescription>
                Preencha os dados do especialista e suas áreas de atuação
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Dr. Carlos Alberto Santos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulacao">Titulação *</Label>
                    <select
                      id="titulacao"
                      value={formData.titulacao}
                      onChange={(e) => setFormData({ ...formData, titulacao: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      required
                    >
                      <option value="Graduado">Graduado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                      <option value="Doutor">Doutor</option>
                      <option value="Pós-Doutor">Pós-Doutor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus">Campus *</Label>
                  <select
                    id="campus"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    required
                  >
                    <option value="">Selecione um campus</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidades">Especialidades / Áreas de Atuação *</Label>
                  <Textarea
                    id="especialidades"
                    value={formData.especialidades}
                    onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                    placeholder="Ex: Automação Industrial, IoT, Python, PLC"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Institucional *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nome@ifro.edu.br"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                      placeholder="(69) 99999-0000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lattes">Lattes (opcional)</Label>
                    <Input
                      id="lattes"
                      value={formData.lattes}
                      onChange={(e) => setFormData({ ...formData, lattes: e.target.value })}
                      placeholder="URL do Lattes"
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Especialista</DialogTitle>
            <DialogDescription>Visualização completa dos dados cadastrados</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-2xl">
                    {getInitials(viewingItem.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900">{viewingItem.nome}</h3>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span className="font-semibold">{viewingItem.titulacao}</span>
                  </div>
                  <Badge variant="outline" className="mt-2 font-semibold">
                    {viewingItem.campus}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-gray-500 text-xs uppercase mb-2 block">Especialidades / Áreas de Atuação</Label>
                <div className="flex flex-wrap gap-2">
                  {viewingItem.especialidades.split(",").map((esp, idx) => (
                    <Badge key={idx} className="bg-[#2F6B38]/10 text-[#2F6B38] border-0">
                      {esp.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">E-mail Institucional</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{viewingItem.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Telefone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{viewingItem.telefone}</p>
                  </div>
                </div>
              </div>

              {viewingItem.lattes && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Currículo Lattes</Label>
                  <a
                    href={viewingItem.lattes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-1 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Acessar Currículo Lattes
                  </a>
                </div>
              )}

              <div className="pt-4 border-t">
                <Label className="text-gray-500 text-xs uppercase">Projetos Ativos</Label>
                <p className="text-4xl font-black text-[#2F6B38] mt-2">{viewingItem.projetosAtivos}</p>
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
              <CardTitle>Especialistas Cadastrados</CardTitle>
              <CardDescription>Total de {filteredEspecialistas.length} especialista(s)</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, campus, especialidades..."
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
                <TableHead className="font-bold">Nome / Titulação</TableHead>
                <TableHead className="font-bold">Campus</TableHead>
                <TableHead className="font-bold">Especialidades</TableHead>
                <TableHead className="font-bold">Contato</TableHead>
                <TableHead className="font-bold text-center">Projetos Ativos</TableHead>
                <TableHead className="font-bold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEspecialistas.map((especialista) => (
                <TableRow key={especialista.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-sm">
                          {getInitials(especialista.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{especialista.nome}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Award className="w-3 h-3" />
                          {especialista.titulacao}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {especialista.campus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {especialista.especialidades.split(",").slice(0, 2).map((esp, idx) => (
                        <Badge key={idx} className="bg-[#2F6B38]/10 text-[#2F6B38] border-0 text-xs">
                          {esp.trim()}
                        </Badge>
                      ))}
                      {especialista.especialidades.split(",").length > 2 && (
                        <Badge className="bg-[#2F6B38]/10 text-[#2F6B38] border-0 text-xs">
                          +{especialista.especialidades.split(",").length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {especialista.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {especialista.telefone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xl font-bold text-[#2F6B38]">{especialista.projetosAtivos}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(especialista)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(especialista)}
                        className="text-[#2F6B38] hover:text-[#1a4122] hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(especialista.id)}
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
