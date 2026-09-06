export type TipoCaso =
  | "processo"
  | "investigacao"
  | "denuncia"
  | "condenacao"
  | "inelegibilidade"
  | "cassacao"
  | "contradicao"
  | "outro";

export type StatusCaso =
  | "em_andamento"
  | "arquivado"
  | "condenado"
  | "absolvido"
  | "sem_informacao";

export type CasoFicha = {
  id: number;
  politico_id: number;
  tipo: TipoCaso;
  status: StatusCaso;
  titulo: string;
  descricao: string | null;
  orgao: string | null;
  data_fato: string | null;
  fontes: string[];
  criado_em: string;
  atualizado_em: string;
};

export type IndicadorFicha = "sem_casos" | "com_casos" | "atencao";

export type ResumoFicha = {
  total: number;
  indicador: IndicadorFicha;
};

const TIPOS_ATENCAO: ReadonlySet<string> = new Set([
  "condenacao",
  "inelegibilidade",
  "cassacao",
]);

const STATUS_ATENCAO: ReadonlySet<string> = new Set([
  "condenado",
]);

export function resumirFicha(casos: CasoFicha[]): ResumoFicha {
  const total = casos.length;
  if (total === 0) return { total, indicador: "sem_casos" };
  const atencao = casos.some(
    (c) => TIPOS_ATENCAO.has(c.tipo) || STATUS_ATENCAO.has(c.status)
  );
  return { total, indicador: atencao ? "atencao" : "com_casos" };
}

export function rotuloTipoCaso(tipo: TipoCaso): string {
  switch (tipo) {
    case "processo":
      return "Processo";
    case "investigacao":
      return "Investigação";
    case "denuncia":
      return "Denúncia";
    case "condenacao":
      return "Condenação";
    case "inelegibilidade":
      return "Inelegibilidade";
    case "cassacao":
      return "Cassação";
    case "contradicao":
      return "Contradição";
    default:
      return "Caso documentado";
  }
}

export function rotuloStatusCaso(status: StatusCaso): string {
  switch (status) {
    case "em_andamento":
      return "Em andamento";
    case "arquivado":
      return "Arquivado";
    case "condenado":
      return "Condenado";
    case "absolvido":
      return "Absolvido";
    default:
      return "Sem informação";
  }
}