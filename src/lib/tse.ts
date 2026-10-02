export type CandidatoTSE = {
  numero: number;
  sq: string;
  nome: string;
  nome_urna: string;
  partido: string;
  votos: number;
  pct_votos_validos: number | null;
  anulado: boolean;
  destino: string;
  situacao: string | null;
};

export type CargoTSE = {
  cd: string;
  nome: string;
  candidatos: CandidatoTSE[];
};

export type ResumoTotalizacao = {
  secao: { total: number; totalizada: number; pct: number | null };
  eleitorado: { total: number; comparecimento: number; abstenção: number };
  votos: {
    total: number;
    validos: number;
    pct_validos: number | null;
    nominais: number;
    brancos: number;
    nulos: number;
  };
};

export type ResultadoPresidencial = ResumoTotalizacao & {
  uf: string;
  uf_nome: string;
  cargos: CargoTSE[];
  gerado_em: string | null;
  data_apuracao: string | null;
  hora_apuracao: string | null;
  totalizacao_finalizada: boolean;
  fonte: "tse";
};

export type ResultadoPorEstado = {
  uf: string;
  uf_nome: string;
  votante_maioria: CandidatoTSE | null;
  segundo: CandidatoTSE | null;
  cargo: { cd: string; nome: string } | null;
  resumo: ResumoTotalizacao;
  gerado_em: string | null;
  totalizacao_finalizada: boolean;
};

export const UFS = [
  { uf: "ac", nome: "Acre" },
  { uf: "al", nome: "Alagoas" },
  { uf: "ap", nome: "Amapá" },
  { uf: "am", nome: "Amazonas" },
  { uf: "ba", nome: "Bahia" },
  { uf: "ce", nome: "Ceará" },
  { uf: "df", nome: "Distrito Federal" },
  { uf: "es", nome: "Espírito Santo" },
  { uf: "go", nome: "Goiás" },
  { uf: "ma", nome: "Maranhão" },
  { uf: "mt", nome: "Mato Grosso" },
  { uf: "ms", nome: "Mato Grosso do Sul" },
  { uf: "mg", nome: "Minas Gerais" },
  { uf: "pa", nome: "Pará" },
  { uf: "pb", nome: "Paraíba" },
  { uf: "pr", nome: "Paraná" },
  { uf: "pe", nome: "Pernambuco" },
  { uf: "pi", nome: "Piauí" },
  { uf: "rj", nome: "Rio de Janeiro" },
  { uf: "rn", nome: "Rio Grande do Norte" },
  { uf: "rs", nome: "Rio Grande do Sul" },
  { uf: "ro", nome: "Rondônia" },
  { uf: "rr", nome: "Roraima" },
  { uf: "sc", nome: "Santa Catarina" },
  { uf: "sp", nome: "São Paulo" },
  { uf: "se", nome: "Sergipe" },
  { uf: "to", nome: "Tocantins" },
] as const;

const CD_CARGO_PRESIDENTE = "1";

function urlDeUF(uf: string): string {
  const ambiente = process.env.TSE_RESULTADOS_URL ?? "";
  if (ambiente) return ambiente.replaceAll("{uf}", uf);
  return `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/${uf}/${uf}-c0001-e06257-u.json`;
}

export const metadata: RequestInit = {
  headers: { "User-Agent": "BrasilTransparenteBot/0.2 (monitoramento eleitoral)" },
  next: { revalidate: 30 },
};

function numero(v: string | undefined | null): number {
  if (!v) return 0;
  return Number(v.replace(/\D/g, "")) || 0;
}

function percentual(v: string | undefined | null): number | null {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseCandidatos(
  presidente: Record<string, unknown>
): CandidatoTSE[] {
  const candidatos: CandidatoTSE[] = [];
  const agregadores = (presidente.agr as Array<Record<string, unknown>>) ?? [];
  for (const agr of agregadores) {
    const partidos = (agr.par as Array<Record<string, unknown>>) ?? [];
    const aliasPartido = (agr.nm as string) ?? "";
    for (const partido of partidos) {
      const cand = (partido.cand as Array<Record<string, unknown>>) ?? [];
      for (const c of cand) {
        const destino = String(c.dvt ?? "");
        candidatos.push({
          numero: numero(String(c.n ?? "")),
          sq: String(c.sqcand ?? ""),
          nome: String(c.nm ?? c.nmu ?? ""),
          nome_urna: String(c.nmu ?? c.nm ?? ""),
          partido: String(partido.sg ?? partido.nm ?? aliasPartido ?? ""),
          votos: numero(String(c.vap ?? "")),
          pct_votos_validos: percentual(String(c.pvap ?? "")),
          anulado: destino.toLowerCase().includes("anulado"),
          destino,
          situacao: String(c.st ?? null) || null,
        });
      }
    }
  }
  candidatos.sort((a, b) => b.votos - a.votos);
  return candidatos;
}

function parseFromJson(
  d: Record<string, unknown>
): Omit<ResultadoPresidencial, "uf" | "uf_nome"> {
  const secoes = d.s as Record<string, string> | undefined;
  const eleitorado = d.e as Record<string, string> | undefined;
  const votos = d.v as Record<string, string> | undefined;

  const cargos = (d.carg as Array<Record<string, unknown>>) ?? [];
  const presidente =
    cargos.find((c) => c.cd === CD_CARGO_PRESIDENTE) ?? cargos[0];

  const candidatos = presidente ? parseCandidatos(presidente) : [];

  return {
    secao: {
      total: numero(secoes?.ts),
      totalizada: numero(secoes?.st),
      pct: percentual(secoes?.pst),
    },
    eleitorado: {
      total: numero(eleitorado?.te),
      comparecimento: numero(eleitorado?.c),
      abstenção: numero(eleitorado?.a),
    },
    votos: {
      total: numero(votos?.tv),
      validos: numero(votos?.vvc),
      pct_validos: percentual(votos?.pvvc),
      nominais: numero(votos?.vnom),
      brancos: numero(votos?.vb),
      nulos: numero(votos?.vn),
    },
    cargos: presidente
      ? [
          {
            cd: String(presidente.cd ?? ""),
            nome: String(presidente.nm ?? "Presidente"),
            candidatos,
          },
        ]
      : [],
    gerado_em: d.hg ? `${d.dg} ${d.hg}` : null,
    data_apuracao: d.dt ? String(d.dt) : null,
    hora_apuracao: d.ht ? String(d.ht) : null,
    totalizacao_finalizada: String(d.and ?? "") === "f",
    fonte: "tse" as const,
  };
}

function nomeDaUF(uf: string): string {
  for (const u of UFS) if (u.uf === uf) return u.nome;
  return uf.toUpperCase();
}

async function fetchJson(uf: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(urlDeUF(uf), metadata);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TSE respondeu HTTP ${res.status} (${uf})`);
  return (await res.json()) as Record<string, unknown>;
}

export async function consultarResultadoPresidencial(): Promise<ResultadoPresidencial | null> {
  const json = await fetchJson("br");
  if (!json) return null;
  return {
    uf: "br",
    uf_nome: "Brasil",
    ...parseFromJson(json),
  };
}

export async function consultarResultadoPorEstado(
  uf: string
): Promise<ResultadoPorEstado | null> {
  const json = await fetchJson(uf);
  if (!json) return null;
  const resumo = parseFromJson(json);
  const valem = resumo.cargos[0]?.candidatos.filter((c) => !c.anulado) ?? [];
  const primeiro = valem[0] ?? null;
  const segundo = valem[1] ?? null;
  const cargo = resumo.cargos[0]
    ? { cd: resumo.cargos[0].cd, nome: resumo.cargos[0].nome }
    : null;
  return {
    uf,
    uf_nome: nomeDaUF(uf),
    votante_maioria: primeiro,
    segundo,
    cargo,
    resumo,
    gerado_em: resumo.gerado_em,
    totalizacao_finalizada: resumo.totalizacao_finalizada,
  };
}

export async function consultarResultadosPorEstado(): Promise<
  ResultadoPorEstado[] | null
> {
  const estados: ResultadoPorEstado[] = [];
  for (const { uf, nome } of UFS) {
    const r = await consultarResultadoPorEstado(uf);
    if (!r) return null;
    estados.push({ ...r, uf, uf_nome: nome });
  }
  return estados;
}