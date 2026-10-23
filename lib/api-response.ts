import { NextResponse } from "next/server";
import { StoreError } from "@/lib/tabtamer-store";

export function errorResponse(error: unknown) {
  const status = error instanceof StoreError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (status === 500) console.error("TabTamer API error:", error);
  return NextResponse.json({ error: status === 500 ? "The library could not be saved. Check that the app folder is writable." : message }, { status });
}
