import { UserRole } from "../types";
import type { PerformanceAnalysis, PerformanceOption } from "./performance";

// Client-side (roda no navegador do usuario): precisa de uma URL publicamente
// alcancavel. Server-side (Route Handlers, dentro do container): usa API_INTERNAL_URL,
// que aponta para o servico do backend na rede Docker (ex. http://nestjs_api:3000),
// pois "localhost" dentro do container do frontend nao alcanca o container do backend.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const INTERNAL_API_URL = process.env.API_INTERNAL_URL ?? PUBLIC_API_URL;

const API_URL = typeof window === "undefined" ? INTERNAL_API_URL : PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (Array.isArray(body?.message) ? body.message[0] : body?.message) ??
      "Nao foi possivel completar a solicitacao.";
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export interface CreateUserPayload {
  name: string;
  role: UserRole;
  email: string;
  password: string;
  branch_id?: number;
}

export function createUser(payload: CreateUserPayload, token: string) {
  return apiFetch("/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  branch_id: number;
}

export function registerUser(payload: RegisterUserPayload) {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  email?: string;
  password?: string;
  branch_id?: number;
}

export function updateUser(id: number, payload: UpdateUserPayload, token: string) {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: number, token: string) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    registrationNumber: string;
    role: UserRole;
    branchId: number | null;
  };
}

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshTokenRequest(refreshToken: string): Promise<AuthResponse> {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function logoutRequest(refreshToken: string) {
  return apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function fetchUser(id: number, token: string) {
  return apiFetch(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface DirectoryUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  branch: { id: number; name: string } | null;
}

export function fetchUsers(token: string): Promise<DirectoryUser[]> {
  return apiFetch("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Registries (operadores, produtos, etapas, variações) ---

export type RegistryResource =
  | "operators"
  | "products"
  | "step-templates"
  | "step-variations";

export interface DeleteImpact {
  cards: number;
  cardOperators: number;
  hourlyRecords: number;
  variations: number;
}

function includeInactiveQuery(includeInactive: boolean) {
  return includeInactive ? "?include_inactive=true" : "";
}

export function setRegistryActive(
  resource: RegistryResource,
  id: number,
  active: boolean,
  token: string,
) {
  return apiFetch(`/${resource}/${id}/active`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ active }),
  });
}

export function fetchRegistryImpact(
  resource: RegistryResource,
  id: number,
  token: string,
): Promise<DeleteImpact> {
  return apiFetch(`/${resource}/${id}/impact`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Operators ---

export interface DirectoryOperator {
  id: number;
  name: string;
  active: boolean;
  branchId: number;
}

export interface OperatorPayload {
  name: string;
  branch_id?: number;
}

export function fetchOperators(
  token: string,
  includeInactive = false,
): Promise<DirectoryOperator[]> {
  return apiFetch(`/operators${includeInactiveQuery(includeInactive)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createOperator(payload: OperatorPayload, token: string) {
  return apiFetch("/operators", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateOperator(
  id: number,
  payload: Pick<OperatorPayload, "name">,
  token: string,
) {
  return apiFetch(`/operators/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteOperator(id: number, token: string) {
  return apiFetch(`/operators/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Products ---

export interface DirectoryProduct {
  id: number;
  sku: string;
  commercialName: string;
  version: string | null;
  description: string | null;
  active: boolean;
}

export interface ProductPayload {
  sku: string;
  commercial_name: string;
  version?: string;
  description?: string;
}

export function productLabel(product: Pick<DirectoryProduct, "commercialName" | "version">) {
  return `${product.commercialName} ${product.version ?? ""}`.trim();
}

export function fetchProducts(
  token: string,
  includeInactive = false,
): Promise<DirectoryProduct[]> {
  return apiFetch(`/products${includeInactiveQuery(includeInactive)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createProduct(payload: ProductPayload, token: string) {
  return apiFetch("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: number, payload: Partial<ProductPayload>, token: string) {
  return apiFetch(`/products/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: number, token: string) {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Production Orders ---

export const PRODUCTION_ORDER_STATUSES = [
  "Aberta",
  "Em andamento",
  "Concluída",
  "Cancelada",
] as const;
export type ProductionOrderStatus = (typeof PRODUCTION_ORDER_STATUSES)[number];

export interface DirectoryProductionOrder {
  id: number;
  opNumber: string;
  startDate: string | null;
  estimatedEndDate: string | null;
  targetQuantity: number;
  status: ProductionOrderStatus;
  branch: { id: number; name: string };
  product: { id: number; sku: string; commercialName: string };
}

export interface ProductionOrderPayload {
  op_number: string;
  branch_id: number;
  product_id: number;
  start_date?: string;
  estimated_end_date?: string;
  target_quantity: number;
  status?: ProductionOrderStatus;
}

export function fetchProductionOrders(
  token: string,
): Promise<DirectoryProductionOrder[]> {
  return apiFetch("/production-order", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchProductionOrder(
  id: number,
  token: string,
): Promise<DirectoryProductionOrder> {
  return apiFetch(`/production-order/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createProductionOrder(payload: ProductionOrderPayload, token: string) {
  return apiFetch("/production-order", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateProductionOrder(
  id: number,
  payload: Partial<ProductionOrderPayload>,
  token: string,
) {
  return apiFetch(`/production-order/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteProductionOrder(id: number, token: string) {
  return apiFetch(`/production-order/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Step Templates ---

export interface DirectoryStepVariation {
  id: number;
  name: string;
  active: boolean;
  stepTemplateId: number;
}

export interface DirectoryStepTemplate {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  variations: DirectoryStepVariation[];
}

export interface StepTemplatePayload {
  name: string;
  description?: string;
}

export function fetchStepTemplates(
  token: string,
  includeInactive = false,
): Promise<DirectoryStepTemplate[]> {
  return apiFetch(`/step-templates${includeInactiveQuery(includeInactive)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createStepTemplate(payload: StepTemplatePayload, token: string) {
  return apiFetch("/step-templates", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateStepTemplate(
  id: number,
  payload: Partial<StepTemplatePayload>,
  token: string,
) {
  return apiFetch(`/step-templates/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteStepTemplate(id: number, token: string) {
  return apiFetch(`/step-templates/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Step Variations ---

export interface StepVariationPayload {
  step_template_id: number;
  name: string;
}

export function createStepVariation(payload: StepVariationPayload, token: string) {
  return apiFetch("/step-variations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateStepVariation(
  id: number,
  payload: Pick<StepVariationPayload, "name">,
  token: string,
) {
  return apiFetch(`/step-variations/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteStepVariation(id: number, token: string) {
  return apiFetch(`/step-variations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Production cards (controle de produção) ---
// As consultas GET recebem a query string já montada pela tela (ex.: "?date=...&branch_id=1").

export interface ProductionRecord {
  id: number;
  timeSlot: string;
  target: number;
  produced: number;
}

export interface ProductionCardOperator {
  id: number;
  operatorId: number;
  name: string;
  orderIndex: number;
  records: ProductionRecord[];
}

export interface ProductionCard {
  id: number;
  date: string;
  branchId: number;
  productId: number;
  stepTemplateId: number;
  variationId: number | null;
  stepTemplate: string;
  variation: string | null;
  label: string;
  product: string;
  defaultHourlyTarget: number;
  operators: ProductionCardOperator[];
}

export interface OpenCardPayload {
  date: string;
  product_id: number;
  step_template_id: number;
  variation_id: number | null;
  default_hourly_target: number;
  branch_id?: number;
}

export interface DayWithCards {
  date: string;
  cards: number;
  totalProduced: number;
  totalTarget: number;
}

export interface DayCard {
  id: number;
  stepTemplate: string;
  variation: string | null;
  label: string;
  product: string;
  operators: number;
  totalProduced: number;
  totalTarget: number;
  efficiency: number | null;
}

export interface ProductionOptions {
  products: { id: number; label: string }[];
  stepTemplates: { id: number; name: string; variations: { id: number; name: string }[] }[];
  operators: { id: number; name: string; branchId: number }[];
}

export interface TimeSlot {
  id: number;
  start: string;
  end: string;
  weekdays: number[];
  orderIndex: number;
  label: string;
}

export interface RecordPayload {
  time_slot: string;
  target: number;
  produced: number;
}

function authGet(path: string, token: string) {
  return apiFetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export function findProductionCard(
  search: string,
  token: string,
): Promise<{ card: ProductionCard | null }> {
  return authGet(`/production-cards${search}`, token);
}

export function openProductionCard(
  payload: OpenCardPayload,
  token: string,
): Promise<{ card: ProductionCard; created: boolean }> {
  return apiFetch("/production-cards", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function fetchProductionOptions(search: string, token: string): Promise<ProductionOptions> {
  return authGet(`/production-cards/options${search}`, token);
}

export function fetchProductionDays(search: string, token: string): Promise<DayWithCards[]> {
  return authGet(`/production-cards/days${search}`, token);
}

export function fetchDayCards(search: string, token: string): Promise<DayCard[]> {
  return authGet(`/production-cards/day${search}`, token);
}

export function fetchProductionCard(id: number, token: string): Promise<ProductionCard> {
  return authGet(`/production-cards/${id}`, token);
}

export function fetchProductionCardImpact(id: number, token: string): Promise<DeleteImpact> {
  return authGet(`/production-cards/${id}/impact`, token);
}

export function deleteProductionCard(id: number, token: string) {
  return apiFetch(`/production-cards/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateDefaultTarget(
  id: number,
  defaultHourlyTarget: number,
  token: string,
): Promise<ProductionCard> {
  return apiFetch(`/production-cards/${id}/default-target`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ default_hourly_target: defaultHourlyTarget }),
  });
}

export function addCardOperator(
  cardId: number,
  operatorId: number,
  token: string,
): Promise<{ cardOperator: ProductionCardOperator; created: boolean }> {
  return apiFetch(`/production-cards/${cardId}/operators`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ operator_id: operatorId }),
  });
}

export function removeCardOperator(cardOperatorId: number, token: string) {
  return apiFetch(`/production-cards/operators/${cardOperatorId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function upsertRecord(
  cardOperatorId: number,
  payload: RecordPayload,
  token: string,
): Promise<ProductionRecord> {
  return apiFetch(`/production-cards/operators/${cardOperatorId}/records`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function fetchTimeSlots(search: string, token: string): Promise<TimeSlot[]> {
  return authGet(`/time-slots${search}`, token);
}

// --- Dashboard (painéis de TV) ---

export interface DashboardCard {
  cardId: number;
  stepTemplate: string;
  variation: string | null;
  label: string;
  product: string;
  /** Com `time_slot`, os totais (por operador, do cartão e geral) contam só a faixa; `byHour` é o dia todo. */
  totalProduced: number;
  totalTarget: number;
  balance: number;
  efficiency: number | null;
  byOperator: { name: string; totalProduced: number; totalTarget: number }[];
  byHour: { timeSlot: string; produced: number; target: number }[];
}

export interface DashboardData {
  date: string;
  product: string;
  timeSlot: string | null;
  total: { produced: number; target: number };
  cards: DashboardCard[];
}

export function fetchDashboard(search: string, token: string): Promise<DashboardData> {
  return authGet(`/dashboard${search}`, token);
}

// --- Performance (análise de desempenho) ---
// Tipos da resposta em app/lib/performance.ts.

export function fetchPerformanceOptions(
  search: string,
  token: string,
): Promise<PerformanceOption[]> {
  return authGet(`/performance/options${search}`, token);
}

export function fetchPerformance(search: string, token: string): Promise<PerformanceAnalysis> {
  return authGet(`/performance${search}`, token);
}

// --- Steps ---

export interface StepAssignment {
  id: number;
  user: { id: number; name: string; registrationNumber: string };
}

export interface DirectoryStep {
  id: number;
  orderIndex: number;
  targetQuantity: number;
  productionOrderId: number;
  stepTemplate: { id: number; name: string };
  assignments: StepAssignment[];
}

export interface StepPayload {
  step_template_id: number;
  order_index: number;
  target_quantity?: number;
  productionOrderId: number;
}

export function fetchSteps(token: string): Promise<DirectoryStep[]> {
  return apiFetch("/steps", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createStep(payload: StepPayload, token: string) {
  return apiFetch("/steps", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateStep(id: number, payload: Partial<StepPayload>, token: string) {
  return apiFetch(`/steps/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteStep(id: number, token: string) {
  return apiFetch(`/steps/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function assignUserToStep(stepId: number, userId: number, token: string) {
  return apiFetch(`/steps/${stepId}/assignments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
  });
}

export function unassignUserFromStep(stepId: number, userId: number, token: string) {
  return apiFetch(`/steps/${stepId}/assignments/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
