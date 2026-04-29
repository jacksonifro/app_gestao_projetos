import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, Mail, Lock, User, Building2, Phone, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { modalErro, modalSucesso } from "../../lib/alerts";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { supabase } from "../../lib/supabase";
import { formatTelefone } from "../../lib/masks";

export function CadastroPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    siape: "",
    campus: "",
    setor: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [campuses, setCampuses] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    const { data, error } = await supabase.from('campus').select('id, nome').order('nome');
    if (!error && data) {
      setCampuses(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem!");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha,
      options: {
        data: {
          nomeCompleto: formData.nomeCompleto,
          siape: formData.siape,
          campus: formData.campus,
          setor: formData.setor,
          telefone: formData.telefone,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      await modalSucesso("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta ou faça login.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2F6B38]/5 via-white to-[#2F6B38]/10 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-[#2F6B38] hover:text-[#1a4122] font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-black text-xl">IF</span>
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-xl text-gray-900 tracking-tight">INSTITUTO FEDERAL</h1>
              <p className="text-xs text-gray-600 font-semibold">Rondônia</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro de Servidor</h2>
          <p className="text-gray-600">Preencha seus dados para propor projetos de pesquisa e inovação</p>
        </div>

        <Card className="shadow-2xl border-2 border-gray-100">
          <CardHeader className="space-y-1 bg-gradient-to-br from-gray-50 to-white border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-[#2F6B38]" />
              Nova Conta
            </CardTitle>
            <CardDescription>Crie sua conta para acessar o sistema de gestão de projetos</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b">
                  <User className="w-4 h-4 text-[#2F6B38]" />
                  Dados Pessoais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      placeholder="João da Silva Santos"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siape">SIAPE *</Label>
                    <Input
                      id="siape"
                      placeholder="0000000"
                      value={formData.siape}
                      onChange={(e) => setFormData({ ...formData, siape: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-cadastro">E-mail Institucional *</Label>
                    <Input
                      id="email-cadastro"
                      type="email"
                      placeholder="seu.nome@ifro.edu.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      placeholder="(69) 99999-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b">
                  <Building2 className="w-4 h-4 text-[#2F6B38]" />
                  Lotação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campus-cadastro">Campus *</Label>
                    <select
                      id="campus-cadastro"
                      value={formData.campus}
                      onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      required
                    >
                      <option value="">Selecione seu campus</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                      <option value="Reitoria">Reitoria</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor/Departamento *</Label>
                    <Input
                      id="setor"
                      placeholder="Ex: Coordenação de Pesquisa"
                      value={formData.setor}
                      onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b">
                  <Lock className="w-4 h-4 text-[#2F6B38]" />
                  Segurança
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha-cadastro">Senha *</Label>
                    <Input
                      id="senha-cadastro"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      required
                      minLength={8}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar">Confirmar Senha *</Label>
                    <Input
                      id="confirmar"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                      required
                      minLength={8}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-[#2F6B38] p-4 rounded-r-lg">
                <p className="text-sm text-gray-700">
                  <strong>Importante:</strong> Utilize seu e-mail institucional @ifro.edu.br para o cadastro. Após a
                  submissão, sua conta passará por validação antes de ser ativada.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="termos" required className="rounded border-gray-300" />
                <label htmlFor="termos" className="text-sm text-gray-600">
                  Li e concordo com os{" "}
                  <a href="#" className="text-[#2F6B38] hover:underline font-semibold">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-[#2F6B38] hover:underline font-semibold">
                    Política de Privacidade
                  </a>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="lg" className="flex-1 bg-[#2F6B38] hover:bg-[#1a4122] font-bold shadow-lg" disabled={loading}>
                  {loading ? "Criando Conta..." : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            Já possui uma conta?{" "}
            <Link to="/login" className="text-[#2F6B38] hover:text-[#1a4122] font-semibold hover:underline">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
