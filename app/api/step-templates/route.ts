import { NextRequest } from "next/server";
import { createStepTemplate, fetchStepTemplates } from "../../lib/api";
import { withAuth } from "../../lib/session";

export async function GET() {
  return withAuth((token) =>
    fetchStepTemplates(token).then((stepTemplates) => ({ stepTemplates })),
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  return withAuth((token) => createStepTemplate(payload, token));
}
