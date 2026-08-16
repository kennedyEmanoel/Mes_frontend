import { NextRequest } from "next/server";
import { createStep, fetchSteps } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET() {
  return withAuth((token) => fetchSteps(token).then((steps) => ({ steps })));
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createStep(payload, token));
}
