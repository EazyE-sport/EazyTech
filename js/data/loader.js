const KEY = "et-devices-v5";
const MANIFEST = "data/devices/index.json";
const SKIP = ["index.json", "test-device.json"];
let cache = null;

export function strip(text) {
  let out = "";
  let i = 0;
  let inStr = false;

  while (i < text.length) {
    const c = text[i];

    if (inStr) {
      out += c;
      if (c === "\\") {
        out += text[i + 1] || "";
        i += 2;
        continue;
      }
      if (c === '"') inStr = false;
      i++;
      continue;
    }

    if (c === '"') {
      inStr = true;
      out += c;
      i++;
      continue;
    }

    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i);
      if (end === -1) break;
      i = end + 2;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

// на github.io листинга папки нет, поэтому список файлов берём из API
// репозитория; манифест остаётся фолбэком для локального хостинга
async function fileList() {
  const host = location.hostname;
  if (host.endsWith(".github.io")) {
    const owner = host.split(".")[0];
    const repo = location.pathname.split("/")[1];
    if (owner && repo) {
      try {
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/devices`);
        if (r.ok) {
          const list = await r.json();
          const names = (Array.isArray(list) ? list : [])
            .map((f) => f.name)
            .filter((n) => n.endsWith(".json") && !SKIP.includes(n));
          if (names.length) return names;
        }
      } catch {
        /* API недоступен — ниже манифест */
      }
    }
  }
  const idx = await (await fetch(MANIFEST)).json();
  return idx.filter((n) => !SKIP.includes(n));
}

async function pull() {
  const idx = await fileList();
  const res = await Promise.allSettled(
    idx.map((f) => fetch(`data/devices/${f}`).then(async (r) => {
      if (!r.ok) throw new Error(f);
      return JSON.parse(strip(await r.text()));
    })),
  );
  return res.filter((r) => r.status === "fulfilled").map((r) => r.value);
}

export async function all() {
  if (cache) return cache;

  // всегда тянем свежие данные — владелец постоянно добавляет файлы,
  // старый кеш показывал устаревший каталог
  try {
    cache = await pull();
    try {
      sessionStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* приватный режим — не критично */
    }
    return cache;
  } catch {
    // сеть/API отвалились — отдаём последний удачный список, если был
    try {
      cache = JSON.parse(sessionStorage.getItem(KEY)) || [];
    } catch {
      cache = [];
    }
    return cache;
  }
}

export async function byId(id) {
  return (await all()).find((d) => d.id === id);
}

export function avg(d) {
  const v = Object.values(d.scores || {}).filter((n) => typeof n === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

export function ranks(list) {
  const byScore = (a, b) => avg(b) - avg(a);
  const global = [...list].sort(byScore);
  const cats = {};
  list.forEach((d) => (cats[d.category] ||= []).push(d));
  Object.values(cats).forEach((c) => c.sort(byScore));

  return new Map(list.map((d) => {
    const c = cats[d.category];
    return [d.id, {
      c: c.indexOf(d) + 1,
      cN: c.length,
      g: global.indexOf(d) + 1,
      gN: global.length,
    }];
  }));
}
