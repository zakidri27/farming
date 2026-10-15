"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { appAlert, appConfirm } from "@/components/AppDialog";
import { formatCurrency, formatDate, getAnimalEmoji, getAnimalLabel, getTodayDate } from "@/lib/utils";
import { useApp } from "@/lib/i18n";

interface Purchase {
  id: number; date: string; category: string; description: string;
  quantity: string | null; unit: string | null; unitPrice: string | null;
  totalAmount: string; supplierId: number | null;
  animalType: string | null; notes: string | null;
}
interface Contact { id: number; name: string; type: string; }
interface FeedItem { id: number; name: string; quantity: string; unit: string; }
interface HerdAnimal { id: number; name: string; type: string; breed: string | null; purchaseDate: string | null; }

interface Entry {
  name: string; breed: string; gender: string; weight: string;
  teeth: string; ageText: string; price: string;
  ageValue: string; ageUnit: "year" | "month" | "day";
  lifeStage?: string; purpose?: string; ref?: string; motherRef?: string;
}

const animalTypes = [
  { value: "cow", emoji: "🐄" },
  { value: "goat", emoji: "🐐" },
  { value: "sheep", emoji: "🐑" },
  { value: "chicken", emoji: "🐔" },
  { value: "quail", emoji: "🦅" },
];
const teethOptions = ["لبنية (لم تكسر)", "ثنية", "رباعية", "سداسية", "جامعة"];
const feedUnits = ["كغ", "دلو", "بوطة", "كيس 25كج", "كيس 50كج", "حبة", "لتر", "قنطار", "طن", "أخرى..."];
const typeLabel = (t: string) => getAnimalLabel(t);

const L: Record<string, Record<"ar" | "en" | "fr", string>> = {
  sub: { ar: "الحيوانات تنضم للقطيع برموز تلقائية", en: "Animals join the herd with automatic codes", fr: "Les animaux rejoignent le troupeau avec des codes automatiques" },
  new_buy: { ar: "شراء جديد", en: "New purchase", fr: "Nouvel achat" },
  empty: { ar: "لا توجد مشتريات", en: "No purchases", fr: "Aucun achat" },
  view_expenses: { ar: "عرض المصاريف ←", en: "View expenses →", fr: "Voir les dépenses →" },
  modal_title: { ar: "🛒 عملية شراء جديدة", en: "🛒 New purchase", fr: "🛒 Nouvel achat" },
  cat_animal: { ar: "🐄 حيوانات", en: "🐄 Animals", fr: "🐄 Animaux" },
  cat_feed: { ar: "🌾 غذاء", en: "🌾 Feed", fr: "🌾 Alimentation" },
  cat_equipment: { ar: "🔧 معدات", en: "🔧 Equipment", fr: "🔧 Équipement" },
  cat_medicine: { ar: "💊 أدوية", en: "💊 Medicine", fr: "💊 Médicaments" },
  cat_other: { ar: "📦 أخرى", en: "📦 Other", fr: "📦 Autre" },
  choose_type: { ar: "اختر نوع الحيوان *", en: "Choose the animal type *", fr: "Choisir le type d'animal *" },
  buy_method: { ar: "طريقة الشراء *", en: "Purchase method *", fr: "Mode d'achat *" },
  mode_single: { ar: "واحد", en: "Single", fr: "Unique" },
  mode_bulk: { ar: "مجموعة (جملة)", en: "Group (bulk)", fr: "Groupe (gros)" },
  mode_one_f: { ar: "واحدة", en: "Single", fr: "Unique" },
  mode_flock: { ar: "قطيع", en: "Flock", fr: "Troupeau" },
  mode_hen: { ar: "أم+فراخ", en: "Hen+chicks", fr: "Poule+poussins" },
  bulk_count: { ar: "عدد المجموعة (2 أو أكثر) *", en: "Group size (2 or more) *", fr: "Taille du groupe (2 ou plus) *" },
  flock_count: { ar: "عدد القطيع *", en: "Flock size *", fr: "Taille du troupeau *" },
  price_per_head: { ar: "سعر كل واحدة", en: "Price per head", fr: "Prix par tête" },
  price_total: { ar: "سعر الكل", en: "Total price", fr: "Prix total" },
  naming: { ar: "التسمية", en: "Naming", fr: "Nommage" },
  naming_each: { ar: "أسمّي كل واحدة", en: "Name each one", fr: "Nommer chacune" },
  naming_none: { ar: "بدون تسمية", en: "Without naming", fr: "Sans nommer" },
  breeds_counts: { ar: "السلالات (كل سلالة + عددها) *", en: "Breeds (each breed + its count) *", fr: "Races (chaque race + son nombre) *" },
  breed_ph: { ar: "السلالة", en: "Breed", fr: "Race" },
  count_ph: { ar: "عدد", en: "Count", fr: "Nombre" },
  add_breed: { ar: "+ إضافة سلالة", en: "+ Add breed", fr: "+ Ajouter une race" },
  males_count: { ar: "عدد الذكور *", en: "Number of males *", fr: "Nombre de mâles *" },
  females_count: { ar: "عدد الإناث *", en: "Number of females *", fr: "Nombre de femelles *" },
  hen_note: { ar: "عند بلوغ الفراخ 3 أشهر سيطلب منك التطبيق إتمام بياناتها.", en: "When the chicks reach 3 months, the app will ask you to complete their data.", fr: "À 3 mois, l'appli vous demandera de compléter leurs données." },
  hen_name: { ar: "اسم الدجاجة الأم *", en: "Mother hen name *", fr: "Nom de la poule mère *" },
  chick_count: { ar: "عدد الفراخ *", en: "Number of chicks *", fr: "Nombre de poussins *" },
  batch_purpose: { ar: "الدفعة مخصصة لـ *", en: "Batch purpose *", fr: "Lot destiné à *" },
  purpose_eggs: { ar: "🥚 بيض", en: "🥚 Eggs", fr: "🥚 Œufs" },
  purpose_meat: { ar: "🥩 لحم", en: "🥩 Meat", fr: "🥩 Viande" },
  next_fill: { ar: "التالي ← ملء البيانات", en: "Next → fill in data", fr: "Suivant → saisir les données" },
  entries_hint_l: { ar: "املأ بيانات كل رأس — الحقول بعلامة * إجبارية. الرمز يُولَّد تلقائياً.", en: "Fill in each head's data — fields marked * are required. Codes are auto-generated.", fr: "Remplissez les données de chaque tête — les champs * sont obligatoires. Codes auto-générés." },
  entries_hint_hen: { ar: "املأ بيانات كل أم وفراخ — الحقول بعلامة * إجبارية. الرمز يُولَّد تلقائياً.", en: "Fill in the hen and chicks data — fields marked * are required. Codes are auto-generated.", fr: "Remplissez les données de la poule et des poussins — champs * obligatoires. Codes auto-générés." },
  entries_hint_bird: { ar: "املأ بيانات كل طير — الحقول بعلامة * إجبارية. الرمز يُولَّد تلقائياً.", en: "Fill in each bird's data — fields marked * are required. Codes are auto-generated.", fr: "Remplissez les données de chaque oiseau — champs * obligatoires. Codes auto-générés." },
  mother_hen: { ar: "🐔 الأم", en: "🐔 Mother", fr: "🐔 Mère" },
  chick_n: { ar: "فرخ", en: "Chick", fr: "Poussin" },
  teeth_lbl: { ar: "الأسنان", en: "Teeth", fr: "Dents" },
  choose: { ar: "اختر...", en: "Choose...", fr: "Choisir..." },
  age_ex1: { ar: "مثال: 3 سنوات", en: "E.g.: 3 years", fr: "Ex. : 3 ans" },
  age_ex2: { ar: "مثال: سنة واحدة", en: "E.g.: one year", fr: "Ex. : un an" },
  age_unit_year: { ar: "سنة", en: "years", fr: "an(s)" },
  age_unit_month: { ar: "شهر", en: "months", fr: "mois" },
  age_unit_day: { ar: "يوم", en: "days", fr: "jours" },
  age_hint: { ar: "يُحسب العمر تلقائياً من تاريخ الشراء (سنة/شهر/يوم) وسيتحدث مع مرور الوقت", en: "Age is auto-computed from the purchase date (years/months/days) and updates over time", fr: "L'âge est calculé automatiquement depuis la date d'achat (années/mois/jours) et évolue avec le temps" },
  next_supplier: { ar: "التالي ← المورّد والسعر", en: "Next → supplier & price", fr: "Suivant → fournisseur et prix" },
  pay_method: { ar: "طريقة الدفع *", en: "Payment method *", fr: "Mode de paiement *" },
  pay_cash: { ar: "💵 نقدي من الخزينة", en: "💵 Cash from treasury", fr: "💵 Espèces de la trésorerie" },
  pay_debt: { ar: "📋 دين على المورّد", en: "📋 Debt on supplier", fr: "📋 Dette fournisseur" },
  pay_debt_short: { ar: "📋 دين", en: "📋 Debt", fr: "📋 Dette" },
  treasury_bal: { ar: "رصيد الخزينة:", en: "Treasury balance:", fr: "Solde de trésorerie :" },
  insufficient: { ar: "⚠️ لا يكفي!", en: "⚠️ Insufficient!", fr: "⚠️ Insuffisant !" },
  debt_note: { ar: "سيُسجل ديناً على المورّد — يلزم اختيار مورّد موجود", en: "It will be recorded as a debt on the supplier — an existing supplier is required", fr: "Sera enregistré comme dette fournisseur — un fournisseur existant est requis" },
  from_suppliers: { ar: "من المورّدين", en: "From suppliers", fr: "Parmi les fournisseurs" },
  new_supplier: { ar: "مورّد جديد +", en: "New supplier +", fr: "Nouveau fournisseur +" },
  new_supplier_name: { ar: "اسم المورّد الجديد *", en: "New supplier name *", fr: "Nom du nouveau fournisseur *" },
  total_bulk: { ar: "السعر الإجمالي (جملة) *", en: "Total price (bulk) *", fr: "Prix total (gros) *" },
  total_single: { ar: "السعر الإجمالي *", en: "Total price *", fr: "Prix total *" },
  buy_date: { ar: "تاريخ الشراء *", en: "Purchase date *", fr: "Date d'achat *" },
  summary_mid: { ar: "سينضمون للقطيع برموز تلقائية • المبلغ يُحتسب كمصروف", en: "They will join the herd with automatic codes • The amount counts as an expense", fr: "Ils rejoindront le troupeau avec des codes auto • Le montant compte comme dépense" },
  confirm_buy: { ar: "تأكيد الشراء ✅", en: "Confirm purchase ✅", fr: "Confirmer l'achat ✅" },
  feed_existing: { ar: "صنف موجود", en: "Existing item", fr: "Article existant" },
  feed_new: { ar: "صنف جديد", en: "New item", fr: "Nouvel article" },
  choose_feed: { ar: "اختر الصنف...", en: "Choose the item...", fr: "Choisir l'article..." },
  new_feed_name: { ar: "اسم الصنف الجديد", en: "New item name", fr: "Nom du nouvel article" },
  per_feed: { ar: "حسب الصنف:", en: "Per item:", fr: "Selon l'article :" },
  unit_ph: { ar: "اكتب الوحدة...", en: "Type the unit...", fr: "Saisir l'unité..." },
  calc_total: { ar: "(يُحسب الإجمالي ⇄)", en: "(computes the total ⇄)", fr: "(calcule le total ⇄)" },
  calc_price: { ar: "(يُحسب السعر ⇄)", en: "(computes the price ⇄)", fr: "(calcule le prix ⇄)" },
  none: { ar: "بدون...", en: "None...", fr: "Aucun..." },
  err_animal: { ar: "الحيوان", en: "Animal", fr: "Animal" },
  err_breed_sum: { ar: "مجموع السلالات", en: "Breeds total", fr: "Total des races" },
  err_must_equal: { ar: "يجب أن يساوي", en: "must equal", fr: "doit égaler" },
  err_flock_n: { ar: "عدد القطيع", en: "flock size", fr: "la taille du troupeau" },
  err_genders: { ar: "ذكور+إناث", en: "Males+females", fr: "Mâles+femelles" },
  err_name_each: { ar: "سمِّ كل دجاجة (اخترت التسمية)", en: "Name each hen (you chose naming)", fr: "Nommez chaque poule (vous avez choisi le nommage)" },
  err_each_price: { ar: "املأ سعر كل دجاجة", en: "Fill in each hen's price", fr: "Saisissez le prix de chaque poule" },
  err_hen_name: { ar: "اسم الدجاجة الأم مطلوب *", en: "Mother hen name is required *", fr: "Nom de la poule mère requis *" },
  err_new_supplier: { ar: "اسم المورّد الجديد مطلوب *", en: "New supplier name is required *", fr: "Nom du nouveau fournisseur requis *" },
  err_total_date: { ar: "السعر الإجمالي والتاريخ مطلوبان *", en: "Total price and date are required *", fr: "Prix total et date requis *" },
  err_insufficient: { ar: "رصيد الخزينة لا يكفي", en: "Treasury balance is insufficient", fr: "Solde de trésorerie insuffisant" },
  err_insufficient_hint: { ar: "اشترِ بالدين أو حدد رأس المال", en: "Buy on debt or set the capital", fr: "Achetez à crédit ou définissez le capital" },
  err_debt_supplier: { ar: "الدين يتطلب مورّداً", en: "Debt requires a supplier", fr: "La dette exige un fournisseur" },
  err_debt_existing: { ar: "الدين يتطلب اختيار مورّد موجود", en: "Debt requires choosing an existing supplier", fr: "La dette exige un fournisseur existant" },
  err_debt_choose: { ar: "الدين يتطلب اختيار مورّد", en: "Debt requires choosing a supplier", fr: "La dette exige un fournisseur" },
  err_desc_amount_date: { ar: "الوصف والمبلغ والتاريخ مطلوبة", en: "Description, amount and date are required", fr: "Description, montant et date requis" },
  det_title: { ar: "تفاصيل الشراء", en: "Purchase details", fr: "Détails de l'achat" },
  det_qty: { ar: "الكمية", en: "Quantity", fr: "Quantité" },
  det_linked: { ar: "الحيوانات المرتبطة", en: "Linked animals", fr: "Animaux liés" },
  det_none: { ar: "بدون", en: "None", fr: "Aucun" },
  det_del: { ar: "حذف الشراء", en: "Delete purchase", fr: "Supprimer l'achat" },
  det_del_confirm: { ar: "حذف هذا الشراء؟", en: "Delete this purchase?", fr: "Supprimer cet achat ?" },
};

const blankEntry = (): Entry => ({ name: "", breed: "", gender: "female", weight: "", teeth: "", ageText: "", ageValue: "", ageUnit: "year", price: "" });

const ageTextFrom = (v: string, u: Entry["ageUnit"]): string => {
  const n = parseInt(v || "0", 10);
  if (!n) return "";
  if (u === "month") return n === 1 ? "شهر واحد" : n === 2 ? "شهران" : `${n} أشهر`;
  if (u === "day") return n === 1 ? "يوم واحد" : n === 2 ? "يومان" : `${n} يوماً`;
  return n === 1 ? "سنة واحدة" : n === 2 ? "سنتان" : `${n} سنوات`;
};

const birthDateFromAge = (buyDate: string, v: string, u: Entry["ageUnit"]): string | null => {
  const n = parseInt(v || "0", 10);
  if (!n || !buyDate) return null;
  const d = new Date(buyDate + "T00:00:00");
  if (u === "month") d.setMonth(d.getMonth() - n);
  else if (u === "day") d.setDate(d.getDate() - n);
  else d.setFullYear(d.getFullYear() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function PurchasesPage() {
  const { lang, t } = useApp();
  const tx = (k: string) => L[k][lang] ?? L[k].ar;
  const typeLabelL = (tt: string) => getAnimalLabel(tt, lang);
  const catLabel = (c: string) => (L["cat_" + c] ? (L["cat_" + c][lang] ?? c) : c);
  const [items, setItems] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [herdBreeds, setHerdBreeds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [herdAnimals, setHerdAnimals] = useState<HerdAnimal[]>([]);
  const [selected, setSelected] = useState<Purchase | null>(null);

  // wizard state
  const [step, setStep] = useState<"cat" | "generic" | "type" | "mode" | "entries" | "supplier">("cat");
  const [category, setCategory] = useState("animal");
  const [aType, setAType] = useState("cow");
  const [mode, setMode] = useState<"single" | "bulk" | "flock" | "hen">("single");
  const [entries, setEntries] = useState<Entry[]>([blankEntry()]);
  const [bulkCount, setBulkCount] = useState("3");
  const [flock, setFlock] = useState({ count: "10", naming: false, males: "", females: "", priceMode: "total" as "perHead" | "total", breeds: [{ breed: "", count: "" }] });
  const [hen, setHen] = useState({ henName: "", chickCount: "5" });
  const [purpose, setPurpose] = useState("eggs");
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [supplierId, setSupplierId] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "debt">("cash");
  const [balance, setBalance] = useState<number | null>(null);
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "" });
  const [buyDate, setBuyDate] = useState(getTodayDate());
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  // generic (non-animal) form
  const [gform, setGform] = useState({ date: getTodayDate(), description: "", quantity: "", unit: "كغ", unitCustom: "", unitPrice: "", totalAmount: "", supplierId: "", animalType: "", feedMode: "existing", feedId: "", feedName: "", feedType: "hay", notes: "" });

  // حساب تلقائي باتجاهين: سعر الوحدة ⇄ الإجمالي
  const gQty = (q: string, up: string, ta: string, changed: "qty" | "up" | "ta") => {
    const nq = parseFloat(q || "0"), nup = parseFloat(up || "0"), nta = parseFloat(ta || "0");
    const round = (x: number) => String(Math.round(x * 100) / 100);
    if (changed === "up" && nq > 0 && nup > 0) return { ...gform, unitPrice: up, totalAmount: round(nq * nup) };
    if (changed === "ta" && nq > 0 && nta > 0) return { ...gform, totalAmount: ta, unitPrice: round(nta / nq) };
    if (changed === "qty" && nq > 0 && nup > 0) return { ...gform, quantity: q, totalAmount: round(nq * nup) };
    if (changed === "qty") return { ...gform, quantity: q };
    if (changed === "up") return { ...gform, unitPrice: up };
    return { ...gform, totalAmount: ta };
  };
  const resolvedUnit = () => {
    if (category === "feed" && gform.feedMode === "existing") {
      const f = feeds.find((x) => String(x.id) === gform.feedId);
      if (f) return f.unit;
    }
    return gform.unit === "أخرى..." ? (gform.unitCustom || "وحدة") : gform.unit;
  };

  const fetchAll = () => {
    setLoading(true);
    fetch("/api/purchases").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([])).finally(() => setLoading(false));
    fetch("/api/contacts").then((r) => r.json()).then((d) => {
      const arr = Array.isArray(d) ? d : [];
      setSuppliers(arr.filter((c: Contact) => c.type === "supplier" || c.type === "both"));
    }).catch(() => {});
    fetch("/api/feed").then((r) => r.json()).then((d) => setFeeds(Array.isArray(d?.stock) ? d.stock : [])).catch(() => {});
    fetch("/api/treasury").then((r) => r.json()).then((d) => setBalance(typeof d?.balance === "number" ? d.balance : null)).catch(() => {});
    fetch("/api/animals").then((r) => r.json()).then((d) => {
      const arr: HerdAnimal[] = Array.isArray(d) ? d : [];
      const map: Record<string, string[]> = {};
      for (const a of arr) {
        if (a.breed && !(map[a.type] || []).includes(a.breed)) map[a.type] = [...(map[a.type] || []), a.breed];
      }
      setHerdBreeds(map);
      setHerdAnimals(arr);
    }).catch(() => {});
  };
  useEffect(() => { fetchAll(); }, []);

  const openWizard = () => {
    setStep("cat"); setCategory("animal"); setAType("cow"); setMode("single");
    setPayMode("cash"); setSupplierMode("existing"); setSupplierId("");
    setEntries([blankEntry()]); setBulkCount("3");
    setFlock({ count: "10", naming: false, males: "", females: "", priceMode: "total", breeds: [{ breed: "", count: "" }] });
    setHen({ henName: "", chickCount: "5" }); setPurpose("eggs");
    setSupplierMode("existing"); setSupplierId(""); setNewSupplier({ name: "", phone: "" });
    setBuyDate(getTodayDate()); setTotalAmount(""); setNotes("");
    setShowForm(true);
  };

  const isLarge = aType === "cow" || aType === "sheep" || aType === "goat";

  const buildEntries = async () => {
    const list: Entry[] = [];
    if (isLarge) {
      if (mode === "single") { setEntries([blankEntry()]); }
      else {
        const n = Math.max(2, parseInt(bulkCount || "2", 10));
        setEntries(Array.from({ length: n }, () => blankEntry()));
      }
    } else {
      if (mode === "single") { setEntries([{ ...blankEntry(), gender: "female" }]); }
      else if (mode === "flock") {
        const n = Math.max(1, parseInt(flock.count || "1", 10));
        // تحقق مبكر قبل توليد البطاقات حتى لا تختلف الأعداد
        const bc = flock.breeds.reduce((s, b) => s + parseInt(b.count || "0", 10), 0);
        if (bc !== n) { await appAlert(`${tx("err_breed_sum")} (${bc}) ${tx("err_must_equal")} ${tx("err_flock_n")} (${n})`); return; }
        const g = parseInt(flock.males || "0", 10) + parseInt(flock.females || "0", 10);
        if (g !== n) { await appAlert(`${tx("err_genders")} (${g}) ${tx("err_must_equal")} ${tx("err_flock_n")} (${n})`); return; }
        const breeds: string[] = [];
        for (const b of flock.breeds) {
          const c = parseInt(b.count || "0", 10);
          for (let i = 0; i < c; i++) breeds.push(b.breed);
        }
        while (breeds.length < n) breeds.push(flock.breeds[0]?.breed || "");
        const males = parseInt(flock.males || "0", 10);
        for (let i = 0; i < n; i++) {
          list.push({
            ...blankEntry(),
            name: flock.naming ? "" : `${typeLabel(aType)} ${i + 1}`,
            breed: breeds[i] || "",
            gender: i < males ? "male" : "female",
            price: "",
          });
        }
        setEntries(list);
      } else {
        // hen + chicks
        const n = Math.max(1, parseInt(hen.chickCount || "1", 10));
        list.push({ ...blankEntry(), name: hen.henName, gender: "female", ref: "mom" });
        for (let i = 0; i < n; i++) {
          list.push({ ...blankEntry(), name: `فرخ ${hen.henName || ""} ${i + 1}`.trim(), gender: "", lifeStage: "chick", motherRef: "mom", ageText: "يوم واحد" });
        }
        setEntries(list);
      }
    }
    if (aType === "quail") setEntries((prev) => prev.map((e) => ({ ...e, purpose })));
    setStep("entries");
  };

  const validateEntries = (): string | null => {
    if (isLarge) {
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (!e.name) return `${tx("err_animal")} ${i + 1}: ${t("c_name")} ${t("c_required")} *`;
        if (!e.breed) return `${tx("err_animal")} ${i + 1}: ${t("c_breed")} ${t("c_required")} *`;
        if (!e.gender) return `${tx("err_animal")} ${i + 1}: ${t("c_gender")} ${t("c_required")} *`;
        if (!e.weight) return `${tx("err_animal")} ${i + 1}: ${t("c_weight")} ${t("c_required")} *`;
        if (!e.teeth) return `${tx("err_animal")} ${i + 1}: ${tx("teeth_lbl")} ${t("c_required")} *`;
        if (mode === "single" && !e.price) return `${t("c_price")} ${t("c_required")} *`;
      }
    } else {
      if (mode === "single") {
        const e = entries[0];
        if (!e.breed) return `${t("c_breed")} ${t("c_required")} *`;
        if (!e.gender) return `${t("c_gender")} ${t("c_required")} *`;
        if (!e.ageValue) return `${t("c_age")} ${t("c_required")} *`;
        if (!e.price) return `${t("c_price")} ${t("c_required")} *`;
      } else if (mode === "flock") {
        const n = entries.length;
        if (flock.naming && entries.some((e) => !e.name)) return tx("err_name_each");
        const bc = flock.breeds.reduce((s, b) => s + parseInt(b.count || "0", 10), 0);
        if (bc !== n) return `${tx("err_breed_sum")} (${bc}) ${tx("err_must_equal")} ${tx("err_flock_n")} (${n})`;
        const g = parseInt(flock.males || "0", 10) + parseInt(flock.females || "0", 10);
        if (g !== n) return `${tx("err_genders")} (${g}) ${tx("err_must_equal")} ${tx("err_flock_n")} (${n})`;
        if (flock.priceMode === "perHead" && entries.some((e) => !e.price)) return tx("err_each_price");
        void n;
      } else {
        if (!hen.henName) return tx("err_hen_name");
      }
    }
    return null;
  };

  const goSupplier = async () => {
    const err = validateEntries();
    if (err) { await appAlert(err); return; }
    // prefill total from per-head prices when relevant
    if ((isLarge && mode === "single") || (!isLarge && mode === "single") || (!isLarge && mode === "flock" && flock.priceMode === "perHead")) {
      const sum = entries.reduce((s, e) => s + parseFloat(e.price || "0"), 0);
      if (sum > 0) setTotalAmount(String(sum));
    } else setTotalAmount("");
    setStep("supplier");
  };

  const handleSaveAnimals = async () => {
    if (supplierMode === "existing" && !supplierId) { await appAlert(`${t("c_supplier")} ${t("c_required")} *`); return; }
    if (supplierMode === "new" && !newSupplier.name) { await appAlert(tx("err_new_supplier")); return; }
    if (!totalAmount || !buyDate) { await appAlert(tx("err_total_date")); return; }
    if (payMode === "cash" && balance !== null && parseFloat(totalAmount) > balance) {
      await appAlert(`${tx("err_insufficient")} (${t("c_available")}: ${formatCurrency(balance)}) — ${tx("err_insufficient_hint")}`); return;
    }
    setSaving(true);
    try {
      let sid = supplierId ? Number(supplierId) : null;
      if (supplierMode === "new") {
        const r = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSupplier.name, type: "supplier", phone: newSupplier.phone || null, notes: "أضيف عند الشراء" }) });
        const c = await r.json();
        sid = c.id;
        fetchAll();
      }
      if (payMode === "debt" && !sid) { await appAlert(tx("err_debt_supplier")); return; }
      const payloadEntries = entries.map((e) => ({
        ...e,
        type: aType,
        purpose: aType === "quail" ? purpose : undefined,
        price: e.price || null,
        birthDate: e.lifeStage === "chick" ? buyDate : (e.ageValue && e.ageValue !== "0" ? birthDateFromAge(buyDate, e.ageValue, e.ageUnit) : null),
        ageText: e.lifeStage === "chick" ? (e.ageText || "يوم واحد") : (e.ageText || ageTextFrom(e.ageValue, e.ageUnit)),
      }));
      const n = payloadEntries.length;
      const r = await fetch("/api/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: buyDate, category: "animal",
          description: `شراء ${n} ${typeLabel(aType)}${mode === "bulk" ? " (جملة)" : ""}${mode === "hen" ? " (أم مع فراخ)" : ""}${aType === "quail" ? (purpose === "eggs" ? " (بيض)" : " (لحم)") : ""}`,
          quantity: String(n), unit: "رأس", totalAmount, supplierId: sid, animalType: aType,
          paymentMethod: payMode,
          batchGroup: mode === "flock" || mode === "bulk",
          notes: notes || null, animalsList: payloadEntries,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error === "INSUFFICIENT_FUNDS") { await appAlert(`${tx("err_insufficient")} (${t("c_available")}: ${formatCurrency(d.balance)})`); return; }
        if (d.error === "SUPPLIER_REQUIRED") { await appAlert(tx("err_debt_existing")); return; }
        { await appAlert(t("c_error")); return; }
      }
      setShowForm(false);
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const handleSaveGeneric = async () => {
    if (!gform.description || !gform.totalAmount || !gform.date) { await appAlert(tx("err_desc_amount_date")); return; }
    if (payMode === "cash" && balance !== null && parseFloat(gform.totalAmount) > balance) {
      await appAlert(`${tx("err_insufficient")} (${t("c_available")}: ${formatCurrency(balance)})`); return;
    }
    setSaving(true);
    try {
      const feed = feeds.find((f) => String(f.id) === gform.feedId);
      let sid = gform.supplierId ? Number(gform.supplierId) : null;
      if (payMode === "debt" && !sid) { await appAlert(tx("err_debt_choose")); return; }
      const r = await fetch("/api/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: gform.date, category, description: gform.description,
          quantity: gform.quantity || null, unit: resolvedUnit(), unitPrice: gform.unitPrice || null,
          totalAmount: gform.totalAmount, supplierId: sid,
          animalType: gform.animalType || null, paymentMethod: payMode, notes: gform.notes || null,
          feedId: category === "feed" && gform.feedMode === "existing" && gform.feedId ? Number(gform.feedId) : undefined,
          feedName: category === "feed" ? (gform.feedMode === "existing" ? feed?.name : gform.feedName) : undefined,
          feedType: gform.feedType || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error === "INSUFFICIENT_FUNDS") { await appAlert(`${tx("err_insufficient")} (${t("c_available")}: ${formatCurrency(d.balance)})`); return; }
        await appAlert(t("c_error")); return;
      }
      setShowForm(false);
      fetchAll();
    } catch { await appAlert(t("c_error")); } finally { setSaving(false); }
  };

  const setEntry = (i: number, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const supplierName = (id: number | null) => suppliers.find((s) => s.id === id)?.name || tx("det_none");
  const linkedAnimals = (p: Purchase) => (p.category === "animal" && p.animalType ? herdAnimals.filter((a) => a.type === p.animalType && a.purchaseDate === p.date) : []);
  const handleDelete = async (id: number) => {
    if (!(await appConfirm(tx("det_del_confirm")))) return;
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchAll();
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm";
  const labelCls = "text-sm text-gray-600 mb-1 block";

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <TopBar title={t("nav_purchases")} subtitle={tx("sub")} action={{ label: tx("new_buy"), icon: "🛒", onClick: openWizard }} />
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16"><p className="text-5xl mb-3">🛒</p><p className="text-gray-500">{tx("empty")}</p></div>
        ) : items.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">
              {p.category === "animal" ? "🐄" : p.category === "feed" ? "🌾" : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{p.description}</p>
              <p className="text-xs text-gray-500">{p.animalType ? getAnimalLabel(p.animalType, lang) : catLabel(p.category)} • {formatDate(p.date)}</p>
            </div>
            <p className="font-bold text-sm text-blue-700">-{formatCurrency(p.totalAmount)}</p>
          </button>
        ))}
        <Link href="/expenses" className="block text-center text-sm text-red-600 pt-2">{tx("view_expenses")}</Link>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 slide-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{tx("det_title")}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                {selected.category === "animal" ? "🐄" : selected.category === "feed" ? "🌾" : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{selected.description}</p>
                <p className="text-xs text-gray-500">{catLabel(selected.category)} • {formatDate(selected.date)}</p>
              </div>
              <p className="font-bold text-sm text-blue-700">-{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_supplier")}</span><b>{supplierName(selected.supplierId)}</b></div>
              {selected.animalType && (
                <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_details")}</span><b>{getAnimalLabel(selected.animalType, lang)}</b></div>
              )}
              {selected.quantity && (
                <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{tx("det_qty")}</span><b>{selected.quantity} {selected.unit || ""}</b></div>
              )}
              {selected.unitPrice && (
                <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_unit_price")}</span><b>{formatCurrency(selected.unitPrice)}</b></div>
              )}
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_total")}</span><b className="text-blue-700">{formatCurrency(selected.totalAmount)}</b></div>
              <div className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"><span className="text-gray-500">{t("c_date")}</span><b>{formatDate(selected.date)}</b></div>
              {selected.notes && (
                <div className="bg-gray-50 rounded-xl px-3 py-2"><p className="text-gray-500 text-xs mb-1">{t("c_notes")}</p><p>{selected.notes}</p></div>
              )}
              {selected.category === "animal" && (
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-gray-500 text-xs mb-1">{tx("det_linked")} ({linkedAnimals(selected).length})</p>
                  {linkedAnimals(selected).length === 0 ? (
                    <p className="text-gray-400 text-xs">{tx("det_none")}</p>
                  ) : (
                    linkedAnimals(selected).map((a) => <p key={a.id} className="text-sm text-gray-800">• {a.name}</p>)
                  )}
                </div>
              )}
            </div>
            <button onClick={() => handleDelete(selected.id)} className="w-full mt-4 bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-bold">🗑️ {t("c_delete")}[SKILL_PRUNED]</button>
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

            {/* STEP: category */}
            {step === "cat" && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["animal", tx("cat_animal")], ["feed", tx("cat_feed")], ["equipment", tx("cat_equipment")], ["medicine", tx("cat_medicine")], ["other", tx("cat_other")],
                ].map(([v, l]) => (
                  <button key={v} onClick={() => { setCategory(v); setStep(v === "animal" ? "type" : "generic"); }}
                    className="bg-blue-50 border border-blue-200 rounded-xl py-3 text-sm font-medium text-blue-800">{l}</button>
                ))}
              </div>
            )}

            {/* STEP: type */}
            {step === "type" && (
              <div>
                <p className={labelCls}>{tx("choose_type")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {animalTypes.map((t) => (
                    <button key={t.value} onClick={() => { setAType(t.value); setMode("single"); setStep("mode"); }}
                      className={`border rounded-xl py-3 text-sm font-medium ${aType === t.value ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200"}`}>
                      {t.emoji} {getAnimalLabel(t.value, lang)}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep("cat")} className="mt-3 text-sm text-gray-500">→ {t("c_back")}</button>
              </div>
            )}

            {/* STEP: mode */}
            {step === "mode" && (
              <div className="space-y-3">
                <p className={labelCls}>{getAnimalEmoji(aType)} {typeLabelL(aType)} — {tx("buy_method")}</p>
                {isLarge ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMode("single")} className={`border rounded-xl py-3 text-sm font-medium ${mode === "single" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200"}`}>{tx("mode_single")}</button>
                    <button onClick={() => setMode("bulk")} className={`border rounded-xl py-3 text-sm font-medium ${mode === "bulk" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200"}`}>{tx("mode_bulk")}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[["single", tx("mode_one_f")], ["flock", tx("mode_flock")], ["hen", tx("mode_hen")]].map(([v, l]) => (
                      <button key={v} onClick={() => setMode(v as "single" | "flock" | "hen")} className={`border rounded-xl py-3 text-sm font-medium ${mode === v ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200"}`}>{l}</button>
                    ))}
                  </div>
                )}
                {isLarge && mode === "bulk" && (
                  <div>
                    <label className={labelCls}>{tx("bulk_count")}</label>
                    <input type="number" min={2} className={inputCls} value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} />
                  </div>
                )}
                {!isLarge && mode === "flock" && (
                  <div className="space-y-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div>
                      <label className={labelCls}>{tx("flock_count")}</label>
                      <input type="number" min={1} className={inputCls} value={flock.count} onChange={(e) => {
                        const v = e.target.value;
                        setFlock({ ...flock, count: v, breeds: flock.breeds.length === 1 ? [{ ...flock.breeds[0], count: v }] : flock.breeds });
                      }} />
                    </div>
                    <div className="flex gap-2">
                      {[["perHead", tx("price_per_head")], ["total", tx("price_total")]].map(([v, l]) => (
                        <button key={v} onClick={() => setFlock({ ...flock, priceMode: v as "perHead" | "total" })}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium ${flock.priceMode === v ? "bg-yellow-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                      ))}
                    </div>
                    <div>
                      <label className={labelCls}>{tx("naming")}</label>
                      <div className="flex gap-2">
                        <button onClick={() => setFlock({ ...flock, naming: true })} className={`flex-1 py-2 rounded-xl text-xs font-medium ${flock.naming ? "bg-yellow-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("naming_each")}</button>
                        <button onClick={() => setFlock({ ...flock, naming: false })} className={`flex-1 py-2 rounded-xl text-xs font-medium ${!flock.naming ? "bg-yellow-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("naming_none")}</button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>{tx("breeds_counts")}</label>
                      {flock.breeds.map((b, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input className={inputCls} placeholder={tx("breed_ph")} value={b.breed} onChange={(e) => setFlock({ ...flock, breeds: flock.breeds.map((x, j) => (j === i ? { ...x, breed: e.target.value } : x)) })} />
                          <input type="number" min={0} className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder={tx("count_ph")} value={b.count} onChange={(e) => setFlock({ ...flock, breeds: flock.breeds.map((x, j) => (j === i ? { ...x, count: e.target.value } : x)) })} />
                          {flock.breeds.length > 1 && <button onClick={() => setFlock({ ...flock, breeds: flock.breeds.filter((_, j) => j !== i) })} className="text-red-500 px-2">×</button>}
                        </div>
                      ))}
                      <button onClick={() => setFlock({ ...flock, breeds: [...flock.breeds, { breed: "", count: "" }] })} className="text-xs text-blue-600 font-medium">{tx("add_breed")}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>{tx("males_count")}</label><input type="number" min={0} className={inputCls} value={flock.males} onChange={(e) => setFlock({ ...flock, males: e.target.value })} /></div>
                      <div><label className={labelCls}>{tx("females_count")}</label><input type="number" min={0} className={inputCls} value={flock.females} onChange={(e) => setFlock({ ...flock, females: e.target.value })} /></div>
                    </div>
                  </div>
                )}
                {!isLarge && mode === "hen" && (
                  <div className="space-y-3 bg-pink-50 border border-pink-200 rounded-xl p-3">
                    <p className="text-xs text-pink-700">{tx("hen_note")}</p>
                    <div><label className={labelCls}>{tx("hen_name")}</label><input className={inputCls} value={hen.henName} onChange={(e) => setHen({ ...hen, henName: e.target.value })} /></div>
                    <div><label className={labelCls}>{tx("chick_count")}</label><input type="number" min={1} className={inputCls} value={hen.chickCount} onChange={(e) => setHen({ ...hen, chickCount: e.target.value })} /></div>
                  </div>
                )}
                {aType === "quail" && (
                  <div>
                    <label className={labelCls}>{tx("batch_purpose")}</label>
                    <div className="flex gap-2">
                      {[["eggs", tx("purpose_eggs")], ["meat", tx("purpose_meat")]].map(([v, l]) => (
                        <button key={v} onClick={() => setPurpose(v)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${purpose === v ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setStep("type")} className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200">→ {t("c_back")}</button>
                  <button onClick={buildEntries} className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white">{tx("next_fill")}</button>
                </div>
              </div>
            )}

            {/* STEP: entries */}
            {step === "entries" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{isLarge ? tx("entries_hint_l") : mode === "hen" ? tx("entries_hint_hen") : tx("entries_hint_bird")}</p>
                {entries.map((e, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-700">{mode === "hen" ? (i === 0 ? tx("mother_hen") : `🐣 ${tx("chick_n")} ${i}`) : `${getAnimalEmoji(aType)} ${i + 1}`}</p>
                    {(isLarge || flock.naming || mode === "single" || (mode === "hen" && i === 0)) && (
                      <div><label className={labelCls}>{t("c_name")} {isLarge || (mode === "hen" && i === 0) ? "*" : ""}</label>
                        <input className={inputCls} value={e.name} onChange={(ev) => setEntry(i, { name: ev.target.value })} /></div>
                    )}
                    {!(mode === "hen" && i > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={labelCls}>{t("c_breed")} *</label>
                          <input className={inputCls} list={`breeds-${aType}`} value={e.breed} onChange={(ev) => setEntry(i, { breed: ev.target.value })} />
                          <datalist id={`breeds-${aType}`}>{(herdBreeds[aType] || []).map((b) => <option key={b} value={b} />)}</datalist></div>
                        <div><label className={labelCls}>{t("c_gender")} *</label>
                          <select className={inputCls} value={e.gender} onChange={(ev) => setEntry(i, { gender: ev.target.value })}>
                            <option value="female">♀ {t("c_female")}</option>
                            <option value="male">♂ {t("c_male")}</option>
                          </select></div>
                      </div>
                    )}
                    {isLarge && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={labelCls}>{t("c_weight")} (كغ) *</label><input type="number" className={inputCls} value={e.weight} onChange={(ev) => setEntry(i, { weight: ev.target.value })} /></div>
                        <div><label className={labelCls}>{tx("teeth_lbl")} *</label>
                          <select className={inputCls} value={e.teeth} onChange={(ev) => setEntry(i, { teeth: ev.target.value })}>
                            <option value="">{tx("choose")}</option>
                            {teethOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select></div>
                      </div>
                    )}
                    {(isLarge || (!isLarge && mode === "single") || (mode === "hen" && i === 0)) && (
                      <div>
                        <label className={labelCls}>{t("c_age")}{!isLarge && mode === "single" ? " *" : ""}</label>
                        <div className="flex gap-2 items-stretch">
                          <input type="number" min={0} inputMode="numeric" className="flex-[3] min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="2" value={e.ageValue} onChange={(ev) => { const v = ev.target.value; setEntry(i, { ageValue: v, ageText: ageTextFrom(v, e.ageUnit) }); }} />
                          <select className="w-24 flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2.5 text-base" value={e.ageUnit} onChange={(ev) => { const u = ev.target.value as Entry["ageUnit"]; setEntry(i, { ageUnit: u, ageText: ageTextFrom(e.ageValue, u) }); }}>
                            <option value="year">{tx("age_unit_year")}</option>
                            <option value="month">{tx("age_unit_month")}</option>
                            <option value="day">{tx("age_unit_day")}</option>
                          </select>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{tx("age_hint")}</p>
                      </div>
                    )}
                    {(mode === "single" || (mode === "flock" && flock.priceMode === "perHead")) && (
                      <div><label className={labelCls}>{t("c_price")} *</label><input type="number" className={inputCls} value={e.price} onChange={(ev) => setEntry(i, { price: ev.target.value })} /></div>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={() => setStep("mode")} className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200">→ {t("c_back")}</button>
                  <button onClick={goSupplier} className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white">{tx("next_supplier")}</button>
                </div>
              </div>
            )}

            {/* STEP: supplier + payment */}
            {step === "supplier" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>{tx("pay_method")}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setPayMode("cash")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${payMode === "cash" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_cash")}</button>
                    <button onClick={() => setPayMode("debt")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${payMode === "debt" ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_debt")}</button>
                  </div>
                  {payMode === "cash" ? (
                    <p className="mt-2 text-xs text-center bg-green-50 border border-green-200 rounded-xl p-2">{tx("treasury_bal")} <b>{balance === null ? "..." : formatCurrency(balance)}</b>{balance !== null && totalAmount && parseFloat(totalAmount) > balance ? ` ${tx("insufficient")}` : ""}</p>
                  ) : (
                    <p className="mt-2 text-xs text-center bg-orange-50 border border-orange-200 rounded-xl p-2">{tx("debt_note")}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>{t("c_supplier")} *</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setSupplierMode("existing")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${supplierMode === "existing" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("from_suppliers")}</button>
                    <button onClick={() => setSupplierMode("new")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${supplierMode === "new" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("new_supplier")}</button>
                  </div>
                  {supplierMode === "existing" ? (
                    <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">{tx("choose")}</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputCls} placeholder={tx("new_supplier_name")} value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                      <input className={inputCls} placeholder={t("c_phone")} value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{mode === "bulk" || (mode === "flock" && flock.priceMode === "total") || mode === "hen" ? tx("total_bulk") : tx("total_single")}</label>
                    <input type="number" className={inputCls} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></div>
                  <div><label className={labelCls}>{tx("buy_date")}</label><input type="date" className={inputCls} value={buyDate} onChange={(e) => setBuyDate(e.target.value)} /></div>
                </div>
                <div><label className={labelCls}>{t("c_notes")}</label><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                  {entries.length} {typeLabelL(aType)} • {tx("summary_mid")}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep("entries")} className="flex-1 py-3 rounded-xl text-sm text-gray-500 border border-gray-200">→ {t("c_back")}</button>
                  <button onClick={handleSaveAnimals} disabled={saving} className="flex-[2] py-3 rounded-xl text-sm font-bold bg-blue-600 text-white disabled:opacity-50">
                    {saving ? t("common_saving") : tx("confirm_buy")}
                  </button>
                </div>
              </div>
            )}

            {/* generic form for feed/equipment/medicine/other */}
            {step === "generic" && (
              <div className="space-y-3">
                <div><label className={labelCls}>{t("c_desc")} *</label><input className={inputCls} value={gform.description} onChange={(e) => setGform({ ...gform, description: e.target.value })} /></div>
                {category === "feed" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      {[["existing", tx("feed_existing")], ["new", tx("feed_new")]].map(([v, l]) => (
                        <button key={v} onClick={() => setGform({ ...gform, feedMode: v })} className={`flex-1 py-2 rounded-xl text-xs font-medium ${gform.feedMode === v ? "bg-yellow-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                      ))}
                    </div>
                    {gform.feedMode === "existing" ? (
                      <select className={inputCls} value={gform.feedId} onChange={(e) => setGform({ ...gform, feedId: e.target.value })}>
                        <option value="">{tx("choose_feed")}</option>
                        {feeds.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.quantity} {f.unit})</option>)}
                      </select>
                    ) : (
                      <input className={inputCls} placeholder={tx("new_feed_name")} value={gform.feedName} onChange={(e) => setGform({ ...gform, feedName: e.target.value })} />
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{t("c_unit")} *</label>
                    {category === "feed" && gform.feedMode === "existing" && gform.feedId ? (
                      <div className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600">{tx("per_feed")} {resolvedUnit()}</div>
                    ) : (
                      <>
                        <select className={inputCls} value={gform.unit} onChange={(e) => setGform({ ...gform, unit: e.target.value })}>
                          {feedUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        {gform.unit === "أخرى..." && (
                          <input className={`${inputCls} mt-2`} placeholder={tx("unit_ph")} value={gform.unitCustom} onChange={(e) => setGform({ ...gform, unitCustom: e.target.value })} />
                        )}
                      </>
                    )}</div>
                  <div><label className={labelCls}>{t("c_quantity")} ({resolvedUnit()})</label><input type="number" className={inputCls} value={gform.quantity} onChange={(e) => setGform(gQty(e.target.value, gform.unitPrice, gform.totalAmount, "qty"))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{t("c_unit_price")} {tx("calc_total")}</label><input type="number" className={inputCls} value={gform.unitPrice} onChange={(e) => setGform(gQty(gform.quantity, e.target.value, gform.totalAmount, "up"))} /></div>
                  <div><label className={labelCls}>{t("c_total")} * {tx("calc_price")}</label><input type="number" className={inputCls} value={gform.totalAmount} onChange={(e) => setGform(gQty(gform.quantity, gform.unitPrice, e.target.value, "ta"))} /></div>
                </div>
                <div>
                  <label className={labelCls}>{tx("pay_method")}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setPayMode("cash")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${payMode === "cash" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_cash")}{balance !== null ? ` (${formatCurrency(balance)})` : ""}</button>
                    <button onClick={() => setPayMode("debt")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${payMode === "debt" ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{tx("pay_debt_short")}</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>{t("c_supplier")}{payMode === "debt" ? " *" : ""}</label>
                    <select className={inputCls} value={gform.supplierId} onChange={(e) => setGform({ ...gform, supplierId: e.target.value })}>
                      <option value="">{tx("none")}</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select></div>
                  <div><label className={labelCls}>{t("c_date")} *</label><input type="date" className={inputCls} value={gform.date} onChange={(e) => setGform({ ...gform, date: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep("cat")} className="flex-1 py-3 rounded-xl text-sm text-gray-500 border border-gray-200">→ {t("c_back")}</button>
                  <button onClick={handleSaveGeneric} disabled={saving} className="flex-[2] py-3 rounded-xl text-sm font-bold bg-blue-600 text-white disabled:opacity-50">
                    {saving ? t("common_saving") : t("common_save")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
