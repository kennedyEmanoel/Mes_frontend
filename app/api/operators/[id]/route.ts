import { NextRequest } from "next/server";
import { deleteOperator, updateOperator } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const payload = await request.json();
  return withAuth((token) => updateOperator(Number(id), payload, token));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => deleteOperator(Number(id), token));
}
