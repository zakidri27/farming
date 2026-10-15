export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0.00 دج";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00 دج";
  return new Intl.NumberFormat("ar-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " دج";
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-DZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function getAnimalLabel(type: string, lang: string = "ar"): string {
  const labels: Record<string, Record<string, string>> = {
    cow: { ar: "أبقار", en: "Cattle", fr: "Bovins" },
    goat: { ar: "ماعز", en: "Goats", fr: "Chèvres" },
    sheep: { ar: "أغنام", en: "Sheep", fr: "Moutons" },
    chicken: { ar: "دجاج", en: "Chickens", fr: "Poulets" },
    quail: { ar: "سمان", en: "Quail", fr: "Cailles" },
  };
  return labels[type]?.[lang] || labels[type]?.ar || type;
}

export function getAnimalEmoji(type: string): string {
  const emojis: Record<string, string> = {
    cow: "🐄",
    goat: "🐐",
    sheep: "🐑",
    chicken: "🐔",
    quail: "🦅",
  };
  return emojis[type] || "🐾";
}

export function getStatusLabel(status: string, lang: string = "ar"): string {
  const labels: Record<string, Record<string, string>> = {
    active: { ar: "نشط", en: "Active", fr: "Actif" },
    sold: { ar: "مباع", en: "Sold", fr: "Vendu" },
    dead: { ar: "نافق", en: "Dead", fr: "Mort" },
    healthy: { ar: "صحي", en: "Healthy", fr: "Sain" },
    sick: { ar: "مريض", en: "Sick", fr: "Malade" },
    treatment: { ar: "تحت العلاج", en: "Under treatment", fr: "En traitement" },
    recovered: { ar: "تعافى", en: "Recovered", fr: "Rétabli" },
    paid: { ar: "مدفوع", en: "Paid", fr: "Payé" },
    pending: { ar: "معلق", en: "Pending", fr: "En attente" },
    partial: { ar: "جزئي", en: "Partial", fr: "Partiel" },
    owed_to_us: { ar: "لنا", en: "Owed to us", fr: "À recevoir" },
    we_owe: { ar: "علينا", en: "We owe", fr: "À payer" },
  };
  return labels[status]?.[lang] || labels[status]?.ar || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    sold: "bg-blue-100 text-blue-700",
    dead: "bg-gray-100 text-gray-600",
    healthy: "bg-green-100 text-green-700",
    sick: "bg-red-100 text-red-700",
    treatment: "bg-amber-100 text-amber-700",
    recovered: "bg-emerald-100 text-emerald-700",
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-orange-100 text-orange-700",
    owed_to_us: "bg-blue-100 text-blue-700",
    we_owe: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function animalAgeLabel(birthDate: string | null, lang: string = "ar", fallback?: string | null): string {
  if (!birthDate) return fallback ?? "-";
  const days = Math.floor((Date.now() - new Date(birthDate + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return fallback ?? "-";
  const D = lang === "ar" ? "يوم" : lang === "fr" ? "jours" : "days";
  const M1 = lang === "ar" ? "شهر" : lang === "fr" ? "mois" : "month";
  const Mn = lang === "ar" ? "أشهر" : lang === "fr" ? "mois" : "months";
  const Y1 = lang === "ar" ? "سنة" : lang === "fr" ? "an" : "year";
  const Yn = lang === "ar" ? "سنوات" : lang === "fr" ? "ans" : "years";
  const YAnd = lang === "ar" ? "سنة و" : lang === "fr" ? "ans et" : "yrs &";
  if (days < 30) return `${days} ${D}`;
  const months = Math.floor(days / 30.4);
  if (months < 12) return `${months} ${months <= 2 ? M1 : Mn}`;
  const y = Math.floor(months / 12), m = months % 12;
  const yW = y <= 2 ? Y1 : Yn;
  if (m > 0) return `${y} ${yW} ${YAnd} ${m} ${m <= 2 ? M1 : Mn}`;
  return `${y} ${yW}`;
}

export function subtractAge(dateStr: string, value: number, unit: string): string | null {
  if (!dateStr || !value || value <= 0) return null;
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  if (unit === "day") d.setDate(d.getDate() - value);
  else if (unit === "month") d.setMonth(d.getMonth() - value);
  else d.setFullYear(d.getFullYear() - value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
