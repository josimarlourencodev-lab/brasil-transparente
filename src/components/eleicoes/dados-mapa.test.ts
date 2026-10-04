import { describe, expect, it } from "vitest";
import { DIMENSOES_MAPA, PATHS_ESTADOS } from "./dados-mapa";
import { UFS } from "@/lib/tse";

describe("MapaBrasil (dados-mapa)", () => {
  it("tem paths para as 27 UFs e dimensões válidas", () => {
    expect(PATHS_ESTADOS.length).toBe(27);
    expect(new Set(PATHS_ESTADOS.map((p) => p.uf)).size).toBe(27);
    expect(DIMENSOES_MAPA.largura).toBeGreaterThan(0);
    expect(DIMENSOES_MAPA.altura).toBeGreaterThan(0);
  });

  it("cobre exatamente as mesmas UFs do TSE", () => {
    const noMapa = new Set(PATHS_ESTADOS.map((p) => p.uf));
    const noTse = new Set(UFS.map((u) => u.uf));
    expect(noMapa).toEqual(noTse);
  });

  it("nenhum path está vazio (todas as geometrias renderizam)", () => {
    for (const p of PATHS_ESTADOS) {
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.nome.length).toBeGreaterThan(0);
    }
  });
});