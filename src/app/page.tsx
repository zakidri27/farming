"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, getAnimalEmoji, getAnimalLabel } from "@/lib/utils";
import { useApp, TKey } from "@/lib/i18n";

interface DashboardData {
  animals: { total: number; byType: { type: string; count: number }[] };
  treasury: { capital: number; balance: number; monthIn: number; monthOut: number };
  monthly: { income: number; expense: number; profit: number; purchases: number; sales: number; expenses: number; incomes: number };
  debts: { owedToUs: number; weOwe: number };
  alerts: { health: number; lowFeed: number; lowFeedItems: { name: string; quantity: string; unit: string }[] };
}

const quickLinks: { href: string; key: TKey; icon: string; color: string }[] = [
  { href: "/animals", key: "nav_animals", icon: "🐄", color: "bg-green-500" },
  { href: "/feed", key: "nav_feed", icon: "🌾", color: "bg-yellow-600" },
  { href: "/purchases", key: "nav_purchases", icon: "🛒", color: "bg-blue-500" },
  { href: "/births", key: "nav_births", icon: "🍼", color: "bg-pink-400" },
  { href: "/health", key: "nav_health", icon: "🏥", color: "bg-pink-500" },
  { href: "/production", key: "nav_production", icon: "🥛", color: "bg-orange-400" },
  { href: "/sales", key: "nav_sales", icon: "💵", color: "bg-emerald-500" },
  { href: "/treasury", key: "nav_treasury", icon: "🏦", color: "bg-amber-500" },
  { href: "/expenses", key: "nav_expenses", icon: "💸", color: "bg-red-500" },
  { href: "/reports", key: "nav_reports", icon: "📑", color: "bg-cyan-500" },
  { href: "/contacts", key: "nav_contacts", icon: "👥", color: "bg-purple-500" },
  { href: "/tracking", key: "nav_tracking", icon: "🔍", color: "bg-indigo-500" },
  { href: "/records", key: "nav_records", icon: "📦", color: "bg-stone-500" },
  { href: "/backup", key: "nav_backup", icon: "💾", color: "bg-slate-500" },
];

export default function HomePage() {
  const { t, lang } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [birthsCount, setBirthsCount] = useState(0);
  const [prodTotal, setProdTotal] = useState(0);
  const currentMonth = new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => {
      if (d && !d.error) setData(d);
    }).catch(console.error).finally(() => setLoading(false));
    fetch("/api/births").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setBirthsCount(d.length);
    }).catch(() => {});
    fetch("/api/production").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setProdTotal(d.reduce((s: number, p: { totalValue?: string | null }) => s + parseFloat(p.totalValue || "0"), 0));
    }).catch(() => {});
  }, []);

  const monthly = data?.monthly ?? { income: 0, expense: 0, profit: 0, purchases: 0, sales: 0, expenses: 0, incomes: 0 };
  const treasury = data?.treasury ?? { capital: 0, balance: 0, monthIn: 0, monthOut: 0 };
  const animals = data?.animals ?? { total: 0, byType: [] };
  const alerts = data?.alerts ?? { health: 0, lowFeed: 0, lowFeedItems: [] };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <div className="gradient-green text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-green-100 text-sm">{lang === "ar" ? "مرحباً بك في" : lang === "fr" ? "Bienvenue à" : "Welcome to"}</p>
            <h1 className="text-2xl font-bold">🌿 {lang === "ar" ? "مزرعتي" : lang === "fr" ? "Ma Ferme" : "My Farm"}</h1>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">{currentMonth}</p>
            <p className="text-white font-medium text-sm">{t("nav_dashboard")}</p>
          </div>
        </div>

        <div className="mt-4 bg-white/20 backdrop-blur rounded-2xl p-4">
          <p className="text-green-100 text-xs mb-1">{t("dash_balance")}</p>
          <p className={`text-2xl font-bold ${treasury.balance >= 0 ? "text-white" : "text-red-200"}`}>
            {loading ? "..." : formatCurrency(treasury.balance)}
          </p>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-green-200 text-xs">{t("dash_month_in")}</p>
              <p className="text-white text-sm font-semibold">{loading ? "..." : formatCurrency(treasury.monthIn)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs">{t("dash_month_out")}</p>
              <p className="text-white text-sm font-semibold">{loading ? "..." : formatCurrency(treasury.monthOut)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">{t("dash_herd")}</h2>
            <Link href="/animals" className="text-green-600 text-sm font-medium">{lang === "ar" ? "عرض الكل ←" : lang === "fr" ? "Tout voir →" : "View all →"}</Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {["cow", "goat", "sheep", "chicken", "quail"].map((type) => {
              const count = animals.byType.find((a) => a.type === type)?.count || 0;
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
            <span className="font-bold text-green-700 text-lg">{loading ? "..." : animals.total}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="text-blue-600 text-xs">🛒 المشتريات هذا الشهر</p>
            <p className="text-blue-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(monthly.purchases)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
            <p className="text-green-600 text-xs">💵 المبيعات هذا الشهر</p>
            <p className="text-green-800 font-bold text-sm mt-1">{loading ? "..." : formatCurrency(monthly.sales)}</p>
          </div>
          <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3">
            <p className="text-pink-600 text-xs">🍼 المواليد (الكل)</p>
            <p className="text-pink-800 font-bold text-sm mt-1">{birthsCount}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
            <p className="text-orange-600 text-xs">🥛 قيمة الإنتاج (الكل)</p>
            <p className="text-orange-800 font-bold text-sm mt-1">{formatCurrency(prodTotal)}</p>
          </div>
        </div>

        {alerts.lowFeed > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚠️</span>
              <h3 className="font-semibold text-amber-800">تنبيهات</h3>
            </div>
            {alerts.lowFeedItems.map((item, i) => (
              <Link key={i} href="/feed" className="block bg-white rounded-xl p-3 mb-2">
                <p className="text-amber-700 text-sm font-medium">مخزون الغذاء منخفض</p>
                <p className="text-xs text-gray-600 mt-1">• {item.name}: {item.quantity} {item.unit}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">{t("dash_quick")}</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1.5 card-hover">
                <div className={`w-12 h-12 ${link.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
                  {link.icon}
                </div>
                <span className="text-xs text-gray-600 text-center leading-tight">{t(link.key)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
