"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Politico = {
  id: number;
  nome: string;
  partido: string | null;
  cargo: string | null;
  biografia: string | null;
  foto_url: string | null;
  termos_busca: string[] | null;
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default function PoliticosPage() {
  const [politicos, setPoliticos] = useState<Politico[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/politicos")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar políticos.");
        return r.json();
      })
      .then(setPoliticos)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="min-h-screen">
      <main className="container-page py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary">
          Políticos monitorados
        </h1>
        <p className="mt-2 text-neutral-dark/70">
          Histórico contextualizado com casos, contradições e posições documentados ao
          longo do tempo.
        </p>

        {erro && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {politicos.map((p) => (
            <article
              key={p.id}
              className="card p-6 transition-shadow hover:shadow-glow"
            >
              <Link href={`/politicos/${p.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_url}
                        alt={`Foto de ${p.nome}`}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {iniciais(p.nome)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-primary">{p.nome}</h2>
                      <p className="mt-1 text-sm text-neutral-dark/70">
                        {p.partido}
                        {p.cargo ? ` · ${p.cargo}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="chip bg-primary/10 text-primary">
                    {p.partido ?? "Sem partido"}
                  </span>
                </div>

                {p.biografia && (
                  <p className="mt-3 text-sm text-neutral-dark/70">{p.biografia}</p>
                )}

                {p.termos_busca && p.termos_busca.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.termos_busca.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-neutral-dark/5 px-2.5 py-0.5 text-xs text-neutral-dark/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>

              <div className="mt-4 flex items-center gap-4 text-sm font-medium">
                <span className="text-accent hover:underline">Ver perfil →</span>
                <Link
                  href={`/noticias?q=${encodeURIComponent(p.nome)}`}
                  className="text-neutral-dark/60 hover:text-primary hover:underline"
                >
                  Ver notícias →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!erro && politicos.length === 0 && (
          <div className="mt-8 flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16">
            <p className="text-neutral-dark/60">
              Nenhum político ativo no momento.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}