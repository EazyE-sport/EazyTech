const KEY = "et-devices-v2";
let cache = null;

async function pull() {
  const idx = await (await fetch("data/devices/index.json")).json();
  const res = await Promise.allSettled(
    idx.map((f) => fetch(`data/devices/${f}`).then((r) => {
      if (!r.ok) throw new Error(f);
      return r.json();
    })),
  );
  return res.filter((r) => r.status === "fulfilled").map((r) => r.value);
}

export async function all() {
  if (cache) return cache;
  try {
    cache = JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  if (!cache || !cache.length) {
    cache = await pull();
    try {
      sessionStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* приватный режим — не критично */
    }
  }
  return cache;
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
