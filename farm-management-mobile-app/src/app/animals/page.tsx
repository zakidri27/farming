"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getStatusColor, getStatusLabel, getTodayDate } from "@/lib/utils";

interface Animal {
  id: number;
  name: string;
  type: string;
  breed: string | null;
  birthDate: string | null;
  gender: string | null;
  weight: string | null;
  purchasePrice: string | null;
  purchaseDate: string | null;
  status: string;
  notes: string | null;
  tagNumber: string | null;
}

const animalTypes = [
  { value: "", label: "الكل", emoji: "🐾" },
  { value: "cow", label: "أبقار", emoji: "🐄" },
  { value: "goat", label: "ماعز", emoji: "🐐" },
  { value: "sheep", label: "أغنام", emoji: "🐑" },
  { value: "chicken", label: "دجاج", emoji: "🐔" },
  { value: "quail", label: "سمان", emoji: "🦅" },
];

const defaultForm = {
  name: "",
  type: "cow",
  breed: "",
  birthDate: "",
  gender: "male",
  weight: "",
  purchasePrice: "",
  purchaseDate: getTodayDate(),
  status: "active",
  notes: "",
  tagNumber: "",
};

function AnimalsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "";

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(initialType);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchAnimals = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    fetch(`/api/animals?${params}`)
      .then((r) => r.json())
      .then(setAnimals)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnimals(); }, [filterType]);

  const openAddForm = () => {
    setEditAnimal(null);
    setForm({ ...defaultForm, type: filterType || "cow" });
    setShowForm(true);
  };

  const openEditForm = (animal: Animal) => {
    setEditAnimal(animal);
    setForm({
      name: animal.name,
      type: animal.type,
      breed: animal.breed || "",
      birthDate: animal.birthDate || "",
      gender: animal.gender || "male",
      weight: animal.weight || "",
      purchasePrice: animal.purchasePrice || "",
      purchaseDate: animal.purchaseDate || getTodayDate(),
      status: animal.status,
      notes: animal.notes || "",
      tagNumber: animal.tagNumber || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.type) return alert("الاسم والنوع مطلوبان");
    setSaving(true);
    try {
      const url = editAnimal ? `/api/animals/${editAnimal.id}` : "/api/animals";
      const method = editAnimal ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false);
      fetchAnimals();
    } catch (err) {
      alert("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الحيوان؟")) return;
    await fetch(`/api/animals/${id}`, { method: "DELETE" });
    fetchAnimals();
  };

  const filtered = filterType ? animals.filter((a) => a.type === filterType) : animals;
  const counts = animalTypes.slice(1).map((t) => ({
    ...t,
    count: animals.filter((a) => a.type === t.value).length,
  }));

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title="الحيوانات" subtitle={`${filtered.length} حيوان`} action={{ label: "إضافة", icon: "➕", onClick: openAddForm }} />

      {/* Type Filter */}
      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {animalTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterType === t.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              <span className={`text-xs ${filterType === t.value ? "text-green-100" : "text-gray-400"}`}>
                {t.value === "" ? animals.length : animals.filter((a) => a.type === t.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🐾</p>
            <p className="text-gray-500">لا توجد حيوانات</p>
            <button onClick={openAddForm} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-medium">
              إضافة حيوان
            </button>
          </div>
        ) : (
          filtered.map((animal) => (
            <div key={animal.id} className="bg-white rounded-2xl p-4 shadow-sm card-hover fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                    {getAnimalEmoji(animal.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{animal.name}</h3>
                      {animal.tagNumber && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">#{animal.tagNumber}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getAnimalLabel(animal.type)} {animal.breed ? `• ${animal.breed}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${getStatusColor(animal.status)}`}>
                        {getStatusLabel(animal.status)}
                      </span>
                      {animal.gender && (
                        <span className="text-xs text-gray-500">
                          {animal.gender === "male" ? "♂ ذكر" : "♀ أنثى"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditForm(animal)} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">✏️</button>
                  <button onClick={() => handleDelete(animal.id)} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm">🗑️</button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {animal.weight && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">الوزن</p>
                    <p className="text-sm font-semibold">{animal.weight} كغ</p>
                  </div>
                )}
                {animal.purchasePrice && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">سعر الشراء</p>
                    <p className="text-sm font-semibold">{formatCurrency(animal.purchasePrice)}</p>
                  </div>
                )}
                {animal.birthDate && (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">تاريخ الميلاد</p>
                    <p className="text-sm font-semibold">{formatDate(animal.birthDate)}</p>
                  </div>
                )}
              </div>

              {animal.notes && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{animal.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editAnimal ? "تعديل الحيوان" : "إضافة حيوان"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الاسم *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  placeholder="اسم الحيوان"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">النوع *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {animalTypes.slice(1).map((t) => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">السلالة</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="السلالة"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">رقم الوسم</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="#001"
                    value={form.tagNumber}
                    onChange={(e) => setForm({ ...form, tagNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الجنس</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">♂ ذكر</option>
                    <option value="female">♀ أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الحالة</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">نشط</option>
                    <option value="sold">مباع</option>
                    <option value="dead">نافق</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الوزن (كغ)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="0.00"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">سعر الشراء</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="0.00"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">تاريخ الميلاد</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">تاريخ الشراء</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  rows={2}
                  placeholder="ملاحظات..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold text-base disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : editAnimal ? "تحديث" : "حفظ"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function AnimalsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AnimalsContent />
    </Suspense>
  );
}
