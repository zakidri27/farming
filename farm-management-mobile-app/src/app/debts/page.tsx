"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getTodayDate } from "@/lib/utils";

interface Debt {
  id: number;
  date: string;
  type: string;
  contactName: string;
  description: string;
  totalAmount: string;
  paidAmount: string;
  dueDate: string | null;
  status: string;
  notes: string | null;
}

const defaultForm = {
  date: getTodayDate(),
  type: "owed_to_us",
  contactId: "",
  contactName: "",
  description: "",
  totalAmount: "",
  paidAmount: "0",
  dueDate: "",
  notes: "",
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<"" | "owed_to_us" | "we_owe">("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/debts").then((r) => r.json()).then(setDebts).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.contactName || !form.totalAmount) return alert("اسم الشخص والمبلغ مطلوبان");
    setSaving(true);
    try {
      if (editDebt) {
        await fetch(`/api/debts/${editDebt.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      setEditDebt(null);
      setForm(defaultForm);
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handlePay = async () => {
    if (!editDebt || !payAmount) return;
    const newPaid = (parseFloat(editDebt.paidAmount) + parseFloat(payAmount)).toString();
    await fetch(`/api/debts/${editDebt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editDebt, paidAmount: newPaid }),
    });
    setShowPayForm(false);
    setEditDebt(null);
    setPayAmount("");
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الدين؟")) return;
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = filterType ? debts.filter((d) => d.type === filterType) : debts;
  const owedToUs = debts.filter((d) => d.type === "owed_to_us" && d.status !== "paid").reduce((s, d) => s + parseFloat(d.totalAmount) - parseFloat(d.paidAmount || "0"), 0);
  const weOwe = debts.filter((d) => d.type === "we_owe" && d.status !== "paid").reduce((s, d) => s + parseFloat(d.totalAmount) - parseFloat(d.paidAmount || "0"), 0);

  const openPay = (debt: Debt) => {
    setEditDebt(debt);
    setPayAmount("");
    setShowPayForm(true);
  };

  const openEdit = (debt: Debt) => {
    setEditDebt(debt);
    setForm({
      date: debt.date,
      type: debt.type,
      contactId: "",
      contactName: debt.contactName,
      description: debt.description,
      totalAmount: debt.totalAmount,
      paidAmount: debt.paidAmount,
      dueDate: debt.dueDate || "",
      notes: debt.notes || "",
    });
    setShowForm(true);
  };

  const remaining = (d: Debt) => parseFloat(d.totalAmount) - parseFloat(d.paidAmount || "0");

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الديون" subtitle={`${debts.length} دين`} action={{ label: "إضافة", icon: "➕", onClick: () => { setEditDebt(null); setForm(defaultForm); setShowForm(true); } }} />

      {/* Summary */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-600 text-white rounded-2xl p-3">
            <p className="text-green-100 text-xs">💚 ديون لنا</p>
            <p className="text-lg font-bold">{formatCurrency(owedToUs)}</p>
          </div>
          <div className="bg-red-600 text-white rounded-2xl p-3">
            <p className="text-red-100 text-xs">❤️ ديون علينا</p>
            <p className="text-lg font-bold">{formatCurrency(weOwe)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { value: "", label: "الكل" },
            { value: "owed_to_us", label: "💚 لنا" },
            { value: "we_owe", label: "❤️ علينا" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value as "" | "owed_to_us" | "we_owe")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${filterType === f.value ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">📋</p><p className="text-gray-500">لا توجد ديون</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <div key={d.id} className={`bg-white rounded-2xl p-4 shadow-sm fade-in ${d.status === "paid" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${d.type === "owed_to_us" ? "bg-green-100" : "bg-red-100"}`}>
                      {d.type === "owed_to_us" ? "💚" : "❤️"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{d.contactName}</p>
                      <p className="text-xs text-gray-500">{d.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${getStatusColor(d.status)}`}>{getStatusLabel(d.status)}</span>
                        {d.dueDate && <span className="text-xs text-gray-400">📅 {formatDate(d.dueDate)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {d.status !== "paid" && (
                      <button onClick={() => openPay(d)} className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-bold">💰</button>
                    )}
                    <button onClick={() => openEdit(d)} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">✏️</button>
                    <button onClick={() => handleDelete(d.id)} className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>المدفوع: {formatCurrency(d.paidAmount)}</span>
                    <span>المتبقي: {formatCurrency(remaining(d))}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.type === "owed_to_us" ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(100, (parseFloat(d.paidAmount) / parseFloat(d.totalAmount)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{formatDate(d.date)}</span>
                    <span className="text-sm font-bold text-gray-900">الإجمالي: {formatCurrency(d.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editDebt ? "تعديل الدين" : "إضافة دين"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">نوع الدين</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({ ...form, type: "owed_to_us" })} className={`py-3 rounded-xl text-sm font-medium ${form.type === "owed_to_us" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    💚 دين لنا
                  </button>
                  <button onClick={() => setForm({ ...form, type: "we_owe" })} className={`py-3 rounded-xl text-sm font-medium ${form.type === "we_owe" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    ❤️ دين علينا
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الاسم *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="اسم الشخص أو المؤسسة" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الوصف *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="وصف الدين" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التاريخ</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">المبلغ الإجمالي *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">المدفوع</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">تاريخ الاستحقاق</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : editDebt ? "تحديث" : "حفظ"}
            </button>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayForm && editDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowPayForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">تسجيل دفعة</h2>
              <button onClick={() => setShowPayForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <p className="text-gray-600 mb-1 text-sm">المتبقي: <span className="font-bold text-red-600">{formatCurrency(remaining(editDebt))}</span></p>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-lg font-bold mt-2"
              placeholder="مبلغ الدفعة"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <button onClick={handlePay} className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold">
              💰 تأكيد الدفع
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
