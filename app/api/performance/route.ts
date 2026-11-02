import { NextRequest } from "next/server";
import { fetchPerformance } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchPerformance(request.nextUrl.search, token));
}
