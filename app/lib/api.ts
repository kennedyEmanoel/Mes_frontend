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

export interface RegisterUserPayload {
  name: string;
  role: UserRole;
  email: string;
  password: string;
  branch_id?: number;
}

export function registerUser(payload: RegisterUserPayload) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
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
