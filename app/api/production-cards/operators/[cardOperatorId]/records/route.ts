import { NextRequest } from "next/server";
import { upsertRecord } from "../../../../../lib/api";
import { withAuth } from "../../../../../lib/session";

interface RouteContext {
  params: Promise<{ cardOperatorId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { cardOperatorId } = await params;
  const payload = await request.json();
  return withAuth((token) => upsertRecord(Number(cardOperatorId), payload, token));
}
