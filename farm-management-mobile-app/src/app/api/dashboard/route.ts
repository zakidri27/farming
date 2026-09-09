import { NextResponse } from "next/server";
import { db } from "@/db";
import { animals, purchases, sales, expenses, incomes, debts, healthRecords, feedStock } from "@/db/schema";
import { sql, eq, gte, and } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

    // Animal counts by type
    const animalCounts = await db
      .select({
        type: animals.type,
        count: sql<number>`count(*)::int`,
      })
      .from(animals)
      .where(eq(animals.status, "active"))
      .groupBy(animals.type);

    const totalAnimals = animalCounts.reduce((sum, a) => sum + a.count, 0);

    // Monthly financials
    const monthlyPurchases = await db
      .select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
      .from(purchases)
      .where(gte(purchases.date, startOfMonth));

    const monthlySales = await db
      .select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
      .from(sales)
      .where(gte(sales.date, startOfMonth));

    const monthlyExpenses = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(expenses)
      .where(gte(expenses.date, startOfMonth));

    const monthlyIncomes = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(incomes)
      .where(gte(incomes.date, startOfMonth));

    // Yearly financials
    const yearlyIncome = await db
      .select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
      .from(sales)
      .where(gte(sales.date, startOfYear));

    const yearlyExpenseAll = await db
      .select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
      .from(purchases)
      .where(gte(purchases.date, startOfYear));

    // Pending debts
    const pendingDebts = await db
      .select({
        type: debts.type,
        total: sql<string>`coalesce(sum(total_amount - paid_amount), 0)`,
      })
      .from(debts)
      .where(sql`status != 'paid'`)
      .groupBy(debts.type);

    // Recent health alerts
    const recentHealth = await db
      .select()
      .from(healthRecords)
      .orderBy(sql`created_at desc`)
      .limit(3);

    // Low feed stock
    const lowFeed = await db
      .select()
      .from(feedStock)
      .where(sql`quantity <= min_quantity`)
      .limit(5);

    const totalIncome = parseFloat(monthlySales[0]?.total || "0") + parseFloat(monthlyIncomes[0]?.total || "0");
    const totalExpense = parseFloat(monthlyPurchases[0]?.total || "0") + parseFloat(monthlyExpenses[0]?.total || "0");

    return NextResponse.json({
      animals: {
        total: totalAnimals,
        byType: animalCounts,
      },
      monthly: {
        income: totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense,
        purchases: parseFloat(monthlyPurchases[0]?.total || "0"),
        sales: parseFloat(monthlySales[0]?.total || "0"),
        expenses: parseFloat(monthlyExpenses[0]?.total || "0"),
        incomes: parseFloat(monthlyIncomes[0]?.total || "0"),
      },
      yearly: {
        income: parseFloat(yearlyIncome[0]?.total || "0"),
        expense: parseFloat(yearlyExpenseAll[0]?.total || "0"),
      },
      debts: {
        owedToUs: parseFloat(pendingDebts.find((d) => d.type === "owed_to_us")?.total || "0"),
        weOwe: parseFloat(pendingDebts.find((d) => d.type === "we_owe")?.total || "0"),
      },
      alerts: {
        health: recentHealth.length,
        lowFeed: lowFeed.length,
        lowFeedItems: lowFeed,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
