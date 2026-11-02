// Selects em cascata da análise (operador → produto → etapa → variação) e regras de período.
import { addDays, daysBetween, isIsoDate } from "../../../lib/dates";
import {
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
  PerformanceOption,
  VariationFilter,
  validatePeriod,
} from "../../../lib/performance";

export interface SelectOption<V extends string | number> {
  value: V;
  label: string;
}

export interface FilterSelection {
  operatorId: number | null;
  productId: number | null;
  stepTemplateId: number | null;
  variation: VariationFilter;
}

export interface Period {
  start: string;
  end: string;
}

export const EMPTY_SELECTION: FilterSelection = {
  operatorId: null,
  productId: null,
  stepTemplateId: null,
  variation: "all",
};

const byLabel = <V extends string | number>(a: SelectOption<V>, b: SelectOption<V>) =>
  a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });

function unique<V extends string | number>(options: SelectOption<V>[]): SelectOption<V>[] {
  const seen = new Set<V>();
  return options.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
}

export function availableOperators(options: readonly PerformanceOption[]): SelectOption<number>[] {
  return unique(
    options.map((o) => ({
      value: o.operatorId,
      label: o.operatorActive ? o.operator : `${o.operator} (inativo)`,
    })),
  ).sort(byLabel);
}

export function productsOfOperator(
  options: readonly PerformanceOption[],
  operatorId: number | null,
): SelectOption<number>[] {
  return unique(
    options
      .filter((o) => o.operatorId === operatorId)
      .map((o) => ({ value: o.productId, label: o.product })),
  ).sort(byLabel);
}

export function stepsOfProduct(
  options: readonly PerformanceOption[],
  operatorId: number | null,
  productId: number | null,
): SelectOption<number>[] {
  const ofProduct = options.filter((o) => o.operatorId === operatorId && o.productId === productId);
  return unique(
    [...ofProduct]
      .sort((a, b) => a.stepTemplateId - b.stepTemplateId)
      .map((o) => ({ value: o.stepTemplateId, label: o.stepTemplate })),
  );
}

// Só vale a pena escolher variação quando há mais de uma possibilidade.
export function variationsOfStep(
  options: readonly PerformanceOption[],
  operatorId: number | null,
  productId: number | null,
  stepTemplateId: number | null,
): SelectOption<VariationFilter>[] {
  const ofStep = options.filter(
    (o) =>
      o.operatorId === operatorId && o.productId === productId && o.stepTemplateId === stepTemplateId,
  );
  if (ofStep.length < 2) return [];

  const withVariation = unique(
    ofStep.flatMap((o) =>
      o.variationId === null || o.variation === null
        ? []
        : [{ value: o.variationId, label: o.variation }],
    ),
  ).sort(byLabel);

  const choices: SelectOption<VariationFilter>[] = [{ value: "all", label: "Todas as variações" }];
  if (ofStep.some((o) => o.variationId === null)) {
    choices.push({ value: "none", label: "Sem variação" });
  }
  return [...choices, ...withVariation];
}

export function fixSelection(
  options: readonly PerformanceOption[],
  requested: FilterSelection,
): FilterSelection {
  const operators = availableOperators(options);
  const operatorId = operators.some((o) => o.value === requested.operatorId)
    ? requested.operatorId
    : (operators[0]?.value ?? null);

  const products = productsOfOperator(options, operatorId);
  const productId = products.some((p) => p.value === requested.productId)
    ? requested.productId
    : (products[0]?.value ?? null);

  const steps = stepsOfProduct(options, operatorId, productId);
  const stepTemplateId = steps.some((s) => s.value === requested.stepTemplateId)
    ? requested.stepTemplateId
    : (steps[0]?.value ?? null);

  const variations = variationsOfStep(options, operatorId, productId, stepTemplateId);
  const variation = variations.some((v) => v.value === requested.variation)
    ? requested.variation
    : "all";

  return { operatorId, productId, stepTemplateId, variation };
}

// Começa pelo operador com o registro mais recente, na combinação que ele usou por último.
export function initialSelection(options: readonly PerformanceOption[]): FilterSelection {
  const mostRecent = [...options].sort(
    (a, b) =>
      b.lastDate.localeCompare(a.lastDate) ||
      b.days - a.days ||
      a.operator.localeCompare(b.operator, "pt-BR"),
  )[0];
  if (!mostRecent) return EMPTY_SELECTION;
  return fixSelection(options, {
    operatorId: mostRecent.operatorId,
    productId: mostRecent.productId,
    stepTemplateId: mostRecent.stepTemplateId,
    variation: "all",
  });
}

export function dataRange(
  options: readonly PerformanceOption[],
  selection: FilterSelection,
): { first: string; last: string } | null {
  const matching = options.filter(
    (o) =>
      o.operatorId === selection.operatorId &&
      o.productId === selection.productId &&
      o.stepTemplateId === selection.stepTemplateId &&
      (selection.variation === "all" ||
        (selection.variation === "none"
          ? o.variationId === null
          : o.variationId === selection.variation)),
  );
  if (matching.length === 0) return null;
  return {
    first: matching.map((o) => o.firstDate).sort()[0],
    last: matching.map((o) => o.lastDate).sort().reverse()[0],
  };
}

export function defaultPeriod(end: string): Period {
  return { start: addDays(end, -29), end };
}

export function periodCovering(range: { first: string; last: string }): Period {
  const end = range.last;
  const days = daysBetween(range.first, end) + 1;
  if (days < MIN_PERIOD_DAYS) return { start: addDays(end, -(MIN_PERIOD_DAYS - 1)), end };
  if (days > MAX_PERIOD_DAYS) return { start: addDays(end, -(MAX_PERIOD_DAYS - 1)), end };
  return { start: range.first, end };
}

export function lastDaysPeriod(days: number, today: string): Period {
  return { start: addDays(today, -(days - 1)), end: today };
}

// Sugere o período válido mais próximo do que foi digitado; null quando já está válido ou faltam datas.
export function fixPeriod(period: Period): Period | null {
  if (!isIsoDate(period.start) || !isIsoDate(period.end)) return null;
  if (validatePeriod(period.start, period.end) === null) return null;

  const [start, end] =
    period.start <= period.end ? [period.start, period.end] : [period.end, period.start];
  const days = daysBetween(start, end) + 1;
  if (days < MIN_PERIOD_DAYS) return { start, end: addDays(start, MIN_PERIOD_DAYS - 1) };
  if (days > MAX_PERIOD_DAYS) return { start: addDays(end, -(MAX_PERIOD_DAYS - 1)), end };
  return { start, end };
}
