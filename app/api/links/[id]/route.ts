import { NextResponse } from "next/server";
import { deleteLink, updateLink } from "@/lib/tabtamer-store";
import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const link = await updateLink(id, typeof body === "object" && body !== null ? body : {});
    return NextResponse.json({ link });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteLink(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
