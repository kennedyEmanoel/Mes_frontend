export type UserRole = "operator" | "manager" | "analyst" | "admin";

export interface SessionUser {
  id: number;
  name: string;
  registrationNumber: string;
  role: UserRole;
  email: string;
  branchId: number | null;
  branch: { id: number; name: string } | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  operator: "Operador",
  manager: "Gerente",
  analyst: "Analista",
  admin: "Administrador",
};
