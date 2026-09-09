import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(incomes).where(eq(incomes.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
  }
}
