"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, getAnimalEmoji, getAnimalLabel } from "@/lib/utils";

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
  purchasesByCategory: { category: string; total: string; count: number }[];
  animalCounts: { type: string; status: string; count: number }[];
  monthlyData: { month: string; totalSales: string }[];
  monthlyExpensesData: { month: string; totalExpenses: string }[];
  health: { totalCost: number; count: number };
}

const months: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${months[m] || m} ${y}`;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchReport = () => {
    setLoading(true);
    fetch(`/api/reports?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, [fromDate, toDate]);

  const reportLinks = [
    { href: "/profits", label: "الأرباح والخسائر", icon: "📊", color: "bg-indigo-100 text-indigo-600" },
    { href: "/treasury", label: "الخزينة", icon: "🏦", color: "bg-amber-100 text-amber-600" },
    { href: "/animals", label: "تقرير الحيوانات", icon: "🐄", color: "bg-green-100 text-green-600" },
    { href: "/health", label: "السجل الصحي", icon: "🏥", color: "bg-pink-100 text-pink-600" },
    { href: "/debts", label: "الديون", icon: "📋", color: "bg-orange-100 text-orange-600" },
    { href: "/feed", label: "مخزون العلف", icon: "🌾", color: "bg-yellow-100 text-yellow-600" },
  ];

  const animalSummary = ["cow", "goat", "sheep", "chicken", "quail"].map((type) => {
    const active = data?.animalCounts.find((a) => a.type === type && a.status === "active")?.count || 0;
    const total = data?.animalCounts.filter((a) => a.type === type).reduce((s, a) => s + a.count, 0) || 0;
    return { type, active, total };
  });

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="التقارير" subtitle="نظرة عامة" />

      <div className="px-4 py-3">
        {/* Date Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📅 الفترة الزمنية</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">من</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">إلى</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: "هذا الشهر", action: () => { const now = new Date(); setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]); setToDate(now.toISOString().split("T")[0]); } },
              { label: "هذه السنة", action: () => { const now = new Date(); setFromDate(new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]); setToDate(now.toISOString().split("T")[0]); } },
            ].map((b) => (
              <button key={b.label} onClick={b.action} className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{b.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !data ? null : (
          <>
            {/* Financial Summary */}
            <div className={`rounded-2xl p-4 mb-4 text-white ${data.financials.netProfit >= 0 ? "gradient-green" : "gradient-red"}`}>
              <p className="text-white/80 text-xs mb-1">صافي النتيجة</p>
              <p className="text-2xl font-bold">{formatCurrency(data.financials.netProfit)}</p>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20 text-sm">
                <div>
                  <p className="text-white/70 text-xs">إجمالي المداخيل</p>
                  <p className="font-bold">{formatCurrency(data.financials.grossIncome)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">إجمالي المصاريف</p>
                  <p className="font-bold">{formatCurrency(data.financials.grossExpense)}</p>
                </div>
              </div>
            </div>

            {/* 4-way breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "المبيعات", value: data.financials.totalSales, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "المداخيل", value: data.financials.totalIncomes, color: "text-teal-700", bg: "bg-teal-50" },
                { label: "المشتريات", value: data.financials.totalPurchases, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "المصاريف", value: data.financials.totalExpenses, color: "text-red-700", bg: "bg-red-50" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-3`}>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart (simple bars) */}
            {data.monthlyData.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <h3 className="font-bold text-gray-800 mb-3">📈 المبيعات الشهرية</h3>
                <div className="space-y-2">
                  {data.monthlyData.slice(-6).map((m) => {
                    const maxVal = Math.max(...data.monthlyData.map((x) => parseFloat(x.totalSales)));
                    const pct = maxVal > 0 ? (parseFloat(m.totalSales) / maxVal) * 100 : 0;
                    return (
                      <div key={m.month}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-500">{formatMonth(m.month)}</span>
                          <span className="font-medium">{formatCurrency(m.totalSales)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Animal Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-bold text-gray-800 mb-3">🐾 ملخص الحيوانات</h3>
              <div className="space-y-2">
                {animalSummary.filter((a) => a.total > 0).map((a) => (
                  <div key={a.type} className="flex items-center gap-3">
                    <span className="text-xl">{getAnimalEmoji(a.type)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-600">{getAnimalLabel(a.type)}</span>
                        <span className="font-medium">{a.active} نشط / {a.total} إجمالي</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${a.total > 0 ? (a.active / a.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📑 التقارير التفصيلية</h3>
              <div className="grid grid-cols-2 gap-3">
                {reportLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={`flex items-center gap-2 p-3 rounded-xl ${link.color} card-hover`}>
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
