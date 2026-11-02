import { NextRequest } from "next/server";
import { fetchRegistryImpact } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => fetchRegistryImpact("products", Number(id), token));
}
