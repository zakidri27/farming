import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(purchases).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [purchase] = await db.insert(purchases).values({
      date: body.date,
      category: body.category,
      description: body.description,
      quantity: body.quantity || null,
      unit: body.unit || null,
      unitPrice: body.unitPrice || null,
      totalAmount: body.totalAmount,
      supplierId: body.supplierId || null,
      animalType: body.animalType || null,
      animalId: body.animalId || null,
      paymentStatus: body.paymentStatus || "paid",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Purchases POST error:", error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
