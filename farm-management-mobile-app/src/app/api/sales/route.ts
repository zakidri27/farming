import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(sales).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [sale] = await db.insert(sales).values({
      date: body.date,
      category: body.category,
      description: body.description,
      quantity: body.quantity || null,
      unit: body.unit || null,
      unitPrice: body.unitPrice || null,
      totalAmount: body.totalAmount,
      customerId: body.customerId || null,
      animalType: body.animalType || null,
      animalId: body.animalId || null,
      paymentStatus: body.paymentStatus || "paid",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
