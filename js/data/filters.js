import { avg } from "./loader.js";

export const state = {
  cat: null,
  brands: [],
  cls: [],
  conn: [],
  mech: [],
  score: 0,
  min: 0,
  max: Infinity,
  deal: false,
};

export function reset() {
  state.brands = [];
  state.cls = [];
  state.conn = [];
  state.mech = [];
  state.score = 0;
  state.min = 0;
  state.max = Infinity;
  state.deal = false;
}

export function apply(list) {
  return list.filter((d) => {
    if (state.cat && d.category !== state.cat) return false;
    if (state.brands.length && !state.brands.includes(d.brand)) return false;
    if (state.cls.length && !state.cls.includes(d.class)) return false;
    if (state.conn.length && !state.conn.includes(d.connection)) return false;
    if (state.mech.length && !state.mech.includes(d.mechanism)) return false;
    if (d.price < state.min || d.price > state.max) return false;
    if (avg(d) < state.score) return false;
    if (state.deal && d.price > d.fairPrice) return false;
    return true;
  });
}

export function bounds(list) {
  return list.reduce((acc, d) => {
    acc.min = Math.min(acc.min, d.price);
    acc.max = Math.max(acc.max, d.price);
    return acc;
  }, { min: Infinity, max: 0 });
}
