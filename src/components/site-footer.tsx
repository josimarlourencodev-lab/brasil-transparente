import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-dark/10 bg-neutral-dark">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-neutral.DEFAULT sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-accent" />
            Brasil<span className="text-accent-light"> Transparente</span>
          </Link>
          <p className="mt-3 text-white/60">
            Portal autônomo, neutro e independente de monitoramento do histórico
            político do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
          <nav aria-label="Rodapé — explorar">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Explorar
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/noticias" className="text-white/70 transition hover:text-white">
                  Notícias
                </Link>
              </li>
              <li>
                <Link href="/politicos" className="text-white/70 transition hover:text-white">
                  Políticos
                </Link>
              </li>
              <li>
                <Link href="/#sobre" className="text-white/70 transition hover:text-white">
                  Sobre o projeto
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Rodapé — institucional">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Institucional
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/#metodologia" className="text-white/70 transition hover:text-white">
                  Metodologia
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-white/70 transition hover:text-white">
                  Painel do auditor
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center gap-1 py-5 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>Dados coletados de fontes públicas. Verifique sempre as referências.</p>
          <p>© 2026 Brasil Transparente.</p>
        </div>
      </div>
    </footer>
  );
}