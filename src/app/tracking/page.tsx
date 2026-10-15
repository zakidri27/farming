"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import { useApp } from "@/lib/i18n";

interface Animal {
  id: number; name: string; type: string; breed: string | null; birthDate: string | null;
  gender: string | null; weight: string | null; status: string; tagNumber: string | null;
  teeth: string | null; ageText: string | null; lifeStage: string | null; purpose: string | null;
  purchasePrice: string | null; purchaseDate: string | null; motherAnimalId: number | null; notes: string | null;
}
interface HRec { id: number; date: string; animalId: number | null; recordType: string; description: string; totalCost: string | null; status: string; }
interface Birth { id: number; date: string; motherId: number | null; fatherId: number | null; childName: string; childAnimalId: number | null; motherName: string | null; fatherName: string | null; }
interface Prod { id: number; date: string; animalId: number | null; productType: string; quantity: string; unit: string; totalValue: string | null; }
interface Sale { id: number; date: string; totalAmount: string; animalId: number | null; description: string; }
interface Purch { id: number; date: string; totalAmount: string; animalId: number | null; description: string; }
interface FeedTx { id?: number; date: string; feedId: number | null; transactionType: string; quantity: string; unit: string; cost: string | null; animalType: string | null; feedName: string; }
interface FeedAlloc { transactionId: number | null; animalId: number | null; date: string; quantity: string; unit: string; }
interface FeedItem { id: number; unitCost: string | null; }
interface Exp { animalType: string | null; amount: string; description: string; }

const TYPES = [
  { value: "cow", emoji: "🐄" },
  { value: "goat", emoji: "🐐" },
  { value: "sheep", emoji: "🐑" },
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "التطبيق يتتبع الحالة من كل الصفحات", en: "The app tracks status from every page", fr: "L'appli suit l'état depuis toutes les pages" },
  step_type: { ar: "1️⃣ نوع الحيوان *", en: "1️⃣ Animal type *", fr: "1️⃣ Type d'animal *" },
  step_animal: { ar: "2️⃣ الحيوان *", en: "2️⃣ Animal *", fr: "2️⃣ Animal *" },
  choose: { ar: "اختر...", en: "Choose...", fr: "Choisir..." },
  empty_pick: { ar: "اختر النوع ثم الحيوان لعرض بطاقة التتبع", en: "Pick a type then an animal to show the tracking card", fr: "Choisissez un type puis un animal pour afficher la fiche de suivi" },
  chick: { ar: "🐣 فرخ", en: "🐣 Chick", fr: "🐣 Poussin" },
  age: { ar: "العمر", en: "Age", fr: "Âge" },
  teeth: { ar: "الأسنان", en: "Teeth", fr: "Dents" },
  unit_day: { ar: "يوم", en: "days", fr: "jours" },
  unit_month: { ar: "شهر", en: "months", fr: "mois" },
  unit_year: { ar: "سنة", en: "years", fr: "ans" },
  unit_year_and: { ar: "سنة و", en: "yrs &", fr: "ans et" },
  unit_kg: { ar: "كغ", en: "kg", fr: "kg" },
  health_recs: { ar: "سجلات صحية", en: "Health records", fr: "Dossiers santé" },
  prod_times: { ar: "مرات الإنتاج", en: "Production times", fr: "Productions" },
  births_from: { ar: "مواليد منه", en: "Offspring", fr: "Petits" },
  sec_prod: { ar: "🥛 إنتاجه عبر الزمن (من صفحة الإنتاج)", en: "🥛 Its production over time (from Production)", fr: "🥛 Sa production dans le temps (depuis Production)" },
  sec_prod_empty: { ar: "لا يوجد إنتاج مسجل لهذا الحيوان", en: "No production recorded for this animal", fr: "Aucune production enregistrée pour cet animal" },
  sec_feed: { ar: "🌾 استهلاكه من الغذاء شهرياً (نصيبه من كل إطعام)", en: "🌾 Monthly feed consumption (its share of each feeding)", fr: "🌾 Consommation mensuelle d'aliment (sa part de chaque distribution)" },
  sec_feed_empty: { ar: "لا توجد حركات إطعام لهذا النوع", en: "No feeding movements for this type", fr: "Aucune distribution pour ce type" },
  sec_money: { ar: "💰 حسابه المالي (شراء/صحة/إنتاج/بيع)", en: "💰 Financial balance (buy/health/produce/sell)", fr: "💰 Bilan financier (achat/santé/production/vente)" },
  row_buy: { ar: "🛒 ثمن الشراء", en: "🛒 Purchase price", fr: "🛒 Prix d'achat" },
  row_health: { ar: "🏥 تكاليف العلاج", en: "🏥 Treatment costs", fr: "🏥 Frais de soins" },
  row_feed: { ar: "🌾 الغذاء المستهلك", en: "🌾 Feed consumed", fr: "🌾 Aliment consommé" },
  row_prod: { ar: "🥛 قيمة ما أنتجه", en: "🥛 Value of what it produced", fr: "🥛 Valeur de sa production" },
  row_sale: { ar: "💵 ثمن البيع", en: "💵 Sale price", fr: "💵 Prix de vente" },
  row_net: { ar: "الصافي (إنتاج+بيع−شراء−علاج−غذاء)", en: "Net (produce+sell−buy−treat−feed)", fr: "Net (production+vente−achat−soins−aliment)" },
  sec_timeline: { ar: "📜 سجله الزمني الكامل", en: "📜 Full timeline", fr: "📜 Chronologie complète" },
  sec_timeline_empty: { ar: "لا توجد أحداث مسجلة — سجّل له شراءً أو ولادة أو علاجًا أو إنتاجًا", en: "No events recorded — log a purchase, birth, treatment or production for it", fr: "Aucun événement — enregistrez un achat, une naissance, un soin ou une production" },
  ev_buy: { ar: "شراء", en: "Purchase", fr: "Achat" },
  ev_born: { ar: "وُلد في المزرعة — الأم", en: "Born on the farm — Mother", fr: "Né à la ferme — Mère" },
  ev_record: { ar: "سجل", en: "Record", fr: "Dossier" },
  ev_newborn: { ar: "مولود جديد", en: "Newborn", fr: "Nouveau-né" },
  ev_production: { ar: "إنتاج", en: "Production", fr: "Production" },
  ev_sale: { ar: "بيع", en: "Sale", fr: "Vente" },
  prod_milk: { ar: "🥛 حليب", en: "🥛 Milk", fr: "🥛 Lait" },
  prod_eggs: { ar: "🥚 بيض", en: "🥚 Eggs", fr: "🥚 Œufs" },
  prod_wool: { ar: "🧶 صوف", en: "🧶 Wool", fr: "🧶 Laine" },
  prod_meat: { ar: "🥩 لحم", en: "🥩 Meat", fr: "🥩 Viande" },
  prod_honey: { ar: "🍯 عسل", en: "🍯 Honey", fr: "🍯 Miel" },
  prod_manure: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" },
  prod_other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
  rec_treatment: { ar: "💉 علاج", en: "💉 Treatment", fr: "💉 Traitement" },
  rec_vaccination: { ar: "💊 تطعيم", en: "💊 Vaccination", fr: "💊 Vaccination" },
  rec_checkup: { ar: "🩺 فحص", en: "🩺 Checkup", fr: "🩺 Contrôle" },
  rec_deworming: { ar: "🧪 تجريع", en: "🧪 Deworming", fr: "🧪 Vermifuge" },
  rec_other: { ar: "📋 أخرى", en: "📋 Other", fr: "📋 Autre" },
};

function ageOf(birthDate: string | null, lang: string): string {
  if (!birthDate) return "-";
  const days = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "-";
  if (days < 30) return `${days} ${L.unit_day[lang as "ar" | "en" | "fr"] ?? L.unit_day.ar}`;
  const months = Math.floor(days / 30.4);
  if (months < 12) return `${months} ${L.unit_month[lang as "ar" | "en" | "fr"] ?? L.unit_month.ar}`;
  const y = Math.floor(months / 12), m = months % 12;
  const yW = L.unit_year[lang as "ar" | "en" | "fr"] ?? L.unit_year.ar;
  const mW = L.unit_month[lang as "ar" | "en" | "fr"] ?? L.unit_month.ar;
  const yAnd = L.unit_year_and[lang as "ar" | "en" | "fr"] ?? L.unit_year_and.ar;
  return m > 0 ? `${y} ${yAnd} ${m} ${mW}` : `${y} ${yW}`;
}
const shortNum = (v: number) =>
  new Intl.NumberFormat("ar-DZ", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function TrackingPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const prodLabel = (k: string) => L["prod_" + k]?.[lang] ?? k;
  const recLabel = (k: string) => L["rec_" + k]?.[lang] ?? tx("ev_record");
  const [herd, setHerd] = useState<Animal[]>([]);
  const [health, setHealth] = useState<HRec[]>([]);
  const [births, setBirths] = useState<Birth[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purch[]>([]);
  const [feedTx, setFeedTx] = useState<FeedTx[]>([]);
  const [feedAlloc, setFeedAlloc] = useState<FeedAlloc[]>([]);
  const [feedStock, setFeedStock] = useState<FeedItem[]>([]);
  const [expenses, setExpenses] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [aType, setAType] = useState("cow");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const get = (url: string, set: (d: never[]) => void) =>
      fetch(url).then((r) => r.json()).then((d: unknown) => {
        if (Array.isArray(d)) set(d as never[]);
        else if (d && typeof d === "object" && Array.isArray((d as { transactions?: unknown }).transactions)) set((d as { transactions: never[] }).transactions);
        else set([]);
      }).catch(() => set([]));
    Promise.all([
      get("/api/animals", setHerd as unknown as (d: never[]) => void),
      get("/api/health/records", setHealth as unknown as (d: never[]) => void),
      get("/api/births", setBirths as unknown as (d: never[]) => void),
      get("/api/production", setProds as unknown as (d: never[]) => void),
      get("/api/sales", setSales as unknown as (d: never[]) => void),
      get("/api/purchases", setPurchases as unknown as (d: never[]) => void),
      fetch("/api/feed").then((r) => r.json()).then((d: unknown) => {
        const o = d as { stock?: FeedItem[]; transactions?: FeedTx[]; allocations?: FeedAlloc[] };
        setFeedTx(Array.isArray(o?.transactions) ? (o.transactions as never[]) : []);
        setFeedStock(Array.isArray(o?.stock) ? (o.stock as never[]) : []);
        setFeedAlloc(Array.isArray(o?.allocations) ? (o.allocations as never[]) : []);
      }).catch(() => { setFeedTx([]); setFeedStock([]); setFeedAlloc([]); }),
      get("/api/expenses", setExpenses as unknown as (d: never[]) => void),
    ]).finally(() => setLoading(false));
  }, []);

  const typeHerd = herd.filter((a) => a.type === aType);
  const animal = herd.find((a) => String(a.id) === selectedId) || null;

  // --- derived status (all from real pages) ---
  const aHealth = animal ? health.filter((h) => h.animalId === animal.id) : [];
  const aProds = animal ? prods.filter((p) => p.animalId === animal.id).sort((a, b) => (a.date < b.date ? -1 : 1)) : [];
  const aBirthAsChild = animal ? births.find((b) => b.childAnimalId === animal.id) : null;
  const aBirthsAsParent = animal ? births.filter((b) => b.motherId === animal.id || b.fatherId === animal.id) : [];
  const aSale = animal ? sales.find((s) => s.animalId === animal.id) : null;
  const aPurch = animal ? purchases.find((p) => p.animalId === animal.id) : null;

  const healthCost = aHealth.reduce((s, h) => s + parseFloat(h.totalCost || "0"), 0);
  const prodValue = aProds.reduce((s, p) => s + parseFloat(p.totalValue || "0"), 0);
  const buyPrice = parseFloat(animal?.purchasePrice || "0");
  const salePrice = aSale ? parseFloat(aSale.totalAmount || "0") : 0;
  // نصيب هذا الحيوان من كل إطعام (توزيع فردي عبر الزمن)
  const aAlloc = animal ? feedAlloc.filter((al) => al.animalId === animal.id) : [];
  const allocUnitCost = (al: FeedAlloc) => {
    const txFeed = feedTx.find((ft) => ft.id === al.transactionId);
    if (txFeed && txFeed.cost && parseFloat(txFeed.cost) > 0 && parseFloat(txFeed.quantity || "0") > 0)
      return parseFloat(txFeed.cost) / parseFloat(txFeed.quantity);
    const item = txFeed?.feedId ? feedStock.find((f) => f.id === txFeed.feedId) : null;
    if (item?.unitCost) return parseFloat(item.unitCost);
    return 0;
  };
  const feedQty = aAlloc.reduce((s, al) => s + parseFloat(al.quantity || "0"), 0);
  const feedCost = aAlloc.reduce((s, al) => s + parseFloat(al.quantity || "0") * allocUnitCost(al), 0);
  const feedUnit = aAlloc[0]?.unit || "";

  const lastHealth = [...aHealth].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const healthState = !animal ? "-" : aSale ? getStatusLabel("sold", lang) : animal.status === "dead" ? getStatusLabel("dead", lang)
    : lastHealth ? (lastHealth.status === "healthy" || lastHealth.status === "recovered" ? `${getStatusLabel("healthy", lang)} ✅` : lastHealth.status === "treatment" ? `${getStatusLabel("treatment", lang)} 🏥` : `${getStatusLabel("sick", lang)} 🤒`)
    : `${getStatusLabel("healthy", lang)} ✅`;

  const feedByMonth = (() => {
    const map = new Map<string, number>();
    for (const al of aAlloc) {
      const k = al.date.slice(0, 7);
      map.set(k, (map.get(k) || 0) + parseFloat(al.quantity || "0"));
    }
    return [...map.entries()].sort().slice(-6);
  })();
  const maxFeed = Math.max(1, ...feedByMonth.map(([, v]) => v));
  const maxProd = Math.max(1, ...aProds.map((p) => parseFloat(p.quantity || "0")));

  type Event = { date: string; icon: string; text: string };
  const events: Event[] = [];
  if (animal) {
    if (aPurch) events.push({ date: aPurch.date, icon: "🛒", text: `${tx("ev_buy")}: ${aPurch.description} (${formatCurrency(aPurch.totalAmount)})` });
    if (aBirthAsChild) events.push({ date: aBirthAsChild.date, icon: "🐣", text: `${tx("ev_born")}: ${aBirthAsChild.motherName || "-"}` });
    aHealth.forEach((h) => events.push({ date: h.date, icon: "🏥", text: `${recLabel(h.recordType)}: ${h.description}` }));
    aBirthsAsParent.forEach((b) => events.push({ date: b.date, icon: "🍼", text: `${tx("ev_newborn")}: ${b.childName}` }));
    aProds.forEach((p) => events.push({ date: p.date, icon: "🥛", text: `${tx("ev_production")} ${prodLabel(p.productType)}: ${p.quantity} ${p.unit}` }));
    if (aSale) events.push({ date: aSale.date, icon: "💵", text: `${tx("ev_sale")}: ${formatCurrency(aSale.totalAmount)}` });
    events.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_tracking")} subtitle={tx("sub")} />
      <div className="px-4 py-3 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">{tx("step_type")}</label>
            <div className="grid grid-cols-5 gap-1.5">
              {TYPES.map((tp) => (
                <button key={tp.value} onClick={() => { setAType(tp.value); setSelectedId(""); }}
                  className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${aType === tp.value ? "bg-indigo-500 text-white border-indigo-500" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                  <span className="text-xl">{tp.emoji}</span>{getAnimalLabel(tp.value, lang)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">{tx("step_animal")} ({typeHerd.length})</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">{tx("choose")}</option>
              {typeHerd.map((a) => <option key={a.id} value={a.id}>{a.name}{a.tagNumber ? ` (${a.tagNumber})` : ""}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !animal ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🔍</p><p className="text-gray-500">{tx("empty_pick")}</p></div>
        ) : (
          <>
            {/* بطاقة الحالة */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">{getAnimalEmoji(animal.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{animal.name} {animal.tagNumber && <span className="text-xs font-normal text-gray-400">• {animal.tagNumber}</span>}</h3>
                  <p className="text-sm text-gray-500">{getAnimalLabel(animal.type, lang)} {animal.breed ? `• ${animal.breed}` : ""}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className={`badge ${getStatusColor(animal.status)}`}>{getStatusLabel(animal.status, lang)}</span>
                    <span className="badge bg-indigo-100 text-indigo-700">{t("c_status")}: {healthState}</span>
                    {animal.lifeStage === "chick" && <span className="badge bg-amber-100 text-amber-700">{tx("chick")}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  [t("c_age"), ageOf(animal.birthDate, lang)],
                  [t("c_weight"), animal.weight ? `${animal.weight} ${tx("unit_kg")}` : "-"],
                  [tx("teeth"), animal.teeth || "-"],
                  [t("c_gender"), animal.gender === "male" ? `♂ ${t("c_male")}` : animal.gender === "female" ? `♀ ${t("c_female")}` : "-"],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">{l}</p><p className="text-xs font-bold mt-0.5">{v}</p></div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="bg-pink-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">{tx("health_recs")}</p><p className="text-sm font-bold">{aHealth.length}</p></div>
                <div className="bg-orange-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">{tx("prod_times")}</p><p className="text-sm font-bold">{aProds.length}</p></div>
                <div className="bg-emerald-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">{tx("births_from")}</p><p className="text-sm font-bold">{aBirthsAsParent.length}</p></div>
              </div>
            </div>

            {/* رسم الإنتاج عبر الزمن */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_prod")}</h3>
              {aProds.length === 0 ? <p className="text-xs text-gray-500 text-center py-2">{tx("sec_prod_empty")}</p> : (
                <div className="flex items-end justify-around min-h-[7rem]">
                  {aProds.slice(-8).map((p) => (
                    <div key={p.id} className="flex flex-col items-center justify-end h-28 flex-1">
                      <span className="text-[10px] font-bold text-orange-600">{shortNum(parseFloat(p.quantity || "0"))}</span>
                      <div className="w-6 bg-orange-400 rounded-t" style={{ height: `${Math.max(4, (parseFloat(p.quantity || "0") / maxProd) * 100)}%` }} />
                      <span className="text-[9px] text-gray-400 mt-1">{p.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* رسم استهلاك الغذاء */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_feed")}</h3>
              {feedByMonth.length === 0 ? <p className="text-xs text-gray-500 text-center py-2">{tx("sec_feed_empty")}</p> : (
                <div className="flex items-end justify-around min-h-[7rem]">
                  {feedByMonth.map(([m, v]) => (
                    <div key={m} className="flex flex-col items-center justify-end h-28 flex-1">
                      <span className="text-[10px] font-bold text-yellow-700">{shortNum(v)}</span>
                      <div className="w-6 bg-yellow-500 rounded-t" style={{ height: `${Math.max(4, (v / maxFeed) * 100)}%` }} />
                      <span className="text-[9px] text-gray-400 mt-1">{m.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* الحساب المالي */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_money")}</h3>
              <div className="space-y-2 text-xs">
                {[
                  [tx("row_buy"), buyPrice, "text-gray-700"],
                  [tx("row_health"), healthCost, "text-red-600"],
                  [`${tx("row_feed")} (${feedQty} ${feedUnit})`, feedCost, "text-amber-700"],
                  [tx("row_prod"), prodValue, "text-green-700"],
                  ...(aSale ? [[tx("row_sale"), salePrice, "text-emerald-700"] as [string, number, string]] : []),
                ].map(([l, v, c]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-gray-600">{l}</span><span className={`font-bold ${c}`}>{formatCurrency(v as number)}</span></div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                  <span className="font-bold">{tx("row_net")}</span>
                  <span className={`font-bold ${prodValue + salePrice - buyPrice - healthCost - feedCost >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatCurrency(prodValue + salePrice - buyPrice - healthCost - feedCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* السجل الزمني */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{tx("sec_timeline")}</h3>
              {events.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">{tx("sec_timeline_empty")}</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                      <span className="text-xl">{e.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{e.text}</p>
                        <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
