import { NextResponse } from "next/server";
import { logoutRequest } from "../../lib/api";
import { clearSessionCookies, getSessionCookies } from "../../lib/session";

export async function POST() {
  const { refreshToken } = await getSessionCookies();

  if (refreshToken) {
    await logoutRequest(refreshToken).catch(() => null);
  }

  await clearSessionCookies();

  return NextResponse.json({ ok: true });
}
