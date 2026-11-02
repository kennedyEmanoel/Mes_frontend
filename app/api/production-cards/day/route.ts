import { NextRequest } from "next/server";
import { fetchDayCards } from "../../../lib/api";
import { withAuth } from "../../../lib/session";

export async function GET(request: NextRequest) {
  return withAuth((token) => fetchDayCards(request.nextUrl.search, token));
}
