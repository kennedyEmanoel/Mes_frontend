import { NextResponse } from "next/server";
import { ApiError, fetchUser, refreshTokenRequest } from "../../lib/api";
import {
  clearSessionCookies,
  getSessionCookies,
  setSessionCookies,
} from "../../lib/session";

interface JwtPayload {
  sub: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET() {
  const { accessToken, refreshToken } = await getSessionCookies();

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const user = await loadUser(accessToken);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return handleExpiredAccessToken(refreshToken);
    }
    return respondWithError(error);
  }
}

async function loadUser(accessToken: string) {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    throw new ApiError(401, "Sessao invalida.");
  }
  return fetchUser(payload.sub, accessToken);
}

async function handleExpiredAccessToken(refreshToken: string) {
  try {
    const { access_token, refresh_token } = await refreshTokenRequest(refreshToken);
    await setSessionCookies(access_token, refresh_token);
    const user = await loadUser(access_token);
    return NextResponse.json({ user });
  } catch {
    await clearSessionCookies();
    return NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
  }
}

function respondWithError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { message: "Nao foi possivel conectar ao servidor." },
    { status: 502 },
  );
}
