export function formatDatePtBr(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function relativo(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 60) return min <= 1 ? "agora" : `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  return dias <= 1 ? "ontem" : `há ${dias} dias`;
}

export function ucFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const CATEGORIAS = [
  "Corrupção",
  "Economia",
  "Saúde",
  "Segurança",
  "Meio Ambiente",
  "Educação",
  "Eleições",
  "Direitos Humanos",
  "Legislação",
  "Outros",
] as const;

export function categoriaPertence(cat: unknown): cat is string {
  return typeof cat === "string" && (CATEGORIAS as readonly string[]).includes(cat);
}

export function badgeTipoFonte(tipo?: string | null): string {
  switch (tipo) {
    case "oficial":
      return "oficial";
    case "oposicao":
      return "oposição";
    case "imprensa":
      return "imprensa";
    default:
      return "fonte desconhecida";
  }
}