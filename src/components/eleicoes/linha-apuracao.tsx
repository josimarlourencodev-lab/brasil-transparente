"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTheme } from "next-themes";

type PontoHistorico = {
  h: string;
  pct: number;
};

export function LinhaApuracao({
  inicial,
}: {
  inicial: { pct: number | null; gerado_em: string | null };
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const axisColor = dark ? "#94a3b8" : "#4b5563";

  const [historico, setHistorico] = useState<PontoHistorico[]>([]);
  const primeiroPct = inicial.pct;
  const registrouInicial = useRef(false);

  useEffect(() => {
    if (!registrouInicial.current && primeiroPct !== null) {
      registrouInicial.current = true;
      const h = inicial.gerado_em?.split(" ")[1]?.slice(0, 5) ?? "00:00";
      setHistorico((prev) => [
        ...prev,
        { h, pct: primeiroPct },
      ]);
    }

    async function poll() {
      try {
        const res = await fetch("/api/eleicoes", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const pct = data?.resultado?.secao?.pct;
        if (typeof pct === "number") {
          const h =
            data?.resultado?.gerado_em?.split(" ")[1]?.slice(0, 5) ?? "00:00";
          setHistorico((prev) => {
            const ultimo = prev[prev.length - 1];
            if (ultimo && ultimo.pct === pct && ultimo.h === h) return prev;
            return [...prev, { h, pct }];
          });
        }
      } catch {
        // mantém o histórico até agora
      }
    }

    const id = setInterval(poll, 30_000);
    return () => {
      clearInterval(id);
    };
  }, [primeiroPct, inicial.gerado_em]);

  if (historico.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-dark/60 dark:text-neutral-400">
        A evolução da apuração será exibida conforme o TSE publica atualizações.
      </p>
    );
  }

  return (
    <LineChart
      series={[
        {
          data: historico.map((p) => p.pct),
          label: "% seções totalizadas",
          color: "#0e7490",
          showMark: true,
          valueFormatter: (v) => `${v}%`,
        },
      ]}
      xAxis={[
        {
          scaleType: "point",
          data: historico.map((p) => p.h),
          tickLabelStyle: { fill: axisColor, fontSize: 12 },
          label: "Horário (Brasília)",
          labelStyle: { fill: axisColor },
        },
      ]}
      yAxis={[
        {
          min: 0,
          max: 100,
          tickLabelStyle: { fill: axisColor, fontSize: 12 },
        },
      ]}
      height={300}
      margin={{ top: 24, right: 24, bottom: 48, left: 48 }}
      hideLegend
      grid={{ vertical: false, horizontal: true }}
      sx={{
        "& .MuiLineElement-root": { strokeWidth: 3 },
        "& .MuiMarkElement-root": { fill: "#0e7490" },
      }}
    />
  );
}