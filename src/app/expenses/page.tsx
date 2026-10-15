"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { appAlert } from "@/components/AppDialog";
import { useApp } from "@/lib/i18n";
import { formatCurrency, formatDate, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface Expense {
  id: number; date: string; category: string; description: string;
  amount: string; animalType: string | null; paymentMethod: string | null;
  notes: string | null;
}

const categoryLabels: Record<string, string> = {
  purchase: "🛒 مشتريات", health: "🏥 صحة وبيطرة", feed: "🌾 غذاء",
  salary: "👷 أجور", electricity: "💡 كهرباء", water: "💧 ماء",
  maintenance: "🔧 صيانة", transport: "🚚 نقل", other: "📦 أخرى",
};
const categoryNames: Record<string, Record<string, string>> = {
  purchase: { ar: "🛒 مشتريات", en: "🛒 Purchases", fr: "🛒 Achats" },
  health: { ar: "🏥 صحة وبيطرة", en: "🏥 Health & vet", fr: "🏥 Santé & véto" },
  feed: { ar: "🌾 غذاء", en: "🌾 Feed", fr: "🌾 Alimentation" },
  salary: { ar: "👷 أجور", en: "👷 Wages", fr: "👷 Salaires" },
  electricity: { ar: "💡 كهرباء", en: "💡 Electricity", fr: "💡 Électricité" },
  water: { ar: "💧 ماء", en: "💧 Water", fr: "💧 Eau" },
  maintenance: { ar: "🔧 صيانة", en: "🔧 Maintenance", fr: "🔧 Maintenance" },
  transport: { ar: "🚚 نقل", en: "🚚 Transport", fr: "🚚 Transport" },
  other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
};

const L: Record<string, Record<string, string>> = {
  manual: { ar: "مصروف يدوي", en: "Manual expense", fr: "Dépense manuelle" },
  auto_hint: { ar: "المشتريات والغذاء والعلاج تُضاف هنا تلقائياً — أضف يدوياً الأجور والفواتير والصيانة فقط.", en: "Purchases, feed and treatments are added here automatically — manually add only wages, bills and maintenance.", fr: "Achats, alimentation et soins sont ajoutés automatiquement — ajoutez manuellement salaires, factures et maintenance." },
  no_expenses: { ar: "لا توجد مصاريف", en: "No expenses", fr: "Aucune dépense" },
  need_both: { ar: "الوصف والمبلغ مطلوبان", en: "Description and amount are required", fr: "Description et montant requis" },
  details: { ar: "📄 تفاصيل المصروف", en: "📄 Expense details", fr: "📄 Détails de la dépense" },
  f_animal: { ar: "نوع الحيوان", en: "Animal type", fr: "Type d'animal" },
  f_paymethod: { ar: "طريقة الدفع", en: "Payment method", fr: "Mode de paiement" },
};

const categoryIcon = (c: string) => (categoryLabels[c]?.split(" ")[0] || "💸");

export default function ExpensesPage() {
  const { t, lang } = useApp();
  const tx = (k: string) => L[k][lang] || L[k].ar;
  const catName = (c: string) => categoryNames[c]?.[lang] || categoryNames[c]?.ar || c;
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: getTodayDate(), category: "other", description: "", amount: "", notes: "" });
  const [selected, setSelected] = useState<Expense | null>(null);

  const detailRow = (label: string, value: string) => (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-bold text-gray-800 text-sm text-end">{value}</span>
    </div>
  );

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/expenses").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.description || !form.amount) { await appAlert(tx("need_both")); return; }
    setSaving(true);
    try {
      await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, notes: form.notes || null }),
      });
      setShowForm(false);
      setForm({ ...form, description: "", amount: "", notes: "" });
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const filtered = filter ? items.filter((e) => e.category === filter) : items;
  const total = filtered.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
  const byCat = Object.keys(categoryLabels).map((c) => ({
    c, total: items.filter((e) => e.category === c).reduce((s, e) => s + parseFloat(e.amount || "0"), 0),
  })).filter((x) => x.total > 0);

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_expenses")} subtitle={`${t("c_total")}: ${formatCurrency(total)}`} action={{ label: tx("manual"), icon: "💸", onClick: () => setShowForm(true) }} />
      <div className="px-4 py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-amber-700 text-xs leading-relaxed">{tx("auto_hint")}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
          <button onClick={() => setFilter("")} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${filter === "" ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{t("c_all")}</button>
          {Object.entries(categoryLabels).map(([v]) => (
            <button key={v} onClick={() => setFilter(v)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${filter === v ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{catName(v)}</button>
          ))}
        </div>

        {byCat.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm space-y-3">
            {byCat.map((x) => (
              <div key={x.c}>
                <div className="flex justify-between text-sm mb-1.5"><span className="text-gray-700">{catName(x.c)}</span><span className="font-bold">{formatCurrency(x.total)}</span></div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${total > 0 ? (x.total / items.reduce((s, e) => s + parseFloat(e.amount || "0"), 0)) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16"><p className="text-5xl mb-3">💸</p><p className="text-gray-500">{tx("no_expenses")}</p></div>
          ) : filtered.map((e) => (
            <button key={e.id} onClick={() => setSelected(e)} className="w-full bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 text-start">
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">{categoryIcon(e.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{e.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(e.date)} • {catName(e.category)}</p>
              </div>
              <p className="font-bold text-base text-red-600 flex-shrink-0">-{formatCurrency(e.amount)}</p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("details")}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">{categoryIcon(selected.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{selected.description}</p>
                <p className="font-bold text-lg text-red-600">-{formatCurrency(selected.amount)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {detailRow(t("c_date"), formatDate(selected.date))}
              {detailRow(t("c_category"), catName(selected.category))}
              {detailRow(t("c_desc"), selected.description)}
              {detailRow(t("c_amount"), formatCurrency(selected.amount))}
              {detailRow(tx("f_animal"), selected.animalType ? getAnimalLabel(selected.animalType, lang) : "—")}
              {detailRow(tx("f_paymethod"), selected.paymentMethod || "—")}
              {detailRow(t("c_notes"), selected.notes || "—")}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">💸 {tx("manual")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_category")}</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryLabels).filter(([v]) => v !== "purchase" && v !== "health" && v !== "feed").map(([v]) => <option key={v} value={v}>{catName(v)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_desc")} *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_amount")} *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_date")}</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-red-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : t("common_save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
