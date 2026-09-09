import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const totalAmount = parseFloat(body.totalAmount);
    const paidAmount = parseFloat(body.paidAmount || "0");
    let status: "pending" | "partial" | "paid" = "pending";
    if (paidAmount >= totalAmount) status = "paid";
    else if (paidAmount > 0) status = "partial";

    const [debt] = await db.update(debts).set({
      date: body.date,
      type: body.type,
      contactId: body.contactId || null,
      contactName: body.contactName,
      description: body.description,
      totalAmount: body.totalAmount,
      paidAmount: body.paidAmount || "0",
      dueDate: body.dueDate || null,
      status,
      notes: body.notes || null,
      updatedAt: new Date(),
    }).where(eq(debts.id, parseInt(id))).returning();

    return NextResponse.json(debt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update debt" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(debts).where(eq(debts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete debt" }, { status: 500 });
  }
}
