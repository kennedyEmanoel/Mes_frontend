import { describe, expect, it } from "vitest";
import type { PerformanceOption } from "../../../lib/performance";
import {
  availableOperators,
  dataRange,
  defaultPeriod,
  fixPeriod,
  fixSelection,
  initialSelection,
  lastDaysPeriod,
  periodCovering,
  productsOfOperator,
  stepsOfProduct,
  variationsOfStep,
} from "./cascadeOptions";

const option = (extra: Partial<PerformanceOption>): PerformanceOption => ({
  operatorId: 1,
  operator: "ANA",
  operatorActive: true,
  productId: 1,
  product: "4G SIMCOM",
  stepTemplateId: 1,
  stepTemplate: "Montagem",
  variationId: null,
  variation: null,
  firstDate: "2026-06-01",
  lastDate: "2026-10-11",
  days: 10,
  ...extra,
});

const OPTIONS: PerformanceOption[] = [
  option({ lastDate: "2026-10-11", days: 50 }),
  option({ stepTemplateId: 2, stepTemplate: "Soldagem", variationId: 1, variation: "Cabos", firstDate: "2026-07-01", lastDate: "2026-09-20" }),
  option({ stepTemplateId: 2, stepTemplate: "Soldagem", variationId: 2, variation: "Retrabalho", firstDate: "2026-08-01", lastDate: "2026-08-10" }),
  option({ stepTemplateId: 2, stepTemplate: "Soldagem", firstDate: "2026-06-02", lastDate: "2026-06-30" }),
  option({ operatorId: 2, operator: "BETO", productId: 2, product: "GPS v2", firstDate: "2026-10-01", lastDate: "2026-10-10" }),
  option({ operatorId: 3, operator: "CIDA", operatorActive: false, stepTemplateId: 3, stepTemplate: "Revisão", firstDate: "2026-03-01", lastDate: "2026-03-20" }),
];

describe("opções em cascata", () => {
  it("lista operadores em ordem alfabética, marcando os inativos", () => {
    expect(availableOperators(OPTIONS)).toEqual([
      { value: 1, label: "ANA" },
      { value: 2, label: "BETO" },
      { value: 3, label: "CIDA (inativo)" },
    ]);
  });

  it("mostra só os produtos e etapas em que o operador atuou, etapas na ordem do processo", () => {
    expect(productsOfOperator(OPTIONS, 1)).toEqual([{ value: 1, label: "4G SIMCOM" }]);
    expect(productsOfOperator(OPTIONS, 2)).toEqual([{ value: 2, label: "GPS v2" }]);
    expect(stepsOfProduct(OPTIONS, 1, 1).map((s) => s.label)).toEqual(["Montagem", "Soldagem"]);
    expect(stepsOfProduct(OPTIONS, 2, 1)).toEqual([]);
  });

  it('oferece variação só quando há mais de uma opção, incluindo "sem variação" do legado', () => {
    expect(variationsOfStep(OPTIONS, 1, 1, 2).map((v) => v.label)).toEqual([
      "Todas as variações",
      "Sem variação",
      "Cabos",
      "Retrabalho",
    ]);
    expect(variationsOfStep(OPTIONS, 1, 1, 1)).toEqual([]);
  });

  it("corrige a seleção em cascata quando algo deixa de existir", () => {
    expect(
      fixSelection(OPTIONS, { operatorId: 2, productId: 1, stepTemplateId: 2, variation: 5 }),
    ).toEqual({ operatorId: 2, productId: 2, stepTemplateId: 1, variation: "all" });
    expect(
      fixSelection(OPTIONS, { operatorId: 99, productId: null, stepTemplateId: null, variation: "all" }),
    ).toMatchObject({ operatorId: 1, productId: 1, stepTemplateId: 1 });
  });

  it("mantém uma seleção que continua válida", () => {
    const valid = { operatorId: 1, productId: 1, stepTemplateId: 2, variation: 2 };
    expect(fixSelection(OPTIONS, valid)).toEqual(valid);
    expect(fixSelection(OPTIONS, { ...valid, variation: "none" })).toMatchObject({ variation: "none" });
  });

  it("sem combinações, não há seleção", () => {
    expect(
      fixSelection([], { operatorId: 1, productId: 1, stepTemplateId: 1, variation: "all" }),
    ).toEqual({ operatorId: null, productId: null, stepTemplateId: null, variation: "all" });
    expect(initialSelection([])).toEqual({
      operatorId: null,
      productId: null,
      stepTemplateId: null,
      variation: "all",
    });
  });

  it("a seleção inicial parte do operador com registro mais recente", () => {
    expect(initialSelection(OPTIONS)).toEqual({
      operatorId: 1,
      productId: 1,
      stepTemplateId: 1,
      variation: "all",
    });
  });
});

describe("intervalo e períodos", () => {
  const selection = { operatorId: 1, productId: 1, stepTemplateId: 2 };

  it("acha o intervalo com dados da seleção (todas, sem variação ou específica)", () => {
    expect(dataRange(OPTIONS, { ...selection, variation: "all" })).toEqual({
      first: "2026-06-02",
      last: "2026-09-20",
    });
    expect(dataRange(OPTIONS, { ...selection, variation: "none" })).toEqual({
      first: "2026-06-02",
      last: "2026-06-30",
    });
    expect(dataRange(OPTIONS, { ...selection, variation: 1 })).toEqual({
      first: "2026-07-01",
      last: "2026-09-20",
    });
    expect(
      dataRange(OPTIONS, { operatorId: 2, productId: 1, stepTemplateId: 1, variation: "all" }),
    ).toBeNull();
  });

  it("período padrão: 30 dias terminando na data de referência", () => {
    expect(defaultPeriod("2026-10-11")).toEqual({ start: "2026-09-12", end: "2026-10-11" });
    expect(lastDaysPeriod(7, "2026-10-11")).toEqual({ start: "2026-10-05", end: "2026-10-11" });
  });

  it("período dos dados respeita o mínimo e o máximo", () => {
    expect(periodCovering({ first: "2026-10-10", last: "2026-10-11" })).toEqual({
      start: "2026-10-05",
      end: "2026-10-11",
    });
    expect(periodCovering({ first: "2026-06-01", last: "2026-10-11" })).toEqual({
      start: "2026-06-01",
      end: "2026-10-11",
    });
    expect(periodCovering({ first: "2024-01-01", last: "2026-10-11" }).start).toBe("2025-10-11");
  });

  it("sugere correção para períodos inválidos e nada para os válidos", () => {
    expect(fixPeriod({ start: "2026-10-05", end: "2026-10-08" })).toEqual({
      start: "2026-10-05",
      end: "2026-10-11",
    });
    expect(fixPeriod({ start: "2026-10-11", end: "2026-10-01" })).toEqual({
      start: "2026-10-01",
      end: "2026-10-11",
    });
    expect(fixPeriod({ start: "2026-10-05", end: "2026-10-11" })).toBeNull();
    expect(fixPeriod({ start: "", end: "2026-10-11" })).toBeNull();
    expect(fixPeriod({ start: "2024-01-01", end: "2026-10-11" })).toEqual({
      start: "2025-10-11",
      end: "2026-10-11",
    });
  });
});
