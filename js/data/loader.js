const KEY = "et-devices-v1";
let cache = null;

async function pull() {
  const idx = await (await fetch("data/devices/index.json")).json();
  const files = idx.map((f) => fetch(`data/devices/${f}`).then((r) => r.json()));
  return Promise.all(files);
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

export async function ofCat(cat) {
  const list = await all();
  return cat ? list.filter((d) => d.category === cat) : list;
}
