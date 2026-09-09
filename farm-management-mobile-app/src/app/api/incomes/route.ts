import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(incomes).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incomes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [income] = await db.insert(incomes).values({
      date: body.date,
      category: body.category,
      description: body.description,
      amount: body.amount,
      animalType: body.animalType || null,
      customerId: body.customerId || null,
      paymentMethod: body.paymentMethod || "cash",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(income);
  } catch (error) {
    console.error("Incomes POST error:", error);
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}
