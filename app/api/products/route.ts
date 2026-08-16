import { NextRequest } from "next/server";
import { createProduct, fetchProducts } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET() {
  return withAuth((token) => fetchProducts(token).then((products) => ({ products })));
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createProduct(payload, token));
}
