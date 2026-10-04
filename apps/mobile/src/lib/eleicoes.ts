export type Candidato = {
  numero: number;
  nome_urna: string;
  partido: string;
  votos: number;
  pct_votos_validos: number | null;
  anulado: boolean;
};

export type ResumoEleicoes = {
  uf: string;
  uf_nome: string;
  turno: number;
  secao: { total: number; totalizada: number; pct: number | null };
  votos: {
    validos: number;
    brancos: number;
    nulos: number;
    pct_validos: number | null;
  };
  cargos: { cd: string; nome: string; candidatos: Candidato[] }[];
  gerado_em: string | null;
  totalizacao_finalizada: boolean;
};

export type EstadoEleicao = {
  uf: string;
  uf_nome: string;
  votante_maioria: Candidato | null;
  segundo: Candidato | null;
  resumo: ResumoEleicoes;
  totalizacao_finalizada: boolean;
};

const CICLO = "ele2026";
const CD_CARGO_PRESIDENTE = "1";
const CD_ELEICAO_T1 = "6257";
const CD_ELEICAO_T2 = "6258";

export const UFS: { uf: string; nome: string }[] = [
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
];

function configUrl(): string {
  return `https://resultados.tse.jus.br/oficial/comum/config/ele-c.json`;
}

function urlDeUF(uf: string, eleicao: string): string {
function urlDeUF(uf: string, eleicao: string): string {
  const codigo = String(eleicao).padStart(6, "0");
  return `https://resultados.tse.jus.br/oficial/${CICLO}/${eleicao}/dados/${uf}/${uf}-c0001-e${codigo}-u.json`;
}
}

const HEADERS = {
  "User-Agent": "BrasilTransparenteMobile/0.2 (app android)",
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

async function obterCdTurnoAtivo(): Promise<string> {
  const forcar = process.env.TSE_TURNO;
  if (forcar === "1") return CD_ELEICAO_T1;
  if (forcar === "2") return CD_ELEICAO_T2;
  try {
    const res = await fetch(urlDeUF("br", CD_ELEICAO_T2), { headers: HEADERS });
    if (res.ok) return CD_ELEICAO_T2;
  } catch {
    /* cai para o 1º turno */
  }
  return CD_ELEICAO_T1;
}

function parseCandidatos(presidente: Record<string, unknown>): Candidato[] {
  const candidatos: Candidato[] = [];
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
          nome_urna: String(c.nmu ?? c.nm ?? ""),
          partido: String(partido.sg ?? partido.nm ?? aliasPartido ?? ""),
          votos: numero(String(c.vap ?? "")),
          pct_votos_validos: percentual(String(c.pvap ?? "")),
          anulado: destino.toLowerCase().includes("anulado"),
        });
      }
    }
  }
  candidatos.sort((a, b) => b.votos - a.votos);
  return candidatos;
}

function parseFromJson(
  d: Record<string, unknown>
): Omit<ResumoEleicoes, "uf" | "uf_nome" | "turno"> {
  const secoes = d.s as Record<string, string> | undefined;
  const eleitorado = d.e as Record<string, string> | undefined;
  const votos = d.v as Record<string, string> | undefined;

  const cargos = (d.carg as Array<Record<string, unknown>>) ?? [];
  const presidente =
    cargos.find((c) => c.cd === CD_CARGO_PRESIDENTE) ?? cargos[0];
  const candidatos = presidente ? parseCandidatos(presidente) : [];

  const validos = numero(votos?.vvc);
  const brancos = numero(votos?.vb);
  const nulos = numero(votos?.vn);

  return {
    secao: {
      total: numero(secoes?.ts),
      totalizada: numero(secoes?.st),
      pct: percentual(secoes?.pst),
    },
    votos: {
      validos,
      brancos,
      nulos,
      pct_validos: percentual(votos?.pvvc),
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
    totalizacao_finalizada: String(d.and ?? "") === "f",
  };
}

async function fetchJson(
  uf: string,
  eleicao: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(urlDeUF(uf, eleicao), { headers: HEADERS });
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`TSE respondeu HTTP ${res.status} (${uf})`);
  return (await res.json()) as Record<string, unknown>;
}

export async function carregarEleicoes(): Promise<{
  resultado: ResumoEleicoes | null;
  estados: EstadoEleicao[];
}> {
  const eleicao = await obterCdTurnoAtivo();
  const turno = eleicao === CD_ELEICAO_T2 ? 2 : 1;

  const br = await fetchJson("br", eleicao);
  const resultado: ResumoEleicoes | null = br
    ? { uf: "br", uf_nome: "Brasil", turno, ...parseFromJson(br) }
    : null;

  const estados: EstadoEleicao[] = [];
  const registros = await Promise.all(
    UFS.map((u) =>
      fetchJson(u.uf, eleicao).then((json) => ({ ...u, json }))
    )
  );
  for (const { uf, nome, json } of registros) {
    if (!json) continue;
    const resumo: ResumoEleicoes = { uf, uf_nome: nome, turno, ...parseFromJson(json) };
    const valem = resumo.cargos[0]?.candidatos.filter((c) => !c.anulado) ?? [];
    estados.push({
      uf,
      uf_nome: nome,
      votante_maioria: valem[0] ?? null,
      segundo: valem[1] ?? null,
      resumo,
      totalizacao_finalizada: resumo.totalizacao_finalizada,
    });
  }

  return { resultado, estados };
}

export function formatarNumero(n: number | null | undefined): string {
  if (n == null || n === 0) return "0";
  return n.toLocaleString("pt-BR");
}