import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animals } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = db.select().from(animals);

    const conditions = [];
    if (type) conditions.push(eq(animals.type, type as "cow" | "goat" | "sheep" | "chicken" | "quail"));
    if (status) conditions.push(eq(animals.status, status));

    const result = conditions.length > 0
      ? await db.select().from(animals).where(and(...conditions)).orderBy(sql`created_at desc`)
      : await db.select().from(animals).orderBy(sql`created_at desc`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Animals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch animals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [animal] = await db.insert(animals).values({
      name: body.name,
      type: body.type,
      breed: body.breed || null,
      birthDate: body.birthDate || null,
      gender: body.gender || null,
      weight: body.weight || null,
      purchasePrice: body.purchasePrice || null,
      purchaseDate: body.purchaseDate || null,
      status: body.status || "active",
      notes: body.notes || null,
      tagNumber: body.tagNumber || null,
    }).returning();

    return NextResponse.json(animal);
  } catch (error) {
    console.error("Animals POST error:", error);
    return NextResponse.json({ error: "Failed to create animal" }, { status: 500 });
  }
}
