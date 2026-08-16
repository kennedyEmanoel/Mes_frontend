import { UserRole } from "../types";

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

// --- Products ---

export interface DirectoryProduct {
  id: number;
  sku: string;
  commercialName: string;
  version: string | null;
}

export interface ProductPayload {
  sku: string;
  commercial_name: string;
  version?: string;
}

export function fetchProducts(token: string): Promise<DirectoryProduct[]> {
  return apiFetch("/products", {
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

export interface DirectoryStepTemplate {
  id: number;
  name: string;
  description: string | null;
}

export interface StepTemplatePayload {
  name: string;
  description?: string;
}

export function fetchStepTemplates(token: string): Promise<DirectoryStepTemplate[]> {
  return apiFetch("/step-templates", {
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
