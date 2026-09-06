import { useColorScheme, type ColorSchemeName } from "react-native";

export type Paleta = {
  primaria: string;
  primariaEscura: string;
  primariaClara: string;
  primariaTexto: string;
  acento: string;
  acentoClara: string;
  fundo: string;
  superficie: string;
  borda: string;
  texto: string;
  textoSecundario: string;
  textoSuave: string;
  sobreposta: string;
  sucesso: string;
  aviso: string;
  erro: string;
};

export const CoresClaras: Paleta = {
  primaria: "#0F4C81",
  primariaEscura: "#0A3A63",
  primariaClara: "#EDF2F7",
  primariaTexto: "#0F4C81",
  acento: "#C8102E",
  acentoClara: "#FDF0F2",
  fundo: "#F7F7F5",
  superficie: "#FFFFFF",
  borda: "#E2E2DE",
  texto: "#1A1A1A",
  textoSecundario: "#5A5A56",
  textoSuave: "#A0A09C",
  sobreposta: "#FFFFFF",
  sucesso: "#1A7F4C",
  aviso: "#B7791F",
  erro: "#C62828",
} as const;

export const CoresEscuras: Paleta = {
  primaria: "#1E6FB8",
  primariaEscura: "#0B3A63",
  primariaClara: "#16283F",
  primariaTexto: "#9CC4E8",
  acento: "#E53935",
  acentoClara: "#3A1E22",
  fundo: "#0B0E14",
  superficie: "#141821",
  borda: "rgba(255,255,255,0.10)",
  texto: "#F7F7F5",
  textoSecundario: "#9CA3B0",
  textoSuave: "#5B6572",
  sobreposta: "#0B0E14",
  sucesso: "#34D399",
  aviso: "#FBBF24",
  erro: "#F87171",
} as const;

export type ModoAparencia = "claro" | "escuro" | "auto";

export function corDoModo(modo: ModoAparencia, esquema: ColorSchemeName): Paleta {
  if (modo === "escuro") return CoresEscuras;
  if (modo === "claro") return CoresClaras;
  return esquema === "dark" ? CoresEscuras : CoresClaras;
}

export function useCores(modo: ModoAparencia = "auto") {
  const esquema = useColorScheme();
  return corDoModo(modo, esquema);
}

export const Espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Bordas = {
  card: 16,
  chip: 999,
  botao: 12,
} as const;

export const Sombras = {
  card: {
    shadowColor: "#0F4C81",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const Tipografia = {
  titulo: 24,
  subtitulo: 18,
  corpo: 15,
  detalhe: 13,
  pequena: 11,
} as const;