export type UserRole = "operator" | "manager" | "analyst" | "admin";

export interface MockUser {
  name: string;
  registration_number: string;
  role: UserRole;
  email?: string;
  branch_id: number | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  operator: "Operador",
  manager: "Gerente",
  analyst: "Analista",
  admin: "Administrador",
};
