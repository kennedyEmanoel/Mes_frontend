import { NextRequest } from "next/server";
import { assignUserToStep } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { user_id } = await request.json();
  return withAuth((token) => assignUserToStep(Number(id), Number(user_id), token));
}
