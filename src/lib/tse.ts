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
  cargos: CargoTSE[];
  gerado_em: string | null;
  data_apuracao: string | null;
  hora_apuracao: string | null;
  totalizacao_finalizada: boolean;
  fonte: "tse";
};

const CD_CARGO_PRESIDENTE = "1";

const URL_TSE =
  process.env.TSE_RESULTADOS_URL ??
  "https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e06257-u.json";

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

function parseFromJson(d: Record<string, unknown>): ResultadoPresidencial {
  const secoes = d.s as Record<string, string> | undefined;
  const eleitorado = d.e as Record<string, string> | undefined;
  const votos = d.v as Record<string, string> | undefined;

  const cargos = (d.carg as Array<Record<string, unknown>>) ?? [];
  const presidente = cargos.find((c) => c.cd === CD_CARGO_PRESIDENTE) ?? cargos[0];

  const candidatos: CandidatoTSE[] = [];
  if (presidente) {
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
            nome: String(c.nm ?? c.nmu ?? "") ?? "",
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
  }
  candidatos.sort((a, b) => b.votos - a.votos);

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
      ? [{ cd: String(presidente.cd ?? ""), nome: String(presidente.nm ?? ""), candidatos }]
      : [],
    gerado_em: d.hg ? `${d.dg} ${d.hg}` : null,
    data_apuracao: d.dt ? String(d.dt) : null,
    hora_apuracao: d.ht ? String(d.ht) : null,
    totalizacao_finalizada: String(d.and ?? "") === "f",
    fonte: "tse",
  };
}

export async function consultarResultadoPresidencial(): Promise<ResultadoPresidencial | null> {
  const res = await fetch(URL_TSE, metadata);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TSE respondeu HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  return parseFromJson(json);
}