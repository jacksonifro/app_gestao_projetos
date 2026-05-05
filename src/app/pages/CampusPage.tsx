import { useState, useEffect } from "react";
import { Building2, Edit, Eye, Mail, MapPin, Phone, Plus, Search, Trash2 } from "lucide-react";
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
import { formatTelefone, formatCNPJ } from "../../lib/masks";

interface Campus {
  id: string;
  razaoSocial: string;
  sigla: string;
  nome: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  areasEspecializacao: string;
  diretorGeral: string;
  email: string;
  telefone: string;
}

export function CampusPage() {
  const [campusList, setCampusList] = useState<Campus[]>([]);

  useEffect(() => {
    fetchCampus();
  }, []);

  const fetchCampus = async () => {
    const { data, error } = await supabase.from('campus').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = data.map(d => ({
        id: d.id,
        razaoSocial: d.razao_social || "",
        sigla: d.sigla || "",
        nome: d.nome || "",
        cnpj: d.cnpj || "",
        logradouro: d.logradouro || d.endereco || "", // Fallback to old endereco if needed
        numero: d.numero || "",
        bairro: d.bairro || "",
        cidade: d.cidade || "",
        estado: d.estado || "",
        areasEspecializacao: d.areas_especializacao || "",
        diretorGeral: d.diretor_geral || d.coordenador || "", // Fallback to coordenador
        email: d.email || "",
        telefone: d.telefone || ""
      }));
      setCampusList(formatted);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Campus | null>(null);
  const [viewingItem, setViewingItem] = useState<Campus | null>(null);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    sigla: "",
    nome: "",
    cnpj: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    areasEspecializacao: "",
    diretorGeral: "",
    email: "",
    telefone: "",
  });

  const handleView = (item: Campus) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: Campus) => {
    setEditingItem(item);
    setFormData({
      razaoSocial: item.razaoSocial,
      sigla: item.sigla,
      nome: item.nome,
      cnpj: item.cnpj,
      logradouro: item.logradouro,
      numero: item.numero,
      bairro: item.bairro,
      cidade: item.cidade,
      estado: item.estado,
      areasEspecializacao: item.areasEspecializacao,
      diretorGeral: item.diretorGeral,
      email: item.email,
      telefone: item.telefone,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este campus?")) {
      const { error } = await supabase.from('campus').delete().eq('id', id);
      if (!error) {
        setCampusList(campusList.filter((c) => c.id !== id));
        modalSucesso("Campus excluído com sucesso!");
      } else {
        modalErro("Erro ao excluir: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      razao_social: formData.razaoSocial,
      sigla: formData.sigla,
      nome: formData.nome,
      cnpj: formData.cnpj,
      logradouro: formData.logradouro,
      numero: formData.numero,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      areas_especializacao: formData.areasEspecializacao,
      diretor_geral: formData.diretorGeral,
      email: formData.email,
      telefone: formData.telefone
    };

    if (editingItem) {
      const { error } = await supabase.from('campus').update(payload).eq('id', editingItem.id);
      if (error) {
        modalErro("Erro ao atualizar: " + error.message);
        return;
      }
      modalSucesso("Campus atualizado com sucesso!");
    } else {
      const { error } = await supabase.from('campus').insert([payload]);
      if (error) {
        modalErro("Erro ao cadastrar: " + error.message);
        return;
      }
      modalSucesso("Campus cadastrado com sucesso!");
    }

    setDialogOpen(false);
    resetForm();
    fetchCampus();
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      razaoSocial: "",
      sigla: "",
      nome: "",
      cnpj: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      areasEspecializacao: "",
      diretorGeral: "",
      email: "",
      telefone: "",
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const filteredCampus = campusList.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.areasEspecializacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.diretorGeral.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Cadastro de Campus</h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie os campus e suas áreas de especialização</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122] shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Novo Campus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Novo"} Campus</DialogTitle>
              <DialogDescription>
                Preencha os dados do campus e suas informações de contato
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social do Campus</Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                    placeholder="Ex: Instituto Federal de Educação, Ciência e Tecnologia de Rondônia - Campus Ji-Paraná"
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 space-y-2">
                    <Label htmlFor="nome">Nome do Campus (Curto) *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Câmpus Ji-Paraná"
                      required
                    />
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                      placeholder="Ex: JIP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diretorGeral">Diretor(a) Geral</Label>
                    <Input
                      id="diretorGeral"
                      value={formData.diretorGeral}
                      onChange={(e) => setFormData({ ...formData, diretorGeral: e.target.value })}
                      placeholder="Nome do diretor geral"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço</h4>
                  
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-9 space-y-2">
                      <Label htmlFor="logradouro">Logradouro / Rua</Label>
                      <Input
                        id="logradouro"
                        value={formData.logradouro}
                        onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                        placeholder="Ex: Rua Rio Amazonas"
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="Ex: 152"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5 space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        placeholder="Ex: Jardim dos Migrantes"
                      />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        placeholder="Ex: Ji-Paraná"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="estado">UF</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        placeholder="RO"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="campus@ifro.edu.br"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                      placeholder="(69) 0000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areas">Áreas de Especialização</Label>
                  <Textarea
                    id="areas"
                    value={formData.areasEspecializacao}
                    onChange={(e) => setFormData({ ...formData, areasEspecializacao: e.target.value })}
                    placeholder="Ex: Automação Industrial, Mecânica, Informática"
                    rows={2}
                  />
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
            <DialogTitle>Detalhes do Campus</DialogTitle>
            <DialogDescription>Visualização completa dos dados cadastrados</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2F6B38]/10 to-[#2F6B38]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-[#2F6B38]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl text-gray-900">{viewingItem.nome}</h3>
                    {viewingItem.sigla && <Badge className="bg-gray-200 text-gray-800">{viewingItem.sigla}</Badge>}
                  </div>
                  {viewingItem.razaoSocial && <p className="text-xs text-gray-500 mt-1">{viewingItem.razaoSocial}</p>}
                  {viewingItem.cnpj && <p className="text-xs text-gray-500 mt-0.5">CNPJ: {viewingItem.cnpj}</p>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-gray-900 font-bold flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-[#2F6B38]"/> Endereço Completo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Logradouro</span>
                    <span className="font-medium text-gray-900">{viewingItem.logradouro || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Número</span>
                    <span className="font-medium text-gray-900">{viewingItem.numero || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Bairro</span>
                    <span className="font-medium text-gray-900">{viewingItem.bairro || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Cidade/UF</span>
                    <span className="font-medium text-gray-900">{viewingItem.cidade}{viewingItem.estado ? ` - ${viewingItem.estado}` : ""}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500 text-xs uppercase mb-2 block">Áreas de Especialização</Label>
                <div className="flex flex-wrap gap-2">
                  {viewingItem.areasEspecializacao ? viewingItem.areasEspecializacao.split(",").map((area, idx) => (
                    <Badge key={idx} variant="outline" className="font-semibold">
                      {area.trim()}
                    </Badge>
                  )) : <span className="text-sm text-gray-500">Nenhuma área informada.</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4 border-t">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Diretor(a) Geral</Label>
                  <p className="font-semibold text-gray-900 mt-1">{viewingItem.diretorGeral || "-"}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">E-mail</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{viewingItem.email || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Telefone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{viewingItem.telefone || "-"}</p>
                  </div>
                </div>
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
              <CardTitle>Campus Cadastrados</CardTitle>
              <CardDescription>Total de {filteredCampus.length} campus(s)</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, cidade, áreas..."
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
                <TableHead className="font-bold">Nome do Campus</TableHead>
                <TableHead className="font-bold">Localização</TableHead>
                <TableHead className="font-bold">Áreas de Especialização</TableHead>
                <TableHead className="font-bold">Diretor Geral</TableHead>
                <TableHead className="font-bold">Contato</TableHead>
                <TableHead className="font-bold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampus.map((campus) => (
                <TableRow key={campus.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-900">{campus.nome} {campus.sigla ? `(${campus.sigla})` : ""}</span>
                      {campus.cnpj && <span className="text-xs text-gray-500">CNPJ: {campus.cnpj}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{campus.cidade}{campus.estado ? ` - ${campus.estado}` : ""}</p>
                        <p className="text-xs text-gray-600">{campus.logradouro ? `${campus.logradouro}, ${campus.numero}` : "-"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {campus.areasEspecializacao.split(",").slice(0, 2).map((area, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {area.trim()}
                        </Badge>
                      ))}
                      {campus.areasEspecializacao.split(",").length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{campus.areasEspecializacao.split(",").length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">{campus.diretorGeral || "-"}</TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-700">
                      <div>{campus.email}</div>
                      <div className="text-gray-600">{campus.telefone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(campus)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(campus)}
                        className="text-[#2F6B38] hover:text-[#1a4122] hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(campus.id)}
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
