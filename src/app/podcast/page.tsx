"use client";

import { useEffect, useState } from "react";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

type Episodio = {
  id: number;
  titulo: string;
  descricao: string | null;
  audio_url: string;
  duracao_seg: number | null;
  publicado_em: string;
};

function formatarDuracao(seg: number | null): string {
  if (!seg || seg <= 0) return "Sem duração";
  const min = Math.floor(seg / 60);
  const s = seg % 60;
  return `${min}min ${s.toString().padStart(2, "0")}s`;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PodcastPage() {
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/podcast/episodios")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar os episódios do podcast.");
        return r.json();
      })
      .then(setEpisodios)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-primary dark:bg-neutral-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(circle at 20% 0%, transparent 0, transparent 30%, #fff 45%, transparent 46%), radial-gradient(circle at 80% 100%, transparent 0, transparent 30%, #fff 50%, transparent 51%)",
          }}
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-soft backdrop-blur-sm sm:h-24 sm:w-24">
              <HeadphonesIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="max-w-2xl">
              <span className="chip bg-white/15 text-white">
                <GraphicEqIcon className="h-3.5 w-3.5" />
                Síntese semanal em áudio
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                A verdade da política, em podcast
              </h1>
              <p className="mt-3 text-base text-white/75 sm:text-lg">
                Episódios semanais com os destaques monitorados pelo Brasil Transparente,
                narrados de forma neutra e com referência às fontes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container-page py-12">
        {erro && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && (
          <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">
            Carregando episódios…
          </p>
        )}

        {!carregando && !erro && episodios.length > 0 && (
          <div className="space-y-5">
            {episodios.map((ep, index) => (
              <article
                key={ep.id}
                className="card overflow-hidden transition hover:shadow-glow"
              >
                <div className="flex flex-col gap-4 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-semibold text-primary dark:bg-primary/20 dark:text-primary-light sm:flex">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-primary dark:text-primary-light sm:text-xl">
                          {ep.titulo}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-dark/70 dark:text-neutral-300">
                          <span className="inline-flex items-center gap-1">
                            <CalendarTodayIcon className="h-3.5 w-3.5" />
                            {formatarData(ep.publicado_em)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <GraphicEqIcon className="h-3.5 w-3.5" />
                            {formatarDuracao(ep.duracao_seg)}
                          </span>
                        </p>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="chip bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
                        Mais recente
                      </span>
                    )}
                  </div>

                  {ep.descricao && (
                    <p className="text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                      {ep.descricao}
                    </p>
                  )}

                  <audio
                    controls
                    preload="none"
                    src={ep.audio_url}
                    className="mt-1 w-full dark:[color-scheme:dark]"
                  >
                    Seu navegador não suporta o player de áudio.
                  </audio>
                </div>
              </article>
            ))}
          </div>
        )}

        {!erro && !carregando && episodios.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-20 text-center dark:border-white/15 dark:bg-neutral-panel">
            <HeadphonesIcon className="h-12 w-12 text-neutral-dark/30 dark:text-neutral-500" />
            <p className="mt-4 text-neutral-dark/60 dark:text-neutral-400">
              Nenhum episódio publicado ainda. Volte na próxima semana.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}