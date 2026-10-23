import { NextResponse } from "next/server";
import { createLink } from "@/lib/tabtamer-store";
import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const link = await createLink(typeof body === "object" && body !== null ? body : {});
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
