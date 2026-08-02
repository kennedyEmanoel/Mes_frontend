import { MockUser } from "./types";

const STORAGE_KEY = "mock_session_user";

const DEFAULT_USER: MockUser = {
  name: "Fulano de Tal",
  registration_number: "123456",
  role: "operator",
  email: "fulano@empresa.com",
  branch_id: 1,
};

export function saveMockUser(user: MockUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getMockUser(): MockUser {
  if (typeof window === "undefined") return DEFAULT_USER;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_USER;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return DEFAULT_USER;
  }
}

export function clearMockUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
