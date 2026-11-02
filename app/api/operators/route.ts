import { NextRequest } from "next/server";
import { createOperator, fetchOperators } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get("include_inactive") === "true";
  return withAuth((token) =>
    fetchOperators(token, includeInactive).then((operators) => ({ operators })),
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createOperator(payload, token));
}
