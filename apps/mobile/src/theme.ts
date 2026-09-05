export const Cores = {
  primaria: "#0F4C81",
  primariaEscura: "#0A3A63",
  primariaClara: "#EDF2F7",
  acento: "#C8102E",
  acentoClara: "#FDF0F2",
  fundo: "#F7F7F5",
  superficie: "#FFFFFF",
  borda: "#E2E2DE",
  texto: "#1A1A1A",
  textoSecundario: "#5A5A56",
  textoSuave: "#A0A09C",
  sucesso: "#1A7F4C",
  aviso: "#B7791F",
  erro: "#C62828",
} as const;

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