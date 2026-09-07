export const SITE_NAME = "Brasil Transparente";
export const SITE_DESCRIPTION =
  "Portal autônomo, neutro e independente que monitora, contextualiza e preserva o histórico de políticos brasileiros: casos, contradições e posições documentados com fontes primárias.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://brasil-transparente-rust.vercel.app";
export const SITE_KEYWORDS = [
  "política",
  "políticos",
  "monitoramento político",
  "histórico de políticos",
  "ficha de políticos",
  "transparência",
  "notícias políticas",
  "eleições",
  "congresso",
  "Brasil",
];

export function absoluto(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}