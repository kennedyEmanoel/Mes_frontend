import { NextRequest } from "next/server";
import { deleteProductionCard, fetchProductionCard } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => fetchProductionCard(Number(id), token));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => deleteProductionCard(Number(id), token));
}
