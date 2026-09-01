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
}