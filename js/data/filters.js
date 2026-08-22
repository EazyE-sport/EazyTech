export const state = {
  brands: [],
  rate: 0,
  min: 0,
  max: Infinity,
  deal: false,
};

export function reset() {
  state.brands = [];
  state.rate = 0;
  state.min = 0;
  state.max = Infinity;
  state.deal = false;
}

export function apply(list) {
  return list.filter((d) => {
    if (state.brands.length && !state.brands.includes(d.brand)) return false;
    if (d.price < state.min || d.price > state.max) return false;
    if (d.rating < state.rate) return false;
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
