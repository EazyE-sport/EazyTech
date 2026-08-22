const el = document.createElement("div");
el.className = "toast";
document.body.append(el);
let t;

export function toast(msg) {
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(t);
  t = setTimeout(() => el.classList.remove("show"), 2400);
}
