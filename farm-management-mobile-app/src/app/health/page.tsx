"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, getAnimalLabel, getStatusColor, getStatusLabel, getTodayDate } from "@/lib/utils";

interface HealthRecord {
  id: number;
  date: string;
  animalType: string | null;
  recordType: string;
  description: string;
  diagnosis: string | null;
  treatment: string | null;
  medicine: string | null;
  medicineCost: string | null;
  vetName: string | null;
  vetCost: string | null;
  totalCost: string | null;
  nextVisitDate: string | null;
  status: string;
  notes: string | null;
}

interface Animal {
  id: number;
  name: string;
  type: string;
}

const recordTypes = [
  { value: "vaccination", label: "تلقيح", icon: "💉" },
  { value: "treatment", label: "علاج", icon: "🏥" },
  { value: "checkup", label: "فحص", icon: "🔍" },
  { value: "deworming", label: "تطفيل", icon: "🐛" },
  { value: "surgery", label: "عملية", icon: "🔪" },
  { value: "other", label: "أخرى", icon: "📋" },
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
  animalType: "",
  animalId: "",
  recordType: "checkup",
  description: "",
  diagnosis: "",
  treatment: "",
  medicine: "",
  medicineCost: "",
  vetName: "",
  vetCost: "",
  nextVisitDate: "",
  status: "healthy",
  notes: "",
};

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/health/records").then((r) => r.json()),
      fetch("/api/animals").then((r) => r.json()),
    ]).then(([recs, animals]) => {
      setRecords(recs);
      setAnimals(animals);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.description || !form.recordType) return alert("الوصف ونوع السجل مطلوبان");
    setSaving(true);
    try {
      await fetch("/api/health/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm(defaultForm);
      fetchData();
    } catch { alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا السجل؟")) return;
    await fetch(`/api/health/records/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = filterType ? records.filter((r) => r.animalType === filterType) : records;
  const totalCost = filtered.reduce((sum, r) => sum + parseFloat(r.totalCost || "0"), 0);

  const getTypeIcon = (type: string) => recordTypes.find((t) => t.value === type)?.icon || "📋";
  const getTypeLabel = (type: string) => recordTypes.find((t) => t.value === type)?.label || type;

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الصحة والبيطرة" subtitle={`${filtered.length} سجل`} action={{ label: "إضافة", icon: "➕", onClick: () => setShowForm(true) }} />

      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterType("")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${!filterType ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}>الكل</button>
          {animalTypes.map((t) => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${filterType === t.value ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Summary */}
        <div className="bg-pink-600 text-white rounded-2xl p-4 mb-4">
          <p className="text-pink-100 text-xs">إجمالي تكاليف العلاج</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          <p className="text-pink-200 text-xs mt-1">{filtered.length} سجل طبي</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🏥</p><p className="text-gray-500">لا توجد سجلات صحية</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">{getTypeIcon(r.recordType)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.description}</p>
                      <p className="text-xs text-gray-500">{getTypeLabel(r.recordType)} {r.animalType ? `• ${getAnimalLabel(r.animalType)}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`badge ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                    <button onClick={() => handleDelete(r.id)} className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">التاريخ</p>
                    <p className="text-sm font-medium">{formatDate(r.date)}</p>
                  </div>
                  {r.totalCost && parseFloat(r.totalCost) > 0 && (
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">التكلفة</p>
                      <p className="text-sm font-medium text-red-700">{formatCurrency(r.totalCost)}</p>
                    </div>
                  )}
                </div>

                {(r.diagnosis || r.treatment || r.medicine) && (
                  <div className="mt-3 space-y-1">
                    {r.diagnosis && <p className="text-xs text-gray-600 bg-blue-50 rounded-lg p-2"><span className="font-medium">التشخيص:</span> {r.diagnosis}</p>}
                    {r.treatment && <p className="text-xs text-gray-600 bg-green-50 rounded-lg p-2"><span className="font-medium">العلاج:</span> {r.treatment}</p>}
                    {r.medicine && <p className="text-xs text-gray-600 bg-amber-50 rounded-lg p-2"><span className="font-medium">الدواء:</span> {r.medicine} {r.medicineCost ? `(${formatCurrency(r.medicineCost)})` : ""}</p>}
                  </div>
                )}

                {r.vetName && (
                  <p className="mt-2 text-xs text-gray-500">👨‍⚕️ الطبيب: {r.vetName} {r.vetCost ? `• ${formatCurrency(r.vetCost)}` : ""}</p>
                )}
                {r.nextVisitDate && (
                  <p className="mt-1 text-xs text-blue-600 font-medium">📅 الزيارة القادمة: {formatDate(r.nextVisitDate)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">سجل صحي جديد</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التاريخ</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">نوع السجل</label>
                <div className="grid grid-cols-3 gap-2">
                  {recordTypes.map((t) => (
                    <button key={t.value} onClick={() => setForm({ ...form, recordType: t.value })} className={`py-2 rounded-xl text-xs flex items-center justify-center gap-1 ${form.recordType === t.value ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">نوع الحيوان</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.animalType} onChange={(e) => setForm({ ...form, animalType: e.target.value })}>
                  <option value="">الكل</option>
                  {animalTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.animalType && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الحيوان (اختياري)</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })}>
                    <option value="">القطيع كله</option>
                    {animals.filter((a) => a.type === form.animalType).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الوصف *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="وصف السجل الصحي" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التشخيص</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">العلاج</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الدواء</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">تكلفة الدواء</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.medicineCost} onChange={(e) => setForm({ ...form, medicineCost: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">اسم الطبيب</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.vetName} onChange={(e) => setForm({ ...form, vetName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">تكلفة الطبيب</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.vetCost} onChange={(e) => setForm({ ...form, vetCost: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الزيارة القادمة</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.nextVisitDate} onChange={(e) => setForm({ ...form, nextVisitDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الحالة</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="healthy">صحي</option>
                  <option value="sick">مريض</option>
                  <option value="treatment">تحت العلاج</option>
                  <option value="recovered">تعافى</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-pink-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
