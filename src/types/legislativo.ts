/**
 * Tipos para Atividade Legislativa (dados brutos oficiais, neutros)
 */

export type Casa = "camara" | "senado" | "executivo";

export type CargoAgente =
  | "deputado_federal"
  | "senador"
  | "governador"
  | "presidente"
  | "presidenciavel";

export type PapelAutor = "autor" | "coautor";

export type VotoBruto =
  | "favor"
  | "contra"
  | "abstencao"
  | "ausente"
  | "artigo_17"
  | "nao_registrado"
  | "obstrucao";

export interface Partido {
  id: string;
  sigla: string;
  nome: string;
  dados_oficiais?: unknown;
  criado_em: string;
}

export interface UF {
  sigla: string;
  nome: string;
  regiao?: string | null;
  criado_em: string;
}

export interface Tema {
  id: string;
  slug: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface AgentePolitico {
  id: string;
  politico_id?: string | null;
  casa: Casa;
  cargo: CargoAgente;
  nome: string;
  nome_eleitoral?: string | null;
  cpf_candidato?: string | null;
  partido_id?: string | null;
  uf?: string | null;
  id_legislativo_camara?: number | null;
  id_legislativo_senado?: number | null;
  tse_candidato_id?: string | null;
  foto_url?: string | null;
  ativo: boolean;
  dados_oficiais?: unknown;
  criado_em: string;
  atualizado_em: string;
}

export interface Proposicao {
  id: string;
  casa: Casa;
  tipo: string;
  numero: number;
  ano: number;
  sigla: string;
  ementa?: string | null;
  ementa_detalhada?: string | null;
  url_oficial?: string | null;
  uri_dados_abertos?: string | null;
  situacao?: string | null;
  ultimo_status?: unknown;
  data_apresentacao?: string | null;
  dados_oficiais?: unknown;
  criado_em: string;
  atualizado_em: string;
}

export interface Votacao {
  id: string;
  casa: Casa;
  id_votacao_oficial: string;
  proposicao_id?: string | null;
  data_hora?: string | null;
  objeto_votacao?: string | null;
  resumo?: string | null;
  aprovada?: boolean | null;
  quorum?: string | null;
  dados_oficiais?: unknown;
  criado_em: string;
  atualizado_em: string;
}

export interface VotoParlamentar {
  id: string;
  votacao_id: string;
  agente_politico_id: string;
  voto: VotoBruto;
  voto_original?: string | null;
  dados_oficiais?: unknown;
  criado_em: string;
}

export interface AutoriaAgente {
  agente_politico_id: string;
  nome: string;
  cargo: CargoAgente;
  casa: Casa;
  uf?: string | null;
  partido_sigla?: string | null;
  proposicao_id: string;
  sigla: string;
  tipo: string;
  numero: number;
  ano: number;
  ementa?: string | null;
  papel: PapelAutor;
  situacao?: string | null;
  url_oficial?: string | null;
  data_apresentacao?: string | null;
}

export interface VotacaoPorAgente {
  agente_politico_id: string;
  cargo: CargoAgente;
  casa: Casa;
  uf?: string | null;
  partido_sigla?: string | null;
  votacao_id: string;
  votacao_casa: Casa;
  data_hora?: string | null;
  objeto_votacao?: string | null;
  resumo?: string | null;
  aprovada?: boolean | null;
  voto: VotoBruto;
  voto_original?: string | null;
  proposicao_id?: string | null;
  sigla?: string | null;
  tipo?: string | null;
  numero?: number | null;
  ano?: number | null;
}

export interface DistribuicaoTema {
  tema_id: string;
  tema: string;
  tema_slug: string;
  votacao_id: string;
  votacao_casa: Casa;
  data_hora?: string | null;
  objeto_votacao?: string | null;
  resumo?: string | null;
  aprovada?: boolean | null;
  voto: VotoBruto;
  qtd_voto: number;
  agente_politico_id: string;
  nome: string;
  cargo: CargoAgente;
  uf?: string | null;
  partido_sigla?: string | null;
}
