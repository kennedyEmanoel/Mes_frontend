import { NextRequest } from "next/server";
import { setRegistryActive } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { active } = await request.json();
  return withAuth((token) => setRegistryActive("step-variations", Number(id), active, token));
}
