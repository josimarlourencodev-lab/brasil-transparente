import type { Metadata } from "next";
import Link from "next/link";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionIcon from "@mui/icons-material/Description";
import GitHubIcon from "@mui/icons-material/GitHub";
import HistoryIcon from "@mui/icons-material/History";
import PolicyIcon from "@mui/icons-material/Policy";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export const metadata: Metadata = {
  title: "Documentação — Brasil Transparente",
  description:
    "Como funciona o Brasil Transparente: monitoramento autônomo de políticos, metodologia, princípios, código de conduta e acesso ao repositório.",
};

const PRINCIPIOS = [
  {
    icone: PolicyIcon,
    titulo: "Neutralidade",
    texto:
      "Sem vínculo partidário. Fontes oficiais e de oposição são apresentadas lado a lado, com pesos equilibrados e sem adjetivos valorativos.",
  },
  {
    icone: HistoryIcon,
    titulo: "Memória",
    texto:
      "Casos e contradições não somem após o ciclo eleitoral. O histórico fica acessível, pesquisável e referenciado.",
  },
  {
    icone: VerifiedIcon,
    titulo: "Verificação",
    texto:
      "Toda matéria aponta para fontes primárias. Código aberto, dados auditáveis e revisão humana opcional no painel interno.",
  },
  {
    icone: ShieldIcon,
    titulo: "Segurança",
    texto:
      "Zero vazamento de chaves, controle de acesso por função (RLS) no banco e dependências autenticadas por hash no CI.",
  },
];

const ETAPAS = [
  {
    etapa: "01",
    titulo: "Coleta",
    texto:
      "Um robô coleta notícias 4 vezes ao dia (cron no GitHub Actions) a partir de feeds RSS/Atom de fontes oficiais, imprensa e independentes, além de busca dirigida por candidato (Google News por termo).",
  },
  {
    etapa: "02",
    titulo: "Síntese por IA",
    texto:
      "Cada matéria é sintetizada por uma inteligência artificial (Groq, gpt-oss-20b) com regra absoluta: sintetizar, nunca opinar. Extrai resumo neutro, categoria, envolvidos e possíveis contradições.",
  },
  {
    etapa: "03",
    titulo: "Restrição de tema",
    texto:
      "Conteúdo fora do escopo — celebridades, esportes, novelas e entretenimento — é descartado automaticamente (status fora do tema) e não entra no acervo.",
  },
  {
    etapa: "04",
    titulo: "Cruzamento com histórico",
    texto:
      "O texto é cruzado com o histórico prévio do político para contextualizar posições e apontar contradições factuais, com referência a quando e onde foram ditas.",
  },
  {
    etapa: "05",
    titulo: "Publicação",
    texto:
      "O conteúdo é publicado no portal com links para todas as fontes primárias. O acesso público é somente leitura; a revisão humana é opcional e feita no painel administrativo.",
  },
];

export default function DocumentacaoPage() {
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
              <DescriptionIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="max-w-2xl">
              <span className="chip bg-white/15 text-white">
                <AutoAwesomeIcon className="h-3.5 w-3.5" />
                Documentação do projeto
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Como o Brasil Transparente funciona
              </h1>
              <p className="mt-3 text-base text-white/75 sm:text-lg">
                Um portal autônomo, neutro e independente de monitoramento político:
                coleta automatizada, síntese imparcial por IA e histórico com
                referências — tudo aberto e auditável.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container-page py-12">
        <section>
          <h2 className="font-display text-2xl font-semibold text-primary dark:text-primary-light sm:text-3xl">
            Sobre o projeto
          </h2>
          <div className="card mt-4 space-y-4 p-6 leading-relaxed text-neutral-dark/75 dark:text-neutral-300 sm:p-8">
            <p>
              O Brasil Transparente monitora, organiza e preserva o histórico de políticos
              brasileiros. Reúne o que cada político disse e fez — e as contradições da
              trajetória — sempre com referência às fontes primárias.
            </p>
            <p>
              Cada notícia é apresentada com fontes oficiais e de oposição lado a lado,
              sem viés partidário. O objetivo é dar ao cidadão uma ferramenta para separar
              fato de versão e acompanhar posições ao longo do tempo, mesmo fora dos
              períodos eleitorais.
            </p>
            <p>
              Tudo funciona de forma autônoma: o pipeline de coleta, síntese e publicação
              roda sozinho, com auditoria humana opcional. O código é aberto e disponível
              no GitHub.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-primary dark:text-primary-light sm:text-3xl">
            Funcionamento autônomo
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ETAPAS.map((e) => (
              <div key={e.etapa} className="card flex gap-4 p-6">
                <span className="font-display text-2xl font-semibold text-accent">
                  {e.etapa}
                </span>
                <div>
                  <h3 className="font-semibold text-primary dark:text-primary-light">
                    {e.titulo}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                    {e.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-primary dark:text-primary-light sm:text-3xl">
            Princípios e código de conduta
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {PRINCIPIOS.map((p) => (
              <div key={p.titulo} className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  <p.icone className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary dark:text-primary-light">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>
          <div className="card mt-4 p-6">
            <p className="text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
              Conteúdo fora do escopo do monitoramento — como celebridades, esportes,
              novelas e entretenimento — é descartado automaticamente pelo pipeline e não
              integra o acervo do portal.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-primary dark:text-primary-light sm:text-3xl">
            Acesso
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link
              href="https://github.com/josimarlourencodev-lab/brasil-transparente"
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex flex-col justify-between p-6 transition hover:shadow-glow"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-dark/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-300">
                  <GitHubIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary dark:text-primary-light">
                  Repositório GitHub
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                  O código-fonte do portal, da ingestão e do app mobile — aberto para
                  contribuição.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:underline">
                Abrir repositório <ArrowForwardIcon className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="https://josimarlourencodev-lab.github.io/brasil-transparente"
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex flex-col justify-between p-6 transition hover:shadow-glow"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  <DescriptionIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary dark:text-primary-light">
                  Documentação completa
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                  Guia rápido, arquitetura, banco de dados, ingestão, podcast, mobile e
                  deploy em um só lugar.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:underline">
                Abrir documentação <ArrowForwardIcon className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/noticias"
              className="card group flex flex-col justify-between p-6 transition hover:shadow-glow"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
                  <VerifiedIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary dark:text-primary-light">
                  Notícias monitoradas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                  Acompanhe a cobertura em andamento, com busca por político ou assunto.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:underline">
                Ir para notícias <ArrowForwardIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}