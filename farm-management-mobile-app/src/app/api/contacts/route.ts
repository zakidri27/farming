import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(contacts).orderBy(sql`name asc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [contact] = await db.insert(contacts).values({
      name: body.name,
      type: body.type || "both",
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
