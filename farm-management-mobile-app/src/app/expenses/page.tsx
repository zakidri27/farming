"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: string;
  animalType: string | null;
  paymentMethod: string;
  notes: string | null;
}

const categories = [
  { value: "salary", label: "رواتب", icon: "👷" },
  { value: "electricity", label: "كهرباء", icon: "⚡" },
  { value: "water", label: "ماء", icon: "💧" },
  { value: "maintenance", label: "صيانة", icon: "🔧" },
  { value: "transport", label: "نقل", icon: "🚛" },
  { value: "rent", label: "إيجار", icon: "🏠" },
  { value: "insurance", label: "تأمين", icon: "🛡️" },
  { value: "other", label: "أخرى", icon: "📦" },
];

const animalTypes = [
  { value: "cow", label: "أبقار" },
  { value: "goat", label: "ماعز" },
  { value: "sheep", label: "أغنام" },
  { value: "chicken", label: "دجاج" },
  { value: "quail", label: "سمان" },
];

const defaultForm = {
  date: getTodayDate(),
  category: "salary",
  description: "",
  amount: "",
  animalType: "",
  paymentMethod: "cash",
  notes: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.description || !form.amount) return alert("الوصف والمبلغ مطلوبان");
    setSaving(true);
    try {
      await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false);
      setForm(defaultForm);
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه العملية؟")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = filterCat ? expenses.filter((e) => e.category === filterCat) : expenses;
  const total = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const getCatIcon = (cat: string) => categories.find((c) => c.value === cat)?.icon || "📦";
  const getCatLabel = (cat: string) => categories.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="المصاريف" subtitle={formatCurrency(total)} action={{ label: "إضافة", icon: "➕", onClick: () => setShowForm(true) }} />

      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterCat("")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${!filterCat ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>الكل ({expenses.length})</button>
          {categories.map((c) => (
            <button key={c.value} onClick={() => setFilterCat(c.value)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${filterCat === c.value ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="bg-red-600 text-white rounded-2xl p-4 mb-4">
          <p className="text-red-100 text-xs">إجمالي المصاريف</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          <p className="text-red-200 text-xs mt-1">{filtered.length} عملية</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">💸</p><p className="text-gray-500">لا توجد مصاريف</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">{getCatIcon(e.category)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{e.description}</p>
                      <p className="text-xs text-gray-500">{getCatLabel(e.category)} {e.animalType ? `• ${getAnimalLabel(e.animalType)}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(e.date)} • {e.paymentMethod === "cash" ? "نقدي" : "بنك"}</span>
                  <p className="font-bold text-red-700">{formatCurrency(e.amount)}</p>
                </div>
                {e.notes && <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">{e.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">إضافة مصاريف</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التاريخ</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الصنف</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((c) => (
                    <button key={c.value} onClick={() => setForm({ ...form, category: c.value })} className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 ${form.category === c.value ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                      <span>{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الوصف *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="وصف المصروف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">نوع الحيوان</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.animalType} onChange={(e) => setForm({ ...form, animalType: e.target.value })}>
                  <option value="">عام</option>
                  {animalTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">المبلغ (دج) *</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">طريقة الدفع</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">نقدي</option>
                  <option value="bank">بنك</option>
                  <option value="cheque">شيك</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
