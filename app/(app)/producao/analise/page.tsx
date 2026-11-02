"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { BRANCH_OPTIONS } from "../../../lib/branches";
import { dayLabel, formatPeriod } from "../../../lib/format";
import {
  PerformanceAnalysis,
  PerformanceOption,
  validatePeriod,
} from "../../../lib/performance";
import { localToday, plural } from "../../../lib/production";
import { SessionUser } from "../../../types";
import { AnalysisFilters } from "./AnalysisFilters";
import {
  ByHourChart,
  ChartCard,
  DailyChart,
  HourlyMode,
  Segmented,
  TrendChart,
  TrendSummary,
  TrendView,
} from "./AnalysisCharts";
import {
  EMPTY_SELECTION,
  FilterSelection,
  Period,
  dataRange,
  defaultPeriod,
  fixSelection,
  initialSelection,
  periodCovering,
} from "./cascadeOptions";
import { CriticalLists } from "./CriticalLists";
import { DaySlotMap } from "./DaySlotMap";
import { SlotTable } from "./SlotTable";
import { SummaryCards } from "./SummaryCards";

const BREADCRUMB = (
  <Breadcrumb
    items={[{ label: "Produção", href: "/producao" }, { label: "Análise de desempenho" }]}
  />
);

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Não foi possível carregar os dados.");
  return body as T;
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Não foi possível carregar os dados.";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="border-b border-zinc-200 pb-2">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="text-sm text-zinc-500">{description}</p>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      {text && <div className="max-w-xl text-sm text-zinc-500">{text}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
      {text}
    </div>
  );
}

interface AnalysisResult {
  query: string;
  data: PerformanceAnalysis | null;
  error: string | null;
}

export default function AnalisePage() {
  const router = useRouter();
  const [today] = useState(() => localToday());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [options, setOptions] = useState<PerformanceOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selection, setSelection] = useState<FilterSelection>(EMPTY_SELECTION);
  const [period, setPeriod] = useState<Period>(() => defaultPeriod(today));
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [hourlyMode, setHourlyMode] = useState<HourlyMode>("day");
  const [trendView, setTrendView] = useState<TrendView>("period");
  const initialized = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getJson<{ user: SessionUser }>("/api/me")
      .then(({ user: sessionUser }) => {
        if (cancelled) return;
        setUser(sessionUser);
        setBranchId(sessionUser.branchId);
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getJson<PerformanceOption[]>(
      `/api/performance/options${branchId ? `?branch_id=${branchId}` : ""}`,
    )
      .then((list) => {
        if (cancelled) return;
        setOptions(list);
        setLoadError(null);
        if (initialized.current) {
          setSelection((current) => fixSelection(list, current));
          return;
        }
        // Primeira carga: operador com registro mais recente e 30 dias até o último dado dele.
        initialized.current = true;
        const initial = initialSelection(list);
        const range = dataRange(list, initial);
        setSelection(initial);
        if (range) setPeriod(defaultPeriod(range.last));
      })
      .catch((e) => {
        if (!cancelled) setLoadError(messageOf(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user, branchId]);

  const periodError = validatePeriod(period.start, period.end);

  const query = useMemo(() => {
    const { operatorId, productId, stepTemplateId, variation } = selection;
    if (operatorId === null || productId === null || stepTemplateId === null || periodError) {
      return null;
    }
    return new URLSearchParams({
      operator_id: String(operatorId),
      product_id: String(productId),
      step_template_id: String(stepTemplateId),
      variation: String(variation),
      start: period.start,
      end: period.end,
    }).toString();
  }, [selection, period, periodError]);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    getJson<PerformanceAnalysis>(`/api/performance?${query}`)
      .then((data) => {
        if (!cancelled) setResult({ query, data, error: null });
      })
      .catch((e) => {
        if (!cancelled) setResult({ query, data: null, error: messageOf(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const range = useMemo(() => dataRange(options ?? [], selection), [options, selection]);
  const dataPeriod = useMemo(() => (range ? periodCovering(range) : null), [range]);

  const selectDay = useCallback((date: string) => {
    setChosenDay(date);
    setHourlyMode("day");
  }, []);

  // Mantém o resultado anterior na tela enquanto a nova consulta roda.
  const loading = query !== null && result?.query !== query;
  const data = query ? (result?.data ?? null) : null;
  const error = query && result?.query === query ? result.error : null;

  const recordedDays = data?.days.filter((d) => d.recorded) ?? [];
  const selectedDay =
    chosenDay && recordedDays.some((d) => d.date === chosenDay)
      ? chosenDay
      : (recordedDays[recordedDays.length - 1]?.date ?? null);
  const selectedDayData = data?.days.find((d) => d.date === selectedDay) ?? null;

  if (!user) {
    return (
      <div>
        {BREADCRUMB}
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const filter = data?.filter;
  const variationText =
    filter && filter.variation !== "all" ? ` · ${filter.variationLabel}` : "";

  return (
    <div>
      {BREADCRUMB}

      <div className="px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Análise de desempenho</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Eficiência de um operador num produto e etapa, a partir dos registros hora a hora.
            </p>
          </div>
          {user.role === "admin" && (
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              Filial
              <select
                value={branchId ?? ""}
                onChange={(e) => setBranchId(Number(e.target.value) || null)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              >
                {user.branchId === null && <option value="">Todas</option>}
                {BRANCH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {options && options.length > 0 && (
          <AnalysisFilters
            options={options}
            selection={selection}
            period={period}
            periodError={periodError}
            today={today}
            dataPeriod={dataPeriod}
            onSelection={setSelection}
            onPeriod={setPeriod}
          />
        )}

        <div className="mt-6 flex flex-col gap-8">
          {loadError && <Alert text={loadError} />}
          {error && <Alert text={error} />}

          {!options && !loadError && <p className="text-sm text-zinc-400">Carregando...</p>}

          {options && options.length === 0 && (
            <EmptyState
              title="Ainda não há registros para analisar"
              text="Os registros hora a hora salvos no Controle de produção aparecem aqui assim que existirem."
            />
          )}

          {options && options.length > 0 && periodError && (
            <EmptyState title="Defina um período válido" text={periodError} />
          )}

          {loading && !data && !periodError && (
            <p className="text-sm text-zinc-400">Carregando análise...</p>
          )}

          {data && data.overall.recordedSlots === 0 && (
            <EmptyState
              title="Nenhum registro neste período"
              text={
                range
                  ? `Este operador, nesta combinação de produto e etapa, tem registros de ${formatPeriod(range.first, range.last)}.`
                  : "Não há registros desta combinação."
              }
              action={
                dataPeriod && (
                  <button
                    type="button"
                    onClick={() => setPeriod(dataPeriod)}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                  >
                    Ver período com dados
                  </button>
                )
              }
            />
          )}

          {data && filter && data.overall.recordedSlots > 0 && (
            <>
              <header className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-extrabold text-zinc-900">{filter.operator}</p>
                  <p className="text-sm text-zinc-500">
                    {filter.stepTemplate}
                    {variationText} · {filter.product} · {formatPeriod(filter.start, filter.end)} (
                    {plural(filter.periodDays, "dia", "dias")})
                  </p>
                </div>
                {loading && <span className="text-xs text-zinc-400">Atualizando...</span>}
              </header>

              <Section
                title="Análise geral"
                description="Indicadores consolidados do operador, produto e etapa no período escolhido."
              >
                <SummaryCards overall={data.overall} />
              </Section>

              <Section
                title="Visualização gráfica"
                description="Evolução do realizado contra a meta. Clique em uma barra do gráfico por dia para ver aquele dia hora a hora."
              >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <ChartCard
                    title="Realizado × meta por dia"
                    subtitle="Cor da barra: verde na meta, âmbar próximo, vermelho crítico"
                    ariaLabel="Gráfico de barras do realizado por dia comparado à meta"
                    footer="Dias úteis sem registro aparecem como barra cinza baixa (e não como produção zero); fins de semana só aparecem quando houve produção."
                  >
                    <DailyChart days={data.days} selectedDay={selectedDay} onSelectDay={selectDay} />
                  </ChartCard>

                  <ChartCard
                    title="Realizado × meta por hora"
                    subtitle={
                      hourlyMode === "day" && selectedDayData
                        ? `Dia ${dayLabel(selectedDayData.date)}`
                        : "Média das faixas em todo o período"
                    }
                    ariaLabel="Gráfico do realizado por faixa de horário comparado à meta"
                    actions={
                      <div className="flex flex-wrap items-center gap-2">
                        {hourlyMode === "day" && recordedDays.length > 0 && (
                          <select
                            aria-label="Dia para detalhar por hora"
                            value={selectedDay ?? ""}
                            onChange={(e) => setChosenDay(e.target.value)}
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          >
                            {recordedDays.map((d) => (
                              <option key={d.date} value={d.date}>
                                {dayLabel(d.date)}
                              </option>
                            ))}
                          </select>
                        )}
                        <Segmented
                          ariaLabel="Modo do gráfico por hora"
                          value={hourlyMode}
                          onChange={setHourlyMode}
                          options={[
                            { value: "day", label: "Dia escolhido", disabled: recordedDays.length === 0 },
                            { value: "period", label: "Média do período" },
                          ]}
                        />
                      </div>
                    }
                    footer="Faixas sem registro aparecem como barra cinza baixa."
                  >
                    <ByHourChart mode={hourlyMode} day={selectedDayData} slots={data.slots} />
                  </ChartCard>
                </div>

                <ChartCard
                  title="Tendência de produtividade"
                  subtitle="Eficiência (% da meta) ao longo do período"
                  ariaLabel="Gráfico de tendência da eficiência"
                  height={300}
                  actions={
                    <Segmented
                      ariaLabel="Visão da tendência"
                      value={trendView}
                      onChange={setTrendView}
                      options={[
                        { value: "period", label: "No período" },
                        { value: "weeks", label: "Semana a semana" },
                        { value: "weekday", label: "Dia da semana" },
                      ]}
                    />
                  }
                  footer={
                    <TrendSummary
                      trend={data.trend}
                      recordedDays={data.overall.daysWithEfficiency}
                    />
                  }
                >
                  <TrendChart view={trendView} days={data.days} trend={data.trend} />
                </ChartCard>
              </Section>

              <Section
                title="Análise detalhada"
                description="Quebra dia a dia e hora a hora, comparativo entre meta horária e realizado, e identificação dos pontos críticos."
              >
                <CriticalLists critical={data.critical} />
                <DaySlotMap
                  days={data.days}
                  slots={data.slots}
                  selectedDay={selectedDay}
                  onSelectDay={selectDay}
                />
                <SlotTable slots={data.slots} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
