import { NextRequest } from "next/server";
import { addCardOperator } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator_id } = await request.json();
  return withAuth((token) => addCardOperator(Number(id), operator_id, token));
}
