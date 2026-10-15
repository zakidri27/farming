"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useApp } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { appAlert, appConfirm } from "@/components/AppDialog";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface Prod {
  id: number; date: string; animalId: number | null; animalName: string | null;
  animalType: string | null; productType: string; quantity: string; unit: string;
  totalValue: string | null; notes: string | null;
}
interface Animal { id: number; name: string; type: string; status: string; }

const L: Record<string, Record<Lang, string>> = {
  totalPrefix: { ar: "القيمة الإجمالية:", en: "Total value:", fr: "Valeur totale :" },
  addAction: { ar: "تسجيل إنتاج", en: "Record production", fr: "Enregistrer la production" },
  tabProd: { ar: "🥛 الإنتاج", en: "🥛 Production", fr: "🥛 Production" },
  tabCons: { ar: "🍽️ الاستهلاك", en: "🍽️ Consumption", fr: "🍽️ Consommation" },
  newConsume: { ar: "+ استهلاك جديد (بدون بيع)", en: "+ New consumption (no sale)", fr: "+ Nouvelle consommation (sans vente)" },
  emptyCons: { ar: "لا يوجد استهلاك مسجل", en: "No consumption recorded", fr: "Aucune consommation enregistrée" },
  emptyProd: { ar: "لا يوجد إنتاج مسجل", en: "No production recorded", fr: "Aucune production enregistrée" },
  sellLink: { ar: "💵 بيع الإنتاج ←", en: "💵 Sell production →", fr: "💵 Vendre la production →" },
  formTitle: { ar: "🥛 تسجيل إنتاج من الحيوانات", en: "🥛 Record animal production", fr: "🥛 Enregistrer la production animale" },
  step1: { ar: "1️⃣ نوع الحيوان *", en: "1️⃣ Animal type *", fr: "1️⃣ Type d'animal *" },
  step2: { ar: "2️⃣ الحيوانات المنتجة (من القطيع) *", en: "2️⃣ Producing animal(s) (from herd) *", fr: "2️⃣ Animal(aux) producteur(s) (du troupeau) *" },
  choose: { ar: "اختر...", en: "Choose...", fr: "Choisir..." },
  noAnimals: { ar: "لا توجد حيوانات من هذا النوع في القطيع", en: "No animals of this type in the herd", fr: "Aucun animal de ce type dans le troupeau" },
  multiHint: { ar: "اختر حيواناً واحداً أو أكثر — يُسجل الإنتاج كدفعة (مثال: قطع السّمان ينتج 30 بيضة)", en: "Select one or more animals — production is recorded as a batch (e.g. a quail flock producing 30 eggs)", fr: "Sélectionnez un ou plusieurs animaux — la production est enregistrée comme un lot (ex. un élevage de cailles produisant 30 œufs)" },
  selectAll: { ar: "✅ تحديد الكل", en: "✅ Select all", fr: "✅ Tout sélectionner" },
  deselectAll: { ar: "❌ إلغاء التحديد", en: "❌ Deselect all", fr: "❌ Tout désélectionner" },
  groupName: { ar: "قطيع", en: "Flock", fr: "Troupeau" },
  step3: { ar: "3️⃣ ماذا ينتج؟ *", en: "3️⃣ What does it produce? *", fr: "3️⃣ Que produit-il ? *" },
  totalPrice: { ar: "السعر الإجمالي: ", en: "Total price: ", fr: "Prix total : " },
  consTitle: { ar: "🍽️ استهلاك من الإنتاج (بدون بيع)", en: "🍽️ Consume from production (no sale)", fr: "🍽️ Consommer de la production (sans vente)" },
  consStep1: { ar: "1️⃣ المنتج (المتوفر يُخصم) *", en: "1️⃣ Product (deducted from available) *", fr: "1️⃣ Produit (déduit du disponible) *" },
  consStep3: { ar: "3️⃣ سبب الاستهلاك *", en: "3️⃣ Consumption reason *", fr: "3️⃣ Motif de consommation *" },
  confirmConsume: { ar: "تأكيد الاستهلاك", en: "Confirm consumption", fr: "Confirmer la consommation" },
  alertQty: { ar: "الكمية مطلوبة", en: "Quantity is required", fr: "La quantité est requise" },
  alertNeed: { ar: "اختر الحيوان والكمية", en: "Select the animal and the quantity", fr: "Sélectionnez l'animal et la quantité" },
  d_animal: { ar: "الحيوان", en: "Animal", fr: "Animal" },
  d_type: { ar: "نوع الحيوان", en: "Animal type", fr: "Type d'animal" },
  d_date: { ar: "التاريخ", en: "Date", fr: "Date" },
  d_qty: { ar: "الكمية", en: "Quantity", fr: "Quantité" },
  d_unit_price: { ar: "سعر الوحدة", en: "Unit price", fr: "Prix unitaire" },
  d_value: { ar: "القيمة", en: "Value", fr: "Valeur" },
  d_reason: { ar: "السبب", en: "Reason", fr: "Motif" },
  d_notes: { ar: "ملاحظات", en: "Notes", fr: "Notes" },
  d_consume: { ar: "استهلاك", en: "Consume", fr: "Consommer" },
  d_close: { ar: "إغلاق", en: "Close", fr: "Fermer" },
};

// Generic product names (UI labels only — values stored in DB stay as-is)
const productLabels: Record<string, Record<Lang, string>> = {
  milk: { ar: "🥛 حليب", en: "🥛 Milk", fr: "🥛 Lait" },
  eggs: { ar: "🥚 بيض", en: "🥚 Eggs", fr: "🥚 Œufs" },
  wool: { ar: "🧶 صوف", en: "🧶 Wool", fr: "🧶 Laine" },
  meat: { ar: "🥩 لحم", en: "🥩 Meat", fr: "🥩 Viande" },
  honey: { ar: "🍯 عسل", en: "🍯 Honey", fr: "🍯 Miel" },
  manure: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" },
  other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
};

// Per-animal product options (units are stored values → intentionally left in Arabic)
const productsByType: Record<string, { value: string; label: Record<Lang, string>; unit: string }[]> = {
  cow: [
    { value: "milk", label: { ar: "🥛 حليب البقر", en: "🥛 Cow milk", fr: "🥛 Lait de vache" }, unit: "لتر" },
    { value: "meat", label: { ar: "🥩 لحم البقر", en: "🥩 Beef", fr: "🥩 Viande de bœuf" }, unit: "كغ" },
    { value: "manure", label: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" }, unit: "كغ" },
  ],
  goat: [
    { value: "milk", label: { ar: "🥛 حليب الماعز", en: "🥛 Goat milk", fr: "🥛 Lait de chèvre" }, unit: "لتر" },
    { value: "meat", label: { ar: "🥩 لحم الماعز", en: "🥩 Goat meat", fr: "🥩 Viande de chèvre" }, unit: "كغ" },
    { value: "manure", label: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" }, unit: "كغ" },
  ],
  sheep: [
    { value: "wool", label: { ar: "🧶 صوف الغنم", en: "🧶 Sheep wool", fr: "🧶 Laine de mouton" }, unit: "كغ" },
    { value: "milk", label: { ar: "🥛 حليب الغنم", en: "🥛 Sheep milk", fr: "🥛 Lait de brebis" }, unit: "لتر" },
    { value: "meat", label: { ar: "🥩 لحم الغنم", en: "🥩 Mutton", fr: "🥩 Viande de mouton" }, unit: "كغ" },
    { value: "manure", label: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" }, unit: "كغ" },
  ],
  chicken: [
    { value: "eggs", label: { ar: "🥚 بيض الدجاج", en: "🥚 Chicken eggs", fr: "🥚 Œufs de poule" }, unit: "حبة" },
    { value: "meat", label: { ar: "🥩 لحم الدجاج", en: "🥩 Chicken meat", fr: "🥩 Poulet" }, unit: "كغ" },
    { value: "manure", label: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" }, unit: "كغ" },
  ],
  quail: [
    { value: "eggs", label: { ar: "🥚 بيض السمان", en: "🥚 Quail eggs", fr: "🥚 Œufs de caille" }, unit: "حبة" },
    { value: "meat", label: { ar: "🥩 لحم السمان", en: "🥩 Quail meat", fr: "🥩 Viande de caille" }, unit: "كغ" },
  ],
};
// Unit values are stored in DB → intentionally left in Arabic
const prodUnits = ["لتر", "حبة", "كغ", "دلو", "بوطة", "علبة"];

const animalTypeOptions = [
  { value: "cow", emoji: "🐄" },
  { value: "goat", emoji: "🐐" },
  { value: "sheep", emoji: "🐑" },
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];

interface Cons { id: number; date: string; productType: string; quantity: string; unit: string; reason: string; notes: string | null; }
interface SaleRef { category: string; productType: string | null; quantity: string | null; }

// Reason labels are UI chrome (stored values stay as-is)
const reasonLabels: Record<string, Record<Lang, string>> = {
  family: { ar: "🏠 استهلاك عائلي", en: "🏠 Family use", fr: "🏠 Consommation familiale" },
  guests: { ar: "🍽️ ضيافة", en: "🍽️ Guests", fr: "🍽️ Invités" },
  farm_use: { ar: "🚜 استعمال المزرعة", en: "🚜 Farm use", fr: "🚜 Usage de la ferme" },
  gift: { ar: "🎁 هدية", en: "🎁 Gift", fr: "🎁 Cadeau" },
  spoiled: { ar: "🗑️ تالف", en: "🗑️ Spoiled", fr: "🗑️ Abîmé" },
  other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
};

export default function ProductionPage() {
  const { lang, t } = useApp();
  const tx = (k: string): string => L[k][lang] ?? L[k].ar;
  const prodName = (v: string): string => productLabels[v]?.[lang] ?? productLabels[v]?.ar ?? v;
  const [items, setItems] = useState<Prod[]>([]);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [cons, setCons] = useState<Cons[]>([]);
  const [salesRef, setSalesRef] = useState<SaleRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prod" | "cons">("prod");
  const [showConsume, setShowConsume] = useState(false);
  const [cform, setCform] = useState({ date: getTodayDate(), productType: "milk", quantity: "", reason: "family", notes: "" });
  const [showForm, setShowForm] = useState(false);
  const [detailProd, setDetailProd] = useState<Prod | null>(null);
  const [detailCons, setDetailCons] = useState<Cons | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: getTodayDate(), animalType: "cow", animalId: "", productType: "milk", quantity: "", unit: "لتر", unitPrice: "", notes: "" });
  const [selIds, setSelIds] = useState<Record<string, boolean>>({});

  const openForm = () => {
    setSelIds({});
    setForm({ ...form, animalId: "", quantity: "", unitPrice: "", notes: "" });
    setShowForm(true);
  };

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/production").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
    fetch("/api/animals?status=active").then((r) => r.json()).then((d) => setHerd(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/consumptions").then((r) => r.json()).then((d) => setCons(Array.isArray(d) ? d : [])).catch(() => setCons([]));
    fetch("/api/sales").then((r) => r.json()).then((d) => setSalesRef(Array.isArray(d) ? d : [])).catch(() => setSalesRef([]));
  };
  useEffect(() => { fetchAll(); }, []);

  // المتوفر = المنتَج − المباع − المستهلَك
  const available = (pt: string) => {
    const produced = items.filter((p) => p.productType === pt).reduce((s, p) => s + parseFloat(p.quantity || "0"), 0);
    const sold = salesRef.filter((s) => s.category === "production" && s.productType === pt).reduce((s, x) => s + parseFloat(x.quantity || "0"), 0);
    const consumed = cons.filter((c) => c.productType === pt).reduce((s, c) => s + parseFloat(c.quantity || "0"), 0);
    const unit = items.find((p) => p.productType === pt)?.unit || "كغ";
    return { qty: produced - sold - consumed, unit };
  };
  const availList = ["milk", "eggs", "wool", "meat", "honey", "manure", "other"]
    .map((pt) => ({ t: pt, ...available(pt) }))
    .filter((x) => x.qty > 0.001 || items.some((p) => p.productType === x.t));

  const handleConsume = async () => {
    const av = available(cform.productType);
    const q = parseFloat(cform.quantity || "0");
    if (!q || q <= 0) { await appAlert(tx("alertQty")); return; }
    if (q > av.qty + 0.001) { await appAlert(lang === "en" ? `Quantity exceeds available (${av.qty} ${av.unit})` : lang === "fr" ? `La quantité dépasse le disponible (${av.qty} ${av.unit})` : `الكمية تتجاوز المتوفر (${av.qty} ${av.unit})`); return; }
    setSaving(true);
    try {
      await fetch("/api/consumptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: cform.date, productType: cform.productType, quantity: cform.quantity, unit: av.unit, reason: cform.reason, notes: cform.notes || null }),
      });
      setShowConsume(false);
      setCform({ ...cform, quantity: "", notes: "" });
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const handleSave = async () => {
    const selected = herd.filter((a) => a.type === form.animalType && selIds[String(a.id)]);
    const q = parseFloat(form.quantity || "0");
    if (selected.length === 0 || !q || q <= 0) { await appAlert(tx("alertNeed")); return; }
    setSaving(true);
    try {
      const n = selected.length;
      const animalId = n === 1 ? selected[0].id : null;
      const animalName = n === 1 ? selected[0].name : `${tx("groupName")} ${getAnimalLabel(form.animalType, lang)} (${n})`;
      const names = n > 1 ? selected.map((a) => a.name).join("، ") : "";
      const notes = n > 1 ? (form.notes ? `${form.notes} — ${names}` : names) : form.notes;
      await fetch("/api/production", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date, animalId, animalName, animalType: form.animalType, productType: form.productType, quantity: form.quantity, unit: form.unit, unitPrice: form.unitPrice || null, notes: notes || null }),
      });
      setShowForm(false);
      setForm({ ...form, animalId: "", quantity: "", unitPrice: "", notes: "" });
      setSelIds({});
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const totalValue = items.reduce((s, p) => s + parseFloat(p.totalValue || "0"), 0);

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_production")} subtitle={`${tx("totalPrefix")} ${formatCurrency(totalValue)}`} action={{ label: tx("addAction"), icon: "🥛", onClick: openForm }} />
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-3">
          <button onClick={() => setActiveTab("prod")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeTab === "prod" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{tx("tabProd")}</button>
          <button onClick={() => setActiveTab("cons")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeTab === "cons" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{tx("tabCons")}</button>
        </div>
        {activeTab === "cons" && (
          <button onClick={() => setShowConsume(true)} className="w-full mb-3 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold">{tx("newConsume")}</button>
        )}
        <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === "cons" ? (
          cons.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">🍽️</p><p className="text-gray-500">{tx("emptyCons")}</p></div>
          ) : cons.map((c) => (
            <button key={c.id} onClick={() => setDetailCons(c)} className="w-full text-right bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base flex-shrink-0">🍽️</div>
              <p className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900">{reasonLabels[c.reason]?.[lang] || c.reason}</p>
              <p className="font-bold text-sm text-gray-900 flex-shrink-0">{c.quantity} {c.unit}</p>
            </button>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🥛</p><p className="text-gray-500">{tx("emptyProd")}</p></div>
        ) : items.map((p) => (
          <button key={p.id} onClick={() => setDetailProd(p)} className="w-full text-right bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-base flex-shrink-0">{p.animalType ? getAnimalEmoji(p.animalType) : "🥛"}</div>
            <p className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900">{prodName(p.productType)} • {p.quantity} {p.unit}</p>
            {p.totalValue && Number(p.totalValue) > 0 && <p className="font-bold text-sm text-orange-600 flex-shrink-0">{formatCurrency(p.totalValue)}</p>}
          </button>
        ))}
        <Link href="/sales" className="block text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium">{tx("sellLink")}</Link>
        </div>
      </div>

      {/* تفاصيل الإنتاج */}
      {detailProd && (() => {
        const q = parseFloat(detailProd.quantity || "0");
        const tv = parseFloat(detailProd.totalValue || "0");
        const up = q > 0 && tv > 0 ? (tv / q).toFixed(2) : null;
        const row = "flex items-center justify-between py-1.5 border-b border-gray-100 text-sm";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetailProd(null)}>
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{prodName(detailProd.productType)} • {detailProd.quantity} {detailProd.unit}</h2>
                <button onClick={() => setDetailProd(null)} className="text-gray-400 text-2xl">×</button>
              </div>
              <div>
                <div className={row}><span className="text-gray-500">{tx("d_animal")}</span><span className="font-medium">{detailProd.animalName || "—"}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_type")}</span><span className="font-medium">{detailProd.animalType ? getAnimalLabel(detailProd.animalType, lang) : "—"}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_date")}</span><span className="font-medium">{formatDate(detailProd.date)}</span></div>
                {up && <div className={row}><span className="text-gray-500">{tx("d_unit_price")}</span><span className="font-medium">{up} دج</span></div>}
                {tv > 0 && <div className={row}><span className="text-gray-500">{tx("d_value")}</span><span className="font-bold text-orange-600">{formatCurrency(detailProd.totalValue || "0")}</span></div>}
                {detailProd.notes && <p className="py-1.5 text-sm text-gray-600">{tx("d_notes")}: {detailProd.notes}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setCform((f) => ({ ...f, productType: detailProd.productType })); setDetailProd(null); setActiveTab("cons"); setShowConsume(true); }} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold">{tx("d_consume")}</button>
                <Link href="/sales" className="flex-1 text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold">{tx("sellLink")}</Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* تفاصيل الاستهلاك */}
      {detailCons && (() => {
        const row = "flex items-center justify-between py-1.5 border-b border-gray-100 text-sm";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetailCons(null)}>
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">🍽️ {reasonLabels[detailCons.reason]?.[lang] || detailCons.reason}</h2>
                <button onClick={() => setDetailCons(null)} className="text-gray-400 text-2xl">×</button>
              </div>
              <div>
                <div className={row}><span className="text-gray-500">{tx("d_qty")}</span><span className="font-bold">{detailCons.quantity} {detailCons.unit}</span></div>
                <div className={row}><span className="text-gray-500">{prodName(detailCons.productType)}</span><span className="font-medium">{formatDate(detailCons.date)}</span></div>
                <div className={row}><span className="text-gray-500">{tx("d_reason")}</span><span className="font-medium">{reasonLabels[detailCons.reason]?.[lang] || detailCons.reason}</span></div>
                {detailCons.notes && <p className="py-1.5 text-sm text-gray-600">{tx("d_notes")}: {detailCons.notes}</p>}
              </div>
              <button onClick={() => setDetailCons(null)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold">{tx("d_close")}</button>
            </div>
          </div>
        );
      })()}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("formTitle")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step1")}</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {animalTypeOptions.map((at) => (
                    <button key={at.value} onClick={() => {
                      const first = (productsByType[at.value] || [])[0];
                      setForm({ ...form, animalType: at.value, animalId: "", productType: first?.value || "milk", unit: first?.unit || "كغ" });
                      setSelIds({});
                    }}
                      className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${form.animalType === at.value ? "bg-orange-500 text-white border-orange-500" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <span className="text-xl">{at.emoji}</span>{getAnimalLabel(at.value, lang)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step2")}</label>
                <p className="text-xs text-gray-400 mb-1">{tx("multiHint")}</p>
                {herd.filter((a) => a.type === form.animalType).length === 0 ? (
                  <p className="text-xs text-red-500">{tx("noAnimals")}</p>
                ) : (
                  <>
                    <button onClick={() => {
                      const typeHerd = herd.filter((a) => a.type === form.animalType);
                      const allSel = typeHerd.every((a) => selIds[String(a.id)]);
                      const next: Record<string, boolean> = {};
                      if (!allSel) typeHerd.forEach((a) => { next[String(a.id)] = true; });
                      setSelIds(next);
                    }}
                      className="w-full mb-2 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {herd.filter((a) => a.type === form.animalType).every((a) => selIds[String(a.id)]) ? tx("deselectAll") : tx("selectAll")}
                    </button>
                    <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {herd.filter((a) => a.type === form.animalType).map((a) => {
                        const on = !!selIds[String(a.id)];
                        return (
                          <div key={a.id} className={`flex items-center gap-2 p-2 ${on ? "bg-orange-50" : "bg-white"}`}>
                            <button onClick={() => setSelIds({ ...selIds, [String(a.id)]: !on })} className="flex-1 min-w-0 flex items-center gap-2 text-right">
                              <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs flex-shrink-0 ${on ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 text-transparent"}`}>✓</span>
                              <span className={`text-sm font-medium truncate ${on ? "text-orange-800" : "text-gray-700"}`}>{a.name}</span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{getAnimalEmoji(a.type)}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Object.values(selIds).filter(Boolean).length} {(lang === "ar" ? "مختار" : lang === "fr" ? "sélectionné(s)" : "selected")}</p>
                  </>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step3")}</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.productType}
                  onChange={(e) => { const pt = (productsByType[form.animalType] || []).find((x) => x.value === e.target.value); setForm({ ...form, productType: e.target.value, unit: pt?.unit || form.unit }); }}>
                  {(productsByType[form.animalType] || []).map((pt) => <option key={pt.value} value={pt.value}>{pt.label[lang] ?? pt.label.ar}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">4️⃣ {t("c_unit")}</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {prodUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">5️⃣ {t("c_quantity")} *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">6️⃣ {t("c_unit_price")}</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                </div>
              </div>
              {parseFloat(form.quantity || "0") > 0 && parseFloat(form.unitPrice || "0") > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-gray-500">{tx("totalPrice")}</span>
                  <span className="text-base font-bold text-orange-700">{formatCurrency(parseFloat(form.quantity) * parseFloat(form.unitPrice))}</span>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_date")}</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : t("common_save")}
            </button>
          </div>
        </div>
      )}

      {/* استهلاك منتج */}
      {showConsume && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowConsume(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("consTitle")}</h2>
              <button onClick={() => setShowConsume(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("consStep1")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {availList.map((a) => (
                    <button key={a.t} onClick={() => setCform({ ...cform, productType: a.t })}
                      className={`border rounded-xl p-2.5 text-right ${cform.productType === a.t ? "bg-amber-600 text-white border-amber-600" : "bg-gray-50 border-gray-200"}`}>
                      <p className={`text-sm font-bold ${cform.productType === a.t ? "text-white" : "text-gray-900"}`}>{prodName(a.t)}</p>
                      <p className={`text-xs ${cform.productType === a.t ? "text-amber-100" : "text-gray-500"}`}>{t("c_available")}: {a.qty} {a.unit}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">2️⃣ {t("c_quantity")} *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={cform.quantity} onChange={(e) => setCform({ ...cform, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_date")}</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={cform.date} onChange={(e) => setCform({ ...cform, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("consStep3")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(reasonLabels).map(([v, lbl]) => (
                    <button key={v} onClick={() => setCform({ ...cform, reason: v })}
                      className={`py-2 rounded-xl text-xs font-medium border ${cform.reason === v ? "bg-amber-600 text-white border-amber-600" : "bg-gray-50 border-gray-200 text-gray-600"}`}>{lbl[lang] ?? lbl.ar}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleConsume} disabled={saving} className="w-full mt-4 bg-amber-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("confirmConsume")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
