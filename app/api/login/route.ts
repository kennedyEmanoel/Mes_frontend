import { NextRequest, NextResponse } from "next/server";
import { ApiError, loginRequest } from "../../lib/api";
import { setSessionCookies } from "../../lib/session";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    const { access_token, refresh_token, user } = await loginRequest(email, password);

    await setSessionCookies(access_token, refresh_token);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "Nao foi possivel conectar ao servidor." },
      { status: 502 },
    );
  }
}
