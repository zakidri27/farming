"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  source: string;
}

interface TreasuryData {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    fetch("/api/treasury").then((r) => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = data?.transactions.filter((t) => filter === "all" || t.type === filter) || [];

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الخزينة" subtitle="السجل المالي" />

      <div className="px-4 py-3">
        {/* Balance Card */}
        <div className={`rounded-2xl p-5 mb-4 text-white ${(data?.summary.balance ?? 0) >= 0 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
          <p className="text-white/80 text-sm mb-1">الرصيد الحالي</p>
          <p className="text-3xl font-bold">{loading ? "..." : formatCurrency(data?.summary.balance || 0)}</p>
          <div className="flex justify-between mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs">📈 إجمالي المداخيل</p>
              <p className="text-white font-bold">{loading ? "..." : formatCurrency(data?.summary.totalIncome || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">📉 إجمالي المصاريف</p>
              <p className="text-white font-bold">{loading ? "..." : formatCurrency(data?.summary.totalExpense || 0)}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { value: "all", label: "الكل" },
            { value: "income", label: "📈 مداخيل" },
            { value: "expense", label: "📉 مصاريف" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as "all" | "income" | "expense")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${filter === f.value ? "bg-amber-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🏦</p><p className="text-gray-500">لا توجد معاملات</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 fade-in">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${t.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                  {t.type === "income" ? "📈" : "📉"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{t.description}</p>
                  <p className="text-xs text-gray-500 truncate">{t.category}</p>
                  <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
