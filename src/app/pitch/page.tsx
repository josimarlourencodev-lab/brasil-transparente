"use client";

import { useState } from "react";
import Image from "next/image";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

const SLIDES = Array.from({ length: 10 }, (_, i) => `/pitch/slides/slide-${String(i + 1).padStart(2, "0")}.png`);

const CAPTIONS = [
  "Abertura",
  "O problema",
  "A proposta",
  "Autonomia e IA",
  "Transparência e verificação",
  "Um projeto multiplataforma",
  "Princípios do projeto",
  "Visão de futuro",
  "Participe",
  "Encerramento",
];

const FALAS = [
  "O Brasil Transparente é um portal autônomo, neutro e independente de monitoramento político. Ele reúne o que cada político disse e fez — e as contradições da trajetória — sempre com referência às fontes. A verdade da política, com transparência.",
  "A informação política no Brasil é fragmentada, reativa e sem memória. Milhões de declarações em entrevistas, redes sociais e discursos. Sem uma linha do tempo consolidada, as contradições passam despercebidas fora dos períodos eleitorais. E o cidadão fica sem ferramenta para separar fato de versão.",
  "Nossa proposta é um portal que monitora, organiza e conecta. Criamos um histórico contextualizado dos políticos do Brasil, apresentando fontes oficiais e de oposição lado a lado, e apontando contradições de forma factual e referenciada — sempre com postura neutra e sem viés partidário.",
  "Tudo é automatizado. Um robô coleta notícias quatro vezes ao dia, todos os dias. Uma inteligência artificial sintetiza o conteúdo em resumo, categorias, envolvidos e contradições. E o motor da IA tem uma regra absoluta: sintetizar, nunca opinar. Nada de adjetivos valorativos; apenas o que as fontes dizem.",
  "Cada fato aponta para a sua fonte. Toda matéria leva às referências primárias. Quando há contradição, mostramos o que foi dito, quando, e a nova posição. O código é aberto e os dados são auditáveis, com revisão humana opcional no painel interno.",
  "O Brasil Transparente está em todas as telas. Um site responsivo e leve, com suporte a instalação como aplicativo. Um app mobile para Android. E um podcast semanal narrado por inteligência artificial. Todos consumindo a mesma base unificada.",
  "Quatro princípios guiam cada decisão. Neutralidade: fontes de origem e oposição equilibradas. Autonomia: o pipeline roda sozinho, com auditoria opcional. Acessibilidade: gratuito e aberto. Verificabilidade: transparência total nas referências.",
  "A jornada continua. Queremos busca histórica profunda de posições antigas, sugestões automáticas de contradições e um verdadeiro banco de memória política de longo prazo — tudo em colaboração aberta com a comunidade.",
  "Acompanhe o portal e conheça o histórico dos políticos. Ouça o podcast semanal. E, se quiser, contribua no GitHub — o projeto é aberto. Juntos, construímos a memória política do Brasil.",
  "Brasil Transparente — a verdade da política, com referência às fontes. Acesse brasiltransparente.com.br e veja como a transparência pode ser automatizada, neutra e acessível a todos.",
];

export default function PitchPage() {
  const [atual, setAtual] = useState(0);

  const anterior = () => setAtual((a) => (a - 1 + SLIDES.length) % SLIDES.length);
  const proximo = () => setAtual((a) => (a + 1) % SLIDES.length);

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
              <SlideshowIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="max-w-2xl">
              <span className="chip bg-white/15 text-white">
                <SlideshowIcon className="h-3.5 w-3.5" />
                Apresentação do projeto
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                O pitch do Brasil Transparente
              </h1>
              <p className="mt-3 text-base text-white/75 sm:text-lg">
                Dez slides e um roteiro de pouco mais de dois minutos — a proposta, o
                problema e a visão de um monitoramento político neutro, autônomo e verificável.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container-page py-12">
        {/* Vídeo do pitch */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-primary dark:text-primary-light">
              Vídeo do pitch
            </h2>
            <a
              href="/pitch/brasil-transparente-pitch.mp4"
              download
              className="chip bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Baixar vídeo (.mp4)
            </a>
          </div>
          <div className="card mt-4 overflow-hidden">
            <video
              controls
              preload="metadata"
              poster={SLIDES[0]}
              className="aspect-video w-full bg-black"
            >
              <source src="/pitch/brasil-transparente-pitch.mp4" type="video/mp4" />
              Seu navegador não suporta a reprodução de vídeo.
            </video>
            <p className="border-t border-neutral-dark/10 p-4 text-sm text-neutral-dark/70 dark:border-white/10 dark:text-neutral-300">
              Pitch de ~3 minutos: 10 slides com narração em voz IA (PT-BR). Abaixo, os
              slides individuais, cada narração e o roteiro completo.
            </p>
          </div>
        </section>

        {/* Galeria de slides */}
        <div className="card overflow-hidden">
          <div className="relative aspect-video w-full bg-neutral-900">
            <Image
              src={SLIDES[atual]}
              alt={`Slide ${atual + 1} — ${CAPTIONS[atual]}`}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <button
              onClick={anterior}
              aria-label="Slide anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={proximo}
              aria-label="Próximo slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <div className="flex flex-col gap-3 border-t border-neutral-dark/10 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-dark/70 dark:text-neutral-300">
              <span className="font-semibold text-primary dark:text-primary-light">
                {CAPTIONS[atual]}
              </span>{" "}
              <span className="text-neutral-dark/50 dark:text-neutral-500">
                · {atual + 1} / {SLIDES.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={proximo}
                className="chip bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
                Próximo slide
              </button>
              <a
                href={SLIDES[atual]}
                target="_blank"
                rel="noopener noreferrer"
                className="chip bg-neutral-dark/10 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-300"
              >
                <FullscreenIcon className="h-3.5 w-3.5" />
                Abrir slide
              </a>
            </div>
          </div>
        </div>

        {/* Miniatura da barra de navegação */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {CAPTIONS.map((cap, i) => (
            <button
              key={cap}
              onClick={() => setAtual(i)}
              className={`chip transition ${
                i === atual
                  ? "bg-primary text-white"
                  : "bg-neutral-dark/5 text-neutral-dark/60 hover:bg-neutral-dark/10 dark:bg-white/5 dark:text-neutral-400"
              }`}
            >
              {i + 1}. {cap}
            </button>
          ))}
        </div>

        {/* Roteiro */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-primary dark:text-primary-light">
              <DescriptionIcon className="h-6 w-6" />
              Roteiro da narração
            </h2>
            <a
              href="/pitch/roteiro.md"
              download
              className="chip bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Baixar roteiro (.md)
            </a>
          </div>
          <div className="card mt-4 space-y-5 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
              Narração de ~2 minutos e meio (≈380 palavras, 10 slides). Voz IA PT-BR
              sugerida: concisa e neutra, com pausa entre slides.
            </p>
            {FALAS.map((fala, i) => (
              <details key={CAPTIONS[i]} open={i === 0} className="group">
                <summary className="cursor-pointer select-none font-semibold text-primary dark:text-primary-light">
                  <span className="mr-2 text-neutral-dark/40 dark:text-neutral-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {CAPTIONS[i]}
                </summary>
                <div className="mt-2 pl-8">
                  <audio
                    controls
                    preload="none"
                    src={`/pitch/audio/fala-${String(i + 1).padStart(2, "0")}.mp3`}
                    className="w-full max-w-md dark:[color-scheme:dark]"
                  >
                    Seu navegador não suporta o player de áudio.
                  </audio>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                    {fala}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
