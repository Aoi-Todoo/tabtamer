import { NextResponse } from "next/server";
import { DEFAULT_COLLECTIONS, getStore } from "@/lib/tabtamer-store";
import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json({
      collections: store.collections,
      links: store.links,
      deletedSampleIds: store.deletedSampleIds ?? [],
      builtInCollections: DEFAULT_COLLECTIONS,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
