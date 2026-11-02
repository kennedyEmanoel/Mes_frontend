import { NextRequest } from "next/server";
import { findProductionCard, openProductionCard } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => findProductionCard(request.nextUrl.search, token));
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => openProductionCard(payload, token));
}
