import { NextRequest } from "next/server";
import { unassignUserFromStep } from "../../../../../lib/api";
import { withAuth } from "../../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id, userId } = await params;
  return withAuth((token) => unassignUserFromStep(Number(id), Number(userId), token));
}
