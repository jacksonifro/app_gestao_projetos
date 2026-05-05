import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Building2, Users, Target, AlertTriangle, FileText, Calendar, DollarSign, Printer, ExternalLink, FolderOpen, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { supabase } from "../../lib/supabase";

const CAMPUS_DATA: Record<string, { nome: string; cnpj: string; endereco: string }> = {
  jiparana: { nome: "Campus Ji-Paraná", cnpj: "10.817.343/0002-19", endereco: "Rua Rio Amazonas, 351" },
  pvelho: { nome: "Campus Porto Velho Calama", cnpj: "10.817.343/0004-80", endereco: "Rua Calama, 4985" },
  vilhena: { nome: "Campus Vilhena", cnpj: "10.817.343/0003-00", endereco: "Rodovia BR 174, km 3" },
  ariquemes: { nome: "Campus Ariquemes", cnpj: "10.817.343/0005-61", endereco: "Rodovia RO-257, km 04" },
  cacoal: { nome: "Campus Cacoal", cnpj: "10.817.343/0006-42", endereco: "Rua IFRO, nº 103" },
  colorado: { nome: "Campus Colorado do Oeste", cnpj: "10.817.343/0007-23", endereco: "Rodovia BR 435, km 63" },
  guajara: { nome: "Campus Guajará-Mirim", cnpj: "10.817.343/0009-54", endereco: "Av. 15 de novembro, 4849" },
  pvz: { nome: "Campus Porto Velho Zona Norte", cnpj: "10.817.343/0011-89", endereco: "Av. Gov. Jorge Teixeira, 3146" },
};

const fmt = (v: any) => typeof v === "number" ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : v || "—";
const fmtDate = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";

const Section = ({ title, icon: Icon, children, id }: any) => (
  <div id={id} className="mb-8 print:break-inside-avoid">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#2F6B38] flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-[#2F6B38]" />}{title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, value, className }: any) => (
  <div className={className}>
    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</p>
    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{value || "—"}</p>
  </div>
);

const ExecBadge = ({ children }: any) => (
  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-semibold text-sm inline-flex items-center gap-1">
    <BarChart3 className="w-3.5 h-3.5" />{children}
  </span>
);

export function VisualizacaoProjetoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<any>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProjeto();
  }, [id]);

  const fetchProjeto = async () => {
    const { data } = await supabase.from("projetos").select("*").eq("id", id).single();
    if (data) setProjeto(data);
    const { data: metasData } = await supabase.from("metas").select("*").eq("projeto_id", id).order("created_at");
    if (metasData) setMetas(metasData);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando projeto...</div>;
  if (!projeto) return <div className="min-h-screen flex items-center justify-center text-red-500">Projeto não encontrado.</div>;

  const campus = CAMPUS_DATA[projeto.campus_key];
  const objs: any[] = projeto.objetivos_especificos || [];
  const partes: any[] = projeto.partes_interessadas || [];
  const riscos: any[] = projeto.mapa_risco || [];
  const equipe: any[] = projeto.equipe || [];
  const produtos: any[] = projeto.produtos_resultados || [];
  const cronograma: any[] = projeto.cronograma_aba1 || [];
  const metasPlano: any[] = projeto.metas_plano_trabalho || [];
  const desembolsos: any[] = projeto.cronograma_desembolso || [];
  const inst = projeto.plano_instituicao || {};
  const custoTotalEst = metas.reduce((a, m) => a + (m.custo_estimado || 0), 0);
  const custoTotalReal = metas.reduce((a, m) => a + (m.custo_realizado || 0), 0);
  const temExecucao = metas.some(m => (m.percentual || 0) > 0 || (m.custo_realizado || 0) > 0);

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl print:max-w-full print:px-2 print:py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600"><ArrowLeft className="w-5 h-5 mr-2" />Voltar</Button>
        <Button className="bg-[#2F6B38] hover:bg-[#1a4122]" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2F6B38] to-[#1a4122] p-8 rounded-2xl text-white shadow-xl mb-8 print:rounded-none print:shadow-none print:p-4">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-white/20 text-white font-bold px-3 py-1 text-sm">{projeto.status}</Badge>
          {campus && <span className="text-white/80 text-sm">{campus.nome}</span>}
        </div>
        <h1 className="text-3xl font-extrabold mb-2 print:text-xl">{projeto.titulo}</h1>
        {projeto.acao_estrategica && <p className="text-white/80">Ação Estratégica: {projeto.acao_estrategica}</p>}
      </div>

      {/* Execução Resumo (se houver) */}
      {temExecucao && (
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50 print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center gap-2"><BarChart3 className="w-5 h-5" />Resumo da Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div><p className="text-xs text-blue-600 uppercase font-bold">Metas Concluídas</p><p className="text-2xl font-black text-blue-700">{metas.filter(m => m.status === "CONCLUÍDO").length}/{metas.length}</p></div>
              <div><p className="text-xs text-blue-600 uppercase font-bold">Execução Geral</p><p className="text-2xl font-black text-blue-700">{metas.length ? Math.round(metas.reduce((a, m) => a + (m.percentual || 0), 0) / metas.length) : 0}%</p></div>
              <div><p className="text-xs text-blue-600 uppercase font-bold">Orçamento Estimado</p><p className="text-lg font-bold text-gray-900">{fmt(custoTotalEst)}</p></div>
              <div><p className="text-xs text-blue-600 uppercase font-bold">Orçamento Realizado</p><p className="text-lg font-bold text-blue-700">{fmt(custoTotalReal)}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PROJETO BÁSICO */}
      <div className="bg-gray-100 text-center py-3 rounded-lg mb-6 font-bold text-gray-700 uppercase tracking-wider print:bg-gray-200">
        Projeto Básico
      </div>

      <Section title="Identificação do Campus" icon={Building2}>
        {campus && (
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <Field label="Campus" value={campus.nome} />
            <Field label="CNPJ" value={campus.cnpj} />
            <Field label="Endereço" value={campus.endereco} />
            <Field label="Telefone" value={projeto.campus_telefone} />
          </div>
        )}
      </Section>

      <Section title="Responsáveis" icon={Users}>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="font-bold text-[#2F6B38] mb-3">Coordenador(a) Geral</p>
            <Field label="Nome" value={projeto.coord_geral_nome} className="mb-2" />
            <Field label="E-mail" value={projeto.coord_geral_email} className="mb-2" />
            <Field label="Telefone" value={projeto.coord_geral_telefone} className="mb-2" />
            <Field label="Lotação" value={projeto.coord_geral_campus} />
          </div>
          {projeto.coord_exec_nome && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="font-bold text-[#2F6B38] mb-3">Coordenador(a) Executivo(a)</p>
              <Field label="Nome" value={projeto.coord_exec_nome} className="mb-2" />
              <Field label="E-mail" value={projeto.coord_exec_email} className="mb-2" />
              <Field label="Telefone" value={projeto.coord_exec_telefone} className="mb-2" />
              <Field label="Lotação" value={projeto.coord_exec_campus} />
            </div>
          )}
        </div>
      </Section>

      {projeto.introducao && <Section title="1. Introdução"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{projeto.introducao}</p></Section>}

      <Section title="2. Objetivos" icon={Target}>
        <Field label="Objeto do Projeto" value={projeto.objeto_projeto} className="mb-4" />
        <Field label="Objetivo Geral" value={projeto.objetivo_geral} className="mb-4" />
        {objs.length > 0 && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Objetivos Específicos, Metas e Indicadores</p>
            {objs.map((o: any, i: number) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-bold text-[#2F6B38]">Objetivo {i + 1}: {o.objetivo}</p>
                {o.metas?.length > 0 && <div className="mt-2"><p className="text-xs text-gray-500 uppercase font-bold">Metas</p>{o.metas.map((m: string, j: number) => <p key={j} className="text-sm text-gray-700">• {m}</p>)}</div>}
                {o.indicadores?.length > 0 && <div className="mt-2"><p className="text-xs text-gray-500 uppercase font-bold">Indicadores</p>{o.indicadores.map((ind: string, j: number) => <p key={j} className="text-sm text-gray-700">• {ind}</p>)}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {projeto.justificativa && <Section title="3. Justificativa"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{projeto.justificativa}</p></Section>}
      {projeto.metodologia && <Section title="4. Metodologia"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{projeto.metodologia}</p></Section>}

      {(projeto.vigencia_inicio || projeto.vigencia_fim) && (
        <Section title="5. Vigência" icon={Calendar}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Início" value={fmtDate(projeto.vigencia_inicio)} />
            <Field label="Fim" value={fmtDate(projeto.vigencia_fim)} />
            <Field label="Duração" value={projeto.duracao_meses ? `${projeto.duracao_meses} meses` : "—"} />
          </div>
        </Section>
      )}

      {projeto.publico_alvo && <Section title="6. Público-Alvo"><p className="text-gray-700">{projeto.publico_alvo}</p></Section>}

      {partes.length > 0 && (
        <Section title="7. Partes Interessadas">
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Parte</TableHead><TableHead className="font-bold">Descrição</TableHead><TableHead className="font-bold text-center">Nível</TableHead></TableRow></TableHeader>
            <TableBody>{partes.map((p: any, i: number) => <TableRow key={i}><TableCell className="font-semibold">{p.parte}</TableCell><TableCell>{p.descricao}</TableCell><TableCell className="text-center"><Badge variant="outline">{p.nivel}</Badge></TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {produtos.length > 0 && (
        <Section title="8. Produtos e Resultados">
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Meta</TableHead><TableHead className="font-bold">Produto</TableHead><TableHead className="font-bold">Resultado</TableHead><TableHead className="font-bold text-center">Prazo</TableHead></TableRow></TableHeader>
            <TableBody>{produtos.map((p: any, i: number) => <TableRow key={i}><TableCell>{p.meta}</TableCell><TableCell>{p.produto}</TableCell><TableCell>{p.resultado}</TableCell><TableCell className="text-center">{p.prazo}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {riscos.length > 0 && (
        <Section title="9. Mapa de Riscos" icon={AlertTriangle}>
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Risco</TableHead><TableHead className="font-bold">Impacto</TableHead><TableHead className="font-bold">Ação</TableHead><TableHead className="font-bold">Responsável</TableHead></TableRow></TableHeader>
            <TableBody>{riscos.map((r: any, i: number) => <TableRow key={i}><TableCell>{r.descricaoRisco}</TableCell><TableCell>{r.descricaoImpacto}</TableCell><TableCell>{r.acao}</TableCell><TableCell>{r.responsavel}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {equipe.length > 0 && (
        <Section title="10. Equipe" icon={Users}>
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Nome</TableHead><TableHead className="font-bold">Função</TableHead><TableHead className="font-bold">Perfil</TableHead><TableHead className="font-bold">Atribuições</TableHead></TableRow></TableHeader>
            <TableBody>{equipe.map((e: any, i: number) => <TableRow key={i}><TableCell className="font-semibold">{e.nome}</TableCell><TableCell>{e.funcao}</TableCell><TableCell>{e.perfil}</TableCell><TableCell className="text-sm">{e.atribuicoes}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {cronograma.length > 0 && (
        <Section title="11. Cronograma" icon={Calendar}>
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Ação</TableHead><TableHead className="font-bold">Obj. Específico</TableHead><TableHead className="font-bold text-center">Início</TableHead><TableHead className="font-bold text-center">Entrega</TableHead></TableRow></TableHeader>
            <TableBody>{cronograma.map((c: any, i: number) => <TableRow key={i}><TableCell>{c.acao}</TableCell><TableCell>{c.objetivoEspecifico}</TableCell><TableCell className="text-center">{c.previsaoInicio}</TableCell><TableCell className="text-center">{c.previsaoEntrega}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {projeto.plano_comunicacao && <Section title="12. Plano de Comunicação"><p className="text-gray-700 whitespace-pre-wrap">{projeto.plano_comunicacao}</p></Section>}
      {projeto.referencias && <Section title="13. Referências"><p className="text-gray-700 whitespace-pre-wrap">{projeto.referencias}</p></Section>}

      {/* PLANO DE TRABALHO */}
      <div className="bg-gray-100 text-center py-3 rounded-lg mb-6 mt-10 font-bold text-gray-700 uppercase tracking-wider print:bg-gray-200">
        Plano de Trabalho
      </div>

      {inst.instUnidadeExecutora && (
        <Section title="Instituição Responsável" icon={Building2}>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <Field label="Unidade Executora" value={inst.instUnidadeExecutora} />
            <Field label="E-mail" value={inst.instEmail} />
            <Field label="Endereço" value={inst.instEndereco} />
            <Field label="Bairro" value={inst.instBairro} />
          </div>
        </Section>
      )}

      {metasPlano.length > 0 && (
        <Section title="Cronograma Físico-Financeiro" icon={DollarSign}>
          {metasPlano.map((meta: any, idx: number) => (
            <div key={idx} className="mb-4 bg-gray-50 p-4 rounded-lg border">
              <p className="font-bold text-[#2F6B38] mb-2">Meta {idx + 1}: {meta.descricao}</p>
              <Table>
                <TableHeader><TableRow><TableHead className="font-bold">Especificação</TableHead><TableHead className="font-bold">Rubrica</TableHead><TableHead className="font-bold text-right">Valor</TableHead><TableHead className="font-bold text-center">Início</TableHead><TableHead className="font-bold text-center">Término</TableHead></TableRow></TableHeader>
                <TableBody>{(meta.etapas || []).map((e: any, i: number) => <TableRow key={i}><TableCell>{e.especificacao}</TableCell><TableCell>{e.rubrica}</TableCell><TableCell className="text-right font-mono">{e.valor}</TableCell><TableCell className="text-center">{e.inicio}</TableCell><TableCell className="text-center">{e.termino}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          ))}
        </Section>
      )}

      {desembolsos.length > 0 && (
        <Section title="Cronograma de Desembolso">
          <Table>
            <TableHeader><TableRow className="bg-gray-100"><TableHead className="font-bold">Mês/Ano</TableHead><TableHead className="font-bold text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>{desembolsos.map((d: any, i: number) => <TableRow key={i}><TableCell>{d.mesAno}</TableCell><TableCell className="text-right font-mono">{d.valor}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Section>
      )}

      {/* EXECUÇÃO — DESTAQUE AZUL */}
      {metas.length > 0 && (
        <>
          <div className="bg-blue-100 text-center py-3 rounded-lg mb-6 mt-10 font-bold text-blue-800 uppercase tracking-wider border-2 border-blue-300 print:bg-blue-50">
            <BarChart3 className="w-5 h-5 inline mr-2" />Dados de Execução
          </div>

          <div className="border-2 border-blue-200 rounded-xl overflow-hidden mb-8 print:break-inside-avoid">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-bold text-blue-800">Meta</TableHead>
                  <TableHead className="font-bold text-blue-800 text-center">Status</TableHead>
                  <TableHead className="font-bold text-blue-800 text-center">Progresso</TableHead>
                  <TableHead className="font-bold text-right">Custo Estimado</TableHead>
                  <TableHead className="font-bold text-blue-800 text-right">Custo Realizado</TableHead>
                  <TableHead className="font-bold text-blue-800 text-center">Previsão</TableHead>
                  <TableHead className="font-bold text-blue-800 text-center">Conclusão</TableHead>
                  <TableHead className="font-bold text-blue-800 text-center">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metas.map((meta, idx) => {
                  const atrasado = meta.previsao_conclusao && !meta.data_conclusao && new Date(meta.previsao_conclusao) < new Date() && meta.status !== "CONCLUÍDO";
                  return (
                    <TableRow key={meta.id} className={atrasado ? "bg-red-50" : ""}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{idx + 1}</span>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{meta.titulo}</p>
                            {meta.observacoes && <p className="text-xs text-blue-600 mt-1 italic">{meta.observacoes}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {atrasado ? (
                          <Badge className="bg-red-100 text-red-700 border-0 font-bold text-xs"><AlertTriangle className="w-3 h-3 mr-1" />ATRASO</Badge>
                        ) : (
                          <Badge className={`border-0 font-bold text-xs ${meta.status === "CONCLUÍDO" ? "bg-green-100 text-green-700" : meta.status === "PROCESSANDO" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{meta.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={meta.percentual || 0} className="h-2 w-14" />
                          <span className="text-xs font-bold text-blue-700">{meta.percentual || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(meta.custo_estimado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-blue-700">{fmt(meta.custo_realizado)}</TableCell>
                      <TableCell className="text-center text-sm">{fmtDate(meta.previsao_conclusao)}</TableCell>
                      <TableCell className="text-center text-sm font-semibold text-blue-700">{fmtDate(meta.data_conclusao)}</TableCell>
                      <TableCell className="text-center">
                        {meta.link_comprovacao ? <a href={meta.link_comprovacao} target="_blank" rel="noopener noreferrer" className="text-blue-600"><ExternalLink className="w-4 h-4 inline" /></a> : <span className="text-gray-400">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell colSpan={3} className="text-right font-bold text-blue-800">TOTAIS</TableCell>
                  <TableCell className="text-right font-mono">{fmt(custoTotalEst)}</TableCell>
                  <TableCell className="text-right font-mono text-blue-700">{fmt(custoTotalReal)}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-blue-600 italic mb-8">* Valores e dados em azul representam registros de execução. Linhas vermelhas indicam metas em atraso.</p>
        </>
      )}

      {/* Botão Imprimir (rodapé) */}
      <div className="flex justify-center mt-8 mb-12 print:hidden">
        <Button size="lg" className="bg-[#2F6B38] hover:bg-[#1a4122]" onClick={() => window.print()}>
          <Printer className="w-5 h-5 mr-2" />Imprimir Projeto Completo
        </Button>
      </div>
    </div>
  );
}
