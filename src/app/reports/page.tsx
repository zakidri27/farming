"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { formatCurrency, getAnimalEmoji, getAnimalLabel } from "@/lib/utils";
import { useApp } from "@/lib/i18n";

interface Money { date: string; totalAmount?: string; amount?: string; createdAt?: string | null; }
interface Animal { type: string; status: string; }
interface Prod { date: string; productType: string; quantity: string; totalValue?: string | null; createdAt?: string | null; }
interface Birth { date: string; createdAt?: string | null; }
interface HRec { date: string; recordType: string; createdAt?: string | null; }
interface Txn { date: string; feedName: string; transactionType: string; quantity: string; unit: string; createdAt?: string | null; }
interface Sale2 extends Money { category: string; customerId: number | null; productType: string | null; description: string; }
interface Purch2 extends Money { category: string; supplierId: number | null; }
interface Contact { id: number; name: string; type: string; }
type Period = "week" | "month" | "year";

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "صورة تفصيلية لحالة المشروع", en: "A detailed picture of the farm", fr: "Vue détaillée de l'exploitation" },
  per_label: { ar: "📅 عرض حسب", en: "📅 View by", fr: "📅 Vue par" },
  per_week: { ar: "الأسبوع", en: "Week", fr: "Semaine" },
  per_month: { ar: "الشهر", en: "Month", fr: "Mois" },
  per_year: { ar: "السنة", en: "Year", fr: "Année" },
  sales: { ar: "💵 المبيعات", en: "💵 Sales", fr: "💵 Ventes" },
  expenses: { ar: "💸 المصاريف", en: "💸 Expenses", fr: "💸 Dépenses" },
  net: { ar: "📊 الصافي", en: "📊 Net", fr: "📊 Net" },
  sec_prod_curve: { ar: "🥛 منحنى قيمة الإنتاج", en: "🥛 Production value curve", fr: "🥛 Courbe de la valeur produite" },
  sec_sales_exp: { ar: "📊 المبيعات مقابل المصاريف", en: "📊 Sales vs expenses", fr: "📊 Ventes vs dépenses" },
  leg_sales: { ar: "مبيعات", en: "Sales", fr: "Ventes" },
  leg_exp: { ar: "المصاريف", en: "Expenses", fr: "Dépenses" },
  sec_herd: { ar: "🐄 توزيع القطيع", en: "🐄 Herd distribution", fr: "🐄 Répartition du troupeau" },
  herd_empty: { ar: "لا توجد حيوانات نشطة", en: "No active animals", fr: "Aucun animal actif" },
  sec_purch: { ar: "🛒 المشتريات حسب الصنف", en: "🛒 Purchases by category", fr: "🛒 Achats par catégorie" },
  purch_empty: { ar: "لا توجد مشتريات في الفترة", en: "No purchases in this period", fr: "Aucun achat sur cette période" },
  sec_exp: { ar: "💸 المصاريف حسب الصنف", en: "💸 Expenses by category", fr: "💸 Dépenses par catégorie" },
  exp_empty: { ar: "لا توجد مصاريف في الفترة", en: "No expenses in this period", fr: "Aucune dépense sur cette période" },
  sec_prodtype: { ar: "🥛 الإنتاج حسب المنتج", en: "🥛 Production by product", fr: "🥛 Production par produit" },
  prod_empty: { ar: "لا يوجد إنتاج في الفترة", en: "No production in this period", fr: "Aucune production sur cette période" },
  sec_births: { ar: "🍼 المواليد/شهر", en: "🍼 Births/month", fr: "🍼 Naissances/mois" },
  sec_health: { ar: "🏥 السجلات الصحية", en: "🏥 Health records", fr: "🏥 Dossiers santé" },
  health_empty: { ar: "لا توجد سجلات في الفترة", en: "No records in this period", fr: "Aucun dossier sur cette période" },
  sec_feed: { ar: "🌾 حركات الغذاء", en: "🌾 Feed movements", fr: "🌾 Mouvements d'aliment" },
  feed_in: { ar: "دخول", en: "In", fr: "Entrées" },
  feed_out: { ar: "إطعام", en: "Fed", fr: "Distribué" },
  view: { ar: "عرض ←", en: "View →", fr: "Voir →" },
  sec_customers: { ar: "🧑 أفضل العملاء", en: "🧑 Top customers", fr: "🧑 Meilleurs clients" },
  cust_empty: { ar: "لا توجد مبيعات في الفترة", en: "No sales in this period", fr: "Aucune vente sur cette période" },
  sec_suppliers: { ar: "🚚 أكبر الموردين", en: "🚚 Top suppliers", fr: "🚚 Principaux fournisseurs" },
  supp_empty: { ar: "لا توجد مشتريات في الفترة", en: "No purchases in this period", fr: "Aucun achat sur cette période" },
  card_births: { ar: "🍼 المواليد", en: "🍼 Births", fr: "🍼 Naissances" },
  card_tracking: { ar: "🔍 تتبع الحيوانات", en: "🔍 Animal tracking", fr: "🔍 Suivi des animaux" },
  purch_animal: { ar: "🐄 حيوانات", en: "🐄 Animals", fr: "🐄 Animaux" },
  purch_feed: { ar: "🌾 غذاء", en: "🌾 Feed", fr: "🌾 Aliment" },
  purch_equipment: { ar: "🔧 معدات", en: "🔧 Equipment", fr: "🔧 Équipement" },
  purch_medicine: { ar: "💊 أدوية", en: "💊 Medicine", fr: "💊 Médicaments" },
  purch_other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
  exp_purchase: { ar: "🛒 مشتريات", en: "🛒 Purchases", fr: "🛒 Achats" },
  exp_health: { ar: "🏥 صحة", en: "🏥 Health", fr: "🏥 Santé" },
  exp_feed: { ar: "🌾 غذاء", en: "🌾 Feed", fr: "🌾 Aliment" },
  exp_salary: { ar: "👷 أجور", en: "👷 Wages", fr: "👷 Salaires" },
  exp_electricity: { ar: "💡 كهرباء", en: "💡 Electricity", fr: "💡 Électricité" },
  exp_water: { ar: "💧 ماء", en: "💧 Water", fr: "💧 Eau" },
  exp_maintenance: { ar: "🔧 صيانة", en: "🔧 Maintenance", fr: "🔧 Entretien" },
  exp_transport: { ar: "🚚 نقل", en: "🚚 Transport", fr: "🚚 Transport" },
  exp_other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
  health_treatment: { ar: "💉 علاج", en: "💉 Treatment", fr: "💉 Traitement" },
  health_vaccination: { ar: "💊 تطعيم", en: "💊 Vaccination", fr: "💊 Vaccination" },
  health_checkup: { ar: "🩺 فحص", en: "🩺 Checkup", fr: "🩺 Contrôle" },
  health_deworming: { ar: "🧪 تجريع", en: "🧪 Deworming", fr: "🧪 Vermifuge" },
  health_other: { ar: "📋 أخرى", en: "📋 Other", fr: "📋 Autre" },
  prod_milk: { ar: "🥛 حليب", en: "🥛 Milk", fr: "🥛 Lait" },
  prod_eggs: { ar: "🥚 بيض", en: "🥚 Eggs", fr: "🥚 Œufs" },
  prod_wool: { ar: "🧶 صوف", en: "🧶 Wool", fr: "🧶 Laine" },
  prod_meat: { ar: "🥩 لحم", en: "🥩 Meat", fr: "🥩 Viande" },
  prod_honey: { ar: "🍯 عسل", en: "🍯 Honey", fr: "🍯 Miel" },
  prod_manure: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" },
  prod_other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
};

function isoD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const MONTHS_ALG = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DAYS_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const DAYS_SHORT_AR = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
const DAYS_SHORT_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const DAYS_SHORT_FR = ["Sam", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven"];

interface Bucket { k: string; label: string; }
function buildBuckets(period: Period, lang: string, m: { year: number; day: number; monthDay: number }): Bucket[] {
  if (period === "week") {
    const ws = new Date(m.year, m.monthDay - 1, m.day);
    ws.setDate(ws.getDate() - ((ws.getDay() + 1) % 7));
    const labels = lang === "ar" ? DAYS_SHORT_AR : lang === "fr" ? DAYS_SHORT_FR : DAYS_SHORT_EN;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i);
      return { k: isoD(d), label: labels[i] };
    });
  }
  if (period === "month") {
    const dim = new Date(m.year, m.monthDay, 0).getDate();
    return Array.from({ length: dim }, (_, i) => ({ k: String(i + 1).padStart(2, "0"), label: String(i + 1) }));
  }
  const months = lang === "ar" ? MONTHS_ALG : lang === "fr" ? MONTHS_FR : MONTHS_EN;
  return Array.from({ length: 12 }, (_, i) => ({ k: String(i + 1).padStart(2, "0"), label: months[i] }));
}

function bucketKeyOf(period: Period, dateStr: string, createdStr?: string | null): string {
  if (!dateStr) return "";
  if (period === "week") return dateStr.slice(0, 10);
  if (period === "month") return dateStr.slice(8, 10);
  return dateStr.slice(0, 7);
}

const shortNum = (v: number) =>
  new Intl.NumberFormat("ar-DZ", { notation: "compact", maximumFractionDigits: 1 }).format(v);

// منحنى مرن (Catmull-Rom → Bezier) بدل المستقيمات
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#84cc16"];

const W = 320, H = 170, PADX = 34, PADT = 14, PADB = 26;
function points(values: number[], max: number, min: number) {
  const range = Math.max(1e-9, max - min);
  return values.map((v, i) => ({
    x: PADX + (i * (W - PADX - 10)) / Math.max(1, values.length - 1),
    y: PADT + (1 - (v - min) / range) * (H - PADT - PADB),
  }));
}

export default function ReportsPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const purchLabel = (c: string) => L["purch_" + c]?.[lang] ?? c;
  const expLabel = (c: string) => L["exp_" + c]?.[lang] ?? c;
  const healthLabel = (c: string) => L["health_" + c]?.[lang] ?? c;
  const prodLabel = (c: string) => L["prod_" + c]?.[lang] ?? c;
  const [sales, setSales] = useState<Sale2[]>([]);
  const [purchases, setPurchases] = useState<Purch2[]>([]);
  const [expenses, setExpenses] = useState<Money[]>([]);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [births, setBirths] = useState<Birth[]>([]);
  const [health, setHealth] = useState<HRec[]>([]);
  const [feedTx, setFeedTx] = useState<Txn[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("year");

  const now = new Date();
  const todayStr = isoD(now);
  const wedStart = (() => { const w = new Date(now); w.setDate(now.getDate() - ((now.getDay() + 1) % 7)); return isoD(w); })();
  const from =
    period === "week" ? wedStart :
    period === "month" ? todayStr.slice(0, 7) + "-01" :
    `${now.getFullYear()}-01-01`;
  const to = todayStr;
  const bs = buildBuckets(period, lang, { year: now.getFullYear(), day: now.getDate(), monthDay: now.getMonth() + 1 });

  useEffect(() => {
    const get = (url: string, set: (d: never[]) => void) =>
      fetch(url).then((r) => r.json()).then((d: unknown) => {
        if (Array.isArray(d)) set(d as never[]);
        else if (d && typeof d === "object" && Array.isArray((d as { transactions?: unknown }).transactions)) set((d as { transactions: never[] }).transactions);
        else set([]);
      }).catch(() => set([]));
    Promise.all([
      get("/api/sales", setSales as unknown as (d: never[]) => void),
      get("/api/purchases", setPurchases as unknown as (d: never[]) => void),
      get("/api/expenses", setExpenses as unknown as (d: never[]) => void),
      get("/api/animals", setHerd as unknown as (d: never[]) => void),
      get("/api/production", setProds as unknown as (d: never[]) => void),
      get("/api/births", setBirths as unknown as (d: never[]) => void),
      get("/api/health/records", setHealth as unknown as (d: never[]) => void),
      get("/api/feed", setFeedTx as unknown as (d: never[]) => void),
      get("/api/contacts", setContacts as unknown as (d: never[]) => void),
    ]).finally(() => setLoading(false));
  }, []);

  const inRange = (d: string) => d >= from && d <= to;

  const rSales = sales.filter((s) => inRange(s.date));
  const rPurch = purchases.filter((s) => inRange(s.date));
  const rExp = expenses.filter((s) => inRange(s.date));
  const rProds = prods.filter((p) => inRange(p.date));
  const rBirths = births.filter((b) => inRange(b.date));
  const rHealth = health.filter((h) => inRange(h.date));
  const rFeed = feedTx.filter((ft) => inRange(ft.date));

  const sumB = (arr: Money[], key: "totalAmount" | "amount") =>
    bs.map((b) => arr.filter((s) => bucketKeyOf(period, s.date, s.createdAt) === b.k).reduce((x, s) => x + parseFloat(s[key] || "0"), 0));
  const salesB = sumB(rSales, "totalAmount");
  const purchB = sumB(rPurch, "totalAmount");
  const expB = sumB(rExp, "amount");
  const prodB = bs.map((b) => rProds.filter((p) => bucketKeyOf(period, p.date, p.createdAt) === b.k).reduce((x, p) => x + parseFloat(p.totalValue || "0"), 0));
  const birthsB = bs.map((b) => rBirths.filter((x) => bucketKeyOf(period, x.date, x.createdAt) === b.k).length);

  const active = herd.filter((a) => a.status === "active");
  const byType = ["cow", "goat", "sheep", "chicken", "quail"].map((tp) => ({ t: tp, n: active.filter((a) => a.type === tp).length })).filter((x) => x.n > 0);
  const herdTotal = byType.reduce((s, x) => s + x.n, 0);
  let acc = 0;
  const donut = byType.map((x, i) => {
    const frac = herdTotal ? x.n / herdTotal : 0;
    const seg = { ...x, color: COLORS[i % COLORS.length], from: acc, to: acc + frac };
    acc += frac;
    return seg;
  });
  const polar = (f: number) => { const a = (f * 360 - 90) * (Math.PI / 180); return [50 + 38 * Math.cos(a), 50 + 38 * Math.sin(a)]; };
  const arc = (from: number, to: number) => {
    if (to - from >= 1) return "M 12,50 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0";
    const [x1, y1] = polar(from); const [x2, y2] = polar(to);
    return `M 50 50 L ${x1} ${y1} A 38 38 0 ${to - from > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`;
  };

  const group = (arr: { date: string; category: string; totalAmount?: string; amount?: string }[], amt: (x: { totalAmount?: string; amount?: string }) => number, labelFn: (c: string) => string) => {
    const map = new Map<string, number>();
    for (const x of arr) map.set(x.category, (map.get(x.category) || 0) + amt(x));
    return [...map.entries()].map(([c, total], i) => ({ c, total, label: labelFn(c), color: COLORS[i % COLORS.length] })).sort((a, b) => b.total - a.total);
  };
  const purchByCat = group(rPurch as { date: string; category: string; totalAmount?: string }[], (x) => parseFloat(x.totalAmount || "0"), purchLabel);
  const expByCat = group(rExp as { date: string; category: string; amount?: string }[], (x) => parseFloat(x.amount || "0"), expLabel);
  const maxCat = Math.max(1, ...purchByCat.map((x) => x.total), ...expByCat.map((x) => x.total));

  const prodByType = ["milk", "eggs", "wool", "meat", "honey", "manure", "other"].map((tp) => ({
    t: tp, q: rProds.filter((p) => p.productType === tp).reduce((x, p) => x + parseFloat(p.quantity || "0"), 0),
    v: rProds.filter((p) => p.productType === tp).reduce((x, p) => x + parseFloat(p.totalValue || "0"), 0),
  })).filter((x) => x.q > 0);
  const maxProd = Math.max(1, ...prodByType.map((x) => x.q));

  const healthByType = ["treatment", "vaccination", "checkup", "deworming", "other"].map((tp) => ({
    t: tp, n: rHealth.filter((h) => h.recordType === tp).length,
  })).filter((x) => x.n > 0);
  const maxHealth = Math.max(1, ...healthByType.map((x) => x.n));
  const maxBirths = Math.max(1, ...birthsB);

  const feedIn = rFeed.filter((ft) => ft.transactionType === "in").length;
  const feedOut = rFeed.filter((ft) => ft.transactionType === "out").length;

  const topCustomers = contacts.map((c) => ({
    name: c.name, total: rSales.filter((s) => s.customerId === c.id).reduce((x, s) => x + parseFloat(s.totalAmount || "0"), 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const topSuppliers = contacts.map((c) => ({
    name: c.name, total: rPurch.filter((s) => s.supplierId === c.id).reduce((x, s) => x + parseFloat(s.totalAmount || "0"), 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTop = Math.max(1, ...topCustomers.map((x) => x.total), ...topSuppliers.map((x) => x.total));

  const totalSales = rSales.reduce((s, x) => s + parseFloat(x.totalAmount || "0"), 0);
  const totalExp = rExp.reduce((s, x) => s + parseFloat(x.amount || "0"), 0);

  // منحنى قيمة الإنتاج مع قيم المحور Y
  const vMax = Math.max(1, ...prodB);
  const prodPts = points(prodB, vMax, 0);
  const prodLine = smoothPath(prodPts);
  const prodArea = `${prodLine} L ${prodPts[prodPts.length - 1].x},${H - PADB} L ${prodPts[0].x},${H - PADB} Z`;
  const yTicks = [0, vMax / 2, vMax];

  const maxBar = Math.max(1, ...salesB, ...expB);

  const bar = (label: string, value: number, max: number, color: string, sub?: string) => (
    <div className="mb-2.5 last:mb-0" key={label}>
      <div className="flex justify-between text-xs mb-1"><span className="text-gray-700">{label} {sub && <span className="text-gray-400">• {sub}</span>}</span><span className="font-bold">{max > 1000 ? formatCurrency(value) : value}</span></div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_reports")} subtitle={tx("sub")} />
      <div className="px-4 py-3 space-y-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">{tx("per_label")}</h3>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["week", "month", "year"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium ${period === p ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100"}`}>{tx("per_" + p)}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                <p className="text-emerald-600 text-xs">{tx("sales")}</p>
                <p className="text-emerald-800 font-bold text-sm mt-1">{formatCurrency(totalSales)}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                <p className="text-red-600 text-xs">{tx("expenses")}</p>
                <p className="text-red-800 font-bold text-sm mt-1">{formatCurrency(totalExp)}</p>
              </div>
              <div className={`border rounded-2xl p-3 text-center ${totalSales - totalExp >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-200"}`}>
                <p className="text-xs text-gray-600">{tx("net")}</p>
                <p className="font-bold text-sm mt-1">{formatCurrency(totalSales - totalExp)}</p>
              </div>
            </div>

            {/* منحنى قيمة الإنتاج مع قيم Y */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-1">{tx("sec_prod_curve")}</h3>
              <div dir="ltr">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  {yTicks.map((yTick) => {
                    const y = PADT + (1 - yTick / vMax) * (H - PADT - PADB);
                    return (
                      <g key={yTick}>
                        <line x1={PADX} y1={y} x2={W - 10} y2={y} stroke="#f3f4f6" />
                        <text x={PADX - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{shortNum(yTick)}</text>
                      </g>
                    );
                  })}
                  <path d={prodArea} fill="url(#prodFill)" />
                  <path d={prodLine} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  {prodPts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                      <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309">{shortNum(prodB[i])}</text>
                      <text x={p.x} y={H - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">{bs[i].label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* أعمدة المبيعات/المصاريف */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-1">{tx("sec_sales_exp")}</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span><span className="inline-block w-3 h-3 bg-emerald-500 rounded ml-1" />{tx("leg_sales")}</span>
                <span><span className="inline-block w-3 h-3 bg-red-400 rounded ml-1" />{tx("leg_exp")}</span>
              </div>
              <div className="flex items-end justify-around h-40">
                {bs.map((b, i) => (
                  <div key={b.k} className="flex items-end gap-1 h-full">
                    <div className="flex flex-col items-center justify-end h-full">
                      <span className="text-[9px] font-bold text-emerald-600">{salesB[i] > 0 ? shortNum(salesB[i]) : ""}</span>
                      <div className="w-5 bg-emerald-500 rounded-t" style={{ height: `${(salesB[i] / maxBar) * 100}%`, minHeight: salesB[i] > 0 ? 4 : 0 }} />
                      <div className="w-5 bg-red-400 rounded-t mt-0.5" style={{ height: `${(expB[i] / maxBar) * 100}%`, minHeight: expB[i] > 0 ? 4 : 0 }} />
                      <span className="text-[10px] text-gray-500 mt-1">{b.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* دائرة القطيع (لقطة حالية) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">{tx("sec_herd")} ({herdTotal})</h3>
              {herdTotal === 0 ? <p className="text-sm text-gray-500 text-center">{tx("herd_empty")}</p> : (
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {donut.map((s) => <path key={s.t} d={arc(s.from, s.to)} fill={s.color} />)}
                    <circle cx="50" cy="50" r="20" fill="white" />
                    <text x="50" y="55" textAnchor="middle" fontSize="14" fontWeight="bold">{herdTotal}</text>
                  </svg>
                  <div className="space-y-1">
                    {donut.map((s) => (
                      <p key={s.t} className="text-xs text-gray-600">
                        <span className="inline-block w-3 h-3 rounded ml-1" style={{ background: s.color }} />
                        {getAnimalEmoji(s.t)} {getAnimalLabel(s.t, lang)}: {s.n} ({Math.round((s.to - s.from) * 100)}%)
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">{tx("sec_purch")}</h3>
              {purchByCat.length === 0 ? <p className="text-sm text-gray-500 text-center">{tx("purch_empty")}</p> :
                purchByCat.map((x) => bar(x.label, x.total, maxCat, x.color))}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">{tx("sec_exp")}</h3>
              {expByCat.length === 0 ? <p className="text-sm text-gray-500 text-center">{tx("exp_empty")}</p> :
                expByCat.map((x) => bar(x.label, x.total, maxCat, x.color))}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">{tx("sec_prodtype")}</h3>
              {prodByType.length === 0 ? <p className="text-sm text-gray-500 text-center">{tx("prod_empty")}</p> :
                prodByType.map((x) => bar(prodLabel(x.t), x.q, maxProd, "#fb923c", formatCurrency(x.v)))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_births")}</h3>
                <div className="flex items-end justify-around h-24">
                  {bs.map((b, i) => (
                    <div key={b.k} className="flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] font-bold text-pink-500">{birthsB[i] || ""}</span>
                      <div className="w-4 bg-pink-400 rounded-t" style={{ height: `${(birthsB[i] / maxBirths) * 100}%`, minHeight: birthsB[i] > 0 ? 4 : 0 }} />
                      <span className="text-[9px] text-gray-400 mt-0.5">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_health")}</h3>
                {healthByType.length === 0 ? <p className="text-xs text-gray-500">{tx("health_empty")}</p> :
                  healthByType.map((x) => (
                    <div key={x.t} className="mb-2 last:mb-0">
                      <div className="flex justify-between text-[11px] mb-0.5"><span>{healthLabel(x.t)}</span><span className="font-bold">{x.n}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(x.n / maxHealth) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">{tx("sec_feed")}</h3>
              <div className="flex gap-2 text-center">
                <div className="flex-1 bg-green-50 rounded-xl p-2"><p className="text-green-700 font-bold">{feedIn}</p><p className="text-[11px] text-gray-500">{tx("feed_in")}</p></div>
                <div className="flex-1 bg-red-50 rounded-xl p-2"><p className="text-red-700 font-bold">{feedOut}</p><p className="text-[11px] text-gray-500">{tx("feed_out")}</p></div>
                <Link href="/feed" className="flex-1 bg-yellow-50 rounded-xl p-2 text-yellow-700 font-bold text-sm flex items-center justify-center">{tx("view")}</Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_customers")}</h3>
                {topCustomers.length === 0 ? <p className="text-xs text-gray-500">{tx("cust_empty")}</p> :
                  topCustomers.map((x) => bar(x.name, x.total, maxTop, "#10b981"))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_suppliers")}</h3>
                {topSuppliers.length === 0 ? <p className="text-xs text-gray-500">{tx("supp_empty")}</p> :
                  topSuppliers.map((x) => bar(x.name, x.total, maxTop, "#3b82f6"))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/births" className="bg-pink-50 border border-pink-100 rounded-2xl p-3 text-center">
                <p className="text-pink-600 text-xs">{tx("card_births")}</p>
                <p className="text-pink-800 font-bold mt-1">{rBirths.length}</p>
              </Link>
              <Link href="/tracking" className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-center">
                <p className="text-indigo-600 text-xs">{tx("card_tracking")}</p>
                <p className="text-indigo-800 font-bold mt-1">{tx("view")}</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
