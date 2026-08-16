import { ApiError, fetchUser } from "../../lib/api";
import { withAuth } from "../../lib/session";

interface JwtPayload {
  sub: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET() {
  return withAuth(async (token) => {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      throw new ApiError(401, "Sessao invalida.");
    }
    const user = await fetchUser(payload.sub, token);
    return { user };
  });
}
