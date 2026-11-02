import { NextRequest } from "next/server";
import { fetchTimeSlots } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchTimeSlots(request.nextUrl.search, token));
}
