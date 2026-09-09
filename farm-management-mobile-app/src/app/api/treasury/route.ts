import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { treasury, purchases, sales, expenses, incomes } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all financial transactions combined and ordered by date
    const allPurchases = await db.select().from(purchases).orderBy(sql`date desc`);
    const allSales = await db.select().from(sales).orderBy(sql`date desc`);
    const allExpenses = await db.select().from(expenses).orderBy(sql`date desc`);
    const allIncomes = await db.select().from(incomes).orderBy(sql`date desc`);

    // Combine all transactions
    const allTransactions = [
      ...allPurchases.map((p) => ({
        id: `p_${p.id}`,
        date: p.date,
        type: "expense" as const,
        category: `مشتريات - ${p.category}`,
        description: p.description,
        amount: parseFloat(p.totalAmount),
        source: "purchase",
      })),
      ...allSales.map((s) => ({
        id: `s_${s.id}`,
        date: s.date,
        type: "income" as const,
        category: `مبيعات - ${s.category}`,
        description: s.description,
        amount: parseFloat(s.totalAmount),
        source: "sale",
      })),
      ...allExpenses.map((e) => ({
        id: `e_${e.id}`,
        date: e.date,
        type: "expense" as const,
        category: `مصاريف - ${e.category}`,
        description: e.description,
        amount: parseFloat(e.amount),
        source: "expense",
      })),
      ...allIncomes.map((i) => ({
        id: `i_${i.id}`,
        date: i.date,
        type: "income" as const,
        category: `مداخيل - ${i.category}`,
        description: i.description,
        amount: parseFloat(i.amount),
        source: "income",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate running balance
    const totalIncome = allTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: allTransactions.slice(0, 100),
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("Treasury GET error:", error);
    return NextResponse.json({ error: "Failed to fetch treasury data" }, { status: 500 });
  }
}
