import { NextRequest, NextResponse } from "next/server";
import { ApiError, registerUser } from "../../lib/api";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  try {
    const user = await registerUser(payload);
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
