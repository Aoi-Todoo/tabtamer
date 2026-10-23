import { NextResponse } from "next/server";
import { deleteCollection } from "@/lib/tabtamer-store";
import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await context.params;
    await deleteCollection(name);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
