"use client";

import Link from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PolicyIcon from "@mui/icons-material/Policy";
import HistoryIcon from "@mui/icons-material/History";
import VerifiedIcon from "@mui/icons-material/Verified";
import BlurText from "@/components/react-bits/BlurText";
import FadeContent from "@/components/react-bits/FadeContent";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import CountUp from "@/components/react-bits/CountUp";

const PILARES = [
  {
    icone: PolicyIcon,
    titulo: "Neutralidade",
    descricao:
      "Sem alinhamento partidário. Cada fato é apresentado com fontes oficiais e de oposição lado a lado.",
  },
  {
    icone: HistoryIcon,
    titulo: "Memória",
    descricao:
      "Casos e contradições não somem após o ciclo eleitoral. O histórico fica acessível e pesquisável.",
  },
  {
    icone: VerifiedIcon,
    titulo: "Verificação",
    descricao:
      "Toda matéria aponta para fontes primárias. O conteúdo é coletado de forma automatizada e auditável.",
  },
];

const ETAPAS = [
  { etapa: "01", texto: "Coleta diária de fontes oficiais e de oposição via RSS." },
  { etapa: "02", texto: "Síntese e categorização automática por IA." },
  { etapa: "03", texto: "Cruzamento com o histórico anterior dos políticos." },
  { etapa: "04", texto: "Publicação com links para todas as fontes primárias." },
];

export function HomeContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.04]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,transparent_0,transparent_40%,#0F4C81_40%,#0F4C81_100%)]" />
        </div>

        <div className="container-page relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <FadeContent delay={0.1}>
              <span className="chip bg-primary/10 text-primary">
                Projeto autônomo, neutro e independente
              </span>
            </FadeContent>

            <BlurText
              text="O histórico político do Brasil, reunido e verificado."
              animateBy="words"
              direction="top"
              delay={60}
              stepDuration={0.25}
              className="mt-6 font-display text-4xl leading-tight font-semibold tracking-tight text-primary sm:text-6xl"
            />

            <FadeContent delay={0.4}>
              <p className="mx-auto mt-8 max-w-2xl text-lg text-neutral-dark/70">
                O Brasil Transparente monitora, contextualiza e preserva o histórico de
                políticos brasileiros — incluindo casos antigos e contradições passadas —
                comparando fontes oficiais e canais de oposição, sem ligação com qualquer
                partido ou mandato.
              </p>
            </FadeContent>

            <FadeContent delay={0.55}>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/noticias" className="btn-accent">
                  Acompanhar cobertura
                  <ArrowForwardIcon className="h-4 w-4" />
                </Link>
                <Link href="/politicos" className="btn-ghost">
                  Ver políticos monitorados
                </Link>
              </div>
            </FadeContent>
          </div>

          <FadeContent delay={0.7}>
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 border-t border-neutral-dark/10 pt-8">
              {[
                { valor: 13, rotulo: "Políticos monitorados" },
                { valor: 600, rotulo: "Notícias em arquivo" },
                { valor: 4, rotulo: "Coletas por dia" },
              ].map((item) => (
                <div key={item.rotulo} className="text-center">
                  <CountUp
                    to={item.valor}
                    separator="."
                    duration={1.8}
                    className="font-display text-3xl font-semibold text-primary sm:text-4xl"
                  />
                  <p className="mt-1 text-xs text-neutral-dark/60 sm:text-sm">{item.rotulo}</p>
                </div>
              ))}
            </div>
          </FadeContent>
        </div>
      </section>

      <section id="sobre" className="border-t border-neutral-dark/10 bg-white">
        <div className="container-page py-16 sm:py-20">
          <FadeContent>
            <h2 className="sr-only">Pilares do projeto</h2>
          </FadeContent>
          <div className="grid gap-5 md:grid-cols-3">
            {PILARES.map((p, index) => (
              <FadeContent key={p.titulo} delay={0.1 * index}>
                <SpotlightCard className="h-full shadow-soft" spotlightColor="rgba(15, 76, 129, 0.08)">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icone className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold text-primary">
                    {p.titulo}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70">
                    {p.descricao}
                  </p>
                </SpotlightCard>
              </FadeContent>
            ))}
          </div>
        </div>
      </section>

      <section id="metodologia" className="container-page py-16 sm:py-20">
        <FadeContent>
          <h2 className="prose-title">Como funciona</h2>
          <p className="mt-2 max-w-readable text-neutral-dark/60">
            Um ciclo contínuo e auditável, do monitoramento à publicação.
          </p>
        </FadeContent>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {ETAPAS.map((item, index) => (
            <FadeContent key={item.etapa} delay={0.08 * index}>
              <div className="card h-full p-6">
                <span className="font-display text-3xl font-semibold text-accent/40">
                  {item.etapa}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-neutral-dark/70">
                  {item.texto}
                </p>
              </div>
            </FadeContent>
          ))}
        </div>
      </section>
    </>
  );
}