import { NextRequest } from "next/server";
import { createStepVariation } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createStepVariation(payload, token));
}
