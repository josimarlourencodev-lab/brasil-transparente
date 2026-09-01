import { describe, expect, it } from "vitest";
import {
  badgeTipoFonte,
  categoriaPertence,
  formatDatePtBr,
  relativo,
  ucFirst,
} from "./format";

describe("formatDatePtBr", () => {
  it("formata data ISO para pt-BR", () => {
    expect(formatDatePtBr("2026-08-28T16:48:10+00:00")).toMatch(/ago\.?|\bou\./i);
  });

  it("retorna — para entradas ausentes ou inválidas", () => {
    expect(formatDatePtBr()).toBe("—");
    expect(formatDatePtBr(null)).toBe("—");
    expect(formatDatePtBr("não é data")).toBe("—");
  });
});

describe("relativo", () => {
  it("retorna agora para timestamps recentes", () => {
    expect(relativo(new Date().toISOString())).toBe("agora");
  });

  it("retorna minutos/horas", () => {
    expect(relativo(new Date(Date.now() - 5 * 60000).toISOString())).toBe("há 5 min");
    expect(relativo(new Date(Date.now() - 3 * 3600000).toISOString())).toBe("há 3h");
  });
});

describe("ucFirst", () => {
  it("capitaliza a primeira letra", () => {
    expect(ucFirst("política")).toBe("Política");
    expect(ucFirst("")).toBe("");
  });
});

describe("categoriaPertence", () => {
  it("aceita categorias do vocabulário e rejeita outras", () => {
    expect(categoriaPertence("Legislação")).toBe(true);
    expect(categoriaPertence("Gossip")).toBe(false);
    expect(categoriaPertence(42)).toBe(false);
  });
});

describe("badgeTipoFonte", () => {
  it("mapeia tipos para rótulos neutros", () => {
    expect(badgeTipoFonte("oficial")).toBe("oficial");
    expect(badgeTipoFonte("oposicao")).toBe("oposição");
    expect(badgeTipoFonte("imprensa")).toBe("imprensa");
    expect(badgeTipoFonte()).toBe("fonte desconhecida");
  });
});