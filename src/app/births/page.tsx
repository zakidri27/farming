"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { appAlert, appConfirm } from "@/components/AppDialog";
import { formatDate, getAnimalEmoji, getAnimalLabel, getTodayDate } from "@/lib/utils";
import { useApp } from "@/lib/i18n";

interface Birth {
  id: number; date: string; motherId: number | null; fatherId: number | null;
  motherName: string | null; fatherName: string | null; childName: string;
  childType: string; childGender: string | null; birthWeight: string | null;
  batchName: string | null; quantity: string | null; status: string; notes: string | null;
}
interface Animal {
  id: number; name: string; type: string; gender: string | null; status: string;
  birthDate: string | null; batchId: number | null; lifeStage: string | null;
}

const largeTypes = [
  { value: "cow", emoji: "🐄" },
  { value: "sheep", emoji: "🐑" },
  { value: "goat", emoji: "🐐" },
];
const birdTypes = [
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];
const allTypes = [...largeTypes, ...birdTypes];

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "المواليد ينضمون للقطيع تلقائياً", en: "Newborns join the herd automatically", fr: "Les nouveau-nés rejoignent le troupeau automatiquement" },
  new_birth: { ar: "تسجيل ولادة", en: "Record birth", fr: "Enregistrer une naissance" },
  batches_title: { ar: "🐣 الدفعات (اضغط لعرض الكتاكيت)", en: "🐣 Batches (tap to show chicks)", fr: "🐣 Lots (touchez pour voir les poussins)" },
  mother_lbl: { ar: "الأم", en: "Mother", fr: "Mère" },
  father_lbl: { ar: "الأب", en: "Father", fr: "Père" },
  chick_unit: { ar: "كتكوت", en: "chick", fr: "poussin" },
  no_chicks: { ar: "لا توجد كتاكيت (بيعت أو نفقت كلها)", en: "No chicks (all sold or dead)", fr: "Aucun poussin (tous vendus ou morts)" },
  singles_title: { ar: "🍼 المواليد المفردة", en: "🍼 Single births", fr: "🍼 Naissances uniques" },
  to_herd: { ar: "القطيع ←", en: "Herd →", fr: "Troupeau →" },
  empty: { ar: "لا توجد مواليد مسجلة", en: "No births recorded", fr: "Aucune naissance enregistrée" },
  modal_title: { ar: "🍼 تسجيل ولادة جديدة", en: "🍼 Record a new birth", fr: "🍼 Enregistrer une naissance" },
  choose_animal: { ar: "اختر الحيوان أولاً *", en: "Choose the animal first *", fr: "Choisir d'abord l'animal *" },
  mother_herd: { ar: "الأم من القطيع (نفس النوع — إناث فقط) *", en: "Mother from the herd (same type — females only) *", fr: "Mère du troupeau (même type — femelles uniquement) *" },
  choose_mother: { ar: "اختر الأم...", en: "Choose the mother...", fr: "Choisir la mère..." },
  no_females: { ar: "لا توجد إناث من هذا النوع في القطيع", en: "No females of this type in the herd", fr: "Aucune femelle de ce type dans le troupeau" },
  from_herd: { ar: "من القطيع", en: "From the herd", fr: "Du troupeau" },
  external: { ar: "خارجي", en: "External", fr: "Externe" },
  choose_father: { ar: "اختر الأب...", en: "Choose the father...", fr: "Choisir le père..." },
  father_ext_ph: { ar: "اسم الأب الخارجي", en: "External father's name", fr: "Nom du père externe" },
  child_name: { ar: "اسم المولود *", en: "Newborn name *", fr: "Nom du nouveau-né *" },
  birth_date: { ar: "تاريخ الازدياد *", en: "Birth date *", fr: "Date de naissance *" },
  save_join: { ar: "حفظ (ينضم للقطيع)", en: "Save (joins the herd)", fr: "Enregistrer (rejoint le troupeau)" },
  quail_note: { ar: "عند بلوغ 40 يوماً يُعتبرون سماناً كبيراً.", en: "At 40 days they count as adult quail.", fr: "À 40 jours ils comptent comme cailles adultes." },
  chicken_note: { ar: "عند بلوغ 5 أشهر يُعتبرون دجاجاً وسيطلب منك ملء بيانات كل دجاجة بالتفصيل.", en: "At 5 months they count as chickens and you will be asked to fill in each one's details.", fr: "À 5 mois ils comptent comme poulets et vous devrez remplir les détails de chacun." },
  quail_female: { ar: "أنثى السمان", en: "female quail", fr: "caille femelle" },
  hen_lbl: { ar: "الدجاجة", en: "hen", fr: "poule" },
  batch_name: { ar: "اسم الدفعة *", en: "Batch name *", fr: "Nom du lot *" },
  batch_ph: { ar: "مثال: دفعة مارس", en: "E.g.: March batch", fr: "Ex. : lot de mars" },
  chick_count: { ar: "عدد الكتاكيت *", en: "Number of chicks *", fr: "Nombre de poussins *" },
  save_batch: { ar: "حفظ الدفعة (تنضم للقطيع)", en: "Save batch (joins the herd)", fr: "Enregistrer le lot (rejoint le troupeau)" },
  detail_title: { ar: "🍼 تفاصيل المولود", en: "🍼 Newborn details", fr: "🍼 Détails du nouveau-né" },
  birth_weight: { ar: "وزن الولادة", en: "Birth weight", fr: "Poids de naissance" },
  err_mother_req: { ar: "الأم من القطيع إجبارية *", en: "Mother from the herd is required *", fr: "Mère du troupeau requise *" },
  err_no_father: { ar: "لم تختر الأب من القطيع — المتابعة بدون أب؟", en: "You didn't choose a father from the herd — continue without a father?", fr: "Vous n'avez pas choisi de père du troupeau — continuer sans père ?" },
  err_child_req: { ar: "اسم المولود وتاريخ الازدياد مطلوبان *", en: "Newborn name and birth date are required *", fr: "Nom du nouveau-né et date de naissance requis *" },
  err_batch_mother: { ar: "الأم إجبارية *", en: "Mother is required *", fr: "Mère requise *" },
  err_batch_name: { ar: "اسم الدفعة مطلوب *", en: "Batch name is required *", fr: "Nom du lot requis *" },
  err_chick_n: { ar: "عدد الكتاكيت مطلوب *", en: "Number of chicks is required *", fr: "Nombre de poussins requis *" },
  del_hint: { ar: "موت أو فقدان", en: "death or loss", fr: "mort ou perte" },
};

export default function BirthsPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const [items, setItems] = useState<Birth[]>([]);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selSingle, setSelSingle] = useState<Birth | null>(null);

  const [bType, setBType] = useState("cow");
  const [single, setSingle] = useState({ date: getTodayDate(), motherId: "", fatherMode: "herd" as "herd" | "external", fatherId: "", fatherExternal: "", childName: "", childGender: "female", childBreed: "", birthWeight: "", status: "alive", notes: "" });
  const [batch, setBatch] = useState({ date: getTodayDate(), motherId: "", batchName: "", chickCount: "10", breed: "", notes: "" });

  const isLarge = bType === "cow" || bType === "sheep" || bType === "goat";

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/births").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
    fetch("/api/animals").then((r) => r.json()).then((d) => setHerd(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetchAll(); }, []);

  const mothers = herd.filter((a) => a.type === bType && a.gender === "female" && a.status === "active");
  const fathers = herd.filter((a) => a.type === bType && a.gender === "male" && a.status === "active");

  const openForm = () => {
    setBType("cow");
    setSingle({ date: getTodayDate(), motherId: "", fatherMode: "herd", fatherId: "", fatherExternal: "", childName: "", childGender: "female", childBreed: "", birthWeight: "", status: "alive", notes: "" });
    setBatch({ date: getTodayDate(), motherId: "", batchName: "", chickCount: "10", breed: "", notes: "" });
    setShowForm(true);
  };

  const handleSaveSingle = async () => {
    if (!single.motherId) { await appAlert(tx("err_mother_req")); return; }
    if (single.fatherMode === "herd" && !single.fatherId && fathers.length > 0) {
      if (!(await appConfirm(tx("err_no_father")))) return;
    }
    if (!single.childName || !single.date) { await appAlert(tx("err_child_req")); return; }
    setSaving(true);
    try {
      const mother = herd.find((a) => String(a.id) === single.motherId);
      const father = herd.find((a) => String(a.id) === single.fatherId);
      await fetch("/api/births", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: single.date, motherId: Number(single.motherId),
          fatherId: single.fatherMode === "herd" && single.fatherId ? Number(single.fatherId) : null,
          motherName: mother?.name || null, fatherName: father?.name || null,
          fatherExternal: single.fatherMode === "external" ? single.fatherExternal || null : null,
          childName: single.childName, childType: bType, childGender: single.childGender,
          childBreed: single.childBreed || null, birthWeight: single.birthWeight || null,
          status: single.status, notes: single.notes || null,
        }),
      });
      setShowForm(false);
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const handleSaveBatch = async () => {
    if (!batch.motherId) { await appAlert(tx("err_batch_mother")); return; }
    if (!batch.batchName) { await appAlert(tx("err_batch_name")); return; }
    const n = parseInt(batch.chickCount || "0", 10);
    if (!n || n < 1) { await appAlert(tx("err_chick_n")); return; }
    setSaving(true);
    try {
      const mother = herd.find((a) => String(a.id) === batch.motherId);
      await fetch("/api/births", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "batch", date: batch.date, motherId: Number(batch.motherId),
          motherName: mother?.name || null, batchName: batch.batchName,
          chickCount: n, childType: bType, childBreed: batch.breed || null, notes: batch.notes || null,
        }),
      });
      setShowForm(false);
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const deleteChick = async (id: number, name: string) => {
    if (!(await appConfirm(`${t("c_delete")} ${name}${lang === "ar" ? "؟" : "?"} (${tx("del_hint")})`))) return;
    await fetch(`/api/births?animalId=${id}`, { method: "DELETE" });
    fetchAll();
  };

  const singles = items.filter((b) => !b.batchName);
  const batches = items.filter((b) => b.batchName);
  const chicksOf = (batchId: number) => herd.filter((a) => a.batchId === batchId);
  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm";
  const labelCls = "text-sm text-gray-600 mb-1 block";

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_births")} subtitle={tx("sub")} action={{ label: tx("new_birth"), icon: "🍼", onClick: openForm }} />
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {batches.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{tx("batches_title")}</p>
                {batches.map((b) => {
                  const chicks = chicksOf(b.id);
                  const open = expanded === b.id;
                  return (
                    <div key={b.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <button onClick={() => setExpanded(open ? null : b.id)} className="w-full p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">{getAnimalEmoji(b.childType)}</div>
                        <div className="flex-1 text-right min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{b.batchName} <span className="font-normal text-gray-500">• {getAnimalLabel(b.childType, lang)}</span></p>
                          <p className="text-xs text-gray-500">{tx("mother_lbl")}: {b.motherName || "-"} • {chicks.length} {tx("chick_unit")} • {formatDate(b.date)}</p>
                        </div>
                        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
                      </button>
                      {open && (
                        <div className="border-t border-gray-100 p-2 space-y-1.5">
                          {chicks.length === 0 && <p className="text-xs text-gray-400 text-center py-2">{tx("no_chicks")}</p>}
                          {chicks.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <p className="flex-1 text-sm text-gray-800">{c.name}</p>
                              <Link href="/animals" className="text-xs text-blue-600 font-medium">{t("c_edit")}</Link>
                              <button onClick={() => deleteChick(c.id, c.name)} className="text-xs text-red-600 font-medium">🗑️ {t("c_delete")}</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {singles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{tx("singles_title")}</p>
                {singles.map((b) => (
                  <button key={b.id} onClick={() => setSelSingle(b)} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-right">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-lg flex-shrink-0">{getAnimalEmoji(b.childType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{b.childName} <span className="font-normal text-gray-500">• {getAnimalLabel(b.childType, lang)}</span></p>
                      <p className="text-xs text-gray-500">{formatDate(b.date)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-16"><p className="text-5xl mb-3">🍼</p><p className="text-gray-500">{tx("empty")}</p></div>
            )}
          </>
        )}
      </div>

      {selSingle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelSingle(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl flex-shrink-0">{getAnimalEmoji(selSingle.childType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{selSingle.childName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getAnimalLabel(selSingle.childType, lang)} • {formatDate(selSingle.date)}</p>
                </div>
              </div>
              <button onClick={() => setSelSingle(null)} className="text-gray-400 text-2xl flex-shrink-0">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{tx("mother_lbl")}</p>
                <p className="text-sm font-semibold">{selSingle.motherName || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{tx("father_lbl")}</p>
                <p className="text-sm font-semibold">{selSingle.fatherName || "-"}</p>
              </div>
              {selSingle.childGender && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{t("c_gender")}</p>
                  <p className="text-sm font-semibold">{selSingle.childGender === "male" ? `♂ ${t("c_male")}` : `♀ ${t("c_female")}`}</p>
                </div>
              )}
              {selSingle.birthWeight && (
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{tx("birth_weight")}</p>
                  <p className="text-sm font-semibold">{selSingle.birthWeight} {lang === "ar" ? "كغ" : "kg"}</p>
                </div>
              )}
            </div>
            {selSingle.notes && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{selSingle.notes}</p>
            )}
            <Link href="/animals" className="block text-center w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold text-sm">{tx("to_herd")}</Link>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("modal_title")}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="mb-3">
              <label className={labelCls}>{tx("choose_animal")}</label>
              <div className="grid grid-cols-5 gap-1.5">
                {allTypes.map((t) => (
                  <button key={t.value} onClick={() => setBType(t.value)}
                    className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium border ${bType === t.value ? "bg-pink-500 text-white border-pink-500" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                    <span className="text-xl">{t.emoji}</span>{getAnimalLabel(t.value, lang)}
                  </button>
                ))}
              </div>
            </div>

            {isLarge ? (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>{tx("mother_herd")}</label>
                  <select className={inputCls} value={single.motherId} onChange={(e) => setSingle({ ...single, motherId: e.target.value })}>
                    <option value="">{tx("choose_mother")}</option>
                    {mothers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {mothers.length === 0 && <p className="text-xs text-red-500 mt-1">{tx("no_females")}</p>}
                </div>
                <div>
                  <label className={labelCls}>{tx("father_lbl")}</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setSingle({ ...single, fatherMode: "herd" })} className={`flex-1 py-2 rounded-xl text-xs font-medium ${single.fatherMode === "herd" ? "bg-pink-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("from_herd")}</button>
                    <button onClick={() => setSingle({ ...single, fatherMode: "external" })} className={`flex-1 py-2 rounded-xl text-xs font-medium ${single.fatherMode === "external" ? "bg-pink-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("external")}</button>
                  </div>
                  {single.fatherMode === "herd" ? (
                    <select className={inputCls} value={single.fatherId} onChange={(e) => setSingle({ ...single, fatherId: e.target.value })}>
                      <option value="">{tx("choose_father")}</option>
                      {fathers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : (
                    <input className={inputCls} placeholder={tx("father_ext_ph")} value={single.fatherExternal} onChange={(e) => setSingle({ ...single, fatherExternal: e.target.value })} />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{tx("child_name")}</label><input className={inputCls} value={single.childName} onChange={(e) => setSingle({ ...single, childName: e.target.value })} /></div>
                  <div><label className={labelCls}>{t("c_breed")}</label><input className={inputCls} value={single.childBreed} onChange={(e) => setSingle({ ...single, childBreed: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={labelCls}>{t("c_gender")}</label>
                    <select className={inputCls} value={single.childGender} onChange={(e) => setSingle({ ...single, childGender: e.target.value })}>
                      <option value="female">♀ {t("c_female")}</option><option value="male">♂ {t("c_male")}</option>
                    </select></div>
                  <div><label className={labelCls}>{t("c_weight")} (كغ)</label><input type="number" className={inputCls} value={single.birthWeight} onChange={(e) => setSingle({ ...single, birthWeight: e.target.value })} /></div>
                  <div><label className={labelCls}>{tx("birth_date")}</label><input type="date" className={inputCls} value={single.date} onChange={(e) => setSingle({ ...single, date: e.target.value })} /></div>
                </div>
                <button onClick={handleSaveSingle} disabled={saving} className="w-full mt-1 bg-pink-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                  {saving ? t("common_saving") : tx("save_join")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-700">
                  {bType === "quail" ? tx("quail_note") : tx("chicken_note")}
                </div>
                <div>
                  <label className={labelCls}>{tx("mother_lbl")} ({bType === "quail" ? tx("quail_female") : tx("hen_lbl")} {tx("from_herd")}) *</label>
                  <select className={inputCls} value={batch.motherId} onChange={(e) => setBatch({ ...batch, motherId: e.target.value })}>
                    <option value="">{tx("choose_mother")}</option>
                    {mothers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {mothers.length === 0 && <p className="text-xs text-red-500 mt-1">{tx("no_females")}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{tx("batch_name")}</label><input className={inputCls} placeholder={tx("batch_ph")} value={batch.batchName} onChange={(e) => setBatch({ ...batch, batchName: e.target.value })} /></div>
                  <div><label className={labelCls}>{tx("chick_count")}</label><input type="number" min={1} className={inputCls} value={batch.chickCount} onChange={(e) => setBatch({ ...batch, chickCount: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{t("c_breed")}</label><input className={inputCls} value={batch.breed} onChange={(e) => setBatch({ ...batch, breed: e.target.value })} /></div>
                  <div><label className={labelCls}>{t("c_date")} *</label><input type="date" className={inputCls} value={batch.date} onChange={(e) => setBatch({ ...batch, date: e.target.value })} /></div>
                </div>
                <button onClick={handleSaveBatch} disabled={saving} className="w-full mt-1 bg-pink-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                  {saving ? t("common_saving") : tx("save_batch")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
