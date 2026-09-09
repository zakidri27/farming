import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(purchases).where(eq(purchases.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [purchase] = await db.update(purchases).set({
      date: body.date,
      category: body.category,
      description: body.description,
      quantity: body.quantity || null,
      unit: body.unit || null,
      unitPrice: body.unitPrice || null,
      totalAmount: body.totalAmount,
      supplierId: body.supplierId || null,
      animalType: body.animalType || null,
      paymentStatus: body.paymentStatus || "paid",
      notes: body.notes || null,
    }).where(eq(purchases.id, parseInt(id))).returning();
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}
