import { NextRequest } from "next/server";
import { createUser, fetchUsers } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET() {
  return withAuth((token) => fetchUsers(token).then((users) => ({ users })));
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createUser(payload, token));
}
