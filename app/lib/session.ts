import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError, refreshTokenRequest } from "./api";

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

// Runs `call` with the current access token; on a 401 (expired token), refreshes once,
// updates the cookies, and retries `call` with the new token before giving up.
export async function withAuth<T>(
  call: (accessToken: string) => Promise<T>,
): Promise<NextResponse> {
  const { accessToken, refreshToken } = await getSessionCookies();

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const data = await call(accessToken);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return retryWithRefreshedToken(call, refreshToken);
    }
    return respondWithApiError(error);
  }
}

async function retryWithRefreshedToken<T>(
  call: (accessToken: string) => Promise<T>,
  refreshToken: string,
): Promise<NextResponse> {
  try {
    const { access_token, refresh_token } = await refreshTokenRequest(refreshToken);
    await setSessionCookies(access_token, refresh_token);
    const data = await call(access_token);
    return NextResponse.json(data);
  } catch {
    await clearSessionCookies();
    return NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
  }
}

function respondWithApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { message: "Nao foi possivel conectar ao servidor." },
    { status: 502 },
  );
}
