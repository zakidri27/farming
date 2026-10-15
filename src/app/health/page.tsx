"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { appAlert } from "@/components/AppDialog";
import { useApp } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getTodayDate } from "@/lib/utils";

interface HealthRecord {
  id: number; date: string; animalId: number | null; animalType: string | null;
  recordType: string; description: string; medicine: string | null;
  medicineCost: string | null; vetName: string | null; vetCost: string | null;
  totalCost: string | null; status: string;
}
interface Animal { id: number; name: string; type: string; status: string; }

const L: Record<string, Record<Lang, string>> = {
  subtitle: { ar: "تكاليف العلاج تُحتسب مصاريف تلقائياً", en: "Treatment costs are automatically counted as expenses", fr: "Les coûts des soins sont automatiquement comptés comme dépenses" },
  actionAdd: { ar: "سجل علاجي", en: "Health record", fr: "Dossier santé" },
  empty: { ar: "لا توجد سجلات صحية", en: "No health records", fr: "Aucun dossier santé" },
  trackLink: { ar: "تتبع ←", en: "Tracking →", fr: "Suivi →" },
  chooseFromHerd: { ar: "🐄 اختيار من القطيع", en: "🐄 Choose from herd", fr: "🐄 Choisir du troupeau" },
  newTitle: { ar: "🏥 سجل صحي جديد", en: "🏥 New health record", fr: "🏥 Nouveau dossier santé" },
  step1: { ar: "1️⃣ اختر نوع الحيوان *", en: "1️⃣ Choose animal type *", fr: "1️⃣ Choisir le type d'animal *" },
  step2: { ar: "2️⃣ اختر الحيوان من القطيع *", en: "2️⃣ Choose the animal from the herd *", fr: "2️⃣ Choisir l'animal du troupeau *" },
  choose: { ar: "اختر...", en: "Choose...", fr: "Choisir..." },
  noAnimals: { ar: "لا توجد حيوانات من هذا النوع في القطيع", en: "No animals of this type in the herd", fr: "Aucun animal de ce type dans le troupeau" },
  step3: { ar: "3️⃣ نوع العلاج", en: "3️⃣ Record type", fr: "3️⃣ Type de soin" },
  step4: { ar: "4️⃣ الوصف *", en: "4️⃣ Description *", fr: "4️⃣ Description *" },
  descPh: { ar: "التشخيص أو العلاج...", en: "Diagnosis or treatment...", fr: "Diagnostic ou traitement..." },
  step5: { ar: "5️⃣ السعر الإجمالي (دواء + بيطري)", en: "5️⃣ Total price (medicine + vet)", fr: "5️⃣ Prix total (médicament + véto)" },
  saveNote: { ar: "حفظ (التكلفة تُحتسب مصروفاً)", en: "Save (cost counts as an expense)", fr: "Enregistrer (le coût compte comme dépense)" },
  alertNeed: { ar: "اختر الحيوان واكتب الوصف", en: "Select the animal and write a description", fr: "Sélectionnez l'animal et écrivez une description" },
  detailsTitle: { ar: "🏥 تفاصيل السجل الصحي", en: "🏥 Health record details", fr: "🏥 Détails du dossier santé" },
  dAnimal: { ar: "الحيوان", en: "Animal", fr: "Animal" },
  dType: { ar: "نوع العلاج", en: "Record type", fr: "Type de soin" },
  dDesc: { ar: "الوصف", en: "Description", fr: "Description" },
  dMedicine: { ar: "الدواء", en: "Medicine", fr: "Médicament" },
  dVet: { ar: "البيطري", en: "Vet", fr: "Vétérinaire" },
  dMedCost: { ar: "تكلفة الدواء", en: "Medicine cost", fr: "Coût médicament" },
  dVetCost: { ar: "تكلفة البيطري", en: "Vet cost", fr: "Coût véto" },
  dTotal: { ar: "التكلفة الإجمالية", en: "Total cost", fr: "Coût total" },
  dStatus: { ar: "الحالة", en: "Status", fr: "Statut" },
};

const recordTypes = [
  { value: "treatment" },
  { value: "vaccination" },
  { value: "checkup" },
  { value: "deworming" },
  { value: "other" },
];

const recordTypeLabels: Record<string, Record<Lang, string>> = {
  treatment: { ar: "💉 علاج", en: "💉 Treatment", fr: "💉 Traitement" },
  vaccination: { ar: "💊 تطعيم", en: "💊 Vaccination", fr: "💊 Vaccination" },
  checkup: { ar: "🩺 فحص", en: "🩺 Checkup", fr: "🩺 Examen" },
  deworming: { ar: "🧪 تجريع", en: "🧪 Deworming", fr: "🧪 Vermifuge" },
  other: { ar: "📋 أخرى", en: "📋 Other", fr: "📋 Autre" },
};

const animalTypeOptions = [
  { value: "cow", emoji: "🐄" },
  { value: "goat", emoji: "🐐" },
  { value: "sheep", emoji: "🐑" },
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];

export default function HealthPage() {
  const { lang, t } = useApp();
  const tx = (k: string): string => L[k][lang] ?? L[k].ar;
  const [items, setItems] = useState<HealthRecord[]>([]);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: getTodayDate(), animalType: "cow", animalId: "", recordType: "treatment", description: "", totalCost: "", status: "treatment", notes: "" });
  const [selected, setSelected] = useState<HealthRecord | null>(null);

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/health/records").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
    fetch("/api/animals?status=active").then((r) => r.json()).then((d) => setHerd(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.animalId || !form.description) { await appAlert(tx("alertNeed")); return; }
    setSaving(true);
    try {
      const animal = herd.find((a) => String(a.id) === form.animalId);
      await fetch("/api/health/records", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date, animalId: Number(form.animalId), animalType: animal?.type || null, recordType: form.recordType, description: form.description, totalCost: form.totalCost || null, status: form.status, notes: form.notes || null }),
      });
      setShowForm(false);
      setForm({ ...form, animalId: "", description: "", totalCost: "", notes: "" });
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_health")} subtitle={tx("subtitle")} action={{ label: tx("actionAdd"), icon: "🏥", onClick: () => setShowForm(true) }} />
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🏥</p><p className="text-gray-500">{tx("empty")}</p></div>
        ) : items.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-lg shrink-0">{r.animalType ? getAnimalEmoji(r.animalType) : "🏥"}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{r.description}</p>
              <p className="text-xs text-gray-500">{formatDate(r.date)}</p>
            </div>
            {r.totalCost && Number(r.totalCost) > 0 ? (
              <p className="font-bold text-sm text-pink-600 shrink-0">{formatCurrency(r.totalCost)}</p>
            ) : (
              <p className="text-xs text-gray-400 shrink-0">{recordTypeLabels[r.recordType]?.[lang] ?? r.recordType}</p>
            )}
          </button>
        ))}
        <div className="flex gap-2 pt-2">
          <Link href="/animals" className="flex-1 text-center bg-green-600 text-white py-2 rounded-xl text-sm font-medium">{tx("chooseFromHerd")}</Link>
          <Link href="/expenses" className="flex-1 text-center bg-red-500 text-white py-2 rounded-xl text-sm font-medium">💸 {t("nav_expenses")}</Link>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("detailsTitle")}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl">{selected.animalType ? getAnimalEmoji(selected.animalType) : "🏥"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{selected.description}</p>
                <p className="text-xs text-gray-500">{formatDate(selected.date)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dAnimal")}</span><span className="font-medium">{herd.find((a) => a.id === selected.animalId)?.name ?? "—"} {selected.animalType ? `• ${getAnimalLabel(selected.animalType, lang)}` : ""}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dType")}</span><span className="font-medium">{recordTypeLabels[selected.recordType]?.[lang] ?? selected.recordType}</span></div>
              <div className="bg-gray-50 rounded-xl px-3 py-2"><p className="text-gray-500 text-xs mb-1">{tx("dDesc")}</p><p className="font-medium">{selected.description}</p></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dMedicine")}</span><span className="font-medium">{selected.medicine || "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dVet")}</span><span className="font-medium">{selected.vetName || "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dMedCost")}</span><span className="font-medium">{selected.medicineCost ? formatCurrency(selected.medicineCost) : "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dVetCost")}</span><span className="font-medium">{selected.vetCost ? formatCurrency(selected.vetCost) : "—"}</span></div>
              <div className="flex justify-between bg-pink-50 rounded-xl px-3 py-2"><span className="text-gray-600 font-medium">{tx("dTotal")}</span><span className="font-bold text-pink-600">{selected.totalCost ? formatCurrency(selected.totalCost) : "—"}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("dStatus")}</span><span className="font-medium">{selected.status}</span></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_date")}</span><span className="font-medium">{formatDate(selected.date)}</span></div>
            </div>
            <Link href="/tracking" className="block text-center mt-4 text-sm text-indigo-600 font-medium">{tx("trackLink")}</Link>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("newTitle")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step1")}</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {animalTypeOptions.map((at) => (
                    <button key={at.value} onClick={() => setForm({ ...form, animalType: at.value, animalId: "" })}
                      className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${form.animalType === at.value ? "bg-pink-500 text-white border-pink-500" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <span className="text-xl">{at.emoji}</span>{getAnimalLabel(at.value, lang)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step2")}</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })}>
                  <option value="">{tx("choose")}</option>
                  {herd.filter((a) => a.type === form.animalType).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {herd.filter((a) => a.type === form.animalType).length === 0 && (
                  <p className="text-xs text-red-500 mt-1">{tx("noAnimals")}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{tx("step3")}</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value })}>
                    {recordTypes.map((rt) => <option key={rt.value} value={rt.value}>{recordTypeLabels[rt.value][lang] ?? recordTypeLabels[rt.value].ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t("c_date")}</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step4")}</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={tx("descPh")} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">{tx("step5")}</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-pink-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {saving ? t("common_saving") : tx("saveNote")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
