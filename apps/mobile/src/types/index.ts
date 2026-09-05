export type TipoFonte = "oficial" | "oposicao" | "imprensa" | "desconhecida";

export interface Noticia {
  id: number;
  titulo: string;
  url: string;
  resumo?: string | null;
  categoria: string;
  tipo_fonte: TipoFonte;
  publicado_em?: string | null;
  status: string;
  contradicao_detectada?: boolean;
  contradicao_descricao?: string | null;
  politico_id?: number | null;
  imagem_url?: string | null;
}

export interface Politico {
  id: number;
  nome: string;
  partido: string | null;
  cargo: string | null;
  biografia: string | null;
  foto_url: string | null;
  termos_busca: string[] | null;
}

export interface NoticiaComPolitico extends Noticia {
  politico?: Pick<Politico, "id" | "nome" | "partido" | "foto_url"> | null;
}

export interface PodcastEpisodio {
  id: number;
  titulo: string;
  descricao: string | null;
  audio_url: string;
  duracao_seg: number | null;
  publicado_em: string | null;
}