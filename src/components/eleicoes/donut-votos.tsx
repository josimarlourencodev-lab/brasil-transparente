"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { useTheme } from "next-themes";
import type { ResumoTotalizacao } from "@/lib/tse";

export function DonutVotos({ votos }: { votos: ResumoTotalizacao["votos"] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const label = dark ? "#f8fafc" : "#1f2937";

  const data = [
    { id: "validos", label: "Válidos", value: votos.validos, color: "#007b5d" },
    { id: "brancos", label: "Brancos", value: votos.brancos, color: "#f59e0b" },
    { id: "nulos", label: "Nulos", value: votos.nulos, color: "#dc2626" },
  ];

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
      <PieChart
        series={[
          {
            data,
            innerRadius: 60,
            outerRadius: 90,
            paddingAngle: 2,
            cornerRadius: 4,
            highlightScope: { fade: "global", highlight: "item" },
          },
        ]}
        height={220}
        width={260}
        hideLegend
        sx={{
          ".MuiPieArc-root": { stroke: dark ? "#0f172a" : "#ffffff", strokeWidth: 2 },
        }}
      />
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.id} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="w-24 text-neutral-dark/70 dark:text-neutral-300">
              {d.label}
            </span>
            <strong className="font-display font-semibold" style={{ color: label }}>
              {d.value.toLocaleString("pt-BR")}
            </strong>
            <span className="text-neutral-dark/50 dark:text-neutral-400">
              {votos.total > 0
                ? `${((d.value / votos.total) * 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}%`
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}