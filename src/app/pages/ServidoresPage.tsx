import { useState, useEffect } from "react";
import { Award, Edit, Eye, ExternalLink, Mail, Phone, Plus, Search, Trash2, Users, ShieldCheck } from "lucide-react";
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
import { useAuth } from "../../contexts/AuthContext";

interface Servidor {
  id: string;
  nome_completo: string;
  email: string;
  siape: string;
  campus: string;
  setor: string;
  telefone: string;
  titulacao: string;
  especialidades: string;
  lattes?: string;
  role: string;
  projetos_ativos: number;
}

export function ServidoresPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "ADMIN";

  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetchServidores();
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    const { data, error } = await supabase.from('campus').select('id, nome').order('nome');
    if (!error && data) {
      setCampuses(data);
    }
  };

  const fetchServidores = async () => {
    const { data, error } = await supabase.from('perfis').select('*').order('nome_completo');
    if (!error && data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        nome_completo: d.nome_completo || "",
        email: d.email || "",
        siape: d.siape || "",
        campus: d.campus || "",
        setor: d.setor || "",
        telefone: d.telefone || "",
        titulacao: d.titulacao || "Graduado",
        especialidades: d.especialidades || "",
        lattes: d.lattes,
        role: d.role || "SERVIDOR",
        projetos_ativos: d.projetos_ativos || 0,
      }));
      setServidores(formatted);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Servidor | null>(null);
  const [viewingItem, setViewingItem] = useState<Servidor | null>(null);
  const [roleItem, setRoleItem] = useState<Servidor | null>(null);
  const [newRole, setNewRole] = useState("SERVIDOR");
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    siape: "",
    campus: "",
    setor: "",
    telefone: "",
    titulacao: "Graduado",
    especialidades: "",
    lattes: "",
  });

  const handleView = (item: Servidor) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: Servidor) => {
    setEditingItem(item);
    setFormData({
      nome_completo: item.nome_completo,
      email: item.email,
      siape: item.siape,
      campus: item.campus,
      setor: item.setor,
      telefone: item.telefone,
      titulacao: item.titulacao,
      especialidades: item.especialidades,
      lattes: item.lattes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este servidor?")) {
      const { error } = await supabase.from('perfis').delete().eq('id', id);
      if (!error) {
        setServidores(servidores.filter((e) => e.id !== id));
        modalSucesso("Servidor excluído com sucesso!");
      } else {
        modalErro("Erro ao excluir: " + error.message);
      }
    }
  };

  const handleOpenRoleDialog = (item: Servidor) => {
    setRoleItem(item);
    setNewRole(item.role);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleItem) return;
    const { error } = await supabase.from('perfis').update({ role: newRole }).eq('id', roleItem.id);
    if (error) {
      modalErro("Erro ao alterar perfil: " + error.message);
    } else {
      modalSucesso("Perfil alterado com sucesso!");
      setRoleDialogOpen(false);
      fetchServidores();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome_completo: formData.nome_completo,
      email: formData.email,
      siape: formData.siape,
      campus: formData.campus,
      setor: formData.setor,
      telefone: formData.telefone,
      titulacao: formData.titulacao,
      especialidades: formData.especialidades,
      lattes: formData.lattes || null,
    };

    if (editingItem) {
      const { error } = await supabase.from('perfis').update(payload).eq('id', editingItem.id);
      if (error) {
        modalErro("Erro ao atualizar: " + error.message);
        return;
      }
      modalSucesso("Servidor atualizado com sucesso!");
    } else {
      const { error } = await supabase.from('perfis').insert([{ ...payload, role: 'SERVIDOR', projetos_ativos: 0 }]);
      if (error) {
        modalErro("Erro ao cadastrar: " + error.message);
        return;
      }
      modalSucesso("Servidor cadastrado com sucesso!");
    }

    setDialogOpen(false);
    resetForm();
    fetchServidores();
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nome_completo: "",
      email: "",
      siape: "",
      campus: "",
      setor: "",
      telefone: "",
      titulacao: "Graduado",
      especialidades: "",
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

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      REITORIA: "bg-blue-100 text-blue-700 border-blue-200",
      AVALIADOR: "bg-orange-100 text-orange-700 border-orange-200",
      SERVIDOR: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[role] || styles.SERVIDOR;
  };

  const filteredServidores = servidores.filter((item) =>
    item.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.titulacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.especialidades.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.siape.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Servidores</h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie os servidores cadastrados no sistema</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122] shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Novo Servidor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Novo"} Servidor</DialogTitle>
              <DialogDescription>
                Preencha os dados do servidor
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      placeholder="Ex: Carlos Alberto Santos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siape">SIAPE *</Label>
                    <Input
                      id="siape"
                      value={formData.siape}
                      onChange={(e) => setFormData({ ...formData, siape: e.target.value })}
                      placeholder="0000000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">Setor/Departamento *</Label>
                  <Input
                    id="setor"
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    placeholder="Ex: Coordenação de Pesquisa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidades">Especialidades / Áreas de Atuação</Label>
                  <Textarea
                    id="especialidades"
                    value={formData.especialidades}
                    onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                    placeholder="Ex: Automação Industrial, IoT, Python, PLC"
                    rows={2}
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

      {/* Modal de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Servidor</DialogTitle>
            <DialogDescription>Visualização completa dos dados cadastrados</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-2xl">
                    {getInitials(viewingItem.nome_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900">{viewingItem.nome_completo}</h3>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span className="font-semibold">{viewingItem.titulacao}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-semibold">
                      {viewingItem.campus}
                    </Badge>
                    <Badge variant="outline" className={`font-bold ${getRoleBadge(viewingItem.role)}`}>
                      {viewingItem.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">SIAPE</Label>
                  <p className="text-gray-900 font-semibold mt-1">{viewingItem.siape}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Setor</Label>
                  <p className="text-gray-900 mt-1">{viewingItem.setor}</p>
                </div>
              </div>

              {viewingItem.especialidades && (
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
              )}

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
                <p className="text-4xl font-black text-[#2F6B38] mt-2">{viewingItem.projetos_ativos}</p>
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

      {/* Modal de Alterar Perfil (só ADMIN) */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Alterar Perfil de Acesso</DialogTitle>
            <DialogDescription>
              Altere o nível de acesso do servidor <span className="font-bold text-gray-900">{roleItem?.nome_completo}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="role-select" className="text-gray-700 font-semibold mb-2 block">
                Nível de Acesso
              </Label>
              <select
                id="role-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="SERVIDOR">Servidor (Submissão e Execução)</option>
                <option value="AVALIADOR">Avaliador (Acesso a Avaliações)</option>
                <option value="REITORIA">Reitoria (Gestão Macro)</option>
                <option value="ADMIN">Administrador (Acesso Total)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#2F6B38] text-white hover:bg-[#1a4122]" onClick={handleSaveRole}>
              Salvar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-xl">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servidores Cadastrados</CardTitle>
              <CardDescription>Total de {filteredServidores.length} servidor(es)</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, campus, SIAPE, especialidades..."
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
                <TableHead className="font-bold">Campus / Setor</TableHead>
                <TableHead className="font-bold">Especialidades</TableHead>
                <TableHead className="font-bold">Contato</TableHead>
                <TableHead className="font-bold text-center">Perfil</TableHead>
                <TableHead className="font-bold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServidores.map((servidor) => (
                <TableRow key={servidor.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#2F6B38] to-[#1a4122] text-white font-bold text-sm">
                          {getInitials(servidor.nome_completo)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{servidor.nome_completo}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Award className="w-3 h-3" />
                          {servidor.titulacao}
                        </div>
                        <p className="text-xs text-gray-400">SIAPE: {servidor.siape}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {servidor.campus}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{servidor.setor}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {servidor.especialidades ? (
                        <>
                          {servidor.especialidades.split(",").slice(0, 2).map((esp, idx) => (
                            <Badge key={idx} className="bg-[#2F6B38]/10 text-[#2F6B38] border-0 text-xs">
                              {esp.trim()}
                            </Badge>
                          ))}
                          {servidor.especialidades.split(",").length > 2 && (
                            <Badge className="bg-[#2F6B38]/10 text-[#2F6B38] border-0 text-xs">
                              +{servidor.especialidades.split(",").length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {servidor.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {servidor.telefone || "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`font-bold ${getRoleBadge(servidor.role)}`}>
                      {servidor.role || "SERVIDOR"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(servidor)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(servidor)}
                        className="text-[#2F6B38] hover:text-[#1a4122] hover:bg-green-50"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRoleDialog(servidor)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="Alterar Perfil"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(servidor.id)}
                        className="text-[#ED1C24] hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
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
