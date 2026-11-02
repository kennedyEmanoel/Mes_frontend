import { NextRequest } from "next/server";
import { fetchPerformanceOptions } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchPerformanceOptions(request.nextUrl.search, token));
}
