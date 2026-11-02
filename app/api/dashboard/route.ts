import { NextRequest } from "next/server";
import { fetchDashboard } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchDashboard(request.nextUrl.search, token));
}
