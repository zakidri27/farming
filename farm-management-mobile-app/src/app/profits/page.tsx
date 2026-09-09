"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  financials: {
    grossIncome: number;
    grossExpense: number;
    netProfit: number;
    profitMargin: string;
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalIncomes: number;
  };
  salesByCategory: { category: string; total: string; count: number }[];
  expensesByCategory: { category: string; total: string; count: number }[];
  purchasesByCategory: { category: string; total: string; count: number }[];
  health: { totalCost: number; count: number };
  period: { from: string; to: string };
}

const categoryLabels: Record<string, string> = {
  animal: "حيوانات",
  feed: "علف",
  medicine: "أدوية",
  equipment: "معدات",
  transport: "نقل",
  milk: "حليب",
  eggs: "بيض",
  meat: "لحم",
  wool: "صوف",
  salary: "رواتب",
  electricity: "كهرباء",
  water: "ماء",
  maintenance: "صيانة",
  rent: "إيجار",
  other: "أخرى",
  manure: "سماد",
  breeding: "تربية",
  subsidy: "دعم حكومي",
};

export default function ProfitsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const getPeriodDates = (p: string) => {
    const now = new Date();
    const to = now.toISOString().split("T")[0];
    if (p === "month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      return { from, to };
    }
    if (p === "quarter") {
      const from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0];
      return { from, to };
    }
    if (p === "year") {
      const from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      return { from, to };
    }
    return { from: to, to };
  };

  useEffect(() => {
    const { from, to } = getPeriodDates(period);
    setLoading(true);
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const isProfit = (data?.financials.netProfit || 0) >= 0;

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الأرباح والخسائر" subtitle="الملخص المالي" />

      <div className="px-4 py-3">
        {/* Period Selector */}
        <div className="flex gap-2 mb-4">
          {[
            { value: "month", label: "الشهر" },
            { value: "quarter", label: "الربع" },
            { value: "year", label: "السنة" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${period === p.value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !data ? null : (
          <>
            {/* Main P&L Card */}
            <div className={`rounded-2xl p-5 mb-4 text-white ${isProfit ? "bg-gradient-to-br from-indigo-600 to-indigo-700" : "bg-gradient-to-br from-red-600 to-red-700"}`}>
              <p className="text-white/80 text-sm mb-1">{isProfit ? "🎉 صافي الربح" : "⚠️ صافي الخسارة"}</p>
              <p className="text-3xl font-bold">{formatCurrency(Math.abs(data.financials.netProfit))}</p>
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex justify-between">
                  <div>
                    <p className="text-white/70 text-xs">هامش الربح</p>
                    <p className="text-white font-bold">{data.financials.profitMargin}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs">الفترة</p>
                    <p className="text-white text-sm">{data.period.from} → {data.period.to}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Income vs Expense */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
                <p className="text-green-600 text-xs font-medium">📈 إجمالي المداخيل</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(data.financials.grossIncome)}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-600">مبيعات: {formatCurrency(data.financials.totalSales)}</p>
                  <p className="text-xs text-gray-600">مداخيل: {formatCurrency(data.financials.totalIncomes)}</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                <p className="text-red-600 text-xs font-medium">📉 إجمالي المصاريف</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(data.financials.grossExpense)}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-600">مشتريات: {formatCurrency(data.financials.totalPurchases)}</p>
                  <p className="text-xs text-gray-600">مصاريف: {formatCurrency(data.financials.totalExpenses)}</p>
                </div>
              </div>
            </div>

            {/* Health Costs */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-bold text-gray-800 mb-3">🏥 تكاليف الصحة والبيطرة</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">{data.health.count} زيارة طبية</span>
                <span className="font-bold text-pink-600">{formatCurrency(data.health.totalCost)}</span>
              </div>
            </div>

            {/* Sales Breakdown */}
            {data.salesByCategory.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <h3 className="font-bold text-gray-800 mb-3">📊 تفاصيل المبيعات</h3>
                <div className="space-y-3">
                  {data.salesByCategory.map((c) => {
                    const maxVal = Math.max(...data.salesByCategory.map((x) => parseFloat(x.total)));
                    const pct = maxVal > 0 ? (parseFloat(c.total) / maxVal) * 100 : 0;
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{categoryLabels[c.category] || c.category} ({c.count})</span>
                          <span className="font-bold text-green-700">{formatCurrency(c.total)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expense Breakdown */}
            {data.expensesByCategory.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <h3 className="font-bold text-gray-800 mb-3">📊 تفاصيل المصاريف</h3>
                <div className="space-y-3">
                  {data.expensesByCategory.map((c) => {
                    const maxVal = Math.max(...data.expensesByCategory.map((x) => parseFloat(x.total)));
                    const pct = maxVal > 0 ? (parseFloat(c.total) / maxVal) * 100 : 0;
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{categoryLabels[c.category] || c.category} ({c.count})</span>
                          <span className="font-bold text-red-700">{formatCurrency(c.total)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
