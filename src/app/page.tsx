import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-dark/10 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Brasil<span className="text-accent"> Transparente</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#sobre" className="text-neutral-dark/70 hover:text-primary">
              Sobre
            </a>
            <a href="#metodologia" className="text-neutral-dark/70 hover:text-primary">
              Metodologia
            </a>
            <Link
              href="/noticias"
              className="rounded-full bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary-dark"
            >
              Ver notícias
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container-page py-20 text-center">
          <p className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Projeto autônomo, neutro e independente
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            O histórico político do Brasil, reunido e verificado.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-dark/70">
            O Brasil Transparente monitora, contextualiza e preserva o histórico de
            políticos brasileiros — incluindo casos antigos e contradições passadas —
            comparando fontes oficiais e canais de oposição, sem ligação com qualquer
            partido ou mandato.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/noticias"
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Acompanhar cobertura
            </Link>
            <Link
              href="/politicos"
              className="rounded-lg border border-primary px-6 py-3 font-medium text-primary transition hover:bg-primary/5"
            >
              Ver políticos monitorados
            </Link>
          </div>
        </section>

        <section id="sobre" className="border-t border-neutral-dark/10 bg-white">
          <div className="container-page grid gap-10 py-16 md:grid-cols-3">
            {[
              {
                titulo: "Neutralidade",
                descricao:
                  "Sem alinhamento partidário. Cada fato é apresentado com fontes oficiais e de oposição lado a lado.",
              },
              {
                titulo: "Memória",
                descricao:
                  "Casos e contradições não somem após o ciclo eleitoral. O histórico fica acessível e pesquisável.",
              },
              {
                titulo: "Verificação",
                descricao:
                  "Toda matéria aponta para fontes primárias. O conteúdo é coletado de forma automatizada e auditável.",
              },
            ].map((item) => (
              <div key={item.titulo} className="rounded-xl border border-neutral-dark/10 p-6">
                <h2 className="text-lg font-semibold text-primary">{item.titulo}</h2>
                <p className="mt-3 text-neutral-dark/70">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="metodologia" className="container-page py-16">
          <h2 className="text-2xl font-bold text-primary">Como funciona</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { etapa: "01", texto: "Coleta diária de fontes oficiais e de oposição via RSS." },
              { etapa: "02", texto: "Síntese e categorização automática por IA." },
              { etapa: "03", texto: "Cruzamento com o histórico anterior dos políticos." },
              { etapa: "04", texto: "Publicação com links para todas as fontes primárias." },
            ].map((item) => (
              <div key={item.etapa} className="rounded-lg bg-white p-6 shadow-sm">
                <span className="text-3xl font-bold text-accent/40">{item.etapa}</span>
                <p className="mt-3 text-sm text-neutral-dark/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-dark/10 bg-neutral.dark">
        <div className="container-page flex flex-col items-center gap-2 py-8 text-sm text-neutral.DEFAULT">
          <p>
            Brasil Transparente — um projeto autônomo, neutro e independente.
          </p>
          <p className="opacity-60">Dados coletados de fontes públicas. Verifique sempre as referências.</p>
        </div>
      </footer>
    </div>
  );
}