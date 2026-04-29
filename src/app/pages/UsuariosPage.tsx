import { useState, useEffect } from "react";
import { UserCog, Edit, Link as LinkIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { modalErro, modalSucesso } from "../../lib/alerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { supabase } from "../../lib/supabase";

export function UsuariosPage() {
  const [perfis, setPerfis] = useState<any[]>([]);
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<any>(null);
  const [especialistaIdSelecionado, setEspecialistaIdSelecionado] = useState<string>("");
  const [roleSelecionado, setRoleSelecionado] = useState<string>("SERVIDOR");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Buscar perfis
    const { data: perfisData, error: perfisError } = await supabase
      .from('perfis')
      .select('*')
      .order('nome_completo');
      
    if (!perfisError && perfisData) {
      setPerfis(perfisData);
    }

    // Buscar especialistas
    const { data: espData, error: espError } = await supabase
      .from('especialistas')
      .select('id, nome, titulacao, campus')
      .order('nome');
      
    if (!espError && espData) {
      setEspecialistas(espData);
    }

    setLoading(false);
  }

  const handleOpenVincular = (perfil: any) => {
    setPerfilSelecionado(perfil);
    setEspecialistaIdSelecionado(perfil.especialista_id || "");
    setRoleSelecionado(perfil.role || "SERVIDOR");
    setIsDialogOpen(true);
  };

  const handleSalvarVinculo = async () => {
    if (!perfilSelecionado) return;

    const valorSalvar = especialistaIdSelecionado === "" ? null : especialistaIdSelecionado;

    const { error } = await supabase
      .from('perfis')
      .update({ especialista_id: valorSalvar, role: roleSelecionado })
      .eq('id', perfilSelecionado.id);

    if (error) {
      modalErro("Erro ao vincular especialista: " + error.message);
    } else {
      modalSucesso("Usuário vinculado com sucesso!");
      setIsDialogOpen(false);
      fetchData(); // Recarrega os dados
    }
  };

  const getEspecialistaNome = (id: string) => {
    const esp = especialistas.find(e => e.id === id);
    return esp ? esp.nome : "Desconhecido";
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Usuários do Sistema</h1>
          <p className="text-gray-600 text-lg">
            Gerencie os servidores cadastrados e vincule perfis de Especialistas
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserCog className="w-6 h-6 text-[#2F6B38]" />
            Lista de Servidores Cadastrados
          </CardTitle>
          <CardDescription>
            Mostrando todos os usuários com acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100/50">
                  <TableHead className="font-bold text-gray-700">Servidor</TableHead>
                  <TableHead className="font-bold text-gray-700">Campus / Lotação</TableHead>
                  <TableHead className="font-bold text-gray-700">Contato</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Nível de Acesso</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Perfil de Avaliação</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Nenhum usuário cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  perfis.map((perfil) => (
                    <TableRow key={perfil.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-gray-900">{perfil.nome_completo}</div>
                        <div className="text-sm text-gray-500 font-medium">{perfil.email || "Sem e-mail registrado"}</div>
                        <div className="text-xs text-gray-400 mt-1">SIAPE: {perfil.siape}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-800">{perfil.campus}</div>
                        <div className="text-sm text-gray-500">{perfil.setor}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700">{perfil.telefone || "-"}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-bold ${
                          perfil.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          perfil.role === 'REITORIA' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          perfil.role === 'AVALIADOR' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {perfil.role || 'SERVIDOR'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {perfil.especialista_id ? (
                          <Badge className="bg-[#2F6B38]/10 text-[#2F6B38] border-[#2F6B38]/20 hover:bg-[#2F6B38]/20">
                            <LinkIcon className="w-3 h-3 mr-1" />
                            {getEspecialistaNome(perfil.especialista_id)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-300">
                            Não Vinculado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[#2F6B38] border-[#2F6B38] hover:bg-[#2F6B38]/10"
                          onClick={() => handleOpenVincular(perfil)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {perfil.especialista_id ? "Alterar Vínculo" : "Vincular"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Ajuste as permissões e o perfil de especialista do servidor <span className="font-bold text-gray-900">{perfilSelecionado?.nome_completo}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div>
              <Label htmlFor="role" className="text-gray-700 font-semibold mb-2 block">
                Nível de Acesso (Perfil)
              </Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={roleSelecionado}
                onChange={(e) => setRoleSelecionado(e.target.value)}
              >
                <option value="SERVIDOR">Servidor (Submissão e Execução)</option>
                <option value="AVALIADOR">Avaliador (Acesso a Avaliações)</option>
                <option value="REITORIA">Reitoria (Gestão Macro)</option>
                <option value="ADMIN">Administrador (Acesso Total)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="especialista" className="text-gray-700 font-semibold mb-2 block">
                Selecione o Especialista (Opcional)
              </Label>
              <select
                id="especialista"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={especialistaIdSelecionado}
                onChange={(e) => setEspecialistaIdSelecionado(e.target.value)}
              >
                <option value="">-- Nenhum (Remover Vínculo) --</option>
                {especialistas.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nome} ({esp.campus})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Isso permitirá que o servidor receba demandas como avaliador quando este especialista for selecionado em uma comissão.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#2F6B38] text-white hover:bg-[#1a4122]" onClick={handleSalvarVinculo}>
              Salvar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
