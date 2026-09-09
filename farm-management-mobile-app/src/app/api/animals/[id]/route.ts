import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [animal] = await db.select().from(animals).where(eq(animals.id, parseInt(id)));
    if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(animal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch animal" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [animal] = await db
      .update(animals)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(animals.id, parseInt(id)))
      .returning();

    return NextResponse.json(animal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update animal" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(animals).where(eq(animals.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete animal" }, { status: 500 });
  }
}
