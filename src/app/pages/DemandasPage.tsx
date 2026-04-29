import { useState, useEffect } from "react";
import { modalErro, modalSucesso, modalAlerta } from "../../lib/alerts";
import {
  AlertCircle, Building2, TrendingUp, Plus, Trash2, Save,
  FileText, Calendar, Users, Target, ShieldAlert, DollarSign,
  Megaphone, Clock, BookOpen, Layers, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { formatTelefone, formatCurrencyInput } from "../../lib/masks";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface ObjetivoEspecifico {
  id: number;
  objetivo: string;
  metas: string[];
  indicadores: string[];
}
interface ParteInteressada {
  id: number;
  parte: string;
  descricao: string;
  nivel: string;
  comentarios: string;
}
interface ProdutoResultado {
  id: number;
  meta: string;
  produto: string;
  servico: string;
  resultado: string;
  prazo: string;
}
interface RiscoItem {
  id: number;
  descricaoRisco: string;
  descricaoImpacto: string;
  acao: string;
  acaoContingencia: string;
  responsavel: string;
  previsao: string;
}
interface MembroEquipe {
  id: number;
  nome: string;
  lattes: string;
  funcao: string;
  quantidade: string;
  perfil: string;
  atribuicoes: string;
}
interface CronogramaItem {
  id: number;
  acao: string;
  objetivoEspecifico: string;
  previsaoInicio: string;
  previsaoEntrega: string;
}
interface AlinhamentoItem {
  objetivo: string;
  contribuicao: "" | "nenhuma" | "indireta" | "forte";
  comentario: string;
}

// ─── Tipos Plano de Trabalho ─────────────────────────────────────────────────

interface EtapaItem {
  id: number;
  especificacao: string;
  rubrica: string;
  valor: string;
  inicio: string;
  termino: string;
}
interface MetaPlano {
  id: number;
  descricao: string;
  etapas: EtapaItem[];
}
interface MetaTodasItem {
  id: number;
  especificacao: string;
  rubrica: string;
  valor: string;
  inicio: string;
  termino: string;
  editavel: boolean;
}
interface DesembolsoItem {
  id: number;
  mesAno: string;
  valor: string;
}

// ─── Dados fixos ─────────────────────────────────────────────────────────────

const OBJETIVOS_ESTRATEGICOS: string[] = [
  "1. Colaborar para o Desenvolvimento Regional Sustentável",
  "2. Formação de cidadãos capazes de transformar a realidade social",
  "3. Disponibilizar soluções Inovadoras para o avanço científico tecnológico e produtivo",
  "4. Desenvolver parcerias com o setor produtivo e instituições de Ensino Pesquisa e Extensão nacionais e internacionais",
  "5. Consolidar a oferta de cursos em consonância com os Arranjos Produtivos Sociais e Locais",
  "6. Fortalecer a Comunicação institucional junto aos públicos estratégicos",
  "7. Promover a integração das Ações de Ensino Pesquisa Extensão e Inovação Tecnológica",
  "8. Fortalecer a identidade institucional e o relacionamento Interinstitucional",
  "9. Otimizar o planejamento a integração e a gestão dos processos de trabalho",
  "10. Promover o Acesso a permanência e o êxito dos estudantes",
  "11. Ampliar e consolidar a Infraestrutura acadêmica científica e tecnológica",
  "12. Valorizar os servidores e melhorar o ambiente organizacional",
  "13. Promover a qualificação e capacitação dos servidores com foco nos resultados institucionais",
  "14. Otimizar a aplicação dos recursos orçamentários e ampliar a captação de recursos extra orçamentários",
];
const ODS_LIST = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const ORCAMENTO_ITEMS = [
  "Equipe Técnica do IFRO (Coordenadores)",
  "Auxílio financeiro a estudantes",
  "Auxílio a pessoas física (alunos FIC)",
  "Diárias e Passagens",
  "Serviços de Terceiros",
  "Infraestrutura para o Campus",
  "Máquinas e Equipamentos",
  "Despesas Operacionais e Administrativas (%)",
];
const CAMPUS_DATA: Record<string, { nome: string; cnpj: string; endereco: string }> = {
  jiparana: { nome: "Campus Ji-Paraná", cnpj: "10.817.343/0002-19", endereco: "Rua Rio Amazonas, 351 – Jardim dos Migrantes" },
  pvelho: { nome: "Campus Porto Velho Calama", cnpj: "10.817.343/0004-80", endereco: "Rua Calama, 4985 – Caladinho" },
  vilhena: { nome: "Campus Vilhena", cnpj: "10.817.343/0003-00", endereco: "Rodovia BR 174, km 3" },
  ariquemes: { nome: "Campus Ariquemes", cnpj: "10.817.343/0005-61", endereco: "Rodovia RO-257, km 04" },
  cacoal: { nome: "Campus Cacoal", cnpj: "10.817.343/0006-42", endereco: "Rua IFRO, nº 103 – Setor Institucional" },
  colorado: { nome: "Campus Colorado do Oeste", cnpj: "10.817.343/0007-23", endereco: "Rodovia BR 435, km 63 – Zona Rural" },
  guajara: { nome: "Campus Guajará-Mirim", cnpj: "10.817.343/0009-54", endereco: "Av. 15 de novembro, 4849" },
  pvz: { nome: "Campus Porto Velho Zona Norte", cnpj: "10.817.343/0011-89", endereco: "Av. Governador Jorge Teixeira, 3146" },
};

const RUBRICAS = [
  { code: "339018", label: "339018 – Auxílio financeiro a estudante" },
  { code: "339030", label: "339030 – Material de consumo" },
  { code: "339036", label: "339036 – Auxílio a pessoa física" },
  { code: "339039", label: "339039 – Outros serviços de terceiros – PJ" },
  { code: "339047", label: "339047 – Obrigações tributárias e contributivas" },
  { code: "339048", label: "339048 – Bolsas" },
  { code: "339093", label: "339093 – Indenizações e restituições" },
  { code: "339147", label: "339147 – Contribuição Patronal" },
  { code: "449052", label: "449052 – Equipamentos e material permanente" },
];



// ─── Helpers ─────────────────────────────────────────────────────────────────

const newObjetivoEspecifico = (id: number): ObjetivoEspecifico => ({ id, objetivo: "", metas: [""], indicadores: [""] });
const newParteInteressada = (id: number): ParteInteressada => ({ id, parte: "", descricao: "", nivel: "", comentarios: "" });
const newProdutoResultado = (id: number): ProdutoResultado => ({ id, meta: "", produto: "", servico: "", resultado: "", prazo: "" });
const newRisco = (id: number): RiscoItem => ({ id, descricaoRisco: "", descricaoImpacto: "", acao: "", acaoContingencia: "", responsavel: "", previsao: "" });
const newMembro = (id: number): MembroEquipe => ({ id, nome: "", lattes: "", funcao: "", quantidade: "1", perfil: "", atribuicoes: "" });
const newCronogramaItem = (id: number): CronogramaItem => ({ id, acao: "", objetivoEspecifico: "", previsaoInicio: "", previsaoEntrega: "" });
const newAlinhamento = (): AlinhamentoItem[] => OBJETIVOS_ESTRATEGICOS.map(objetivo => ({ objetivo, contribuicao: "", comentario: "" }));

const newEtapa = (id: number): EtapaItem => ({ id, especificacao: "", rubrica: "", valor: "", inicio: "", termino: "" });
const newMetaPlano = (id: number): MetaPlano => ({ id, descricao: "", etapas: [newEtapa(1)] });
const METAS_TODAS_FIXAS: MetaTodasItem[] = [
  { id: 1, especificacao: "Bolsas", rubrica: "339048", valor: "", inicio: "", termino: "", editavel: false },
  { id: 2, especificacao: "Auxílio financeiro a estudante", rubrica: "339018", valor: "", inicio: "", termino: "", editavel: false },
  { id: 3, especificacao: "Auxílio a pessoa física (Catador)", rubrica: "339036", valor: "", inicio: "", termino: "", editavel: false },
  { id: 4, especificacao: "Contribuição Patronal", rubrica: "339147", valor: "", inicio: "", termino: "", editavel: false },
  { id: 5, especificacao: "Custos indiretos de execução do projeto", rubrica: "339039", valor: "", inicio: "", termino: "", editavel: false },
];

const parseMoeda = (v: string) => parseFloat(v.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
const formatMoeda = (n: number) =>
  n > 0 ? `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ –";

// ─── Componente Principal ─────────────────────────────────────────────────────

export function DemandasPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState("projeto");
  const [ultimasDemandas, setUltimasDemandas] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUltimasDemandas();
    }
  }, [user]);

  const fetchUltimasDemandas = async () => {
    const { data, error } = await supabase
      .from("projetos")
      .select("id, titulo, campus_key, status")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(3);
      
    if (data) {
      setUltimasDemandas(data.map(d => ({
        id: d.id,
        titulo: d.titulo,
        campus: CAMPUS_DATA[d.campus_key]?.nome || d.campus_key,
        status: d.status,
        statusColor: d.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      })));
    }
  };

  // ── Aba 1 ─────────────────────────────────────────────���────────────────────

  const [tituloProjeto, setTituloProjeto] = useState("");
  const [acaoEstrategica, setAcaoEstrategica] = useState("");
  const [indicadoresPDI, setIndicadoresPDI] = useState("");
  const [objetivosAtendidosPDI, setObjetivosAtendidosPDI] = useState("");
  const [campusKey, setCampusKey] = useState("");
  const [campusTelefone, setCampusTelefone] = useState("");
  const [coordGeralNome, setCoordGeralNome] = useState("");
  const [coordGeralEmail, setCoordGeralEmail] = useState("");
  const [coordGeralTelefone, setCoordGeralTelefone] = useState("");
  const [coordGeralCampus, setCoordGeralCampus] = useState("");
  const [coordExecNome, setCoordExecNome] = useState("");
  const [coordExecEmail, setCoordExecEmail] = useState("");
  const [coordExecTelefone, setCoordExecTelefone] = useState("");
  const [coordExecCampus, setCoordExecCampus] = useState("");
  const [introducao, setIntroducao] = useState("");
  const [objetoProjeto, setObjetoProjeto] = useState("");
  const [objetivoGeral, setObjetivoGeral] = useState("");
  const [objetivosEspecificos, setObjetivosEspecificos] = useState<ObjetivoEspecifico[]>([newObjetivoEspecifico(1)]);
  const [alinhamento, setAlinhamento] = useState<AlinhamentoItem[]>(newAlinhamento());
  const [odsSelected, setOdsSelected] = useState<boolean[]>(new Array(17).fill(false));
  const [odsComentario, setOdsComentario] = useState("");
  const [partesInteressadas, setPartesInteressadas] = useState<ParteInteressada[]>([
    { id: 1, parte: "Usuário Final (Beneficiário Direto)", descricao: "", nivel: "Alto", comentarios: "" },
    { id: 2, parte: "Patrocinador do Projeto", descricao: "", nivel: "Moderado", comentarios: "Emenda Parlamentar" },
    { id: 3, parte: "Instituições Participantes", descricao: "IFRO e Prefeituras", nivel: "Moderado", comentarios: "" },
    { id: 4, parte: "Equipe do Projeto", descricao: "", nivel: "Alto", comentarios: "" },
    { id: 5, parte: "Coordenador(a) Administrativo", descricao: "", nivel: "Alto", comentarios: "" },
    { id: 6, parte: "Coordenador(a) Geral do Projeto", descricao: "", nivel: "Alto", comentarios: "" },
  ]);
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [duracaoMeses, setDuracaoMeses] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [escopoProjeto, setEscopoProjeto] = useState("");
  const [naoEscopo, setNaoEscopo] = useState("");
  const [escopoProduto, setEscopoProduto] = useState("");
  const [premissas, setPremissas] = useState<Record<string, string>>({
    "Disponibilidade de recursos financeiros": "",
    "Engajamento da Equipe": "",
    "Colaboração de Parceiros": "",
    "Disponibilidade de mão de obra qualificada": "",
    "Condições climáticas e ambientais favoráveis": "",
  });
  const [restricoes, setRestricoes] = useState<Record<string, string>>({
    "Orçamento limitado": "",
    "Prazos de execução": "",
    "Infraestrutura": "",
    "Capacidade de atendimento": "",
  });
  const [justificativa, setJustificativa] = useState("");
  const [tecnologiasSociais, setTecnologiasSociais] = useState("");
  const [produtosResultados, setProdutosResultados] = useState<ProdutoResultado[]>([newProdutoResultado(1)]);
  const [mapaRisco, setMapaRisco] = useState<RiscoItem[]>([newRisco(1)]);
  const [equipe, setEquipe] = useState<MembroEquipe[]>([newMembro(1)]);
  const [orcamentoValues, setOrcamentoValues] = useState<string[]>(new Array(8).fill(""));
  const [metodologia, setMetodologia] = useState("");
  const [planoComunicacao, setPlanoComunicacao] = useState("");
  const [cronogramaAba1, setCronogramaAba1] = useState<CronogramaItem[]>([newCronogramaItem(1)]);
  const [referencias, setReferencias] = useState("");

  // ── Aba 2 – Plano de Trabalho ──────────────────────────────────────────────

  // Seção 1 – Instituição Responsável (compartilha dados do campus da Aba 1)
  const [instEndereco, setInstEndereco] = useState("");
  const [instBairro, setInstBairro] = useState("");
  const [instCidadeEstadoCep, setInstCidadeEstadoCep] = useState("");
  const [instUnidadeExecutora, setInstUnidadeExecutora] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instSite, setInstSite] = useState("");
  const [instTelCampus, setInstTelCampus] = useState("");
  const [instCpf, setInstCpf] = useState("");
  const [instMatricula, setInstMatricula] = useState("");

  // Seção 2 – Fundação de Apoio (opcional)
  const [hasFundacao, setHasFundacao] = useState(false);
  const [fundNome, setFundNome] = useState("");
  const [fundSigla, setFundSigla] = useState("");
  const [fundCnpj, setFundCnpj] = useState("");
  const [fundEndereco, setFundEndereco] = useState("");
  const [fundBairro, setFundBairro] = useState("");
  const [fundCidadeEstado, setFundCidadeEstado] = useState("");
  const [fundCep, setFundCep] = useState("");
  const [fundEmail, setFundEmail] = useState("");
  const [fundSite, setFundSite] = useState("");
  const [fundTelefone, setFundTelefone] = useState("");
  const [fundResponsavel, setFundResponsavel] = useState("");
  const [fundCargo, setFundCargo] = useState("");
  const [fundCpf, setFundCpf] = useState("");

  // Seção 3 – Instituição/ICT/Empresa Participante (opcional)
  const [hasInstPart, setHasInstPart] = useState(false);
  const [partNome, setPartNome] = useState("");
  const [partSigla, setPartSigla] = useState("");
  const [partCnpj, setPartCnpj] = useState("");
  const [partEndereco, setPartEndereco] = useState("");
  const [partBairro, setPartBairro] = useState("");
  const [partCidadeEstado, setPartCidadeEstado] = useState("");
  const [partCep, setPartCep] = useState("");
  const [partEmail, setPartEmail] = useState("");
  const [partSite, setPartSite] = useState("");
  const [partTelefone, setPartTelefone] = useState("");
  const [partResponsavel, setPartResponsavel] = useState("");
  const [partCargo, setPartCargo] = useState("");
  const [partCpf, setPartCpf] = useState("");

  // Seção 10 – Cronograma Físico-Financeiro
  const [metasPlano, setMetasPlano] = useState<MetaPlano[]>([newMetaPlano(1)]);
  const [metaTodasItems, setMetaTodasItems] = useState<MetaTodasItem[]>(METAS_TODAS_FIXAS);

  // Seção 10.1 – Total do Orçamento
  const [despesasOpFundacao, setDespesasOpFundacao] = useState("");
  const [custosIndiretos, setCustosIndiretos] = useState("");

  // Seção 11 – Cronograma de Desembolso
  const [desembolsos, setDesembolsos] = useState<DesembolsoItem[]>([
    { id: 1, mesAno: "", valor: "" },
    { id: 2, mesAno: "", valor: "" },
  ]);

  // ── Cálculos de totais ────────────────────────────────────────────────────

  const campusInfo = campusKey ? CAMPUS_DATA[campusKey] : null;

  const calcTotalMeta = (meta: MetaPlano) =>
    meta.etapas.reduce((acc, e) => acc + parseMoeda(e.valor), 0);

  const calcTotalTodas = () =>
    metaTodasItems.reduce((acc, i) => acc + parseMoeda(i.valor), 0);

  const calcTotalMetas = () =>
    metasPlano.reduce((acc, m) => acc + calcTotalMeta(m), 0) + calcTotalTodas();

  const valorTotalOrcamento = calcTotalMetas();
  const totalProjeto = valorTotalOrcamento + parseMoeda(despesasOpFundacao) + parseMoeda(custosIndiretos);
  const totalDesembolso = desembolsos.reduce((acc, d) => acc + parseMoeda(d.valor), 0);

  // ── Handlers Aba 1 ────────────────────────────────────────────────────────

  const updateAlinhamento = (index: number, field: keyof AlinhamentoItem, value: string) =>
    setAlinhamento(alinhamento.map((a, i) => i === index ? { ...a, [field]: value } : a));
  const toggleOds = (index: number) =>
    setOdsSelected(odsSelected.map((v, i) => i === index ? !v : v));

  const addObjetivoEspecifico = () => {
    const id = Math.max(...objetivosEspecificos.map(o => o.id), 0) + 1;
    setObjetivosEspecificos([...objetivosEspecificos, newObjetivoEspecifico(id)]);
  };
  const removeObjetivoEspecifico = (id: number) => {
    if (objetivosEspecificos.length > 1) setObjetivosEspecificos(objetivosEspecificos.filter(o => o.id !== id));
  };
  const updateObjetivo = (id: number, field: keyof ObjetivoEspecifico, value: any) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, [field]: value } : o));
  const addMetaToObjetivo = (id: number) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, metas: [...o.metas, ""] } : o));
  const updateMetaObjetivo = (id: number, idx: number, value: string) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, metas: o.metas.map((m, i) => i === idx ? value : m) } : o));
  const removeMetaObjetivo = (id: number, idx: number) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, metas: o.metas.filter((_, i) => i !== idx) } : o));
  const addIndicadorToObjetivo = (id: number) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, indicadores: [...o.indicadores, ""] } : o));
  const updateIndicadorObjetivo = (id: number, idx: number, value: string) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, indicadores: o.indicadores.map((ind, i) => i === idx ? value : ind) } : o));
  const removeIndicadorObjetivo = (id: number, idx: number) =>
    setObjetivosEspecificos(objetivosEspecificos.map(o => o.id === id ? { ...o, indicadores: o.indicadores.filter((_, i) => i !== idx) } : o));

  const addParteInteressada = () => {
    const id = Math.max(...partesInteressadas.map(p => p.id), 0) + 1;
    setPartesInteressadas([...partesInteressadas, newParteInteressada(id)]);
  };
  const removeParteInteressada = (id: number) => {
    if (partesInteressadas.length > 1) setPartesInteressadas(partesInteressadas.filter(p => p.id !== id));
  };
  const updateParteInteressada = (id: number, field: keyof ParteInteressada, value: string) =>
    setPartesInteressadas(partesInteressadas.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addProduto = () => {
    const id = Math.max(...produtosResultados.map(p => p.id), 0) + 1;
    setProdutosResultados([...produtosResultados, newProdutoResultado(id)]);
  };
  const removeProduto = (id: number) => {
    if (produtosResultados.length > 1) setProdutosResultados(produtosResultados.filter(p => p.id !== id));
  };
  const updateProduto = (id: number, field: keyof ProdutoResultado, value: string) =>
    setProdutosResultados(produtosResultados.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addRisco = () => {
    const id = Math.max(...mapaRisco.map(r => r.id), 0) + 1;
    setMapaRisco([...mapaRisco, newRisco(id)]);
  };
  const removeRisco = (id: number) => {
    if (mapaRisco.length > 1) setMapaRisco(mapaRisco.filter(r => r.id !== id));
  };
  const updateRisco = (id: number, field: keyof RiscoItem, value: string) =>
    setMapaRisco(mapaRisco.map(r => r.id === id ? { ...r, [field]: value } : r));

  const addMembro = () => {
    const id = Math.max(...equipe.map(e => e.id), 0) + 1;
    setEquipe([...equipe, newMembro(id)]);
  };
  const removeMembro = (id: number) => {
    if (equipe.length > 1) setEquipe(equipe.filter(e => e.id !== id));
  };
  const updateMembro = (id: number, field: keyof MembroEquipe, value: string) =>
    setEquipe(equipe.map(e => e.id === id ? { ...e, [field]: value } : e));

  const addCronogramaAba1 = () => {
    const id = Math.max(...cronogramaAba1.map(c => c.id), 0) + 1;
    setCronogramaAba1([...cronogramaAba1, newCronogramaItem(id)]);
  };
  const removeCronogramaAba1 = (id: number) => {
    if (cronogramaAba1.length > 1) setCronogramaAba1(cronogramaAba1.filter(c => c.id !== id));
  };
  const updateCronogramaAba1 = (id: number, field: keyof CronogramaItem, value: string) =>
    setCronogramaAba1(cronogramaAba1.map(c => c.id === id ? { ...c, [field]: value } : c));

  const updateOrcamento = (idx: number, value: string) =>
    setOrcamentoValues(orcamentoValues.map((v, i) => i === idx ? value : v));

  // ── Handlers Aba 2 ────────────────────────────────────────────────────────

  // Metas do Plano
  const addMetaPlano = () => {
    const id = Math.max(...metasPlano.map(m => m.id), 0) + 1;
    setMetasPlano([...metasPlano, newMetaPlano(id)]);
  };
  const removeMetaPlano = (id: number) => {
    if (metasPlano.length > 1) setMetasPlano(metasPlano.filter(m => m.id !== id));
  };
  const updateMetaPlanoDesc = (id: number, descricao: string) =>
    setMetasPlano(metasPlano.map(m => m.id === id ? { ...m, descricao } : m));

  // Etapas
  const addEtapa = (metaId: number) => {
    setMetasPlano(metasPlano.map(m => {
      if (m.id !== metaId) return m;
      const newId = Math.max(...m.etapas.map(e => e.id), 0) + 1;
      return { ...m, etapas: [...m.etapas, newEtapa(newId)] };
    }));
  };
  const removeEtapa = (metaId: number, etapaId: number) => {
    setMetasPlano(metasPlano.map(m => {
      if (m.id !== metaId || m.etapas.length <= 1) return m;
      return { ...m, etapas: m.etapas.filter(e => e.id !== etapaId) };
    }));
  };
  const updateEtapa = (metaId: number, etapaId: number, field: keyof EtapaItem, value: string) => {
    setMetasPlano(metasPlano.map(m => {
      if (m.id !== metaId) return m;
      return { ...m, etapas: m.etapas.map(e => e.id === etapaId ? { ...e, [field]: value } : e) };
    }));
  };

  // Meta "Todas"
  const updateMetaTodas = (id: number, field: keyof MetaTodasItem, value: string) =>
    setMetaTodasItems(metaTodasItems.map(i => i.id === id ? { ...i, [field]: value } : i));

  // Desembolso
  const addDesembolso = () => {
    const id = Math.max(...desembolsos.map(d => d.id), 0) + 1;
    setDesembolsos([...desembolsos, { id, mesAno: "", valor: "" }]);
  };
  const removeDesembolso = (id: number) => {
    if (desembolsos.length > 1) setDesembolsos(desembolsos.filter(d => d.id !== id));
  };
  const updateDesembolso = (id: number, field: keyof DesembolsoItem, value: string) =>
    setDesembolsos(desembolsos.map(d => d.id === id ? { ...d, [field]: value } : d));

  const handleSubmit = async () => {
    if (!tituloProjeto || !campusKey || !coordGeralNome) {
      modalAlerta("Preencha os campos obrigatórios na aba Projeto!");
      setCurrentTab("projeto");
      return;
    }
    if (!user) {
      modalErro("Você precisa estar logado para salvar.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.from("projetos").insert([{
      user_id: user.id,
      titulo: tituloProjeto,
      acao_estrategica: acaoEstrategica,
      campus_key: campusKey,
      coord_geral_nome: coordGeralNome,
      coord_geral_email: coordGeralEmail,
      coord_geral_telefone: coordGeralTelefone,
      coord_geral_campus: coordGeralCampus,
      introducao: introducao,
      objeto_projeto: objetoProjeto,
      objetivo_geral: objetivoGeral,
      objetivos_especificos: objetivosEspecificos,
      alinhamento: alinhamento,
      partes_interessadas: partesInteressadas,
      mapa_risco: mapaRisco,
      equipe: equipe,
      metas_plano_trabalho: metasPlano,
      vigencia_inicio: vigenciaInicio || null,
      vigencia_fim: vigenciaFim || null,
      duracao_meses: duracaoMeses ? parseInt(duracaoMeses) : null,
      
      indicadores_pdi: indicadoresPDI,
      objetivos_atendidos_pdi: objetivosAtendidosPDI,
      campus_telefone: campusTelefone,
      coord_exec_nome: coordExecNome,
      coord_exec_email: coordExecEmail,
      coord_exec_telefone: coordExecTelefone,
      coord_exec_campus: coordExecCampus,
      
      ods: odsSelected,
      ods_comentario: odsComentario,
      
      publico_alvo: publicoAlvo,
      escopo_projeto: escopoProjeto,
      nao_escopo: naoEscopo,
      escopo_produto: escopoProduto,
      
      premissas: premissas,
      restricoes: restricoes,
      
      justificativa: justificativa,
      tecnologias_sociais: tecnologiasSociais,
      produtos_resultados: produtosResultados,
      metodologia: metodologia,
      plano_comunicacao: planoComunicacao,
      cronograma_aba1: cronogramaAba1,
      referencias: referencias,
      orcamento_resumo: orcamentoValues,
      
      plano_instituicao: { instEndereco, instBairro, instCidadeEstadoCep, instUnidadeExecutora, instEmail, instSite, instTelCampus, instCpf, instMatricula },
      plano_fundacao: hasFundacao ? { fundNome, fundSigla, fundCnpj, fundEndereco, fundBairro, fundCidadeEstado, fundCep, fundEmail, fundSite, fundTelefone, fundResponsavel, fundCargo, fundCpf } : {},
      plano_participante: hasInstPart ? { partNome, partSigla, partCnpj, partEndereco, partBairro, partCidadeEstado, partCep, partEmail, partSite, partTelefone, partResponsavel, partCargo, partCpf } : {},
      cronograma_desembolso: desembolsos
    }]).select();

    if (error) {
      console.error(error);
      modalErro("Erro ao salvar projeto: " + error.message);
      setSaving(false);
      return;
    }

    const projetoId = data[0].id;
    const metasToInsert = metasPlano.map((m, i) => ({
      projeto_id: projetoId,
      titulo: m.descricao || `Meta ${i + 1}`,
      descricao: m.etapas.map(e => e.especificacao).join(", "),
      custo_estimado: m.etapas.reduce((acc, e) => acc + parseMoeda(e.valor), 0),
      custo_realizado: 0,
      status: "AGENDADO"
    }));

    if (metasToInsert.length > 0) {
      await supabase.from("metas").insert(metasToInsert);
    }

    setSaving(false);
    await modalSucesso("Projeto cadastrado com sucesso!");
    window.location.href = "/projetos";
  };

  // ── Sub-componentes helper ────────────────────────────────────────────────

  const SectionTitle = ({ icon: Icon, number, title }: { icon?: any; number?: string; title: string }) => (
    <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-[#2F6B38] flex-shrink-0" />}
      {number && <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full">{number}</span>}
      {title}
    </h3>
  );

  const totalOrcaAba1 = orcamentoValues.reduce((acc, v) => acc + parseMoeda(v), 0);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2F6B38] to-[#1a4122] p-10 rounded-2xl text-white shadow-xl mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold mb-2">Proposta para Projeto Básico – IFRO</h1>
            <p className="text-white/90 text-base">
              Preencha todos os campos conforme o modelo institucional do IFRO. O Plano de Trabalho está na aba seguinte.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gray-100 mb-6">
          <TabsTrigger value="projeto" className="data-[state=active]:bg-white py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <p className="font-bold">Projeto Básico</p>
                <p className="text-xs text-gray-500">Proposta completa – Seções 1 a 14</p>
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="plano" className="data-[state=active]:bg-white py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <div className="text-left">
                <p className="font-bold">Plano de Trabalho</p>
                <p className="text-xs text-gray-500">Dados cadastrais, cronograma e desembolso</p>
              </div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
            ABA 1 — PROJETO BÁSICO
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="projeto">
          <Card className="shadow-xl border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-2xl">Proposta para Projeto Básico</CardTitle>
              <CardDescription>Preencha todos os campos do modelo institucional IFRO</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">

              {/* ── CABEÇALHO DA PROPOSTA ── */}
              <div>
                <SectionTitle icon={FileText} title="Cabeçalho da Proposta" />
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">Título do Projeto Estratégico *</Label>
                    <Input placeholder="Ex: Pesca e Sustentabilidade" value={tituloProjeto} onChange={e => setTituloProjeto(e.target.value)} className="h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Ações Estratégicas</Label>
                      <Input placeholder="Ex: PROEX; PROPESP" value={acaoEstrategica} onChange={e => setAcaoEstrategica(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Indicadores institucionais PDI-IFRO (2023-2027)</Label>
                      <Input placeholder="Ex: PROEX; PROPESP" value={indicadoresPDI} onChange={e => setIndicadoresPDI(e.target.value)} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Objetivos Estratégicos PDI-IFRO atendidos (nº)</Label>
                    <Input placeholder="Ex: 5, 8, 10, 15" value={objetivosAtendidosPDI} onChange={e => setObjetivosAtendidosPDI(e.target.value)} className="h-11" />
                  </div>
                </div>
              </div>

              {/* ── IDENTIFICAÇÃO DO CAMPUS ── */}
              <div>
                <SectionTitle icon={Building2} title="Identificação do Campus Proponente" />
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Campus *</Label>
                    <Select value={campusKey} onValueChange={setCampusKey}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o campus" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jiparana">Câmpus Ji-Paraná</SelectItem>
                        <SelectItem value="pvelho">Câmpus Porto Velho Calama</SelectItem>
                        <SelectItem value="vilhena">Câmpus Vilhena</SelectItem>
                        <SelectItem value="ariquemes">Câmpus Ariquemes</SelectItem>
                        <SelectItem value="cacoal">Câmpus Cacoal</SelectItem>
                        <SelectItem value="colorado">Câmpus Colorado do Oeste</SelectItem>
                        <SelectItem value="guajara">Câmpus Guajará-Mirim</SelectItem>
                        <SelectItem value="pvz">Câmpus Porto Velho Zona Norte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {campusInfo && (
                    <div className="bg-[#2F6B38]/5 border border-[#2F6B38]/20 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-semibold text-gray-700">Nome/Razão Social: </span><span className="text-gray-600">Instituto Federal de Educação, Ciência e Tecnologia de Rondônia, {campusInfo.nome}</span></div>
                      <div><span className="font-semibold text-gray-700">Sigla: </span><span className="text-gray-600">IFRO</span></div>
                      <div><span className="font-semibold text-gray-700">CNPJ: </span><span className="text-gray-600">{campusInfo.cnpj}</span></div>
                      <div><span className="font-semibold text-gray-700">Natureza Jurídica: </span><span className="text-gray-600">Autarquia Federal</span></div>
                      <div className="col-span-2"><span className="font-semibold text-gray-700">Endereço: </span><span className="text-gray-600">{campusInfo.endereco}</span></div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="font-semibold">Telefone do Campus</Label>
                    <Input placeholder="(69) XXXX-XXXX" value={campusTelefone} onChange={e => setCampusTelefone(formatTelefone(e.target.value))} className="h-11" />
                  </div>
                </div>
              </div>

              {/* ── RESPONSÁVEIS ── */}
              <div>
                <SectionTitle icon={Users} title="Responsáveis pela Proposta" />
                <div className="grid grid-cols-1 gap-6">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-semibold text-[#2F6B38] mb-3">Coordenador(a) Geral</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Nome *</Label><Input placeholder="Nome completo" value={coordGeralNome} onChange={e => setCoordGeralNome(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">E-mail *</Label><Input type="email" placeholder="nome@ifro.edu.br" value={coordGeralEmail} onChange={e => setCoordGeralEmail(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Telefone</Label><Input placeholder="(69) XXXX-XXXX" value={coordGeralTelefone} onChange={e => setCoordGeralTelefone(formatTelefone(e.target.value))} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Unidade de Lotação</Label><Input placeholder="Campus / Setor" value={coordGeralCampus} onChange={e => setCoordGeralCampus(e.target.value)} className="h-10" /></div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-semibold text-[#2F6B38] mb-3">Coordenador(a) Executivo(a)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Nome</Label><Input placeholder="Nome completo" value={coordExecNome} onChange={e => setCoordExecNome(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">E-mail</Label><Input type="email" placeholder="nome@ifro.edu.br" value={coordExecEmail} onChange={e => setCoordExecEmail(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Telefone</Label><Input placeholder="(69) XXXX-XXXX" value={coordExecTelefone} onChange={e => setCoordExecTelefone(formatTelefone(e.target.value))} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="font-semibold text-sm">Unidade de Lotação</Label><Input placeholder="Campus / Setor" value={coordExecCampus} onChange={e => setCoordExecCampus(e.target.value)} className="h-10" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 1: INTRODUÇÃO ── */}
              <div>
                <SectionTitle number="1" title="Introdução" />
                <Textarea placeholder="Apresente o contexto, relevância e motivação do projeto..." value={introducao} onChange={e => setIntroducao(e.target.value)} rows={5} className="resize-none" />
              </div>

              {/* ── SEÇÃO 2: OBJETIVOS ── */}
              <div className="space-y-6">
                <SectionTitle number="2" icon={Target} title="Objetivos" />
                <div>
                  <p className="font-semibold text-gray-800 mb-2">2.1 Objeto do projeto *</p>
                  <Textarea placeholder="Especifique o objeto principal do projeto..." value={objetoProjeto} onChange={e => setObjetoProjeto(e.target.value)} rows={3} className="resize-none" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">2.2 Objetivo Geral *</p>
                  <Textarea placeholder="Descreva o objetivo geral do projeto..." value={objetivoGeral} onChange={e => setObjetivoGeral(e.target.value)} rows={3} className="resize-none" />
                </div>
                {/* 2.3 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-800">2.3 Objetivos, Metas e Indicadores</p>
                    <Button onClick={addObjetivoEspecifico} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]">
                      <Plus className="w-4 h-4 mr-1" /> Objetivo Específico
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {objetivosEspecificos.map((obj, idx) => (
                      <div key={obj.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#2F6B38]">Objetivo Específico {idx + 1}</span>
                          {objetivosEspecificos.length > 1 && (
                            <Button onClick={() => removeObjetivoEspecifico(obj.id)} variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1.5 mb-3">
                          <Label className="text-sm font-semibold">Objetivo</Label>
                          <Input placeholder={`Objetivo específico ${idx + 1}`} value={obj.objetivo} onChange={e => updateObjetivo(obj.id, "objetivo", e.target.value)} className="h-10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-semibold">Metas</Label>
                              <Button onClick={() => addMetaToObjetivo(obj.id)} variant="outline" size="sm" className="text-[#2F6B38] h-7 text-xs"><Plus className="w-3 h-3 mr-1" /> Meta</Button>
                            </div>
                            <div className="space-y-2">
                              {obj.metas.map((meta, mIdx) => (
                                <div key={mIdx} className="flex gap-1">
                                  <Input placeholder={`Meta ${idx + 1}.${mIdx + 1}`} value={meta} onChange={e => updateMetaObjetivo(obj.id, mIdx, e.target.value)} className="h-9 text-sm" />
                                  {obj.metas.length > 1 && (<Button onClick={() => removeMetaObjetivo(obj.id, mIdx)} variant="ghost" size="sm" className="text-red-500 px-2"><Trash2 className="w-3 h-3" /></Button>)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-semibold">Indicadores</Label>
                              <Button onClick={() => addIndicadorToObjetivo(obj.id)} variant="outline" size="sm" className="text-[#2F6B38] h-7 text-xs"><Plus className="w-3 h-3 mr-1" /> Indicador</Button>
                            </div>
                            <div className="space-y-2">
                              {obj.indicadores.map((ind, iIdx) => (
                                <div key={iIdx} className="flex gap-1">
                                  <Input placeholder={`Indicador ${idx + 1}.${iIdx + 1}`} value={ind} onChange={e => updateIndicadorObjetivo(obj.id, iIdx, e.target.value)} className="h-9 text-sm" />
                                  {obj.indicadores.length > 1 && (<Button onClick={() => removeIndicadorObjetivo(obj.id, iIdx)} variant="ghost" size="sm" className="text-red-500 px-2"><Trash2 className="w-3 h-3" /></Button>)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 2.4 Alinhamento */}
                <div>
                  <p className="font-semibold text-gray-800 mb-3">2.4 Alinhamento Estratégico – PDI-IFRO (2023-2027)</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#2F6B38] text-white">
                        <tr>
                          <th className="text-left p-3 w-[45%]">Objetivo Estratégico</th>
                          <th className="text-center p-3">Nenhuma</th>
                          <th className="text-center p-3">Indireta</th>
                          <th className="text-center p-3">Forte</th>
                          <th className="text-left p-3">Comentários</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alinhamento.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-3 text-gray-700">{item.objetivo}</td>
                            {(["nenhuma", "indireta", "forte"] as const).map(tipo => (
                              <td key={tipo} className="p-3 text-center">
                                <input type="radio" name={`alinhamento-${idx}`} checked={item.contribuicao === tipo} onChange={() => updateAlinhamento(idx, "contribuicao", tipo)} className="w-4 h-4 accent-[#2F6B38]" />
                              </td>
                            ))}
                            <td className="p-3"><Input placeholder="Comentário..." value={item.comentario} onChange={e => updateAlinhamento(idx, "comentario", e.target.value)} className="h-8 text-xs" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* 2.5 ODS */}
                <div>
                  <p className="font-semibold text-gray-800 mb-3">2.5 Objetivos de Desenvolvimento Sustentável (ODS)</p>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-3">Selecione os ODS com os quais o projeto pretende contribuir:</p>
                    <div className="grid grid-cols-9 gap-2 mb-4">
                      {ODS_LIST.map((ods, idx) => (
                        <div key={ods} onClick={() => toggleOds(idx)} className={`flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border-2 transition-all ${odsSelected[idx] ? "border-[#2F6B38] bg-[#2F6B38]/10" : "border-gray-200 bg-white hover:border-gray-400"}`}>
                          <Checkbox checked={odsSelected[idx]} onCheckedChange={() => toggleOds(idx)} className="data-[state=checked]:bg-[#2F6B38] data-[state=checked]:border-[#2F6B38]" />
                          <span className="text-xs font-bold text-gray-700">{ods}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Comentário sobre a contribuição aos ODS</Label>
                      <Textarea placeholder="O projeto contribui para..." value={odsComentario} onChange={e => setOdsComentario(e.target.value)} rows={2} className="resize-none text-sm" />
                    </div>
                  </div>
                </div>
                {/* 2.6 Partes Interessadas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-800">2.6 Partes Interessadas do Projeto</p>
                    <Button onClick={addParteInteressada} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#2F6B38] text-white">
                        <tr>
                          <th className="text-left p-3">Partes Interessadas</th>
                          <th className="text-left p-3">Descrição</th>
                          <th className="text-left p-3">Nível de Comprometimento</th>
                          <th className="text-left p-3">Comentários</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {partesInteressadas.map((p, idx) => (
                          <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-2"><Input value={p.parte} onChange={e => updateParteInteressada(p.id, "parte", e.target.value)} className="h-8 text-xs" /></td>
                            <td className="p-2"><Input value={p.descricao} onChange={e => updateParteInteressada(p.id, "descricao", e.target.value)} className="h-8 text-xs" placeholder="Descreva..." /></td>
                            <td className="p-2">
                              <Select value={p.nivel} onValueChange={v => updateParteInteressada(p.id, "nivel", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Alto">Alto</SelectItem>
                                  <SelectItem value="Moderado">Moderado</SelectItem>
                                  <SelectItem value="Baixo">Baixo</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2"><Input value={p.comentarios} onChange={e => updateParteInteressada(p.id, "comentarios", e.target.value)} className="h-8 text-xs" placeholder="Comentário..." /></td>
                            <td className="p-2 text-center">
                              {partesInteressadas.length > 1 && (<Button onClick={() => removeParteInteressada(p.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8"><Trash2 className="w-3 h-3" /></Button>)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 3: VIGÊNCIA ── */}
              <div>
                <SectionTitle number="3" icon={Clock} title="Vigência" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="font-semibold">Data de Início *</Label><Input type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} className="h-11" /></div>
                  <div className="space-y-2"><Label className="font-semibold">Data de Término *</Label><Input type="date" value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} className="h-11" /></div>
                  <div className="space-y-2"><Label className="font-semibold">Duração (meses)</Label><Input type="number" placeholder="Ex: 15" value={duracaoMeses} onChange={e => setDuracaoMeses(e.target.value)} className="h-11" /></div>
                </div>
              </div>

              {/* ── SEÇÃO 4: PÚBLICO ALVO E ESCOPO ── */}
              <div className="space-y-5">
                <SectionTitle number="4" icon={Layers} title="Público Alvo e Escopo" />
                <div className="space-y-2"><Label className="font-semibold">4. Público Alvo *</Label><Textarea placeholder="Descreva o público-alvo do projeto..." value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} rows={3} className="resize-none" /></div>
                <div className="space-y-2"><Label className="font-semibold">4.1 Escopo do Projeto</Label><Textarea placeholder="Descreva o escopo: o que o projeto se propõe a fazer..." value={escopoProjeto} onChange={e => setEscopoProjeto(e.target.value)} rows={4} className="resize-none" /></div>
                <div className="space-y-2"><Label className="font-semibold">4.2 Não Escopo</Label><Textarea placeholder="Liste o que não está incluído nas entregas do projeto..." value={naoEscopo} onChange={e => setNaoEscopo(e.target.value)} rows={3} className="resize-none" /></div>
                <div className="space-y-2"><Label className="font-semibold">4.3 Escopo do Produto</Label><Textarea placeholder="Descreva o que o projeto efetivamente entregará..." value={escopoProduto} onChange={e => setEscopoProduto(e.target.value)} rows={4} className="resize-none" /></div>
                <div>
                  <Label className="font-semibold mb-3 block">4.4 Premissas</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100"><tr><th className="text-left p-3 w-[40%]">Premissa</th><th className="text-left p-3">Descrição / Observação</th></tr></thead>
                      <tbody>
                        {Object.keys(premissas).map((key, idx) => (
                          <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-3 font-medium text-gray-700">{key}</td>
                            <td className="p-2"><Input placeholder="Descreva..." value={premissas[key]} onChange={e => setPremissas({ ...premissas, [key]: e.target.value })} className="h-9 text-sm" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold mb-3 block">4.5 Restrições</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100"><tr><th className="text-left p-3 w-[40%]">Restrição</th><th className="text-left p-3">Descrição / Observação</th></tr></thead>
                      <tbody>
                        {Object.keys(restricoes).map((key, idx) => (
                          <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-3 font-medium text-gray-700">{key}</td>
                            <td className="p-2"><Input placeholder="Descreva..." value={restricoes[key]} onChange={e => setRestricoes({ ...restricoes, [key]: e.target.value })} className="h-9 text-sm" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 5: JUSTIFICATIVA ── */}
              <div>
                <SectionTitle number="5" title="Justificativa" />
                <Textarea placeholder="Justifique a relevância, importância e impacto social, econômico e tecnológico do projeto..." value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={6} className="resize-none" />
              </div>

              {/* ── SEÇÃO 6: TECNOLOGIAS SOCIAIS ── */}
              <div>
                <SectionTitle number="6" title="Previsão de Tecnologias Sociais e/ou Propriedade Intelectual" />
                <Textarea placeholder="Descreva as tecnologias sociais previstas e/ou possibilidades de propriedade intelectual." value={tecnologiasSociais} onChange={e => setTecnologiasSociais(e.target.value)} rows={3} className="resize-none" />
              </div>

              {/* ── SEÇÃO 7: PRODUTOS, SERVIÇOS E RESULTADOS ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full">7</span>
                    <h3 className="text-base font-bold text-gray-900">Produtos, Serviços e/ou Resultados Esperados</h3>
                  </div>
                  <Button onClick={addProduto} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]"><Plus className="w-4 h-4 mr-1" /> Adicionar Linha</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#2F6B38] text-white">
                      <tr><th className="text-left p-3">Meta</th><th className="text-left p-3">Produto</th><th className="text-left p-3">Serviço</th><th className="text-left p-3">Resultado</th><th className="text-left p-3">Prazos</th><th className="p-3 w-10"></th></tr>
                    </thead>
                    <tbody>
                      {produtosResultados.map((p, idx) => (
                        <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {(["meta", "produto", "servico", "resultado", "prazo"] as const).map(field => (
                            <td key={field} className="p-2"><Input value={p[field]} onChange={e => updateProduto(p.id, field, e.target.value)} className="h-9 text-xs" placeholder="..." /></td>
                          ))}
                          <td className="p-2 text-center">
                            {produtosResultados.length > 1 && (<Button onClick={() => removeProduto(p.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8"><Trash2 className="w-3 h-3" /></Button>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEÇÃO 8: MAPA DE RISCO ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full">8</span>
                    <ShieldAlert className="w-5 h-5 text-[#2F6B38]" />
                    <h3 className="text-base font-bold text-gray-900">Mapa de Risco</h3>
                  </div>
                  <Button onClick={addRisco} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]"><Plus className="w-4 h-4 mr-1" /> Adicionar Risco</Button>
                </div>
                <div className="space-y-3">
                  {mapaRisco.map((r, idx) => (
                    <div key={r.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-600">Risco {idx + 1}</span>
                        {mapaRisco.length > 1 && (<Button onClick={() => removeRisco(r.id)} variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>)}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Descrição do Risco</Label><Textarea value={r.descricaoRisco} onChange={e => updateRisco(r.id, "descricaoRisco", e.target.value)} rows={2} className="resize-none text-xs" placeholder="Descreva o risco..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Descrição do Impacto</Label><Textarea value={r.descricaoImpacto} onChange={e => updateRisco(r.id, "descricaoImpacto", e.target.value)} rows={2} className="resize-none text-xs" placeholder="Descreva o impacto..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Ação</Label>
                          <Select value={r.acao} onValueChange={v => updateRisco(r.id, "acao", v)}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent><SelectItem value="Mitigar">Mitigar</SelectItem><SelectItem value="Aceitar">Aceitar</SelectItem><SelectItem value="Evitar">Evitar</SelectItem><SelectItem value="Transferir">Transferir</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Descrição da Ação de Contingência</Label><Textarea value={r.acaoContingencia} onChange={e => updateRisco(r.id, "acaoContingencia", e.target.value)} rows={2} className="resize-none text-xs" placeholder="Plano de contingência..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Responsável(is)</Label><Input value={r.responsavel} onChange={e => updateRisco(r.id, "responsavel", e.target.value)} className="h-9 text-xs" placeholder="Nome do responsável" /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold">Previsão</Label><Input type="date" value={r.previsao} onChange={e => updateRisco(r.id, "previsao", e.target.value)} className="h-9 text-xs" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SEÇÃO 9: EQUIPE ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full">9</span>
                    <Users className="w-5 h-5 text-[#2F6B38]" />
                    <h3 className="text-base font-bold text-gray-900">Equipe Inicial Vinculada ao Projeto e suas Atribuições</h3>
                  </div>
                  <Button onClick={addMembro} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]"><Plus className="w-4 h-4 mr-1" /> Adicionar Membro</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#2F6B38] text-white">
                      <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Currículo Lattes</th><th className="text-left p-3">Função</th><th className="text-left p-3 w-20">Qtd.</th><th className="text-left p-3">Perfil</th><th className="text-left p-3">Atribuições</th><th className="p-3 w-10"></th></tr>
                    </thead>
                    <tbody>
                      {equipe.map((m, idx) => (
                        <tr key={m.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {(["nome", "lattes", "funcao", "quantidade", "perfil", "atribuicoes"] as const).map(field => (
                            <td key={field} className="p-2"><Input value={m[field]} onChange={e => updateMembro(m.id, field, e.target.value)} className="h-9 text-xs" placeholder={field === "lattes" ? "http://lattes..." : "..."} /></td>
                          ))}
                          <td className="p-2 text-center">
                            {equipe.length > 1 && (<Button onClick={() => removeMembro(m.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8"><Trash2 className="w-3 h-3" /></Button>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEÇÃO 10: RESUMO ORÇAMENTÁRIO ── */}
              <div>
                <SectionTitle number="10" icon={DollarSign} title="Resumo Orçamentário" />
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#2F6B38] text-white">
                      <tr><th className="text-center p-3 w-16">Item</th><th className="text-left p-3">Descritivo</th><th className="text-left p-3 w-48">Valor (R$)</th></tr>
                    </thead>
                    <tbody>
                      {ORCAMENTO_ITEMS.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-3 text-center font-semibold text-gray-600">{idx + 1}</td>
                          <td className="p-3 text-gray-700">{item}</td>
                          <td className="p-2"><Input placeholder="R$ 0,00" value={orcamentoValues[idx]} onChange={e => updateOrcamento(idx, e.target.value)} className="h-9 text-sm" /></td>
                        </tr>
                      ))}
                      <tr className="bg-[#2F6B38]/10 border-t-2 border-[#2F6B38]">
                        <td colSpan={2} className="p-3 font-bold text-gray-900 text-right">Total Geral</td>
                        <td className="p-3 font-bold text-[#2F6B38]">{orcamentoValues.some(v => v) ? `R$ ${totalOrcaAba1.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ –"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEÇÃO 11: METODOLOGIA ── */}
              <div>
                <SectionTitle number="11" title="Metodologia" />
                <Textarea placeholder="Descreva a metodologia e procedimentos técnicos utilizados para alcançar os objetivos..." value={metodologia} onChange={e => setMetodologia(e.target.value)} rows={6} className="resize-none" />
              </div>

              {/* ── SEÇÃO 12: PLANO DE COMUNICAÇÃO ── */}
              <div>
                <SectionTitle number="12" icon={Megaphone} title="Plano de Comunicação / Divulgação" />
                <Textarea placeholder="Descreva as estratégias de comunicação e divulgação dos resultados do projeto..." value={planoComunicacao} onChange={e => setPlanoComunicacao(e.target.value)} rows={4} className="resize-none" />
              </div>

              {/* ── SEÇÃO 13: CRONOGRAMA ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full">13</span>
                    <Calendar className="w-5 h-5 text-[#2F6B38]" />
                    <h3 className="text-base font-bold text-gray-900">Cronograma de Execução das Atividades</h3>
                  </div>
                  <Button onClick={addCronogramaAba1} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]"><Plus className="w-4 h-4 mr-1" /> Adicionar Ação</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#2F6B38] text-white">
                      <tr><th className="text-left p-3">Ação</th><th className="text-left p-3">Objetivo Específico</th><th className="text-left p-3 w-40">Previsão de Início</th><th className="text-left p-3 w-40">Previsão de Entrega</th><th className="p-3 w-10"></th></tr>
                    </thead>
                    <tbody>
                      {cronogramaAba1.map((c, idx) => (
                        <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-2"><Input value={c.acao} onChange={e => updateCronogramaAba1(c.id, "acao", e.target.value)} className="h-9 text-xs" placeholder="Descreva a ação..." /></td>
                          <td className="p-2"><Input value={c.objetivoEspecifico} onChange={e => updateCronogramaAba1(c.id, "objetivoEspecifico", e.target.value)} className="h-9 text-xs" placeholder="Objetivo relacionado" /></td>
                          <td className="p-2"><Input type="date" value={c.previsaoInicio} onChange={e => updateCronogramaAba1(c.id, "previsaoInicio", e.target.value)} className="h-9 text-xs" /></td>
                          <td className="p-2"><Input type="date" value={c.previsaoEntrega} onChange={e => updateCronogramaAba1(c.id, "previsaoEntrega", e.target.value)} className="h-9 text-xs" /></td>
                          <td className="p-2 text-center">
                            {cronogramaAba1.length > 1 && (<Button onClick={() => removeCronogramaAba1(c.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8"><Trash2 className="w-3 h-3" /></Button>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEÇÃO 14: REFERÊNCIAS ── */}
              <div>
                <SectionTitle number="14" icon={BookOpen} title="Referências" />
                <Textarea placeholder="Liste as referências bibliográficas conforme ABNT..." value={referencias} onChange={e => setReferencias(e.target.value)} rows={5} className="resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" size="lg"><Save className="w-4 h-4 mr-2" /> Salvar Rascunho</Button>
                <Button size="lg" onClick={() => setCurrentTab("plano")} className="bg-[#2F6B38] hover:bg-[#1a4122]">Avançar para Plano de Trabalho</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            ABA 2 — PLANO DE TRABALHO DO PROJETO ESTRATÉGICO
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="plano">
          <Card className="shadow-xl border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-2xl">Plano de Trabalho do Projeto Estratégico</CardTitle>
              <CardDescription>Dados cadastrais, cronograma físico-financeiro e desembolso</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">

              {/* ── SEÇÃO 1: DADOS CADASTRAIS – INSTITUIÇÃO RESPONSÁVEL ── */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full font-bold">1</span>
                  <Building2 className="w-5 h-5 text-[#2F6B38]" />
                  <h3 className="text-base font-bold text-gray-900">Dados Cadastrais – Instituição Responsável</h3>
                </div>

                {campusInfo ? (
                  <div className="bg-[#2F6B38]/5 border border-[#2F6B38]/20 rounded-lg p-4 mb-4 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="font-semibold text-gray-700">Instituição: </span><span className="text-gray-600">Instituto Federal de Educação, Ciência e Tecnologia de Rondônia</span></div>
                      <div><span className="font-semibold text-gray-700">Sigla: </span><span className="text-gray-600">IFRO</span></div>
                      <div><span className="font-semibold text-gray-700">CNPJ: </span><span className="text-gray-600">{campusInfo.cnpj}</span></div>
                    </div>
                    <p className="text-xs text-[#2F6B38] mt-2 italic">↑ Preenchido automaticamente com base no campus selecionado na Aba 1</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
                    Selecione o campus na aba <strong>Projeto Básico</strong> para preencher automaticamente os dados da instituição.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Endereço</Label><Input placeholder="Logradouro, número" value={instEndereco} onChange={e => setInstEndereco(e.target.value)} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">Bairro</Label><Input placeholder="Bairro" value={instBairro} onChange={e => setInstBairro(e.target.value)} className="h-10" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">Cidade / Estado / CEP</Label><Input placeholder="Ex: Ji-Paraná/RO – 76900-000" value={instCidadeEstadoCep} onChange={e => setInstCidadeEstadoCep(e.target.value)} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">Unidade Executora</Label><Input placeholder="Ex: Campus Ji-Paraná" value={instUnidadeExecutora} onChange={e => setInstUnidadeExecutora(e.target.value)} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">Telefone</Label><Input placeholder="(69) XXXX-XXXX" value={instTelCampus} onChange={e => setInstTelCampus(formatTelefone(e.target.value))} className="h-10" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">E-mail</Label><Input placeholder="campus@ifro.edu.br" value={instEmail} onChange={e => setInstEmail(e.target.value)} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold">Site</Label><Input placeholder="https://www.ifro.edu.br" value={instSite} onChange={e => setInstSite(e.target.value)} className="h-10" /></div>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-semibold text-[#2F6B38] mb-3">Responsável (Coordenador(a) Geral)</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold">Nome</Label><Input value={coordGeralNome} readOnly className="h-9 text-sm bg-gray-100" placeholder="Preencher na aba Projeto" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">CPF</Label><Input placeholder="000.000.000-00" value={instCpf} onChange={e => setInstCpf(e.target.value)} className="h-9 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Matrícula SIAPE</Label><Input placeholder="0000000" value={instMatricula} onChange={e => setInstMatricula(e.target.value)} className="h-9 text-sm" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 2: FUNDAÇÃO DE APOIO ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 pb-2 border-b flex-1">
                    <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">2</span>
                    <h3 className="text-base font-bold text-gray-900">Dados Cadastrais – Fundação de Apoio <span className="font-normal text-gray-500 text-sm">(preencher se houver)</span></h3>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer ml-4" onClick={() => setHasFundacao(v => !v)}>
                    <Checkbox checked={hasFundacao} onCheckedChange={(v) => setHasFundacao(!!v)} className="data-[state=checked]:bg-[#2F6B38] data-[state=checked]:border-[#2F6B38]" />
                    <span className="text-sm font-semibold text-gray-700">Há fundação</span>
                  </div>
                </div>
                {hasFundacao && (
                  <div className="grid grid-cols-1 gap-4 border rounded-lg p-5 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Instituição</Label><Input placeholder="Nome da fundação" value={fundNome} onChange={e => setFundNome(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Sigla</Label><Input placeholder="Ex: FAPERO" value={fundSigla} onChange={e => setFundSigla(e.target.value)} className="h-10" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CNPJ</Label><Input placeholder="00.000.000/0000-00" value={fundCnpj} onChange={e => setFundCnpj(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">E-mail</Label><Input placeholder="email@fundacao.org" value={fundEmail} onChange={e => setFundEmail(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Site</Label><Input placeholder="https://" value={fundSite} onChange={e => setFundSite(e.target.value)} className="h-10" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Endereço</Label><Input placeholder="Logradouro, número" value={fundEndereco} onChange={e => setFundEndereco(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Bairro</Label><Input value={fundBairro} onChange={e => setFundBairro(e.target.value)} className="h-10" placeholder="Bairro" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Cidade / Estado</Label><Input value={fundCidadeEstado} onChange={e => setFundCidadeEstado(e.target.value)} className="h-10" placeholder="Cidade/UF" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CEP</Label><Input value={fundCep} onChange={e => setFundCep(e.target.value)} className="h-10" placeholder="00000-000" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Telefone</Label><Input value={fundTelefone} onChange={e => setFundTelefone(formatTelefone(e.target.value))} className="h-10" placeholder="(XX) XXXX-XXXX" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Responsável</Label><Input value={fundResponsavel} onChange={e => setFundResponsavel(e.target.value)} className="h-10" placeholder="Nome do responsável" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Cargo</Label><Input value={fundCargo} onChange={e => setFundCargo(e.target.value)} className="h-10" placeholder="Cargo" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CPF</Label><Input value={fundCpf} onChange={e => setFundCpf(e.target.value)} className="h-10" placeholder="000.000.000-00" /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SEÇÃO 3: INSTITUIÇÃO PARTICIPANTE ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 pb-2 border-b flex-1">
                    <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">3</span>
                    <h3 className="text-base font-bold text-gray-900">Dados Cadastrais – Instituição / ICT / Empresa / ONG Participante <span className="font-normal text-gray-500 text-sm">(se houver)</span></h3>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer ml-4" onClick={() => setHasInstPart(v => !v)}>
                    <Checkbox checked={hasInstPart} onCheckedChange={(v) => setHasInstPart(!!v)} className="data-[state=checked]:bg-[#2F6B38] data-[state=checked]:border-[#2F6B38]" />
                    <span className="text-sm font-semibold text-gray-700">Há participante</span>
                  </div>
                </div>
                {hasInstPart && (
                  <div className="grid grid-cols-1 gap-4 border rounded-lg p-5 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Instituição</Label><Input placeholder="Nome da instituição" value={partNome} onChange={e => setPartNome(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Sigla</Label><Input value={partSigla} onChange={e => setPartSigla(e.target.value)} className="h-10" placeholder="Sigla" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CNPJ</Label><Input placeholder="00.000.000/0000-00" value={partCnpj} onChange={e => setPartCnpj(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">E-mail</Label><Input value={partEmail} onChange={e => setPartEmail(e.target.value)} className="h-10" placeholder="email@empresa.com" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Site</Label><Input value={partSite} onChange={e => setPartSite(e.target.value)} className="h-10" placeholder="https://" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Endereço</Label><Input placeholder="Logradouro, número" value={partEndereco} onChange={e => setPartEndereco(e.target.value)} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Bairro</Label><Input value={partBairro} onChange={e => setPartBairro(e.target.value)} className="h-10" placeholder="Bairro" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Cidade / Estado</Label><Input value={partCidadeEstado} onChange={e => setPartCidadeEstado(e.target.value)} className="h-10" placeholder="Cidade/UF" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CEP</Label><Input value={partCep} onChange={e => setPartCep(e.target.value)} className="h-10" placeholder="00000-000" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Telefone</Label><Input value={partTelefone} onChange={e => setPartTelefone(formatTelefone(e.target.value))} className="h-10" placeholder="(XX) XXXX-XXXX" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5"><Label className="text-sm font-semibold">Responsável</Label><Input value={partResponsavel} onChange={e => setPartResponsavel(e.target.value)} className="h-10" placeholder="Nome do responsável" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">Cargo</Label><Input value={partCargo} onChange={e => setPartCargo(e.target.value)} className="h-10" placeholder="Cargo" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold">CPF</Label><Input value={partCpf} onChange={e => setPartCpf(e.target.value)} className="h-10" placeholder="000.000.000-00" /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SEÇÃO 10: CRONOGRAMA FÍSICO-FINANCEIRO ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full font-bold">10</span>
                    <DollarSign className="w-5 h-5 text-[#2F6B38]" />
                    <h3 className="text-base font-bold text-gray-900">Cronograma Físico-Financeiro</h3>
                  </div>
                  <Button onClick={addMetaPlano} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Meta
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Metas dinâmicas */}
                  {metasPlano.map((meta, metaIdx) => (
                    <div key={meta.id} className="border-2 border-[#2F6B38]/20 rounded-xl overflow-hidden">
                      {/* Cabeçalho da Meta */}
                      <div className="bg-[#2F6B38]/10 px-4 py-3 flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="bg-[#2F6B38] text-white text-xs font-bold px-2.5 py-1 rounded">META {metaIdx + 1}</span>
                          <Input
                            placeholder={`Descrição da Meta ${metaIdx + 1}`}
                            value={meta.descricao}
                            onChange={e => updateMetaPlanoDesc(meta.id, e.target.value)}
                            className="h-9 flex-1 bg-white font-semibold"
                          />
                        </div>
                        {metasPlano.length > 1 && (
                          <Button onClick={() => removeMetaPlano(meta.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Tabela de Etapas */}
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 w-14">Etapa</th>
                            <th className="text-left p-3">Especificação</th>
                            <th className="text-left p-3 w-56">Rubrica</th>
                            <th className="text-left p-3 w-36">Etapa(s) R$</th>
                            <th className="text-left p-3 w-36">Início</th>
                            <th className="text-left p-3 w-36">Término</th>
                            <th className="p-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {meta.etapas.map((etapa, etapaIdx) => (
                            <tr key={etapa.id} className={etapaIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                              <td className="p-2 text-center font-semibold text-gray-500 text-xs">{metaIdx + 1}.{etapaIdx + 1}</td>
                              <td className="p-2">
                                <Input value={etapa.especificacao} onChange={e => updateEtapa(meta.id, etapa.id, "especificacao", e.target.value)} className="h-9 text-xs" placeholder="Descreva a etapa/item..." />
                              </td>
                              <td className="p-2">
                                <Select value={etapa.rubrica} onValueChange={v => updateEtapa(meta.id, etapa.id, "rubrica", v)}>
                                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                  <SelectContent>
                                    {RUBRICAS.map(r => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input value={etapa.valor} onChange={e => updateEtapa(meta.id, etapa.id, "valor", e.target.value)} className="h-9 text-xs" placeholder="R$ 0,00" />
                              </td>
                              <td className="p-2"><Input type="date" value={etapa.inicio} onChange={e => updateEtapa(meta.id, etapa.id, "inicio", e.target.value)} className="h-9 text-xs" /></td>
                              <td className="p-2"><Input type="date" value={etapa.termino} onChange={e => updateEtapa(meta.id, etapa.id, "termino", e.target.value)} className="h-9 text-xs" /></td>
                              <td className="p-2 text-center">
                                {meta.etapas.length > 1 && (
                                  <Button onClick={() => removeEtapa(meta.id, etapa.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8"><Trash2 className="w-3 h-3" /></Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Rodapé da Meta */}
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
                        <Button onClick={() => addEtapa(meta.id)} variant="outline" size="sm" className="text-[#2F6B38] border-[#2F6B38] h-8 text-xs">
                          <Plus className="w-3 h-3 mr-1" /> Adicionar Etapa
                        </Button>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">({metaIdx + 1}) TOTAL META {metaIdx + 1}:</span>
                          <span className="font-bold text-[#2F6B38]">{formatMoeda(calcTotalMeta(meta))}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Meta "Todas" – itens comuns a todas as metas */}
                  <div className="border-2 border-amber-300 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-4 py-3 flex items-center gap-3">
                      <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded">META TODAS</span>
                      <p className="text-sm font-semibold text-gray-700">Itens transversais – comuns a todas as metas</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-3 w-14 text-center">Etapa</th>
                          <th className="text-left p-3">Especificação</th>
                          <th className="text-left p-3 w-56">Rubrica</th>
                          <th className="text-left p-3 w-36">Etapa(s) R$</th>
                          <th className="text-left p-3 w-36">Início</th>
                          <th className="text-left p-3 w-36">Término</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metaTodasItems.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-2 text-center font-semibold text-gray-500 text-xs">Todas</td>
                            <td className="p-3 text-gray-700 text-sm">{item.especificacao}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono text-xs border-amber-400 text-amber-700 bg-amber-50">{item.rubrica}</Badge>
                            </td>
                            <td className="p-2"><Input value={item.valor} onChange={e => updateMetaTodas(item.id, "valor", e.target.value)} className="h-9 text-xs" placeholder="R$ 0,00" /></td>
                            <td className="p-2"><Input type="date" value={item.inicio} onChange={e => updateMetaTodas(item.id, "inicio", e.target.value)} className="h-9 text-xs" /></td>
                            <td className="p-2"><Input type="date" value={item.termino} onChange={e => updateMetaTodas(item.id, "termino", e.target.value)} className="h-9 text-xs" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-t border-amber-200">
                      <span className="text-sm text-gray-500">({metasPlano.length + 1}) TOTAL META TODAS:</span>
                      <span className="font-bold text-amber-700">{formatMoeda(calcTotalTodas())}</span>
                    </div>
                  </div>

                  {/* TOTAL DAS METAS */}
                  <div className="bg-[#2F6B38] text-white rounded-xl p-4 flex items-center justify-between">
                    <span className="font-bold text-lg">TOTAL DAS METAS ({metasPlano.map((_, i) => i + 1).join("+")}+Todas)</span>
                    <span className="font-extrabold text-xl">{formatMoeda(calcTotalMetas())}</span>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO 10.1: TOTAL DO ORÇAMENTO ── */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full font-bold">10.1</span>
                  <h3 className="text-base font-bold text-gray-900">Total do Orçamento</h3>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="bg-white border-b">
                        <td className="p-4 font-semibold text-gray-700">Valor Total do Orçamento</td>
                        <td className="p-4 font-bold text-[#2F6B38] text-right">{formatMoeda(valorTotalOrcamento)}</td>
                      </tr>
                      <tr className="bg-gray-50 border-b">
                        <td className="p-4 text-gray-700">
                          <p className="font-semibold">Despesas Operacionais e Administrativas da Fundação</p>
                          <p className="text-xs text-gray-500 mt-0.5">Em caso de contratação da Fundação de Apoio</p>
                        </td>
                        <td className="p-3 w-52">
                          <Input placeholder="R$ 0,00" value={despesasOpFundacao} onChange={e => setDespesasOpFundacao(formatCurrencyInput(e.target.value))} className="h-10 text-right" />
                        </td>
                      </tr>
                      <tr className="bg-white border-b">
                        <td className="p-4 text-gray-700">
                          <p className="font-semibold text-amber-700">Custos indiretos de execução do projeto (até 15%)</p>
                          <p className="text-xs text-gray-500 mt-0.5">O valor será definido pelo Escritório de Projetos após a avaliação do Projeto Básico (Portaria Nº 2494/REIT)</p>
                        </td>
                        <td className="p-3 w-52">
                          <Input placeholder="R$ 0,00" value={custosIndiretos} onChange={e => setCustosIndiretos(formatCurrencyInput(e.target.value))} className="h-10 text-right border-amber-300 focus:ring-amber-400" />
                        </td>
                      </tr>
                      <tr className="bg-[#2F6B38] text-white">
                        <td className="p-4 font-bold text-lg">TOTAL PROJETO</td>
                        <td className="p-4 font-extrabold text-xl text-right">{formatMoeda(totalProjeto)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEÇÃO 11: CRONOGRAMA DE DESEMBOLSO ── */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2F6B38] text-white text-xs px-2 py-0.5 rounded-full font-bold">11</span>
                    <Calendar className="w-5 h-5 text-[#2F6B38]" />
                    <h3 className="text-base font-bold text-gray-900">Cronograma de Desembolso do Recurso pelo Demandante</h3>
                  </div>
                  <Button onClick={addDesembolso} size="sm" className="bg-[#2F6B38] hover:bg-[#1a4122]">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Mês
                  </Button>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#2F6B38] text-white">
                      <tr>
                        <th className="text-center p-3 w-16">Nº</th>
                        <th className="text-left p-3">Mês / Ano de Desembolso</th>
                        <th className="text-left p-3 w-56">Valor (R$)</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {desembolsos.map((d, idx) => (
                        <tr key={d.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-3 text-center font-semibold text-gray-500">{idx + 1}</td>
                          <td className="p-2">
                            <Input placeholder="Ex: Maio / 2025" value={d.mesAno} onChange={e => updateDesembolso(d.id, "mesAno", e.target.value)} className="h-10" />
                          </td>
                          <td className="p-2">
                            <Input placeholder="R$ 0,00" value={d.valor} onChange={e => updateDesembolso(d.id, "valor", e.target.value)} className="h-10" />
                          </td>
                          <td className="p-2 text-center">
                            {desembolsos.length > 1 && (
                              <Button onClick={() => removeDesembolso(d.id)} variant="ghost" size="sm" className="text-red-500 px-2 h-8">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#2F6B38] text-white">
                        <td colSpan={2} className="p-4 font-bold text-right">VALOR TOTAL DO PROJETO (R$)</td>
                        <td className="p-4 font-extrabold">{formatMoeda(totalDesembolso || totalProjeto)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3 text-xs text-amber-800">
                  <strong>Nota (Portaria Nº 2494/REIT – CGAB/IFRO, 18/12/2023):</strong> O IFRO regulamentou que cada projeto captado deve reservar até 15% do seu orçamento bruto para incorporar ao orçamento da instituição e assim custear ações de ensino, pesquisa e extensão. Projetos que contribuam para a melhoria dos indicadores do IFRO terão taxas reduzidas ao mínimo.
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="bg-amber-50 border-l-4 border-[#2F6B38] p-5 rounded-r-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Atenção</p>
                    <p>Após submeter o projeto, ele será enviado para análise técnica pela comissão avaliadora. Certifique-se de que todos os dados estão corretos e completos.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" size="lg" onClick={() => setCurrentTab("projeto")}>Voltar para Projeto</Button>
                <Button variant="outline" size="lg"><Save className="w-4 h-4 mr-2" /> Salvar Rascunho</Button>
                <Button size="lg" onClick={handleSubmit} className="bg-[#2F6B38] hover:bg-[#1a4122]">Submeter Projeto Completo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lista de Projetos Cadastrados */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-[#ED1C24] rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900">Projetos Cadastrados</h2>
        </div>
        <div className="grid gap-4">
          {ultimasDemandas.map(demanda => (
            <Card key={demanda.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2F6B38]/10 to-[#2F6B38]/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[#2F6B38]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{demanda.titulo}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Campus: {demanda.campus}</p>
                    </div>
                  </div>
                  <Badge className={`${demanda.statusColor} px-4 py-1.5 font-bold border-0`}>{demanda.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
