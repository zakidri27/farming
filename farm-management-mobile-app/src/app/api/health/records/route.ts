import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { healthRecords } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(healthRecords).orderBy(sql`date desc, created_at desc`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch health records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const totalCost = (parseFloat(body.medicineCost || "0") + parseFloat(body.vetCost || "0")).toString();

    const [record] = await db.insert(healthRecords).values({
      date: body.date,
      animalId: body.animalId || null,
      animalType: body.animalType || null,
      recordType: body.recordType,
      description: body.description,
      diagnosis: body.diagnosis || null,
      treatment: body.treatment || null,
      medicine: body.medicine || null,
      medicineCost: body.medicineCost || null,
      vetName: body.vetName || null,
      vetCost: body.vetCost || null,
      totalCost: totalCost || null,
      nextVisitDate: body.nextVisitDate || null,
      status: body.status || "healthy",
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(record);
  } catch (error) {
    console.error("Health POST error:", error);
    return NextResponse.json({ error: "Failed to create health record" }, { status: 500 });
  }
}
