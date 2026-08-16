import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "mes_token";
export const REFRESH_TOKEN_COOKIE = "mes_refresh_token";

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  const baseOptions = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getSessionCookies() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}
