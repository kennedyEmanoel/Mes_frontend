import { NextRequest } from "next/server";
import { fetchProductionOptions } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchProductionOptions(request.nextUrl.search, token));
}
