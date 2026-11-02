import { NextRequest } from "next/server";
import { removeCardOperator } from "../../../../lib/api";
import { withAuth } from "../../../../lib/session";

interface RouteContext {
  params: Promise<{ cardOperatorId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { cardOperatorId } = await params;
  return withAuth((token) => removeCardOperator(Number(cardOperatorId), token));
}
