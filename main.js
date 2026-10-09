/* Look Back — tribute. Vanilla JS, no dependencies. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- i18n: Indonesian lives in the HTML, English loads on demand ----------
     Text blocks are matched by their (whitespace-normalised) Indonesian innerHTML,
     so the markup needs no per-element keys. Dynamic strings go through T(). */
  const I18N = (() => {
    let lang = "id", EN = null, REV = null, loading = null;
    const subs = [];
    const norm = s => s.replace(/\s+/g, " ").trim();
    const LATIN = /[A-Za-z]/;
    const SKIP = 'script,style,noscript,[lang="ja"],[data-no-i18n]';
    const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && LATIN.test(n.nodeValue));
    const collect = (root, out) => {
      for (const el of root.children) {
        if (el.matches(SKIP)) continue;
        if (ownText(el)) out.push(el); else collect(el, out);
      }
      return out;
    };
    const META = () => [document.querySelector('meta[name="description"]')];
    const apply = () => {
      for (const el of collect(document.body, [])) {
        const cur = norm(el.innerHTML);
        if (lang === "en") {
          const en = EN[cur];
          if (en) { el._id = cur; el.innerHTML = en; el._en = norm(el.innerHTML); }
        } else {
          const id = REV[cur] || (el._en === cur ? el._id : null);
          if (id) el.innerHTML = id;
        }
      }
      $$("[aria-label],[alt],[title]").forEach(el => {
        if (el.closest('[lang="ja"],[data-no-i18n]')) return;
        ["aria-label", "alt", "title"].forEach(a => {
          const v = el.getAttribute(a); if (!v) return;
          const r = (lang === "en" ? EN : REV)[norm(v)]; if (r) el.setAttribute(a, r);
        });
      });
      const title = (lang === "en" ? EN : REV)[norm(document.title)]; if (title) document.title = title;
      META().forEach(m => { const r = m && (lang === "en" ? EN : REV)[norm(m.content)]; if (r) m.content = r; });
      document.documentElement.lang = lang;
    };
    const fetchEN = () => loading || (loading = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = "i18n-en.js";
      s.onload = () => { EN = {}; REV = {}; for (const k in window.LB_EN) { EN[norm(k)] = window.LB_EN[k]; REV[norm(window.LB_EN[k])] = norm(k); } res(); };
      s.onerror = rej; document.head.appendChild(s);
    }));
    return {
      get lang() { return lang; },
      T(s, v) {
        let o = (lang === "en" && EN && EN[norm(s)]) || s;
        return v ? o.replace(/\{(\w+)\}/g, (_, k) => v[k]) : o;
      },
      on(fn) { subs.push(fn); },
      async set(l) {
        if (l === lang) return;
        if (l === "en") { try { await fetchEN(); } catch { return; } }
        lang = l; apply(); subs.forEach(fn => fn());
        try { localStorage.setItem("lb-lang", l); } catch {}
      },
    };
  })();
  const T = I18N.T;

  const svg = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------- procedural scene details ---------- */
  function buildField() {
    const tl = $("#treeline");
    for (let x = -20; x < 1640; x += rand(26, 48)) {
      const y = 470 + Math.sin(x / 140) * 6, r = rand(12, 24);
      svg("circle", { class: "tree", cx: x, cy: y - r * .6, r, stroke: "#1f2a22", "stroke-width": 1.6 }, tl);
    }
    const hf = $("#housesFar");
    [[300, 462], [356, 466], [1120, 458], [1190, 460], [1250, 464]].forEach(([x, y], i) => {
      svg("rect", { x, y: y - 16, width: 30, height: 16, fill: "#e9dcc0", stroke: "#1f2a22", "stroke-width": 1.4 }, hf);
      svg("path", { d: `M${x - 4} ${y - 16} L${x + 15} ${y - 30} L${x + 34} ${y - 16}Z`, fill: i % 2 ? "#4f5a64" : "#7b4a36", stroke: "#1f2a22", "stroke-width": 1.4 }, hf);
    });
    const pd = $("#paddies");
    const H0 = 482, H1 = 760, VX = 800;
    for (let k = 1; k <= 9; k++) {
      const t = (k / 9) ** 1.8, y = H0 + (H1 - H0) * t;
      svg("path", { d: `M0 ${y} H1600`, "stroke-width": .8 + t * 1.4, opacity: .45 }, pd);
    }
    for (let i = -14; i <= 14; i++) {
      if (Math.abs(i) < 2) continue;
      svg("path", { d: `M${VX + i * 20} ${H0} L${VX + i * 150} ${H1}`, "stroke-width": 1, opacity: .3 }, pd);
    }
    // rice tufts
    for (let n = 0; n < 90; n++) {
      const t = Math.random() ** .7, y = H0 + 8 + (H1 - H0 - 8) * t, side = Math.random() < .5 ? -1 : 1;
      const x = VX + side * (40 + t * 330 + rand(0, 700));
      const s = 2 + t * 9;
      svg("path", { d: `M${x} ${y} l${-s * .5} ${-s} M${x} ${y} l0 ${-s * 1.2} M${x} ${y} l${s * .5} ${-s}`, "stroke-width": .6 + t, opacity: .55 }, pd);
    }
    // utility poles along the road
    const pl = $("#poles");
    const ts = [.05, .14, .28, .5, .82];
    let prev = null;
    ts.forEach(t => {
      const x = 830 + t * 420, base = H0 + (H1 - H0) * t, h = 30 + t * 300, top = base - h, w = 1.2 + t * 6;
      svg("path", { d: `M${x} ${base} V${top}`, "stroke-width": w }, pl);
      svg("path", { d: `M${x - h * .12} ${top + h * .06} H${x + h * .12}`, "stroke-width": w * .7 }, pl);
      if (prev) {
        [-1, 1].forEach(s => {
          const x1 = prev.x + s * prev.h * .1, y1 = prev.top + prev.h * .06, x2 = x + s * h * .1, y2 = top + h * .06;
          svg("path", { d: `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 10 + t * 30} ${x2} ${y2}`, "stroke-width": .9, opacity: .8 }, pl);
        });
      }
      prev = { x, h, top };
    });
    const gf = $("#grassFront");
    for (let x = -10; x < 1620; x += rand(10, 26)) {
      const y = 760, s = rand(18, 44);
      svg("path", { d: `M${x} ${y} q${rand(-6, 2)} ${-s * .6} ${rand(-14, -4)} ${-s} M${x + 4} ${y} q2 ${-s * .5} ${rand(4, 14)} ${-s * .9}`, stroke: "#4d6b34", opacity: .9 }, gf);
    }
  }

  function buildClassroom() {
    const w = $("#kyoWindows");
    for (let c = 0; c < 6; c++) for (let r = 0; r < 3; r++) {
      const x = 196 + c * 52 + r * 0, y = 190 + r * 54 - c * 4;
      if (c === 3 && r === 2) continue;
      svg("path", { d: `M${x} ${y} l36 -2 l0 30 l-36 2Z M${x + 18} ${y - 1} v30 M${x} ${y + 15} l36 -2`, fill: r === 0 ? "url(#hatch2)" : "#f6f1e3" }, w);
    }
    const tr = $("#kyoTrees");
    [[70, 380, 1], [660, 360, .9], [740, 365, 1.15]].forEach(([x, y, s]) => {
      svg("path", { d: `M${x} ${y} v${-60 * s}`, "stroke-width": 2.4 }, tr);
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2), r = rand(10, 46) * s, cx = x + Math.cos(a) * r, cy = y - 90 * s + Math.sin(a) * r * .8;
        svg("path", { d: `M${cx - 8} ${cy} q8 -10 16 0`, fill: "none" }, tr);
      }
    });
    const gr = $("#kyoGrass");
    for (let x = 0; x < 800; x += rand(6, 14)) {
      const y = rand(395, 550);
      svg("path", { d: `M${x} ${y} l2 -7 M${x + 3} ${y} l3 -5`, opacity: .55 }, gr);
    }
  }

  function buildDoor() {
    const wb = $("#wallBoards");
    for (let x = 0; x <= 800; x += 40) svg("path", { d: `M${x} 0 V640` }, wb);
    const sb = $("#sketchbooks");
    const colors = ["#e8e0c8", "#cfdcb4", "#d6c7a2", "#bcd2dc", "#e3d1b2"];
    for (let s = 0; s < 4; s++) {
      let y = 470;
      const x = 230 + s * 56, n = 6 + s * 3;
      for (let i = 0; i < n; i++) {
        const h = rand(7, 10), off = rand(-3, 3);
        y -= h;
        svg("rect", { x: x + off, y, width: 46, height: h, fill: colors[(i + s) % colors.length] }, sb);
      }
    }
  }

  function buildVillage() {
    const g = $("#villageHouses");
    const houses = [[760, 530, 1, "a"], [880, 526, 1.15, "b"], [1030, 532, .9, "c"], [1160, 526, 1.25, "a"], [1420, 520, 1, "b"], [40, 540, .8, "c"]];
    houses.forEach(([x, y, s, k]) => {
      const W = 90 * s, H = 56 * s;
      svg("rect", { class: "house-wall", x, y: y - H, width: W, height: H, stroke: "#1f2a22", "stroke-width": 2 }, g);
      svg("path", { class: `house-roof ${k}`, d: `M${x - 12 * s} ${y - H} L${x + W / 2} ${y - H - 40 * s} L${x + W + 12 * s} ${y - H}Z`, stroke: "#1f2a22", "stroke-width": 2, "stroke-linejoin": "round" }, g);
      svg("path", { class: "snowy", d: `M${x - 12 * s} ${y - H} L${x + W / 2} ${y - H - 40 * s} L${x + W + 12 * s} ${y - H} L${x + W} ${y - H - 6 * s} L${x + W / 2} ${y - H - 32 * s} L${x} ${y - H - 6 * s}Z`, fill: "#fbfbf6", stroke: "#1f2a22", "stroke-width": 1.4 }, g);
      svg("rect", { x: x + W * .18, y: y - H * .7, width: W * .24, height: H * .32, fill: "#f6e7b8", stroke: "#1f2a22", "stroke-width": 1.6 }, g);
      svg("rect", { x: x + W * .58, y: y - H * .62, width: W * .22, height: H * .62, fill: "#8c6a4c", stroke: "#1f2a22", "stroke-width": 1.6 }, g);
    });
  }

  /* ---------- nav, progress, reveals ---------- */
  function initChrome() {
    const nav = $("#nav"), bar = $(".progress span");
    let lastY = scrollY, ticking = false;
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle("scrolled", y > 20);
      nav.classList.toggle("hide", y > innerHeight * .8 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove("hide");
      lastY = y; ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .12 });
    $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

    const links = $$(".nav-links a");
    const secIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["kamar", "tokoh", "jalan", "kelas", "pintu", "musim", "galeri", "fujimoto"].forEach(id => secIO.observe(document.getElementById(id)));

    const hero = $("#kamar");
    new IntersectionObserver(es => hero.classList.toggle("off", !es[0].isIntersecting)).observe(hero);
  }

  /* ---------- parallax (only visible scenes) ---------- */
  // Each parallax group gets its own <svg> so scrolling only moves composited layers
  // instead of repainting the whole scene every frame.
  function splitLayers() {
    $$(".scene-svg").forEach(base => {
      let ref = base;
      $$(":scope > .px", base).forEach(g => {
        const s = svg("svg", { class: "scene-svg layer", viewBox: base.getAttribute("viewBox"), preserveAspectRatio: base.getAttribute("preserveAspectRatio"), "aria-hidden": "true", "data-d": g.dataset.d });
        s.appendChild(g); ref.after(s); ref = s;
      });
    });
  }

  function initParallax() {
    if (reduce) return;
    const scenes = $$(".scene").map(el => ({ el, layers: $$(".layer", el).map(l => ({ l, d: +l.dataset.d })), on: false }));
    const io = new IntersectionObserver(es => es.forEach(e => {
      const s = scenes.find(s => s.el === e.target); if (s) s.on = e.isIntersecting;
    }));
    scenes.forEach(s => io.observe(s.el));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = innerHeight;
      scenes.forEach(s => {
        if (!s.on) return;
        const r = s.el.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        s.layers.forEach(({ l, d }) => { l.style.transform = `translate3d(0, ${(p * d * 90).toFixed(1)}px, 0)`; });
      });
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------- 01 hero: paint the room ---------- */
  function initPaint() {
    const art = $("#sheetArt"), cv = $("#paintCanvas"), ctx = cv.getContext("2d");
    const pencil = $("#pencil"), fill = $("#meterFill"), text = $("#meterText"), btn = $("#paintAll");
    const W = cv.width, H = cv.height, MW = 96, MH = Math.round(MW * H / W);
    const mask = document.createElement("canvas"); mask.width = MW; mask.height = MH;
    const m = mask.getContext("2d", { willReadFrequently: true });
    const img = new Image(); img.decoding = "async"; img.src = "assets/room-color.webp";
    let ready = false, dirty = false, done = false, last = null, coverage = 0, lastMeasure = 0, autoRunning = false;

    const render = () => {
      dirty = false;
      if (!ready) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.drawImage(mask, 0, 0, W, H);
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(img, 0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    };
    const requestRender = () => { if (!dirty) { dirty = true; requestAnimationFrame(render); } };

    const dab = (nx, ny, r = .09) => {
      const x = nx * MW, y = ny * MH, R = r * MW;
      const g = m.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, "rgba(0,0,0,.9)"); g.addColorStop(.6, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)");
      m.fillStyle = g; m.beginPath(); m.arc(x, y, R, 0, Math.PI * 2); m.fill();
    };
    const stroke = (nx, ny, r) => {
      if (last) {
        const dx = nx - last.x, dy = ny - last.y, steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / .02));
        for (let i = 1; i <= steps; i++) dab(last.x + dx * i / steps, last.y + dy * i / steps, r);
      } else dab(nx, ny, r);
      last = { x: nx, y: ny };
      requestRender(); measure();
    };
    // remember the last message so a language switch can re-render it
    let msg = ["Gerakkan kursor di atas sketsa untuk mewarnai"], lbl = "Warnai kamarnya";
    const say = (k, v) => { msg = [k, v]; text.textContent = T(k, v); };
    const label = k => { lbl = k; btn.textContent = T(k); };
    I18N.on(() => { text.textContent = T(...msg); btn.textContent = T(lbl); });
    const measure = (force) => {
      const now = performance.now();
      if (!force && now - lastMeasure < 250) return;
      lastMeasure = now;
      const d = m.getImageData(0, 0, MW, MH).data;
      let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i] > 150 ? 1 : d[i] / 150;
      coverage = s / (MW * MH);
      fill.style.transform = `scaleX(${Math.min(1, coverage / .8)})`;
      if (!done && !autoRunning) coverage < .05 ? say("Gerakkan kursor di atas sketsa untuk mewarnai") : say("Mewarnai… {n}%", { n: Math.round(Math.min(1, coverage / .8) * 100) });
      if (!done && coverage > .8) finish();
    };
    const finish = () => {
      done = true;
      let a = 0;
      const step = () => {
        a += .06; m.fillStyle = `rgba(0,0,0,${Math.min(a, 1) * .35})`; m.fillRect(0, 0, MW, MH); requestRender();
        if (a < 1) requestAnimationFrame(step); else { m.fillStyle = "#000"; m.fillRect(0, 0, MW, MH); requestRender(); }
      };
      step();
      fill.style.transform = "scaleX(1)";
      say(document.body.dataset.time === "night" ? "Malam. Fujino masih menggambar." : "Kamar Fujino sudah berwarna. Sekarang, masuk ke desa ↓");
      label("Kembalikan ke sketsa");
    };
    const reset = () => {
      done = false; m.clearRect(0, 0, MW, MH); requestRender(); measure(true);
      label("Warnai kamarnya");
    };

    // animated brush along a path (intro + "paint all")
    const autoPaint = (pts, dur, r, then) => {
      if (reduce) { pts.forEach(([x, y]) => dab(x, y, r)); requestRender(); measure(true); then && then(); return; }
      autoRunning = true; art.classList.add("auto"); last = null;
      const t0 = performance.now(), n = pts.length - 1;
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur), f = t * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
        const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
        stroke(x, y, r); movePencil(x, y);
        if (t < 1) requestAnimationFrame(tick);
        else { autoRunning = false; last = null; art.classList.remove("auto"); measure(true); then && then(); }
      };
      requestAnimationFrame(tick);
    };
    const zigzag = (y0, y1, rows) => {
      const p = [];
      for (let i = 0; i <= rows; i++) { const y = y0 + (y1 - y0) * i / rows; p.push(i % 2 ? [.95, y] : [.05, y]); }
      return p;
    };
    const movePencil = (nx, ny) => {
      const r = art.getBoundingClientRect();
      pencil.style.transform = `translate3d(${nx * r.width}px, ${ny * r.height}px, 0)`;
    };

    art.addEventListener("pointermove", e => {
      if (autoRunning) return;
      const r = art.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      movePencil(nx, ny);
      if (!done && ready) stroke(nx, ny, e.pointerType === "touch" ? .12 : .085);
    });
    art.addEventListener("pointerdown", e => {
      if (autoRunning || done || !ready) return;
      const r = art.getBoundingClientRect();
      last = null; stroke((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, .14);
    });
    art.addEventListener("pointerleave", () => { last = null; });

    btn.addEventListener("click", () => {
      if (autoRunning) return;
      if (done) return reset();
      autoPaint(zigzag(.02, .98, 9), 1400, .16, () => { if (!done) finish(); });
    });

    img.onload = () => {
      ready = true;
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return; io.disconnect();
        setTimeout(() => autoPaint([[.18, .35], [.5, .28], [.78, .4], [.4, .55], [.65, .62], [.35, .72]], 1800, .11), 900);
      }, { threshold: .4 });
      io.observe(art);
    };

    return { finish: () => { if (!done) autoPaint(zigzag(.02, .98, 9), 1400, .16, () => { if (!done) finish(); }); else say("Malam. Fujino masih menggambar."); } };
  }

  /* ---------- 02 characters: official art revealed like a speed-drawing time-lapse ---------- */
  function initTimelapse(panels) {
    const ART = {
      "panel-fujino": { name: "Fujino", seed: [2, 47, 13] },
      "panel-kyomoto": { name: "Kyomoto", seed: [3, 12, 40] },
      "panel-duo": { name: "Fujino & Kyomoto", seed: [5, 31, 8] },
    };
    const CREDIT = {
      film: "Film · © Tatsuki Fujimoto/Shueisha · © Look Back Film Partners",
      manga: "Manga · © Tatsuki Fujimoto/Shueisha (Jump Comics+)",
    };
    const cache = {};
    const load = src => cache[src] || (cache[src] = new Promise((res, rej) => {
      const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src;
    }));
    const srcs = (panel, mode) => {
      const k = panel.id.replace("panel-", "");
      return [`assets/${mode}-${k}-sketch.webp`, `assets/${mode}-${k}.webp`];
    };
    // fetch the film art shortly before the section is reached
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      panels.forEach(p => srcs(p, "film").forEach(load));
    }, { rootMargin: "600px 0px" }).observe($("#tokoh"));

    const MW = 60, MH = 72;
    const state = new Map();
    I18N.on(() => state.forEach(s => { if (s.creditMode) s.credit.textContent = T(CREDIT[s.creditMode]); }));
    panels.forEach(panel => {
      const sheet = $(".char-sheet", panel);
      const wrap = document.createElement("div");
      wrap.className = "tl"; wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML = '<canvas class="tl-s"></canvas><canvas class="tl-c"></canvas>' +
        '<div class="tl-hud"><span class="tl-rec">REC</span><span class="tl-time">00:00:00</span><span class="tl-speed">×600</span></div>';
      const chips = document.createElement("div");
      chips.className = "mode-chips"; chips.setAttribute("role", "group"); chips.setAttribute("aria-label", "Versi gambar");
      chips.innerHTML = ["svg:Ilustrasi", "film:Film", "manga:Manga"].map(s => {
        const [m, l] = s.split(":"); return `<button type="button" data-m="${m}" aria-pressed="${m === "svg"}">${l}</button>`;
      }).join("");
      const credit = document.createElement("p"); credit.className = "tl-credit";
      const live = document.createElement("span"); live.className = "sr-only"; live.setAttribute("aria-live", "polite");
      sheet.append(wrap, chips, credit, live);
      const s = {
        sheet, wrap, chips, credit, live, token: 0, timer: 0, mode: "svg",
        cs: $(".tl-s", wrap), cc: $(".tl-c", wrap), time: $(".tl-time", wrap),
        mS: Object.assign(document.createElement("canvas"), { width: MW, height: MH }),
        mC: Object.assign(document.createElement("canvas"), { width: MW, height: MH }),
      };
      state.set(panel, s);
      chips.addEventListener("click", e => {
        const b = e.target.closest("button"); if (b) api.show(panel, b.dataset.m);
      });
    });

    const fit = (img, W, H, mode) => {
      if (mode === "film") { const k = Math.max(W / img.width, H / img.height); return [(W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k]; }
      const k = Math.min(W * .8 / img.width, H * .74 / img.height);
      return [(W - img.width * k) / 2, (H - img.height * k) / 2 + H * .03, img.width * k, img.height * k];
    };
    const layer = (cv, mask, img, r) => {
      const c = cv.getContext("2d"), W = cv.width, H = cv.height;
      c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H);
      c.drawImage(mask, 0, 0, W, H);
      c.globalCompositeOperation = "source-in"; c.drawImage(img, ...r);
      c.globalCompositeOperation = "source-over";
    };
    const dab = (m, x, y, r) => {
      const g = m.getContext("2d"), X = x * MW, Y = y * MH, R = r * MW;
      const grad = g.createRadialGradient(X, Y, 0, X, Y, R);
      grad.addColorStop(0, "rgba(0,0,0,1)"); grad.addColorStop(.55, "rgba(0,0,0,.6)"); grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad; g.beginPath(); g.arc(X, Y, R, 0, 6.29); g.fill();
    };
    const line = (m, x0, y0, x1, y1, r) => {
      const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .015));
      for (let i = 0; i <= n; i++) dab(m, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, r);
    };
    const fillMask = m => { const g = m.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, MW, MH); };
    const clock = (s, seed, t) => {
      const total = (seed[0] * 3600 + seed[1] * 60 + seed[2]) * t;
      const h = total / 3600 | 0, mi = (total % 3600) / 60 | 0, se = total % 60 | 0;
      s.time.textContent = [h, mi, se].map(v => String(v).padStart(2, "0")).join(":");
    };

    async function run(panel, mode) {
      const s = state.get(panel), my = ++s.token, art = ART[panel.id];
      let sketch, color;
      try { [sketch, color] = await Promise.all(srcs(panel, mode).map(load)); } catch { return; }
      if (my !== s.token) return;
      const rect = s.sheet.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
      [s.cs, s.cc].forEach(c => { c.width = W; c.height = H; });
      [s.mS, s.mC].forEach(m => m.getContext("2d").clearRect(0, 0, MW, MH));
      const r = fit(color, W, H, mode);
      const nx = r[0] / W, ny = r[1] / H, nw = r[2] / W, nh = r[3] / H; // image box, normalized
      s.sheet.classList.add("real"); s.sheet.dataset.mode = mode;
      s.wrap.classList.toggle("manga", mode === "manga");
      s.credit.textContent = T(CREDIT[mode]); s.creditMode = mode;
      s.live.textContent = T("Gambar resmi {name}, versi {mode}.", { name: art.name, mode });
      const frame = () => layer(s.cs, s.mS, sketch, r);
      const paint = () => layer(s.cc, s.mC, color, r);

      if (reduce) { fillMask(s.mS); fillMask(s.mC); frame(); paint(); clock(s, art.seed, 1); s.wrap.classList.add("done"); return; }
      s.wrap.classList.remove("done"); s.wrap.classList.add("rec");
      const T1 = 1500, T2 = 1500, N = 54;
      let drawn = 0, prev = null;
      const rows = 7, zig = [];
      for (let i = 0; i <= rows; i++) zig.push([i % 2 ? nx + nw * .98 : nx + nw * .02, ny + nh * (i / rows)]);
      const t0 = performance.now();
      const tick = now => {
        if (my !== s.token) return;
        const t = now - t0;
        if (t < T1) {
          // pencil phase: quick scribbles, roughly top to bottom
          const want = Math.floor(t / T1 * N);
          while (drawn < want) {
            const p = drawn / N, x = nx + nw * Math.random(), y = ny + nh * Math.min(1, Math.random() * .45 + p * .7);
            const a = (Math.random() < .7 ? -.8 : .6) + rand(-.3, .3), len = rand(.12, .3);
            line(s.mS, x, y, x + Math.cos(a) * len * nw, y + Math.sin(a) * len * nh, .045);
            drawn++;
          }
          frame();
        } else if (t < T1 + T2) {
          if (drawn !== -1) { fillMask(s.mS); frame(); drawn = -1; }
          // brush phase: wide zigzag strokes lay the colour (or ink) down
          const f = (t - T1) / T2 * (zig.length - 1), i = Math.min(zig.length - 2, f | 0), k = f - i;
          const x = zig[i][0] + (zig[i + 1][0] - zig[i][0]) * k, y = zig[i][1] + (zig[i + 1][1] - zig[i][1]) * k;
          if (prev) line(s.mC, prev[0], prev[1], x, y, .2); prev = [x, y];
          paint();
        } else {
          fillMask(s.mC); paint(); clock(s, art.seed, 1);
          s.wrap.classList.remove("rec"); s.wrap.classList.add("done");
          return;
        }
        clock(s, art.seed, t / (T1 + T2));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    const api = {
      onSvg: null,
      reset(panel) {
        const s = state.get(panel); s.token++; clearTimeout(s.timer);
        s.sheet.classList.remove("real"); s.wrap.classList.remove("rec", "done");
        [s.cs, s.cc].forEach(c => c.getContext("2d").clearRect(0, 0, c.width, c.height));
        s.credit.textContent = ""; s.creditMode = null; api.press(s, "svg");
      },
      after(panel, ms, mode) {
        const s = state.get(panel), my = s.token;
        s.timer = setTimeout(() => { if (my === s.token) api.show(panel, mode); }, ms);
      },
      press(s, mode) { s.mode = mode; $$("button", s.chips).forEach(b => b.setAttribute("aria-pressed", b.dataset.m === mode)); },
      show(panel, mode) {
        const s = state.get(panel);
        if (mode === "svg") { api.reset(panel); api.onSvg && api.onSvg(panel); return; }
        clearTimeout(s.timer); api.press(s, mode); run(panel, mode);
      },
    };
    return api;
  }

  /* ---------- 02 characters: tabbed design sheets ---------- */
  function initCharacters() {
    const tabs = $$(".char-tab"), panels = tabs.map(t => document.getElementById(t.getAttribute("aria-controls")));
    // duo sheet reuses both portraits (ids stripped so highlights stay unique)
    const duo = $("#duoArt");
    ["#panel-fujino .char-art", "#panel-kyomoto .char-art"].forEach(sel => {
      const c = $(sel).cloneNode(true);
      c.removeAttribute("role"); c.removeAttribute("aria-label");
      $$("[id]", c).forEach(n => n.removeAttribute("id"));
      duo.appendChild(c);
    });
    $$(".char-art path, .char-art ellipse, .char-art circle").forEach(n => n.setAttribute("pathLength", 1));

    const tl = initTimelapse(panels);
    const drawSvg = (panel) => {
      const sheet = $(".char-sheet", panel); sheet.classList.remove("annos-on");
      $$(".char-art", panel).forEach(a => { a.classList.remove("drawing"); if (!reduce) { void a.getBoundingClientRect(); a.classList.add("drawing"); } });
      return setTimeout(() => sheet.classList.add("annos-on"), reduce ? 0 : 1100);
    };
    // tab opened: SVG line drawing first, then the official art "time-lapses" in over it
    const play = (panel) => {
      panel.classList.remove("on");
      requestAnimationFrame(() => panel.classList.add("on"));
      tl.reset(panel); drawSvg(panel);
      tl.after(panel, reduce ? 300 : 1900, "film");
    };
    tl.onSvg = drawSvg;
    const select = (i, focus) => {
      tabs.forEach((t, j) => { const on = i === j; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
      if (focus) tabs[i].focus();
      play(panels[i]);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
      });
    });

    // annotation -> highlight the matching body part
    $$(".anno").forEach(a => {
      const parts = a.dataset.hl.split(" ").map(id => document.getElementById(id));
      const on = v => parts.forEach(p => p && p.classList.toggle("hl", v));
      a.addEventListener("pointerenter", () => on(true)); a.addEventListener("pointerleave", () => on(false));
      a.addEventListener("focus", () => on(true)); a.addEventListener("blur", () => on(false));
      a.addEventListener("click", () => { on(true); setTimeout(() => on(false), 1200); });
    });

    // first reveal: draw Fujino when the section scrolls into view
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); play(panels[0]); } }, { threshold: .35 });
    io.observe($("#tokoh"));
  }

  /* ---------- 07 gallery: film strip + lightbox + lazy trailer ---------- */
  function initGallery() {
    const SCENES = [
      ["kamar", 255, "Kamar Fujino", "Key visual: punggung yang membungkuk di atas meja, malam demi malam."],
      ["kelas-gambar", 604, "Menggambar di sela pelajaran", "Fujino mencuri setiap menit di kelas untuk terus berlatih."],
      ["koran", 575, "Koran kelas", "Halaman kecil tempat semuanya bermula."],
      ["bintang", 535, "Bintang kecil kelas empat", "Senyum puas setelah dipuji satu kelas."],
      ["latihan", 870, "Latihan tanpa henti", "Buku panduan, sketsa, dan tekad untuk tidak kalah."],
      ["empat-panel", 800, "Selembar empat panel", "Kertas kecil yang akan menyelinap lewat celah pintu."],
      ["sensei", 300, "“Fujino-sensei!”", "Kyomoto akhirnya keluar dari balik pintunya."],
      ["pulang", 300, "Berlari tanpa menoleh", "Randoseru merah, langit musim panas Akita."],
      ["meja", 300, "Satu meja, dua pensil", "Key visual: Fujino dan Kyomoto menggarap naskah bersama."],
      ["salju", 720, "Salju di kota", "Berdesakan di bawah salju, pipi merah, mimpi yang sama."],
      ["kereta", 720, "Kereta senja", "Perjalanan pulang, langit Akita berwarna merah muda."],
    ];
    const list = $("#frames"), strip = $("#strip");
    SCENES.forEach(([k, w, title], i) => {
      const li = document.createElement("li");
      li.innerHTML = `<button class="frame" type="button" data-i="${i}" aria-label="${T("Adegan {n}: {title}", { n: i + 1, title: T(title).replace(/[“”"]/g, "") })}">` +
        `<img src="assets/gallery/${k}-t.webp" width="${w}" height="360" alt="" loading="lazy" decoding="async">` +
        `<span class="frame-no">${String(i + 1).padStart(2, "0")}</span><span class="frame-cap">${title}</span></button>`;
      list.appendChild(li);
    });

    // drag to scroll (mouse); touch uses native scrolling
    let d = null, moved = false;
    strip.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; d = { x: e.clientX, sl: strip.scrollLeft }; moved = false; });
    addEventListener("pointermove", e => {
      if (!d) return; const dx = e.clientX - d.x;
      if (Math.abs(dx) > 5) { moved = true; strip.classList.add("dragging"); }
      strip.scrollLeft = d.sl - dx;
    });
    addEventListener("pointerup", () => { if (d) { d = null; setTimeout(() => strip.classList.remove("dragging"), 0); } });
    strip.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = strip.scrollWidth - strip.clientWidth, sl = strip.scrollLeft;
      if ((e.deltaY > 0 && sl < max - 1) || (e.deltaY < 0 && sl > 0)) { e.preventDefault(); strip.scrollLeft += e.deltaY; }
    }, { passive: false });

    // lightbox
    const dlg = $("#lightbox"), img = $("#lbImg"), no = $("#lbNo"), ttl = $("#lbTitle"), desc = $("#lbDesc");
    let cur = 0, opener = null;
    const src = i => `assets/gallery/${SCENES[i][0]}.webp`;
    const show = i => {
      cur = (i + SCENES.length) % SCENES.length;
      const [, , title, text] = SCENES[cur];
      img.src = src(cur); img.alt = `${T(title)}. ${T(text)}`;
      no.textContent = `${String(cur + 1).padStart(2, "0")} / ${SCENES.length}`; ttl.textContent = T(title); desc.textContent = T(text);
      if (!reduce) { img.classList.remove("flick"); void img.offsetWidth; img.classList.add("flick"); }
      [cur + 1, cur - 1].forEach(j => { const p = new Image(); p.src = src((j + SCENES.length) % SCENES.length); });
    };
    I18N.on(() => {
      $$(".frame", list).forEach(b => { const i = +b.dataset.i; b.setAttribute("aria-label", T("Adegan {n}: {title}", { n: i + 1, title: T(SCENES[i][2]).replace(/[“”"]/g, "") })); });
      if (dlg.open) show(cur);
    });
    list.addEventListener("click", e => {
      const b = e.target.closest(".frame"); if (!b || moved) return;
      opener = b; show(+b.dataset.i); dlg.showModal();
    });
    $("#lbPrev").addEventListener("click", () => show(cur - 1));
    $("#lbNext").addEventListener("click", () => show(cur + 1));
    $("#lbClose").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1); }
    });
    dlg.addEventListener("close", () => opener && opener.focus());
    let sx = null;
    dlg.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") sx = e.clientX; });
    dlg.addEventListener("pointerup", e => {
      if (sx === null) return; const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });

    // trailer: the YouTube iframe is only created on click
    const tr = $("#trailer");
    tr.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${tr.dataset.yt}?autoplay=1&rel=0`;
      f.title = "Trailer resmi Look Back"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      // an iframe can't live inside a <button>; swap the poster for a plain box
      const box = document.createElement("div"); box.className = "trailer playing"; box.id = "trailer";
      box.appendChild(f); tr.replaceWith(box); f.focus();
    }, { once: true });
  }

  /* ---------- particles (rain + seasons), paused offscreen ---------- */
  function Particles(canvas, host) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, mode = null, parts = [], visible = false, raf = 0, last = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      // particles are soft shapes; 1x resolution keeps full-screen canvases cheap
      canvas.width = Math.round(w); canvas.height = Math.round(h);
    };
    const count = () => {
      const base = Math.min(1, (w * h) / (1400 * 700));
      return Math.round(({ rain: 260, spring: 70, summer: 46, autumn: 54, winter: 160 })[mode] * base) + 10;
    };
    const spawn = (init) => {
      const p = { x: rand(-50, w + 50), y: init ? rand(-h, h) : rand(-60, -10), s: rand(.6, 1.4), a: rand(0, 6.28), v: rand(.5, 1.5), life: rand(0, 6.28) };
      if (mode === "summer") { p.y = rand(h * .45, h); p.x = rand(0, w); }
      return p;
    };
    const fill = () => { parts = []; const n = count(); for (let i = 0; i < n; i++) parts.push(spawn(true)); };
    const draw = (now) => {
      raf = 0;
      const dt = Math.min(50, now - (last || now)) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      if (mode === "rain") { drawRain(dt); return loop(); }
      if (mode === "winter") { drawSnow(dt); return loop(); }
      for (const p of parts) {
        switch (mode) {
          case "spring": case "autumn": {
            p.a += .02 * dt * p.v; p.y += (mode === "spring" ? .9 : 1.3) * dt * p.s; p.x += Math.sin(p.a) * 1.1 * dt + .4 * dt;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a * 2);
            ctx.fillStyle = mode === "spring" ? "#f6c2cf" : (p.v > 1 ? "#e0793a" : "#d4a23a");
            ctx.strokeStyle = "rgba(31,42,34,.45)"; ctx.lineWidth = .8;
            ctx.beginPath();
            if (mode === "spring") ctx.ellipse(0, 0, 5 * p.s, 3 * p.s, 0, 0, 6.28);
            else { ctx.moveTo(0, -7 * p.s); ctx.quadraticCurveTo(6 * p.s, 0, 0, 7 * p.s); ctx.quadraticCurveTo(-6 * p.s, 0, 0, -7 * p.s); }
            ctx.fill(); ctx.stroke(); ctx.restore();
            if (p.y > h + 20 || p.x > w + 40) Object.assign(p, spawn(false));
            break;
          }
          case "summer": {
            p.life += .03 * dt * p.v; p.x += Math.cos(p.life) * .5 * dt; p.y += Math.sin(p.life * .7) * .4 * dt;
            const g = (Math.sin(p.life * 2) + 1) / 2;
            ctx.fillStyle = `rgba(255,236,140,${.25 + g * .65})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 + g * 2 * p.s, 0, 6.28); ctx.fill();
            break;
          }
        }
      }
      loop();
    };
    // rain: every drop in one path, every splash in another -> 2 strokes per frame
    const drawRain = (dt) => {
      const drops = new Path2D(), splash = new Path2D();
      for (const p of parts) {
        p.x -= 2.2 * dt * p.s; p.y += 16 * dt * p.s;
        drops.moveTo(p.x, p.y); drops.lineTo(p.x + 3 * p.s, p.y - 18 * p.s);
        if (p.y > h * (.75 + p.v * .15)) {
          splash.moveTo(p.x + 5 * p.s, p.y); splash.ellipse(p.x, p.y, 5 * p.s, 1.6 * p.s, 0, 0, Math.PI, true);
          Object.assign(p, spawn(false));
        }
      }
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(232,242,246,.6)"; ctx.stroke(drops);
      ctx.strokeStyle = "rgba(232,242,246,.5)"; ctx.stroke(splash);
    };
    const drawSnow = (dt) => {
      const flakes = new Path2D();
      for (const p of parts) {
        p.a += .015 * dt; p.y += .8 * dt * p.s; p.x += Math.sin(p.a) * .5 * dt;
        const r = 1.4 + p.s * 1.8;
        flakes.moveTo(p.x + r, p.y); flakes.arc(p.x, p.y, r, 0, 6.28);
        if (p.y > h + 10) Object.assign(p, spawn(false));
      }
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fill(flakes);
      ctx.lineWidth = .6; ctx.strokeStyle = "rgba(31,42,34,.25)"; ctx.stroke(flakes);
    };
    const loop = () => { if (visible && mode && !raf) raf = requestAnimationFrame(draw); };
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { last = 0; loop(); } }).observe(host);
    addEventListener("resize", () => { resize(); if (mode) fill(); });
    resize();
    return {
      set(m) {
        mode = reduce ? null : m;
        if (!mode) { ctx.clearRect(0, 0, w, h); parts = []; return; }
        resize(); fill(); loop();
      }
    };
  }

  /* ---------- 02 rain ---------- */
  function initRain() {
    const band = $("#jalan"), btn = $("#rainToggle"), note = $("#rainNote");
    const fx = Particles($("#rainCanvas"), $("#fieldScene"));
    const render = () => {
      const on = band.dataset.rain === "on";
      btn.lastChild.textContent = " " + T(on ? "Hentikan hujan" : "Turunkan hujan");
      note.textContent = T(on ? "“Kyomoto bilang dia penggemarku…!”" : "“Langit cerah. Seperti biasa.”");
    };
    I18N.on(render);
    btn.addEventListener("click", () => {
      const on = band.dataset.rain !== "on";
      band.dataset.rain = on ? "on" : "off";
      btn.setAttribute("aria-pressed", on);
      render();
      fx.set(on ? "rain" : null);
      $(".hint", band)?.remove();
    });
  }

  /* ---------- 03 compare ---------- */
  function initCompare() {
    const box = $("#compare"), range = $("#compareRange");
    const set = v => box.style.setProperty("--pos", `${v}%`);
    range.addEventListener("input", () => set(range.value));
    // gentle hint sweep the first time it's seen
    if (reduce) return;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const tick = now => {
        const t = (now - t0) / 1600; if (t > 1 || range.dataset.touched) return set(range.value);
        const v = 50 + Math.sin(t * Math.PI * 2) * 22; set(v.toFixed(1)); requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 500);
    }, { threshold: .6 });
    io.observe(box);
    range.addEventListener("pointerdown", () => { range.dataset.touched = 1; });
  }

  /* ---------- 04 door ---------- */
  function initDoor() {
    const stage = $("#doorStage"), slip = $("#slip"), btn = $("#slipBtn"), result = $("#doorResult");
    let drag = null;
    const zoneHit = (cx, cy) => cx > .26 && cx < .74 && cy > .64 && cy < .92;
    const center = () => {
      const s = stage.getBoundingClientRect(), r = slip.getBoundingClientRect();
      return [(r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height];
    };
    const succeed = () => {
      if (stage.dataset.state !== "closed") return;
      stage.dataset.state = "sliding"; stage.classList.remove("near");
      const s = stage.getBoundingClientRect(), r = slip.getBoundingClientRect();
      slip.style.left = `${(s.width * .5 - r.width / 2)}px`;
      slip.style.top = `${s.height * .80 - r.height / 2}px`;
      slip.style.transform = "rotate(0deg)";
      setTimeout(() => {
        slip.classList.add("under");
        slip.style.transform = `translateY(${r.height * .45}px) scaleY(.05)`;
      }, 320);
      setTimeout(() => {
        stage.dataset.state = "open"; result.hidden = false; btn.hidden = true; slip.hidden = true;
      }, 1300);
    };
    slip.addEventListener("pointerdown", e => {
      if (stage.dataset.state !== "closed") return;
      e.preventDefault(); slip.setPointerCapture(e.pointerId);
      const s = stage.getBoundingClientRect(), r = slip.getBoundingClientRect();
      drag = { ox: e.clientX - r.left, oy: e.clientY - r.top, s };
      slip.classList.add("dragging");
    });
    slip.addEventListener("pointermove", e => {
      if (!drag) return;
      const { s } = drag;
      slip.style.left = `${e.clientX - s.left - drag.ox}px`;
      slip.style.top = `${e.clientY - s.top - drag.oy}px`;
      const [cx, cy] = center(); stage.classList.toggle("near", zoneHit(cx, cy));
    });
    const end = () => {
      if (!drag) return; drag = null; slip.classList.remove("dragging");
      const [cx, cy] = center();
      if (zoneHit(cx, cy)) succeed(); else stage.classList.remove("near");
    };
    slip.addEventListener("pointerup", end); slip.addEventListener("pointercancel", end);
    slip.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); succeed(); } });
    btn.addEventListener("click", succeed);
  }

  /* ---------- 05 seasons ---------- */
  function initSeasons() {
    const band = $("#musim"), txt = $("#seasonText"), count = $("#bookCount"), stack = $("#bookStack");
    const fx = Particles($("#seasonCanvas"), $("#villageScene"));
    const data = {
      spring: { t: "Musim semi. Dua meja dirapatkan di kamar Kyomoto. Fujino menggambar tokohnya, Kyomoto menggambar latarnya.", n: 4 },
      summer: { t: "Musim panas. Suara jangkrik, es krim dari minimarket, dan naskah one-shot pertama yang dikirim ke penerbit.", n: 11 },
      autumn: { t: "Musim gugur. Kabar menang lomba, lalu perjalanan pertama ke kota besar, bergandengan tangan di tengah keramaian.", n: 19 },
      winter: { t: "Musim dingin di Akita. Salju setinggi lutut, tapi pensil tidak berhenti. Tahun demi tahun, buku sketsa terus menumpuk.", n: 30 },
    };
    let cur = 4, cur$ = "spring";
    I18N.on(() => { txt.textContent = T(data[cur$].t); });
    const countTo = (to) => {
      const from = cur, t0 = performance.now(); cur = to;
      const tick = now => { const t = Math.min(1, (now - t0) / 700); count.textContent = Math.round(from + (to - from) * t); if (t < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      stack.replaceChildren();
      const n = Math.ceil(to / 2.5);
      for (let i = 0; i < n; i++) svg("rect", { x: 82 + rand(-3, 3), y: 34 - i * 5, width: 46, height: 5, fill: ["#e8e0c8", "#cfdcb4", "#bcd2dc", "#e3d1b2"][i % 4], stroke: "#1f2a22", "stroke-width": 1 }, stack);
    };
    const set = (s, first) => {
      band.dataset.season = s;
      $$(".season-btn", band).forEach(b => { const on = b.dataset.s === s; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      cur$ = s;
      if (first) txt.textContent = T(data[s].t);
      else { txt.classList.add("swap"); setTimeout(() => { txt.textContent = T(data[cur$].t); txt.classList.remove("swap"); }, 250); }
      countTo(data[s].n); fx.set(s);
    };
    const btns = $$(".season-btn", band);
    btns.forEach((b, i) => {
      b.addEventListener("click", () => set(b.dataset.s));
      b.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        const nb = btns[(i + d + btns.length) % btns.length]; nb.focus(); set(nb.dataset.s);
      });
    });
    set("spring", true);
  }

  /* ---------- spoiler, works drag, look back ---------- */
  function initMisc(paint) {
    const sp = $("#spoiler"), sb = $("#spoilerBtn");
    sb.addEventListener("click", () => { sp.dataset.open = "true"; sb.setAttribute("aria-expanded", "true"); });

    const works = $("#works");
    let d = null;
    works.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; d = { x: e.clientX, sl: works.scrollLeft, moved: false }; });
    addEventListener("pointermove", e => {
      if (!d) return; const dx = e.clientX - d.x;
      if (Math.abs(dx) > 4) { d.moved = true; works.classList.add("dragging"); }
      works.scrollLeft = d.sl - dx;
    });
    addEventListener("pointerup", () => { if (d) { d = null; works.classList.remove("dragging"); } });

    $("#lookBack").addEventListener("click", () => {
      document.body.dataset.time = "night";
      document.querySelector('meta[name="theme-color"]').content = "#e9e3d2";
      scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      setTimeout(paint.finish, reduce ? 0 : 900);
    });
  }

  buildField(); buildClassroom(); buildDoor(); buildVillage(); splitLayers();
  initChrome(); initParallax();
  const paint = initPaint();
  // language toggle (preference persists); English dictionary loads on first use
  const langBtn = $("#langToggle");
  const syncLang = () => langBtn.setAttribute("aria-pressed", I18N.lang === "en");
  I18N.on(syncLang);
  langBtn.addEventListener("click", () => I18N.set(I18N.lang === "en" ? "id" : "en"));
  initCharacters(); initGallery(); initRain(); initCompare(); initDoor(); initSeasons(); initMisc(paint);
  try { if (localStorage.getItem("lb-lang") === "en") I18N.set("en"); } catch {}
})();
