import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { supabase } from "../../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.senha) return;
    
    setLoading(true);
    setError("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.senha,
    });

    if (error) {
      console.error("Erro detalhado do Supabase:", error);
      setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : `Erro do servidor: ${error.message}`);
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2F6B38]/5 via-white to-[#2F6B38]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2F6B38] to-[#1a4122] rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-black text-2xl">IF</span>
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">INSTITUTO FEDERAL</h1>
              <p className="text-sm text-gray-600 font-semibold">Rondônia</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Gestão de Projetos</h2>
          <p className="text-gray-600">Faça login para acessar o sistema</p>
        </div>

        <Card className="shadow-2xl border-2 border-gray-100">
          <CardHeader className="space-y-1 bg-gradient-to-br from-gray-50 to-white border-b">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Entre com suas credenciais institucionais</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail Institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.nome@ifro.edu.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-gray-600">Lembrar de mim</span>
                </label>
                <a href="#" className="text-[#2F6B38] hover:text-[#1a4122] font-semibold">
                  Esqueceu a senha?
                </a>
              </div>

              <Button type="submit" size="lg" className="w-full bg-[#2F6B38] hover:bg-[#1a4122] font-bold shadow-lg" disabled={loading}>
                {loading ? "Entrando..." : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar no Sistema
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 font-bold">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full font-semibold border-2"
                onClick={() => navigate("/cadastro")}
              >
                Criar Nova Conta
              </Button>

              <div className="text-center text-xs text-gray-500 pt-4">
                <p>Ao fazer login, você concorda com os</p>
                <a href="#" className="text-[#2F6B38] hover:underline font-semibold">
                  Termos de Uso e Política de Privacidade
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>&copy; 2026 Instituto Federal de Rondônia</p>
        </div>
      </div>
    </div>
  );
}
