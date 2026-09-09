import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedStock, feedTransactions } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  try {
    const stock = await db.select().from(feedStock).orderBy(sql`updated_at desc`);
    const transactions = await db.select().from(feedTransactions).orderBy(sql`date desc, created_at desc`).limit(50);
    return NextResponse.json({ stock, transactions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feed data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "add_stock") {
      // Add new feed item
      const [item] = await db.insert(feedStock).values({
        name: body.name,
        type: body.type,
        quantity: body.quantity || "0",
        unit: body.unit || "kg",
        unitCost: body.unitCost || null,
        minQuantity: body.minQuantity || "0",
        animalType: body.animalType || null,
        notes: body.notes || null,
      }).returning();

      return NextResponse.json(item);
    }

    if (body.action === "transaction") {
      // Record a feed transaction
      const [transaction] = await db.insert(feedTransactions).values({
        date: body.date,
        feedId: body.feedId || null,
        feedName: body.feedName,
        transactionType: body.transactionType, // in or out
        quantity: body.quantity,
        unit: body.unit,
        cost: body.cost || null,
        animalType: body.animalType || null,
        notes: body.notes || null,
      }).returning();

      // Update stock quantity
      if (body.feedId) {
        if (body.transactionType === "in") {
          await db
            .update(feedStock)
            .set({
              quantity: sql`quantity + ${body.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(feedStock.id, body.feedId));
        } else {
          await db
            .update(feedStock)
            .set({
              quantity: sql`greatest(0, quantity - ${body.quantity})`,
              updatedAt: new Date(),
            })
            .where(eq(feedStock.id, body.feedId));
        }
      }

      return NextResponse.json(transaction);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Feed POST error:", error);
    return NextResponse.json({ error: "Failed to process feed request" }, { status: 500 });
  }
}
