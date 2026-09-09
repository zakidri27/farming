"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, getAnimalEmoji, getAnimalLabel } from "@/lib/utils";

interface DashboardData {
  animals: {
    total: number;
    byType: { type: string; count: number }[];
  };
  monthly: {
    income: number;
    expense: number;
    profit: number;
    purchases: number;
    sales: number;
    expenses: number;
    incomes: number;
  };
  debts: {
    owedToUs: number;
    weOwe: number;
  };
  alerts: {
    health: number;
    lowFeed: number;
    lowFeedItems: { name: string; quantity: string; unit: string }[];
  };
}

const quickLinks = [
  { href: "/animals", label: "الحيوانات", icon: "🐄", color: "bg-green-500" },
  { href: "/purchases", label: "المشتريات", icon: "🛒", color: "bg-blue-500" },
  { href: "/sales", label: "المبيعات", icon: "💵", color: "bg-emerald-500" },
  { href: "/expenses", label: "المصاريف", icon: "💸", color: "bg-red-500" },
  { href: "/incomes", label: "المداخيل", icon: "📈", color: "bg-teal-500" },
  { href: "/treasury", label: "الخزينة", icon: "🏦", color: "bg-amber-500" },
  { href: "/feed", label: "العلف", icon: "🌾", color: "bg-yellow-600" },
  { href: "/health", label: "الصحة والبيطرة", icon: "🏥", color: "bg-pink-500" },
  { href: "/contacts", label: "العملاء والموردون", icon: "👥", color: "bg-purple-500" },
  { href: "/debts", label: "الديون", icon: "📋", color: "bg-orange-500" },
  { href: "/profits", label: "الأرباح والخسائر", icon: "📊", color: "bg-indigo-500" },
  { href: "/reports", label: "التقارير", icon: "📑", color: "bg-cyan-500" },
];

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      {/* Header */}
      <div className="gradient-green text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-green-100 text-sm">مرحباً بك في</p>
            <h1 className="text-2xl font-bold">🌿 مزرعتي</h1>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">{currentMonth}</p>
            <p className="text-white font-medium text-sm">لوحة التحكم</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-4 bg-white/20 backdrop-blur rounded-2xl p-4">
          <p className="text-green-100 text-xs mb-1">رصيد الشهر الحالي</p>
          <p className={`text-2xl font-bold ${data?.monthly.profit !== undefined && data.monthly.profit >= 0 ? "text-white" : "text-red-200"}`}>
            {loading ? "..." : formatCurrency(data?.monthly.profit || 0)}
          </p>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-green-200 text-xs">المداخيل</p>
              <p className="text-white text-sm font-semibold">{loading ? "..." : formatCurrency(data?.monthly.income || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs">المصاريف</p>
              <p className="text-white text-sm font-semibold">{loading ? "..." : formatCurrency(data?.monthly.expense || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* Animals Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">قطيع المزرعة</h2>
            <Link href="/animals" className="text-green-600 text-sm font-medium">عرض الكل ←</Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {["cow", "goat", "sheep", "chicken", "quail"].map((type) => {
              const count = data?.animals.byType.find((a) => a.type === type)?.count || 0;
              return (
                <Link key={type} href={`/animals?type=${type}`} className="flex flex-col items-center bg-green-50 rounded-xl p-2 card-hover">
                  <span className="text-2xl">{getAnimalEmoji(type)}</span>
                  <span className="text-xs text-gray-600 mt-1">{getAnimalLabel(type)}</span>
                  <span className="text-base font-bold text-green-700">{loading ? "-" : count}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 text-center bg-green-50 rounded-xl py-2">
            <span className="text-gray-600 text-sm">إجمالي الحيوانات: </span>
            <span className="font-bold text-green-700 text-lg">{loading ? "..." : data?.animals.total || 0}</span>
          </div>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="text-blue-600 text-xs">المشتريات هذا الشهر</p>
            <p className="text-blue-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(data?.monthly.purchases || 0)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
            <p className="text-green-600 text-xs">المبيعات هذا الشهر</p>
            <p className="text-green-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(data?.monthly.sales || 0)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
            <p className="text-red-600 text-xs">ديون علينا</p>
            <p className="text-red-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(data?.debts.weOwe || 0)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
            <p className="text-emerald-600 text-xs">ديون لنا</p>
            <p className="text-emerald-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(data?.debts.owedToUs || 0)}</p>
          </div>
        </div>

        {/* Alerts */}
        {data && (data.alerts.lowFeed > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚠️</span>
              <h3 className="font-semibold text-amber-800">تنبيهات</h3>
            </div>
            {data.alerts.lowFeed > 0 && (
              <div className="bg-white rounded-xl p-3 mb-2">
                <p className="text-amber-700 text-sm font-medium">مخزون العلف منخفض</p>
                {data.alerts.lowFeedItems.map((item, i) => (
                  <p key={i} className="text-xs text-gray-600 mt-1">• {item.name}: {item.quantity} {item.unit}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">الوصول السريع</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1.5 card-hover"
              >
                <div className={`w-12 h-12 ${link.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
                  {link.icon}
                </div>
                <span className="text-xs text-gray-600 text-center leading-tight">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
