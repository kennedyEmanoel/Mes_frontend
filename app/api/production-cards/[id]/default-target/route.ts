import { NextRequest } from "next/server";
import { updateDefaultTarget } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { default_hourly_target } = await request.json();
  return withAuth((token) => updateDefaultTarget(Number(id), default_hourly_target, token));
}
