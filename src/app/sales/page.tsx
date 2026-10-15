"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { appAlert } from "@/components/AppDialog";
import { useApp } from "@/lib/i18n";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface Sale {
  id: number; date: string; category: string; description: string;
  quantity: string | null; unit: string | null; totalAmount: string;
  customerId: number | null; animalType: string | null; animalId: number | null;
  productType: string | null;
}
interface Contact { id: number; name: string; type: string; }
interface Animal { id: number; name: string; type: string; status: string; }
interface Prod { productType: string; quantity: string; unit: string; }
interface ConsRef { productType: string; quantity: string | null; }

const productLabels: Record<string, string> = {
  milk: "🥛 حليب", eggs: "🥚 بيض", wool: "🧶 صوف", meat: "🥩 لحم",
  honey: "🍯 عسل", manure: "💩 سماد", other: "📦 أخرى",
};
const productNames: Record<string, Record<string, string>> = {
  milk: { ar: "🥛 حليب", en: "🥛 Milk", fr: "🥛 Lait" },
  eggs: { ar: "🥚 بيض", en: "🥚 Eggs", fr: "🥚 Œufs" },
  wool: { ar: "🧶 صوف", en: "🧶 Wool", fr: "🧶 Laine" },
  meat: { ar: "🥩 لحم", en: "🥩 Meat", fr: "🥩 Viande" },
  honey: { ar: "🍯 عسل", en: "🍯 Honey", fr: "🍯 Miel" },
  manure: { ar: "💩 سماد", en: "💩 Manure", fr: "💩 Fumier" },
  other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
};

const L: Record<string, Record<string, string>> = {
  subtitle: { ar: "الإجمالي", en: "Total", fr: "Total" },
  new_sale: { ar: "عملية بيع", en: "New sale", fr: "Nouvelle vente" },
  no_sales: { ar: "لا توجد مبيعات", en: "No sales", fr: "Aucune vente" },
  cat_animal: { ar: "حيوان", en: "Animal", fr: "Animal" },
  cat_production: { ar: "إنتاج", en: "Production", fr: "Production" },
  modal_title: { ar: "💵 عملية بيع جديدة", en: "💵 New sale", fr: "💵 Nouvelle vente" },
  step_what: { ar: "ماذا تبيع؟", en: "What are you selling?", fr: "Que vendez-vous ?" },
  sell_production: { ar: "🥛 بيع إنتاج", en: "🥛 Sell production", fr: "🥛 Vendre production" },
  sell_animal: { ar: "🐄 بيع حيوان", en: "🐄 Sell animal", fr: "🐄 Vendre animal" },
  pay_cash: { ar: "💵 نقدي للخزينة", en: "💵 Cash to treasury", fr: "💵 Espèces" },
  pay_debt: { ar: "📋 دين على العميل", en: "📋 Debt on customer", fr: "📋 Dette client" },
  step_animal_type: { ar: "نوع الحيوان", en: "Animal type", fr: "Type d'animal" },
  step_animal: { ar: "الحيوان (سيُعلَّم مباعاً)", en: "Animal (will be marked sold)", fr: "Animal (sera marqué vendu)" },
  choose: { ar: "اختر...", en: "Choose...", fr: "Choisir..." },
  no_herd_type: { ar: "لا توجد حيوانات من هذا النوع في القطيع", en: "No animals of this type in the herd", fr: "Aucun animal de ce type dans le troupeau" },
  step_pick_prod: { ar: "اختر من الإنتاج المتوفر (يُخصم عند البيع)", en: "Pick from available production (deducted on sale)", fr: "Choisir dans la production (déduit à la vente)" },
  no_prod: { ar: "لا يوجد إنتاج متوفر — سجّل الإنتاج أولاً", en: "No production available — record production first", fr: "Pas de production — enregistrez d'abord" },
  from_here: { ar: "من هنا", en: "here", fr: "ici" },
  qty_avail: { ar: "متوفر", en: "available", fr: "disponible" },
  total_calc: { ar: "الإجمالي المحسوب", en: "Calculated total", fr: "Total calculé" },
  animal_price: { ar: "ثمن الحيوان", en: "Animal price", fr: "Prix de l'animal" },
  for_debt: { ar: "(إجباري للدين)", en: "(required for debt)", fr: "(requis pour dette)" },
  multi_hint: { ar: "اختر الحيوانات — يمكن بيع عدة حيوانات في دفعة واحدة", en: "Select animals — you can sell several in one batch", fr: "Sélectionnez les animaux — vous pouvez en vendre plusieurs en lot" },
  price_head: { ar: "سعر كل حيوان", en: "Per animal", fr: "Prix par animal" },
  price_total: { ar: "سعر إجمالي", en: "Total price", fr: "Prix total" },
  batch_price: { ar: "الثمن الإجمالي للدفعة *", en: "Batch total price *", fr: "Prix total du lot *" },
  computed_total: { ar: "الإجمالي", en: "Total", fr: "Total" },
  per_head_price: { ar: "الثمن", en: "Price", fr: "Prix" },
  need_each_price: { ar: "املأ ثمن كل حيوان", en: "Fill in the price of each animal", fr: "Saisissez le prix de chaque animal" },
  selected_n: { ar: "مختار", en: "selected", fr: "sélectionnés" },
  select_all: { ar: "تحديد الكل", en: "Select all", fr: "Tout sélectionner" },
  deselect_all: { ar: "إلغاء التحديد", en: "Deselect all", fr: "Tout désélectionner" },
  from_customers: { ar: "من العملاء", en: "From customers", fr: "Depuis clients" },
  new_customer: { ar: "عميل جديد +", en: "New customer +", fr: "Nouveau client +" },
  without: { ar: "بدون...", en: "None...", fr: "Aucun..." },
  new_customer_name: { ar: "اسم العميل الجديد *", en: "New customer name *", fr: "Nom du nouveau client *" },
  save_sale: { ar: "حفظ البيع", en: "Save sale", fr: "Enregistrer la vente" },
  need_animal: { ar: "اختر الحيوان", en: "Choose the animal", fr: "Choisissez l'animal" },
  need_stock: { ar: "اختر صنفاً متوفراً من الإنتاج", en: "Choose an available production item", fr: "Choisissez un produit disponible" },
  need_qty: { ar: "الكمية مطلوبة", en: "Quantity is required", fr: "Quantité requise" },
  qty_exceeds: { ar: "الكمية تتجاوز المتوفر", en: "Quantity exceeds available", fr: "Quantité supérieure au disponible" },
  need_amount: { ar: "المبلغ مطلوب", en: "Amount is required", fr: "Montant requis" },
  need_new_customer: { ar: "اسم العميل الجديد مطلوب", en: "New customer name is required", fr: "Nom du nouveau client requis" },
  debt_needs_customer: { ar: "الدين يتطلب عميلاً", en: "Debt requires a customer", fr: "La dette exige un client" },
  debt_needs_existing: { ar: "الدين يتطلب اختيار عميل موجود", en: "Debt requires choosing an existing customer", fr: "La dette exige un client existant" },
  details_title: { ar: "💵 تفاصيل البيع", en: "💵 Sale details", fr: "💵 Détails de la vente" },
  d_category: { ar: "الفئة", en: "Category", fr: "Catégorie" },
  d_desc: { ar: "الوصف", en: "Description", fr: "Description" },
  d_qty: { ar: "الكمية", en: "Quantity", fr: "Quantité" },
  d_unit: { ar: "الوحدة", en: "Unit", fr: "Unité" },
  d_total: { ar: "المبلغ الإجمالي", en: "Total amount", fr: "Montant total" },
  d_customer: { ar: "العميل", en: "Customer", fr: "Client" },
  d_animal: { ar: "الحيوان", en: "Animal", fr: "Animal" },
  d_product: { ar: "المنتج", en: "Product", fr: "Produit" },
};

export default function SalesPage() {
  const { t, lang } = useApp();
  const tx = (k: string) => L[k][lang] || L[k].ar;
  const prodName = (p: string) => productNames[p]?.[lang] || productNames[p]?.ar || p;
  const [items, setItems] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [consRef, setConsRef] = useState<ConsRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: getTodayDate(), category: "production", description: "", quantity: "", unit: "كغ", unitPrice: "", totalAmount: "", customerId: "", animalId: "", animalType: "cow", productType: "milk" });
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [payMode, setPayMode] = useState<"cash" | "debt">("cash");
  const [priceMode, setPriceMode] = useState<"total" | "perHead">("total");
  const [selIds, setSelIds] = useState<Record<string, boolean>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});

  const openForm = () => {
    setForm({ ...form, category: form.category, animalId: "" });
    setSelIds({});
    setPrices({});
    setPriceMode("total");
    setCustomerMode("existing");
    setNewCustomer({ name: "", phone: "" });
    setShowForm(true);
  };

  const saleUnits = ["كغ", "لتر", "حبة", "دلو", "بوطة", "كيس 25كج", "كيس 50كج", "رأس", "علبة"];

  // حساب تلقائي باتجاهين
  const sQty = (q: string, up: string, ta: string, changed: "qty" | "up" | "ta") => {
    const nq = parseFloat(q || "0"), nup = parseFloat(up || "0"), nta = parseFloat(ta || "0");
    const round = (x: number) => String(Math.round(x * 100) / 100);
    if (changed === "up" && nq > 0 && nup > 0) return { ...form, unitPrice: up, totalAmount: round(nq * nup) };
    if (changed === "ta" && nq > 0 && nta > 0) return { ...form, totalAmount: ta, unitPrice: round(nta / nq) };
    if (changed === "qty" && nq > 0 && nup > 0) return { ...form, quantity: q, totalAmount: round(nq * nup) };
    if (changed === "qty") return { ...form, quantity: q };
    if (changed === "up") return { ...form, unitPrice: up };
    return { ...form, totalAmount: ta };
  };

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/sales").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
    fetch("/api/contacts").then((r) => r.json()).then((d) => {
      const arr = Array.isArray(d) ? d : [];
      setCustomers(arr.filter((c: Contact) => c.type === "customer" || c.type === "both"));
    }).catch(() => {});
    fetch("/api/animals?status=active").then((r) => r.json()).then((d) => setHerd(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/production").then((r) => r.json()).then((d) => setProds(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/consumptions").then((r) => r.json()).then((d) => setConsRef(Array.isArray(d) ? d : [])).catch(() => setConsRef([]));
  };
  useEffect(() => { fetchAll(); }, []);

  // مخزون الإنتاج المتاح = المنتَج − المباع − المستهلَك (حسب الصنف)
  const prodStock = (() => {
    const map = new Map<string, { qty: number; unit: string }>();
    for (const p of prods) {
      const cur = map.get(p.productType) || { qty: 0, unit: p.unit };
      map.set(p.productType, { qty: cur.qty + parseFloat(p.quantity || "0"), unit: cur.unit });
    }
    for (const s of items) {
      if (s.category === "production" && s.productType && map.has(s.productType)) {
        const cur = map.get(s.productType)!;
        map.set(s.productType, { qty: cur.qty - parseFloat(s.quantity || "0"), unit: cur.unit });
      }
    }
    for (const c of consRef) {
      if (map.has(c.productType)) {
        const cur = map.get(c.productType)!;
        map.set(c.productType, { qty: cur.qty - parseFloat(c.quantity || "0"), unit: cur.unit });
      }
    }
    return [...map.entries()].map(([t, v]) => ({ t, ...v })).filter((x) => x.qty > 0.001);
  })();
  const selectedStock = prodStock.find((x) => x.t === form.productType);
  const perHeadTotal = Object.keys(selIds).filter((k) => selIds[k]).reduce((s, k) => s + (parseFloat(prices[k] || "0") || 0), 0);

  const handleSave = async () => {
    const selectedAnimals = form.category === "animal" ? herd.filter((a) => a.type === form.animalType && selIds[String(a.id)]) : [];
    if (form.category === "animal" && selectedAnimals.length === 0) { await appAlert(tx("need_animal")); return; }
    if (form.category === "production") {
      if (!selectedStock) { await appAlert(tx("need_stock")); return; }
      const q = parseFloat(form.quantity || "0");
      if (!q || q <= 0) { await appAlert(tx("need_qty")); return; }
      if (q > selectedStock.qty + 0.001) { await appAlert(`${tx("qty_exceeds")} (${selectedStock.qty} ${selectedStock.unit})`); return; }
    }
    if (form.category === "production" && !form.totalAmount) { await appAlert(tx("need_amount")); return; }
    if (form.category === "animal" && priceMode === "total" && (!form.totalAmount || parseFloat(form.totalAmount) <= 0)) { await appAlert(tx("need_amount")); return; }
    if (form.category === "animal" && priceMode === "perHead") {
      for (const a of selectedAnimals) {
        const p = parseFloat(prices[String(a.id)] || "0");
        if (!p || p <= 0) { await appAlert(`${tx("need_each_price")}: ${a.name}`); return; }
      }
    }
    if (customerMode === "new" && !newCustomer.name) { await appAlert(tx("need_new_customer")); return; }
    setSaving(true);
    try {
      let cid = form.customerId ? Number(form.customerId) : null;
      if (customerMode === "new") {
        const r = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCustomer.name, type: "customer", phone: newCustomer.phone || null, notes: "أضيف عند البيع" }) });
        const c = await r.json();
        cid = c.id;
      }
      const desc = form.category === "animal"
        ? `بيع ${selectedAnimals.length} ${getAnimalLabel(form.animalType, lang)}`
        : `بيع ${form.quantity} ${selectedStock?.unit || form.unit} ${productLabels[form.productType] || form.productType}`;
      if (payMode === "debt" && !cid) { await appAlert(tx("debt_needs_customer")); return; }
      let animalsPayload: { id: number; price: string }[] | undefined;
      let totalAmount = form.totalAmount;
      if (form.category === "animal") {
        if (priceMode === "perHead") {
          animalsPayload = selectedAnimals.map((a) => ({ id: a.id, price: prices[String(a.id)] }));
          totalAmount = String(animalsPayload.reduce((s, x) => s + parseFloat(x.price), 0));
        } else {
          const n = selectedAnimals.length;
          const t = parseFloat(form.totalAmount) || 0;
          const base = Math.round((t / n) * 100) / 100;
          animalsPayload = selectedAnimals.map((a, i) => ({ id: a.id, price: i === n - 1 ? String(Math.round((t - base * (n - 1)) * 100) / 100) : String(base) }));
        }
      }
      const r = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date, category: form.category, description: desc,
          quantity: form.quantity || null, unit: form.category === "animal" ? null : (selectedStock?.unit || form.unit || null), unitPrice: form.unitPrice || null,
          totalAmount, customerId: cid,
          animals: form.category === "animal" ? animalsPayload : undefined,
          animalId: null,
          animalType: form.category === "animal" ? form.animalType : null,
          productType: form.category === "production" ? form.productType : null,
          paymentMethod: payMode,
        }),
      });
      const dd = await r.json();
      if (!r.ok) {
        if (dd.error === "CUSTOMER_REQUIRED") { await appAlert(tx("debt_needs_existing")); return; }
        await appAlert(t("c_error")); return;
      }
      setShowForm(false);
      setForm({ ...form, description: "", quantity: "", unitPrice: "", totalAmount: "", animalId: "" });
      setCustomerMode("existing");
      setNewCustomer({ name: "", phone: "" });
      setSelIds({});
      setPrices({});
      setPriceMode("total");
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const total = items.reduce((s, x) => s + parseFloat(x.totalAmount || "0"), 0);

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_sales")} subtitle={`${tx("subtitle")}: ${formatCurrency(total)}`} action={{ label: tx("new_sale"), icon: "💵", onClick: openForm }} />
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">💵</p><p className="text-gray-500">{tx("no_sales")}</p></div>
        ) : items.map((s) => (
          <button key={s.id} onClick={() => setSelected(s)} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">{s.category === "animal" ? "🐄" : "🥛"}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{s.description}</p>
              <p className="text-xs text-gray-500">{formatDate(s.date)}</p>
            </div>
            <p className="font-bold text-sm text-emerald-600 shrink-0">+{formatCurrency(s.totalAmount)}</p>
          </button>
        ))}
        <div className="flex gap-2 pt-2">
          <Link href="/production" className="flex-1 text-center bg-orange-500 text-white py-2 rounded-xl text-sm font-medium">🥛 {t("nav_production")}</Link>
          <Link href="/contacts" className="flex-1 text-center bg-purple-500 text-white py-2 rounded-xl text-sm font-medium">👥 {t("nav_contacts")}</Link>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("details_title")}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">{selected.category === "animal" ? "🐄" : "🥛"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{selected.description}</p>
                <p className="text-xs text-gray-500">{formatDate(selected.date)}</p>
              </div>
              <p className="font-bold text-emerald-600">+{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_category")}</span><span className="font-medium">{selected.category === "animal" ? tx("cat_animal") : tx("cat_production")}</span></div>
              <div className="bg-gray-50 rounded-xl px-3 py-2"><p className="text-gray-500 text-xs mb-1">{tx("d_desc")}</p><p className="font-medium">{selected.description}</p></div>
              {selected.category === "production" && selected.productType && (
                <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_product")}</span><span className="font-medium">{prodName(selected.productType)}</span></div>
              )}
              {selected.category === "animal" && (
                <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_animal")}</span><span className="font-medium">{herd.find((a) => a.id === selected.animalId)?.name ?? "—"} {selected.animalType ? `• ${getAnimalLabel(selected.animalType, lang)}` : ""}</span></div>
              )}
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_qty")}</span><span className="font-medium">{selected.quantity || "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_unit")}</span><span className="font-medium">{selected.unit || "—"}</span></div>
              <div className="flex justify-between bg-emerald-50 rounded-xl px-3 py-2"><span className="text-gray-600 font-medium">{tx("d_total")}</span><span className="font-bold text-emerald-600">+{formatCurrency(selected.totalAmount)}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("d_customer")}</span><span className="font-medium">{customers.find((c) => c.id === selected.customerId)?.name ?? "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_date")}</span><span className="font-medium">{formatDate(selected.date)}</span></div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("modal_title")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">1️⃣ {tx("step_what")} *</label>
                <div className="flex gap-2">
                  {[["production", tx("sell_production")], ["animal", tx("sell_animal")]].map(([v, l]) => (
                    <button key={v} onClick={() => { setForm({ ...form, category: v, animalId: "" }); setSelIds({}); setPrices({}); setPriceMode("total"); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${form.category === v ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPayMode("cash")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${payMode === "cash" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_cash")}</button>
                  <button onClick={() => setPayMode("debt")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${payMode === "debt" ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_debt")}</button>
                </div>
              </div>
              {form.category === "animal" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">2️⃣ {tx("step_animal_type")} *</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { value: "cow", emoji: "🐄" },
                        { value: "goat", emoji: "🐐" },
                        { value: "sheep", emoji: "🐑" },
                        { value: "chicken", emoji: "🐔" },
                        { value: "quail", emoji: "🦅" },
                      ].map((at) => (
                        <button key={at.value} onClick={() => { setForm({ ...form, animalType: at.value, animalId: "" }); setSelIds({}); setPrices({}); }}
                          className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${form.animalType === at.value ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                          <span className="text-xl">{at.emoji}</span>{getAnimalLabel(at.value, lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">3️⃣ {tx("step_animal")} *</label>
                    <div className="flex gap-2 mb-2">
                      {[["perHead", tx("price_head")], ["total", tx("price_total")]].map(([v, l]) => (
                        <button key={v} onClick={() => setPriceMode(v as "total" | "perHead")}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium ${priceMode === v ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{tx("multi_hint")}</p>
                    {herd.filter((a) => a.type === form.animalType).length > 0 && (
                      <button onClick={() => {
                        const typeHerd = herd.filter((a) => a.type === form.animalType);
                        const allSel = typeHerd.every((a) => selIds[String(a.id)]);
                        const next: Record<string, boolean> = {};
                        if (!allSel) typeHerd.forEach((a) => { next[String(a.id)] = true; });
                        setSelIds(next);
                        if (allSel) setPrices({});
                      }}
                        className="w-full mb-2 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {herd.filter((a) => a.type === form.animalType).every((a) => selIds[String(a.id)]) ? `❌ ${tx("deselect_all")}` : `✅ ${tx("select_all")}`}
                      </button>
                    )}
                    <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {herd.filter((a) => a.type === form.animalType).length === 0 ? (
                        <p className="text-xs text-red-500 p-3">{tx("no_herd_type")}</p>
                      ) : herd.filter((a) => a.type === form.animalType).map((a) => {
                        const on = !!selIds[String(a.id)];
                        return (
                          <div key={a.id} className={`flex items-center gap-2 p-2 ${on ? "bg-emerald-50" : "bg-white"}`}>
                            <button onClick={() => setSelIds({ ...selIds, [String(a.id)]: !on })} className="flex-1 min-w-0 flex items-center gap-2 text-right">
                              <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs flex-shrink-0 ${on ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300 text-transparent"}`}>✓</span>
                              <span className={`text-sm font-medium truncate ${on ? "text-emerald-800" : "text-gray-700"}`}>{a.name}</span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{getAnimalEmoji(a.type)}</span>
                            </button>
                            {on && priceMode === "perHead" && (
                              <input type="number" inputMode="numeric" className="w-24 flex-shrink-0 border border-emerald-300 rounded-lg px-2 py-1.5 text-sm text-center" placeholder={tx("per_head_price")} value={prices[String(a.id)] || ""} onChange={(e) => setPrices({ ...prices, [String(a.id)]: e.target.value })} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Object.values(selIds).filter(Boolean).length} {tx("selected_n")}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">2️⃣ {tx("step_pick_prod")} *</label>
                  {prodStock.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">{tx("no_prod")} <Link href="/production" className="text-orange-600 font-medium">{tx("from_here")} ←</Link></p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {prodStock.map((p) => (
                        <button key={p.t} onClick={() => setForm({ ...form, productType: p.t, unit: p.unit })}
                          className={`border rounded-xl p-2.5 text-right transition-all ${form.productType === p.t ? "bg-emerald-600 text-white border-emerald-600 shadow" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-sm font-bold ${form.productType === p.t ? "text-white" : "text-gray-900"}`}>{prodName(p.t)}</p>
                          <p className={`text-xs mt-0.5 ${form.productType === p.t ? "text-emerald-100" : "text-gray-500"}`}>{t("c_available")}: {p.qty} {p.unit}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {form.category === "production" && (
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">3️⃣ {t("c_quantity")}{selectedStock ? ` (${selectedStock.qty} ${tx("qty_avail")})` : ""}</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.quantity} onChange={(e) => setForm(sQty(e.target.value, form.unitPrice, form.totalAmount, "qty"))} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_unit")}</label>
                  <div className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 text-center font-medium">{selectedStock?.unit || form.unit}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_unit_price")} ⇄</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.unitPrice} onChange={(e) => setForm(sQty(form.quantity, e.target.value, form.totalAmount, "up"))} />
                </div>
              </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{form.category === "production" ? `4️⃣ ${t("c_total")} * ⇄` : priceMode === "total" ? `4️⃣ ${tx("batch_price")}` : `4️⃣ ${t("c_total")}`}</label>
                {form.category === "animal" && priceMode === "perHead" ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <span className="text-xs text-gray-500">{tx("computed_total")}: </span>
                    <span className="text-base font-bold text-emerald-700">{formatCurrency(perHeadTotal)}</span>
                  </div>
                ) : (
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.totalAmount} onChange={(e) => setForm(sQty(form.quantity, form.unitPrice, e.target.value, "ta"))} />
                )}
              </div>
              {form.category === "production" && parseFloat(form.quantity || "0") > 0 && parseFloat(form.unitPrice || "0") > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                  <span className="text-xs text-gray-500">{tx("total_calc")}: </span>
                  <span className="text-base font-bold text-emerald-700">{formatCurrency(parseFloat(form.quantity) * parseFloat(form.unitPrice))}</span>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{form.category === "production" ? "5️⃣" : "5️⃣"} {t("c_customer")}{payMode === "debt" ? ` ${tx("for_debt")} *` : ""}</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setCustomerMode("existing")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${customerMode === "existing" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("from_customers")}</button>
                  <button onClick={() => setCustomerMode("new")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${customerMode === "new" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("new_customer")}</button>
                </div>
                {customerMode === "existing" ? (
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">{tx("without")}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder={tx("new_customer_name")} value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder={t("c_phone")} value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">6️⃣ {t("c_date")}</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("save_sale")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
