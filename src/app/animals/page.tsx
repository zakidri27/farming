"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import { useApp } from "@/lib/i18n";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getStatusColor, getStatusLabel, getTodayDate, animalAgeLabel } from "@/lib/utils";
import { appAlert, appConfirm } from "@/components/AppDialog";

const FL: Record<string, Record<"ar" | "en" | "fr", string>> = {
  flock: { ar: "قطيع", en: "Flock", fr: "Troupeau" },
  head: { ar: "أفراد", en: "members", fr: "membres" },
  dead_btn: { ar: "نفوق", en: "Death", fr: "Mort" },
  dead_confirm: { ar: "هل تريد تسجيل نفوق", en: "Record the death of", fr: "Enregistrer la mort de" },
  flock_hint: { ar: "اشتُريت معاً", en: "bought together", fr: "achetés ensemble" },
};

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
  teeth: string | null;
  ageText: string | null;
  lifeStage: string | null;
  batchId: number | null;
  purpose: string | null;
  notes: string | null;
  tagNumber: string | null;
}

interface Birth {
  id: number; batchName: string | null; motherName: string | null; date: string;
}

const animalTypes = [
  { value: "", emoji: "🐾" },
  { value: "cow", emoji: "🐄" },
  { value: "goat", emoji: "🐐" },
  { value: "sheep", emoji: "🐑" },
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];
const typeLabel = (v: string, all: string, lang: string) => v === "" ? all : getAnimalLabel(v, lang);

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
  teeth: "",
  ageText: "",
  purpose: "",
  notes: "",
  tagNumber: "",
};

function AnimalsContent() {
  const { t, lang } = useApp();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "";

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(initialType);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [births, setBirths] = useState<Birth[]>([]);
  const [purchases, setPurchases] = useState<{ id: number; description: string; date: string }[]>([]);
  const [openBatch, setOpenBatch] = useState<number | null>(null);
  const [detail, setDetail] = useState<Animal | null>(null);

  const fl = (k: string) => FL[k]?.[lang] || FL[k]?.ar || k;

  const fetchAnimals = () => {
    setLoading(true);
    // جلب القطيع كاملاً دائماً — التصفية تتم محلياً لتبقى عدّادات الأزرار صحيحة
    fetch(`/api/animals`)
      .then((r) => r.json())
      .then((data) => {
        // تأكد أن البيانات مصفوفة دائمًا (حتى لو API أعاد خطأ)
        setAnimals(Array.isArray(data) ? data : []);
      })
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnimals(); }, []);
  useEffect(() => {
    fetch("/api/births").then((r) => r.json()).then((d) => setBirths(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/purchases").then((r) => r.json()).then((d) => setPurchases(Array.isArray(d) ? d.filter((p: { category: string }) => p.category === "animal") : [])).catch(() => {});
  }, []);

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
      teeth: animal.teeth || "",
      ageText: animal.ageText || "",
      purpose: animal.purpose || "",
      notes: animal.notes || "",
      tagNumber: animal.tagNumber || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.type) { await appAlert(t("an_name_type_req")); return; }
    setSaving(true);
    try {
      const url = editAnimal ? `/api/animals/${editAnimal.id}` : "/api/animals";
      const method = editAnimal ? "PUT" : "POST";
      // الفرخ الذي بلغ 3 أشهر يتخرج بالغاً عند إتمام بياناته
      const payload = { ...form, lifeStage: "adult" };
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setShowForm(false);
      fetchAnimals();
    } catch (err) {
      await appAlert(t("c_error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<boolean> => {
    if (!(await appConfirm(t("an_del_confirm")))) return false;
    await fetch(`/api/animals/${id}`, { method: "DELETE" });
    fetchAnimals();
    return true;
  };

  // safer access
  const safeAnimals = Array.isArray(animals) ? animals : [];
  const daysOld = (d: string | null) => {
    if (!d) return 0;
    return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  };
  // الدجاج بعمر 5 أشهر يحتاج إتمام البيانات تفصيلاً
  const chickenGraduated = safeAnimals.filter((a) => a.type === "chicken" && a.lifeStage === "chick" && daysOld(a.birthDate || a.purchaseDate) >= 150);
  // السمان بعمر 40 يوماً يُعتبر كبيراً — تأكيد عادي بدون تفاصيل
  const quailReady = safeAnimals.filter((a) => a.type === "quail" && a.lifeStage === "chick" && daysOld(a.birthDate || a.purchaseDate) >= 40);

  const graduateQuail = async (a: Animal) => {
    if (!(await appConfirm(`${t("an_quail_confirm")} ${a.name} (40 ${t("an_day")})؟`))) return;
    await fetch(`/api/animals/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: a.name, type: a.type, breed: a.breed, birthDate: a.birthDate, gender: a.gender, weight: a.weight, purchasePrice: a.purchasePrice, purchaseDate: a.purchaseDate, status: a.status, teeth: a.teeth, ageText: a.ageText, lifeStage: "adult", purpose: a.purpose, notes: a.notes, tagNumber: a.tagNumber }),
    });
    fetchAnimals();
  };

  const markDeath = async (a: Animal) => {
    if (!(await appConfirm(`${fl("dead_confirm")} "${a.name}"؟`))) return;
    await fetch(`/api/animals/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: a.name, type: a.type, breed: a.breed, birthDate: a.birthDate, gender: a.gender, weight: a.weight, purchasePrice: a.purchasePrice, purchaseDate: a.purchaseDate, status: "dead", teeth: a.teeth, ageText: a.ageText, lifeStage: a.lifeStage, purpose: a.purpose, notes: a.notes, tagNumber: a.tagNumber }),
    });
    fetchAnimals();
  };

  // دفعات الكتاكيت في القطيع (قابلة للطي)
  const batchGroups = (() => {
    const map = new Map<number, Animal[]>();
    for (const a of safeAnimals) {
      if (a.batchId) {
        if (!map.has(a.batchId)) map.set(a.batchId, []);
        map.get(a.batchId)!.push(a);
      }
    }
    return [...map.entries()].map(([batchId, members]) => ({
      batchId, members,
      birth: births.find((b) => b.id === batchId),
      purchase: purchases.find((p) => p.id === batchId),
    }));
  })();
  const batchedIds = new Set(batchGroups.flatMap((g) => g.members.map((c) => c.id)));
  const filtered = (filterType ? safeAnimals.filter((a) => a.type === filterType) : safeAnimals).filter((a) => !batchedIds.has(a.id));
  const counts = animalTypes.slice(1).map((t) => ({
    ...t,
    count: safeAnimals.filter((a) => a.type === t.value).length,
  }));

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("an_title")} subtitle={`${filtered.length} ${t("an_unit_head")} • ${t("an_sub_buy")}`} action={{ label: t("an_buy"), icon: "🛒", href: "/purchases" }} />

      {/* الدجاج الذي بلغ 5 أشهر — إتمام البيانات تفصيلاً */}
      {chickenGraduated.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <p className="text-amber-800 text-sm font-bold mb-2">🐣 {chickenGraduated.length} {t("an_chicken_msg")}</p>
          <div className="space-y-2">
            {chickenGraduated.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-xl">🐔</span>
                <p className="flex-1 text-sm font-medium text-gray-800">{a.name}</p>
                <button onClick={() => openEditForm(a)} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{t("an_complete")}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* السمان الذي بلغ 40 يوماً — تأكيد عادي */}
      {quailReady.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
          <p className="text-orange-800 text-sm font-bold mb-2">🦅 {quailReady.length} {t("an_quail_msg")}</p>
          <div className="space-y-2">
            {quailReady.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-xl">🦅</span>
                <p className="flex-1 text-sm font-medium text-gray-800">{a.name}</p>
                <button onClick={async () => { await graduateQuail(a); }} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{t("an_confirm_ok")}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {animalTypes.map((at) => (
            <button
              key={at.value}
              onClick={() => setFilterType(at.value)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterType === at.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span>{at.emoji}</span>
              <span>{typeLabel(at.value, t("c_all"), lang)}</span>
              <span className={`text-xs ${filterType === at.value ? "text-green-100" : "text-gray-400"}`}>
                {at.value === "" ? safeAnimals.length : safeAnimals.filter((a) => a.type === at.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* دفعات القطيع والكتاكيت */}
        {batchGroups.filter((g) => !filterType || g.members[0]?.type === filterType).map((g) => {
          const open = openBatch === g.batchId;
          const isPurchase = !!g.purchase;
          const label = g.birth
            ? `${t("an_batch")}: ${g.birth.batchName || `#${g.batchId}`}`
            : `${fl("flock")}: ${g.purchase?.description || `#${g.batchId}`}`;
          const subtitle = isPurchase
            ? `${g.members.length} ${fl("head")} • ${formatDate(g.purchase!.date)} • ${fl("flock_hint")}`
            : `${g.members.length} ${t("an_chick")} • ${t("an_mother")}: ${g.birth?.motherName || "-"}`;
          return (
            <div key={g.batchId} className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isPurchase ? "border-green-200" : "border-amber-200"}`}>
              <button onClick={() => setOpenBatch(open ? null : g.batchId)} className="w-full p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isPurchase ? "bg-green-100" : "bg-amber-100"}`}>
                  {isPurchase ? getAnimalEmoji(g.members[0].type) : "🐣"}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{label}</p>
                  <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                </div>
                <span className="text-gray-400">{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <div className="border-t border-gray-100 p-2 space-y-1.5">
                  {g.members.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "dead" ? "bg-gray-400" : c.status === "sold" ? "bg-amber-400" : "bg-green-500"}`} />
                      <p className="flex-1 text-sm text-gray-800 min-w-0 truncate">{c.name} <span className="text-xs text-gray-400">• {daysOld(c.birthDate || c.purchaseDate)} {t("an_day")}</span></p>
                      {c.status === "dead" && <span className={`badge ${getStatusColor(c.status)} flex-shrink-0`}>{getStatusLabel(c.status, lang)}</span>}
                      {c.status === "active" && (
                        <button onClick={async () => { await markDeath(c); }} className="text-xs text-red-600 font-medium flex-shrink-0">💀 {fl("dead_btn")}</button>
                      )}
                      <button onClick={() => openEditForm(c)} className="text-xs text-blue-600 font-medium flex-shrink-0">✏️ {t("c_edit")}</button>
                      <button onClick={async () => { await handleDelete(c.id); }} className="text-xs text-red-600 font-medium flex-shrink-0">🗑️ {t("c_delete")}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🐾</p>
            <p className="text-gray-500">{t("an_none")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("an_none_hint")}</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Link href="/purchases" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium">
                🛒 {t("nav_purchases")}
              </Link>
              <Link href="/births" className="bg-pink-500 text-white px-6 py-2 rounded-xl font-medium">
                🍼 {t("nav_births")}
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((animal) => (
            <button
              key={animal.id}
              onClick={() => setDetail(animal)}
              className="w-full bg-white rounded-2xl p-3 shadow-sm card-hover fade-in flex items-center gap-3 text-right"
            >
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {getAnimalEmoji(animal.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{animal.name}</h3>
                <p className="text-xs text-gray-500">{getAnimalLabel(animal.type, lang)}</p>
              </div>
              <span className={`badge ${getStatusColor(animal.status)} flex-shrink-0`}>
                {getStatusLabel(animal.status, lang)}
              </span>
            </button>
          )))}
      </div>

      {/* Detail bottom-sheet: full info + actions */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  {getAnimalEmoji(detail.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{detail.name}</h2>
                    {detail.tagNumber && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">#{detail.tagNumber}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {getAnimalLabel(detail.type, lang)} {detail.breed ? `• ${detail.breed}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${getStatusColor(detail.status)}`}>
                      {getStatusLabel(detail.status, lang)}
                    </span>
                    {detail.gender && (
                      <span className="text-xs text-gray-500">
                        {detail.gender === "male" ? `♂ ${t("c_male")}` : `♀ ${t("c_female")}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {detail.weight && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("c_weight")}</p>
                  <p className="text-sm font-semibold">{detail.weight} {lang === "ar" ? "كغ" : "kg"}</p>
                </div>
              )}
              {detail.purchasePrice && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("an_buy_price")}</p>
                  <p className="text-sm font-semibold">{formatCurrency(detail.purchasePrice)}</p>
                </div>
              )}
              {detail.birthDate && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("an_birth")}</p>
                  <p className="text-sm font-semibold">{formatDate(detail.birthDate)}</p>
                </div>
              )}
              {detail.purchaseDate && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("an_buy_date")}</p>
                  <p className="text-sm font-semibold">{formatDate(detail.purchaseDate)}</p>
                </div>
              )}
              {detail.teeth && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("an_teeth")}</p>
                  <p className="text-sm font-semibold">{detail.teeth}</p>
                </div>
              )}
              {(detail.birthDate || detail.ageText) && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("c_age")}</p>
                  <p className="text-sm font-semibold">{animalAgeLabel(detail.birthDate, lang, detail.ageText)}</p>
                </div>
              )}
              {detail.lifeStage === "chick" && (
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-amber-600">🐣 {lang === "ar" ? "فرخ" : lang === "fr" ? "Poussin" : "Chick"}</p>
                  <p className="text-sm font-semibold text-amber-700">{t("an_chick_waiting")}</p>
                </div>
              )}
            </div>

            {detail.notes && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{detail.notes}</p>
            )}

            <div className="flex gap-2 mt-4">
              <Link href="/tracking" className="flex-1 bg-indigo-100 text-indigo-700 py-2.5 rounded-xl font-bold text-sm text-center">🔍 {t("nav_tracking")}</Link>
              <button
                onClick={() => { const a = detail; setDetail(null); if (a) openEditForm(a); }}
                className="flex-1 bg-blue-100 text-blue-700 py-2.5 rounded-xl font-bold text-sm"
              >
                ✏️ {t("c_edit")}
              </button>
              <button
                onClick={async () => { const id = detail.id; setDetail(null); await handleDelete(id); }}
                className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-xl font-bold text-sm"
              >
                🗑️ {t("c_delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editAnimal ? t("an_edit_title") : t("an_add_title")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_name")} *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  placeholder={t("c_name")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_type")} *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {animalTypes.slice(1).map((at) => (
                    <option key={at.value} value={at.value}>{at.emoji} {getAnimalLabel(at.value, lang)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_breed")}</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder={t("c_breed")}
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_tag")}</label>
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
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_gender")}</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">♂ {t("c_male")}</option>
                    <option value="female">♀ {t("c_female")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_status")}</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">{getStatusLabel("active", lang)}</option>
                    <option value="sold">{getStatusLabel("sold", lang)}</option>
                    <option value="dead">{getStatusLabel("dead", lang)}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_teeth")}</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.teeth}
                    onChange={(e) => setForm({ ...form, teeth: e.target.value })}
                  >
                    <option value="">{lang === "ar" ? "بدون..." : lang === "fr" ? "Sans..." : "None..."}</option>
                    {["لبنية (لم تكسر)", "ثنية", "رباعية", "سداسية", "جامعة"].map((tt) => (
                      <option key={tt} value={tt}>{tt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_age")}</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder={lang === "ar" ? "مثال: 3 سنوات" : lang === "fr" ? "Ex : 3 ans" : "E.g. 3 years"}
                    value={form.ageText}
                    onChange={(e) => setForm({ ...form, ageText: e.target.value })}
                  />
                </div>
              </div>

              {(form.type === "quail") && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_batch_for")}</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  >
                    <option value="">{lang === "ar" ? "بدون..." : lang === "fr" ? "Sans..." : "None..."}</option>
                    <option value="eggs">🥚 {lang === "ar" ? "بيض" : lang === "fr" ? "Œufs" : "Eggs"}</option>
                    <option value="meat">🥩 {lang === "ar" ? "لحم" : lang === "fr" ? "Viande" : "Meat"}</option>
                  </select>
                </div>
              )}

              {editAnimal?.tagNumber && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                  <span className="text-xs text-gray-500">{t("an_auto_code")}: </span>
                  <span className="text-sm font-bold text-green-700">{editAnimal.tagNumber}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_weight")} ({lang === "ar" ? "كغ" : "kg"})</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="0.00"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_buy_price")}</label>
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
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_birth")}</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("an_buy_date")}</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">{t("c_notes")}</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  rows={2}
                  placeholder={`${t("c_notes")}...`}
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
              {saving ? t("common_saving") : editAnimal ? t("an_update") : t("common_save")}
            </button>
          </div>
        </div>
      )}
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
