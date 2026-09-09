import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases, sales, expenses, incomes, animals, healthRecords, feedTransactions } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const to = searchParams.get("to") || new Date().toISOString().split("T")[0];

    // Sales by category
    const salesByCategory = await db
      .select({
        category: sales.category,
        total: sql<string>`coalesce(sum(total_amount), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(sales)
      .where(and(gte(sales.date, from), lte(sales.date, to)))
      .groupBy(sales.category);

    // Purchases by category
    const purchasesByCategory = await db
      .select({
        category: purchases.category,
        total: sql<string>`coalesce(sum(total_amount), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(purchases)
      .where(and(gte(purchases.date, from), lte(purchases.date, to)))
      .groupBy(purchases.category);

    // Expenses by category
    const expensesByCategory = await db
      .select({
        category: expenses.category,
        total: sql<string>`coalesce(sum(amount), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .where(and(gte(expenses.date, from), lte(expenses.date, to)))
      .groupBy(expenses.category);

    // Incomes by category
    const incomesByCategory = await db
      .select({
        category: incomes.category,
        total: sql<string>`coalesce(sum(amount), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(incomes)
      .where(and(gte(incomes.date, from), lte(incomes.date, to)))
      .groupBy(incomes.category);

    // Totals
    const totalSales = salesByCategory.reduce((s, c) => s + parseFloat(c.total), 0);
    const totalPurchases = purchasesByCategory.reduce((s, c) => s + parseFloat(c.total), 0);
    const totalExpenses = expensesByCategory.reduce((s, c) => s + parseFloat(c.total), 0);
    const totalIncomes = incomesByCategory.reduce((s, c) => s + parseFloat(c.total), 0);

    // Animal counts
    const animalCounts = await db
      .select({
        type: animals.type,
        status: animals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(animals)
      .groupBy(animals.type, animals.status);

    // Monthly breakdown (sales + incomes vs purchases + expenses)
    const monthlyData = await db
      .select({
        month: sql<string>`to_char(date::date, 'YYYY-MM')`,
        totalSales: sql<string>`coalesce(sum(total_amount), 0)`,
      })
      .from(sales)
      .where(and(gte(sales.date, from), lte(sales.date, to)))
      .groupBy(sql`to_char(date::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(date::date, 'YYYY-MM')`);

    const monthlyExpensesData = await db
      .select({
        month: sql<string>`to_char(date::date, 'YYYY-MM')`,
        totalExpenses: sql<string>`coalesce(sum(total_amount), 0)`,
      })
      .from(purchases)
      .where(and(gte(purchases.date, from), lte(purchases.date, to)))
      .groupBy(sql`to_char(date::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(date::date, 'YYYY-MM')`);

    // Health costs
    const healthCosts = await db
      .select({
        total: sql<string>`coalesce(sum(total_cost), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(healthRecords)
      .where(and(gte(healthRecords.date, from), lte(healthRecords.date, to)));

    const grossIncome = totalSales + totalIncomes;
    const grossExpense = totalPurchases + totalExpenses;
    const netProfit = grossIncome - grossExpense;

    return NextResponse.json({
      period: { from, to },
      financials: {
        grossIncome,
        grossExpense,
        netProfit,
        profitMargin: grossIncome > 0 ? ((netProfit / grossIncome) * 100).toFixed(1) : "0",
        totalSales,
        totalPurchases,
        totalExpenses,
        totalIncomes,
      },
      salesByCategory,
      purchasesByCategory,
      expensesByCategory,
      incomesByCategory,
      animalCounts,
      monthlyData,
      monthlyExpensesData,
      health: {
        totalCost: parseFloat(healthCosts[0]?.total || "0"),
        count: healthCosts[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
