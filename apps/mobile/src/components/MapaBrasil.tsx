import { Path, Svg, Text as SvgText } from "react-native-svg";
import { DIMENSOES_MAPA, PATHS_ESTADOS } from "./dados-mapa";
import type { EstadoEleicao } from "../lib/eleicoes";
import { Tipografia } from "../theme";

const CORES = [
  "#0e7490",
  "#c2410c",
  "#a16207",
  "#7c3aed",
  "#be185d",
  "#3f6212",
  "#3730a3",
];

export function MapaBrasilMobile({
  estados,
  acessivel,
}: {
  estados: EstadoEleicao[];
  acessivel: boolean;
}) {
  if (!acessivel || estados.length === 0) {
    return null;
  }

  const porUF = new Map(estados.map((e) => [e.uf, e]));

  const vencedores = estados
    .map((e) => e.votante_maioria?.numero)
    .filter((n): n is number => n !== undefined && n !== null);
  const coresPorNumero = new Map<number, string>();
  let i = 0;
  for (const n of new Set(vencedores)) {
    coresPorNumero.set(n, CORES[i % CORES.length]);
    i += 1;
  }

  return (
    <Svg
      viewBox={`0 0 ${DIMENSOES_MAPA.largura} ${DIMENSOES_MAPA.altura}`}
      width="100%"
      height={DIMENSOES_MAPA.altura * 0.7}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="Mapa do Brasil com o candidato que lidera em cada estado"
    >
      {PATHS_ESTADOS.map(({ uf, d }) => {
        const estado = porUF.get(uf);
        const vencedor = estado?.votante_maioria;
        const cor = vencedor ? coresPorNumero.get(vencedor.numero) : "#475569";
        const pct =
          vencedor && vencedor.pct_votos_validos !== null
            ? `${vencedor.pct_votos_validos.toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}%`
            : "—";
        const tooltip = `${estado?.uf_nome ?? uf.toUpperCase()} — ${
          vencedor ? vencedor.nome_urna : "sem dados"
        } · ${pct}`;
        return <Path key={uf} d={d} fill={cor} stroke="#ffffff" strokeWidth={1} />;
      })}
    </Svg>
  );
}