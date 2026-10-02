"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { useTheme } from "next-themes";
import type { CandidatoTSE } from "@/lib/tse";

export function BarraVotos({
  candidatos,
}: {
  candidatos: CandidatoTSE[];
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const axisColor = dark ? "#94a3b8" : "#4b5563";

  const validos = candidatos.filter((c) => !c.anulado);

  return (
    <BarChart
      series={[
        {
          data: validos.map((c) => c.votos),
          label: "Votos",
          color: "#007b5d",
          valueFormatter: (v) => Number(v ?? 0).toLocaleString("pt-BR"),
        },
      ]}
      xAxis={[
        {
          scaleType: "band",
          data: validos.map((c) => c.nome_urna),
          tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 12, fill: axisColor },
        },
      ]}
      yAxis={[{ tickLabelStyle: { fill: axisColor, fontSize: 12 } }]}
      height={320}
      margin={{ top: 24, right: 16, bottom: 120, left: 64 }}
      borderRadius={6}
    />
  );
}