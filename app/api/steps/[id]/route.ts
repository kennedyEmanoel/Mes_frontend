import { NextRequest } from "next/server";
import { deleteStep, updateStep } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const payload = await request.json();
  return withAuth((token) => updateStep(Number(id), payload, token));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => deleteStep(Number(id), token));
}
