import { NextRequest } from "next/server";
import {
  deleteProductionOrder,
  fetchProductionOrder,
  updateProductionOrder,
} from "../../../lib/api";
import { withAuth } from "../../../lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) =>
    fetchProductionOrder(Number(id), token).then((productionOrder) => ({
      productionOrder,
    })),
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const payload = await request.json();
  return withAuth((token) => updateProductionOrder(Number(id), payload, token));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withAuth((token) => deleteProductionOrder(Number(id), token));
}
