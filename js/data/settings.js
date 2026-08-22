const KEY = "et-cur";

export const RATES = { uah: 1, usd: 41.4, eur: 45.3, rub: 0.48 };

export const CURRENCIES = [
  { id: "uah", label: "Гривны", sym: "₴" },
  { id: "usd", label: "Доллары", sym: "$" },
  { id: "eur", label: "Евро", sym: "€" },
  { id: "rub", label: "Рубли", sym: "₽" },
];

let cur = "uah";

try {
  const saved = localStorage.getItem(KEY);
  if (saved && RATES[saved]) cur = saved;
} catch {
  /* приватный режим */
}

export const getCur = () => cur;

export function setCur(c) {
  if (!RATES[c]) return;
  cur = c;
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* игнорируем */
  }
}

export function fmt(v) {
  const f = cur === "uah"
    ? Math.round(v)
    : Math.round((v / RATES[cur]) * 100) / 100;
  const str = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(f);
  const s = CURRENCIES.find((c) => c.id === cur).sym;
  return `${str} ${s}`;
}

// цена магазина: число (гривны) или строка с валютой на конце —
// "3000RUB", "79EUR", "69USD" / "69DLR", "2990UAH"
const SUF_RATE = {
  uah: 1, "₴": 1,
  usd: RATES.usd, dlr: RATES.usd, "$": RATES.usd,
  eur: RATES.eur, "€": RATES.eur,
  rub: RATES.rub, "₽": RATES.rub,
};

export function toUah(v) {
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/[ ,]/g, "").toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)(uah|usd|dlr|eur|rub|₴|\$|€|₽)?$/);
  if (!m) return 0;
  return parseFloat(m[1]) * (SUF_RATE[m[2]] ?? 1);
}
