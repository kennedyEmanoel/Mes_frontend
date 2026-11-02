import { NextRequest } from "next/server";
import { fetchProductionDays } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchProductionDays(request.nextUrl.search, token));
}
