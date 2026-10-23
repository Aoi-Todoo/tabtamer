import { NextResponse } from "next/server";
import { createCollection } from "@/lib/tabtamer-store";
import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const name = typeof body === "object" && body !== null && "name" in body && typeof body.name === "string" ? body.name : "";
    const collection = await createCollection(name);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
