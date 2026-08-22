const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

const LINK = 110;

export function init(mode = "grid") {
  if (calm) return;
  const cv = document.getElementById("field");
  if (!cv) return;
  const ctx = cv.getContext("2d");

  let w, h, dpr, pts = [], trail = [], mx = -1e4, my = -1e4, raf = 0, t0 = performance.now();

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (mode === "grid") seed();
  }

  function seed() {
    const gap = coarse ? 64 : 44;
    pts = [];
    for (let px = gap / 2; px < w + gap; px += gap) {
      for (let py = gap / 2; py < h + gap; py += gap) {
        pts.push({ x: px, y: py, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.8 });
      }
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const t = (now - t0) / 1000;

    if (mode === "trail") {
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const k = i / trail.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + k * 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 53, ${(k * 0.4).toFixed(3)})`;
        ctx.fill();
      }
      if (mx > -1e4) {
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 212, 170, 0.8)";
        ctx.fill();
      }
      return;
    }

    for (const p of pts) {
      const py = p.y + Math.sin(t * p.sp + p.ph) * 2.4;
      ctx.beginPath();
      ctx.arc(p.x, py, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fill();

      const dx = p.x - mx;
      const dy = py - my;
      const d = Math.hypot(dx, dy);
      if (d < LINK) {
        const a = (1 - d / LINK) * 0.3;
        ctx.strokeStyle = `rgba(255, 107, 53, ${a.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, py);
        ctx.lineTo(mx, my);
        ctx.stroke();
      }
    }
  }

  function tick(now) {
    draw(now);
    raf = requestAnimationFrame(tick);
  }

  addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (mode === "trail") {
      trail.push({ x: e.clientX, y: e.clientY });
      if (trail.length > 8) trail.shift();
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  });

  addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    size();
    raf = requestAnimationFrame(tick);
  });

  size();
  raf = requestAnimationFrame(tick);
}
