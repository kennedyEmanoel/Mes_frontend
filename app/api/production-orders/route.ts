import { NextRequest } from "next/server";
import { createProductionOrder, fetchProductionOrders } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET() {
  return withAuth((token) =>
    fetchProductionOrders(token).then((productionOrders) => ({ productionOrders })),
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createProductionOrder(payload, token));
}
