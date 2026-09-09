import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(expenses).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [expense] = await db.insert(expenses).values({
      date: body.date,
      category: body.category,
      description: body.description,
      amount: body.amount,
      animalType: body.animalType || null,
      paymentMethod: body.paymentMethod || "cash",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
