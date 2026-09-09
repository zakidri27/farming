import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { healthRecords } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(healthRecords).where(eq(healthRecords.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete health record" }, { status: 500 });
  }
}
