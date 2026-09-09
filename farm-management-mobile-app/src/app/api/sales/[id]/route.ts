import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(sales).where(eq(sales.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [sale] = await db.update(sales).set({
      date: body.date,
      category: body.category,
      description: body.description,
      quantity: body.quantity || null,
      unit: body.unit || null,
      unitPrice: body.unitPrice || null,
      totalAmount: body.totalAmount,
      customerId: body.customerId || null,
      animalType: body.animalType || null,
      paymentStatus: body.paymentStatus || "paid",
      notes: body.notes || null,
    }).where(eq(sales.id, parseInt(id))).returning();
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
  }
}
