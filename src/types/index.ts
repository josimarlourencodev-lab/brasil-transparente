export type TipoFonte = "oficial" | "oposicao" | "imprensa" | "desconhecida";

export type StatusNoticia = "rascunho" | "revisao" | "publicado" | "rejeitado";

export interface Politico {
  id: number;
  nome: string;
  partido?: string | null;
  cargo?: string | null;
  ativo: boolean;
  termos_busca: string[];
  biografia?: string | null;
  foto_url?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Noticia {
  id: number;
  titulo: string;
  url: string;
  url_fonte?: string | null;
  resumo?: string | null;
  categoria: string;
  tipo_fonte: TipoFonte;
  publicado_em?: string | null;
  coletado_em: string;
  status: StatusNoticia;
  imagem_url?: string | null;
  contradicao_detectada?: boolean | null;
  politico_id?: number | null;
  politica: Politico | null;
}

export interface Fonte {
  id: number;
  noticia_id: number;
  titulo?: string | null;
  url: string;
  veiculo?: string | null;
  tipo: string;
  acessado_em: string;
}

export interface Historico {
  id: number;
  politico_id: number;
  noticia_id?: number | null;
  titulo: string;
  descricao?: string | null;
  data_fato?: string | null;
  tipo: "caso" | "contradicao" | "posicao" | "correcao";
  criado_em: string;
}