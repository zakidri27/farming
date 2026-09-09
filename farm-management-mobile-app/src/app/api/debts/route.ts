import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(debts).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch debts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [debt] = await db.insert(debts).values({
      date: body.date,
      type: body.type,
      contactId: body.contactId || null,
      contactName: body.contactName,
      description: body.description,
      totalAmount: body.totalAmount,
      paidAmount: body.paidAmount || "0",
      dueDate: body.dueDate || null,
      status: body.status || "pending",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Debts POST error:", error);
    return NextResponse.json({ error: "Failed to create debt" }, { status: 500 });
  }
}
