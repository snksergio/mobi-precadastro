/* iGreen MOB · pré-cadastro (pre-cadastro.html) — convite para a live de lançamento.
   Menu em cápsula, aparições leves, foto que troca com a rolagem, formulário demonstrativo (nada é enviado),
   convite do licenciado (?ref=CÓDIGO), agenda (.ics), barra do celular. Sem bibliotecas. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => window.matchMedia("(max-width: 960px)").matches;

  /* ---------- menu: cápsula ao rolar, item ativo; no celular some ao descer e volta ao subir ---------- */
  const hdr = $("#hdr");
  const navLinks = $$(".hdr__nav a");
  const measureHdr = () => {
    const inner = $(".hdr__in", hdr), w = hdr.clientWidth;
    const capW = mobile() ? w : Math.min(1100, w - 24);
    hdr.style.setProperty("--capW", capW + "px");
    hdr.style.setProperty("--pull", Math.max(0, (inner.getBoundingClientRect().width - capW) / 2 + 18) + "px");
  };
  let lastY = window.scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, dy = y - lastY;
    lastY = y;
    hdr.classList.toggle("is-compact", y > 40);
    // celular: o menu fica só no topo; depois some de vez (a barra de baixo com "Quero participar" cumpre o papel)
    hdr.classList.toggle("is-hidden", mobile() && y > 160);
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", measureHdr);
  measureHdr();
  onScroll();
  if ("IntersectionObserver" in window) {
    const secs = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const seen = new Map();
    const nio = new IntersectionObserver((es) => {
      es.forEach((e) => seen.set(e.target, e.isIntersecting));
      const on = secs.findIndex((s) => seen.get(s));
      navLinks.forEach((a, i) => a.classList.toggle("is-on", i === on));
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach((s) => nio.observe(s));
  }

  /* ---------- aparições: abertura em sequência (o título palavra por palavra); o resto ao rolar ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--i", i++);
            w.textContent = p;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    if (!reduce) walk(el);
  });
  const ins = $$("[data-in]");
  requestAnimationFrame(() => requestAnimationFrame(() => ins.forEach((el) => el.classList.add("is-in"))));
  const revealAll = () => $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
  if (!("IntersectionObserver" in window) || reduce) revealAll();
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach((el) => io.observe(el));
  }

  /* ---------- faixa em curva (reta no celular): o texto se repete o bastante e anda sem emenda; com o mouse em cima fica
     bem mais lenta; dá para segurar e arrastar, e ao soltar ela segue no embalo até voltar ao ritmo ---------- */
  const mq = $("[data-mq]");
  if (mq) {
    const wrap = mq.parentElement, tp = $("[data-mq-tp]", mq), path = $("[data-mq-path]", mq), bands = $$("[data-mq-band]", mq);
    const group = tp.innerHTML;
    const BASE = -0.06, SLOW = -0.012;
    let groupLen = 1, offset = 0, last = 0, running = false, seen = false, ratio = 1;
    let v = reduce ? 0 : BASE, target = v, drag = null;
    const wrapOff = () => { while (offset <= -groupLen) offset += groupLen; while (offset > 0) offset -= groupLen; };
    const paint = () => { wrapOff(); tp.setAttribute("startOffset", offset.toFixed(1)); };
    const layout = () => {
      const w = mq.clientWidth, hgt = wrap.clientHeight, H = mq.clientHeight, mid = H / 2, p = 80;
      mq.setAttribute("viewBox", `0 0 ${w} ${H}`);
      const d = mobile() ? `M ${-p} ${mid} L ${w + p} ${mid}` : `M ${-p} ${mid} C ${w * 0.5} ${mid - hgt * 1.04}, ${w * 0.5} ${mid + hgt * 1.04}, ${w + p} ${mid}`;
      bands.forEach((b) => b.setAttribute("d", d));
      path.setAttribute("d", d);
      tp.innerHTML = group;
      groupLen = Math.max(1, $("text", mq).getComputedTextLength());
      const len = path.getTotalLength();
      ratio = len / (w + p * 2);
      tp.innerHTML = group.repeat(Math.ceil((len + groupLen) / groupLen) + 1);
      paint();
      // computador: a faixa sobe para dentro da hero até perto do conteúdo, sem cobrir texto (o espaço livre muda com a tela)
      if (!mobile()) {
        const hero = $(".hero"), copy = $(".hero__copy"), show = $(".show");
        if (hero && copy && show) {
          wrap.style.marginTop = "0px";
          const hb = hero.getBoundingClientRect().bottom, sw = parseFloat(getComputedStyle(bands[0]).strokeWidth) || 70, ext = (H - hgt) / 2;
          // a borda de cima da faixa embaixo de cada bloco (amostras ao longo da curva)
          const pts = [];
          for (let k = 0; k <= 120; k++) { const q = path.getPointAtLength((len * k) / 120); pts.push([q.x, q.y - ext - sw / 2]); }
          const need = [copy, show].map((el) => {
            const r = el.getBoundingClientRect();
            const ys = pts.filter(([x]) => x >= r.left - 20 && x <= r.right + 20).map(([, y]) => y);
            return ys.length ? r.bottom + 28 - Math.min(...ys) : -Infinity;
          });
          wrap.style.marginTop = Math.round(Math.max(-160, Math.min(0, Math.max(...need) - hb))) + "px";   // sobe no máximo 160px: no início da tela aparece só a curva da esquerda
        }
      } else wrap.style.marginTop = "";
    };
    const tick = (t) => {
      if (!running) return;
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      if (!drag) {
        v += (target - v) * Math.min(1, dt / 420);
        offset += v * dt;
        paint();
      }
      requestAnimationFrame(tick);
    };
    const sync = () => {
      const go = seen && !document.hidden;
      if (go && !running) { running = true; last = 0; requestAnimationFrame(tick); }
      if (!go) running = false;
    };
    const base = () => (reduce ? 0 : BASE);
    target = base();
    bands.forEach((b) => {
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !reduce) target = SLOW; });
      b.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !drag) target = base(); });
      b.addEventListener("pointerdown", (e) => {
        drag = { id: e.pointerId, x: e.clientX, t: performance.now(), vel: 0 };
        b.setPointerCapture(e.pointerId);
        wrap.classList.add("is-drag");
      });
      b.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const now = performance.now(), dx = (e.clientX - drag.x) * ratio, dt = Math.max(1, now - drag.t);
        offset += dx;
        drag.vel = drag.vel * 0.6 + (dx / dt) * 0.4;
        drag.x = e.clientX;
        drag.t = now;
        paint();
      });
      const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        v = Math.max(-1.6, Math.min(1.6, drag.vel));
        drag = null;
        wrap.classList.remove("is-drag");
        target = e.pointerType === "mouse" && b.matches(":hover") && !reduce ? SLOW : base();
      };
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
    });
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; sync(); }).observe(mq);
    else { seen = true; sync(); }
    document.addEventListener("visibilitychange", sync);
  }

  /* ---------- seção 01: a frase grande se acende palavra por palavra conforme a seção sobe na tela ---------- */
  const lit = $("[data-lit]");
  if (lit) {
    const words = lit.textContent.trim().split(/\s+/);
    const HL = ["pessoas,", "lugares", "negócios."];
    lit.innerHTML = words.map((w) => '<span class="lw' + (HL.includes(w) ? " lw--hl" : "") + '">' + w + "</span>").join(" ");
    const ws = $$(".lw", lit);
    let lt = false;
    const paintLit = () => {
      lt = false;
      const r = lit.getBoundingClientRect(), vh = window.innerHeight;
      const p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.45)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle("is-on", i < n));
    };
    window.addEventListener("scroll", () => { if (!lt) { lt = true; requestAnimationFrame(paintLit); } }, { passive: true });
    window.addEventListener("resize", paintLit);
    paintLit();
  }

  /* ---------- quando um bloco está na tela (para as trocas automáticas só rodarem à vista) ---------- */
  const onScreen = (el, cb) => {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver((es) => cb(es[0].isIntersecting), { threshold: 0.25 }).observe(el);
  };

  /* ---------- os três eletropostos (dados da página de lançamento) ---------- */
  const IMG = "img/pre-cadastro/";
  const kwType = (m) => m.kw + '<i class="sep" aria-hidden="true"></i>' + m.type;
  const MODELS = [
    { name: "Mobi", short: "Mobi", kw: "7 kW", type: "AC", pw: "7 kW · AC", feat: "1 ponto de recarga AC", aud: "Para residências, condomínios e estabelecimentos comerciais.", img: IMG + "modelo-mobi.webp" },
    { name: "Mobi Fast", short: "Mobi Fast", kw: "7 + 40 kW", type: "AC + DC", pw: "7 + 40 kW · AC + DC", feat: "2 pontos de recarga · AC + DC", aud: "Para estacionamentos e estabelecimentos comerciais.", img: IMG + "modelo-mobi-fast.webp" },
    { name: "Mobi Ultra Fast", short: "Ultra Fast", kw: "80 kW", type: "DC", pw: "80 kW · DC", feat: "Recarga rápida DC", aud: "Para operações com maior demanda de recarga.", img: IMG + "modelo-mobi-ultra-fast.webp" },
  ];

  /* ---------- hero: apresentação, um eletroposto por vez (troca sozinha; para no hover e fora da tela) ---------- */
  const show = $("[data-show]");
  let showI = 0;
  if (show) {
    const pics = $$(".show__pic", show), tabs = $$("[data-show-tab]", show);
    const set = (i, focus) => {
      showI = i;
      pics.forEach((p, j) => p.classList.toggle("is-on", j === i));
      tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      show.classList.add("is-swap");
      setTimeout(() => {
        const m = MODELS[i];
        $("[data-show-n]", show).textContent = String(i + 1).padStart(2, "0");
        $("[data-show-name]", show).textContent = m.name;
        $("[data-show-kw]", show).innerHTML = kwType(m);
        $("[data-show-short]", show).textContent = m.short;
        show.classList.remove("is-swap");
      }, reduce ? 0 : 220);
      // a barra da aba recomeça
      tabs.forEach((t) => { const b = $(".show__bar i", t); b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; });
    };
    tabs.forEach((t, j) => {
      t.addEventListener("click", () => set(j));
      $(".show__bar i", t).addEventListener("animationend", () => { if (j === showI) set((showI + 1) % MODELS.length); });
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); set((showI + d + MODELS.length) % MODELS.length, true); }
      });
    });
    // as outras fotos chegam logo depois da primeira
    window.addEventListener("load", () => pics.forEach((p) => { p.loading = "eager"; }));
    let hover = false, seen = true;
    const sync = () => show.classList.toggle("is-paused", hover || !seen || document.hidden || !!$("dialog[open]"));
    show.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; sync(); } });
    show.addEventListener("pointerleave", () => { hover = false; sync(); });
    onScreen(show, (v) => { seen = v; sync(); });
    document.addEventListener("visibilitychange", sync);
    if (reduce) show.classList.add("is-static");
    show.syncPause = sync;
    $("[data-show-more]", show).addEventListener("click", () => openModel(showI));
    // no toque: arrastar para a esquerda/direita troca o eletroposto
    let sx = 0, sy = 0;
    show.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    show.addEventListener("touchend", (e) => {
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) set((showI + (dx < 0 ? 1 : -1) + MODELS.length) % MODELS.length);
    }, { passive: true });
  }

  /* ---------- detalhes do eletroposto (janela com as três opções) ---------- */
  const dm = $("#dlg-model");
  const mdl = $(".mdl", dm);
  const fillModel = (i) => {
    const m = MODELS[i];
    $$("[data-mdl-tab]", dm).forEach((t, j) => t.setAttribute("aria-selected", String(j === i)));
    $("[data-mdl-img]", dm).src = m.img;
    $("[data-mdl-n]", dm).textContent = String(i + 1).padStart(2, "0") + " / 03";
    $("[data-mdl-name]", dm).textContent = m.name;
    $("[data-mdl-kw]", dm).innerHTML = kwType(m);
    $("[data-mdl-pw]", dm).textContent = m.pw;
    $("[data-mdl-feat]", dm).textContent = m.feat;
    $("[data-mdl-aud]", dm).textContent = m.aud;
  };
  const openModel = (i) => { fillModel(i); dm.showModal(); if (show) show.syncPause(); };
  $$("[data-mdl-tab]", dm).forEach((t, j) => t.addEventListener("click", () => {
    if (reduce) { fillModel(j); return; }
    mdl.classList.add("is-swap");
    setTimeout(() => { fillModel(j); mdl.classList.remove("is-swap"); }, 200);
  }));
  $("[data-mdl-go]", dm).addEventListener("click", () => dm.close());
  dm.addEventListener("close", () => { if (show) show.syncPause(); });

  /* ---------- 02 · a seção fica fixa e o scroll passa o foco de um tema para o outro; sem espaço na tela (ou com o
     movimento reduzido) ela fica parada e o clique troca o tema ---------- */
  const live = $("[data-live]");
  if (live) {
    const items = $$("[data-live-i]", live), imgs = $$(".live__img", live), bars = items.map((it) => $(".live__bar i", it));
    const n = items.length, grid = $(".live__grid", live), segs = $$(".live__segs > i > i", live);
    // a diferença de altura entre o tema aberto agora e o mais longo (as descrições têm 2 ou 3 linhas)
    const descs = items.map((it) => $(".live__desc > span", it));
    let extra = 0;
    const measureExtra = () => { const hs = descs.map((d) => d.scrollHeight); const cur = descs[Math.max(0, k)].scrollHeight; extra = Math.max(...hs) - cur; };
    let k = -1, pinned = false, top = 0, span = 1;
    const set = (i) => {
      if (i === k) return;
      k = i;
      items.forEach((it, j) => { it.classList.toggle("is-on", j === i); if (j === i) it.setAttribute("aria-current", "true"); else it.removeAttribute("aria-current"); });
      imgs.forEach((im, j) => im.classList.toggle("is-on", j === i));
      $("[data-live-n]", live).textContent = String(i + 1).padStart(2, "0");
      $("[data-live-t]", live).textContent = $(".live__top b", items[i]).textContent;
      if (!pinned) segs.forEach((g, j) => { g.style.transform = "scaleX(" + (j <= i ? 1 : 0) + ")"; });
    };
    const measure = () => {
      measureExtra();
      // fixa só quando o bloco inteiro (com o tema mais longo aberto) cabe na tela
      const pad = mobile() ? 88 : 96;
      pinned = !reduce && !mobile() && grid.offsetHeight + extra + pad <= window.innerHeight;
      live.classList.toggle("is-pin", pinned);
      if (pinned) {
        // o bloco fica centrado na tela (abaixo do menu) por um percurso de ~1,2 tela
        const vh = window.innerHeight, ch = grid.offsetHeight + extra, minTop = mobile() ? 24 : 84 + 16;
        const pinTop = Math.max(minTop, Math.round((vh - ch) / 2));
        const run = Math.round(vh * 1.2);
        live.style.setProperty("--pin-top", pinTop + "px");
        live.style.setProperty("--pin-run", run + "px");
        const padTop = parseFloat(getComputedStyle(live).paddingTop) || 0;
        top = live.getBoundingClientRect().top + window.scrollY + padTop - pinTop;
        span = run;
      } else {
        live.style.removeProperty("--pin-top");
        live.style.removeProperty("--pin-run");
      }
      if (!pinned) bars.forEach((b) => { b.style.transform = ""; });
      tick();
    };
    const tick = () => {
      if (!pinned) return;
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / span)), f = p * n, i = Math.min(n - 1, Math.floor(f));
      set(i);
      bars.forEach((b, j) => {
        const v = "scaleX(" + (j < i ? 1 : j === i ? Math.min(1, f - i) : 0).toFixed(3) + ")";
        b.style.transform = v;
        segs[j].style.transform = v;
      });
    };
    let lt = false;
    window.addEventListener("scroll", () => { if (!lt) { lt = true; requestAnimationFrame(() => { lt = false; tick(); }); } }, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if ("ResizeObserver" in window) { let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(measure, 120); }).observe(document.body); }
    items.forEach((it, j) => it.addEventListener("click", () => {
      if (!pinned) { set(j); return; }
      window.scrollTo({ top: top + span * ((j + 0.15) / n), behavior: reduce ? "auto" : "smooth" });
    }));
    set(0);
    measure();
    // as fotos dos outros temas já ficam prontas quando a seção chega perto
    if ("IntersectionObserver" in window) {
      const pio = new IntersectionObserver((es) => { if (es[0].isIntersecting) { imgs.forEach((im) => { im.loading = "eager"; }); pio.disconnect(); } }, { rootMargin: "600px 0px" });
      pio.observe(live);
    }
  }

  /* ---------- ingresso: inclina de leve e o brilho acompanha o cursor ---------- */
  const ticket = $("[data-ticket]");
  if (ticket && !reduce && window.matchMedia("(hover: hover)").matches) {
    ticket.addEventListener("pointermove", (e) => {
      const r = ticket.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ticket.classList.add("is-tilt");
      ticket.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
      ticket.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
      ticket.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    });
    ticket.addEventListener("pointerleave", () => {
      ticket.classList.remove("is-tilt");
      ["--rx", "--ry", "--mx"].forEach((p) => ticket.style.removeProperty(p));
    });
  }

  /* ---------- encerramento: a estrada acende quando aparece ---------- */
  const end = $("[data-end]");
  if (end) {
    if (!("IntersectionObserver" in window) || reduce) end.classList.add("is-lit");
    else {
      const eo = new IntersectionObserver((es) => { if (es[0].isIntersecting) { end.classList.add("is-lit"); eo.disconnect(); } }, { threshold: 0.35 });
      eo.observe(end);
    }
  }

  /* ---------- FAQ: um aberto por vez ---------- */
  $$("[data-faq] .qa").forEach((qa) => {
    const q = $(".qa__q", qa);
    q.addEventListener("click", () => {
      const open = !qa.classList.contains("is-open");
      $$("[data-faq] .qa").forEach((o) => { o.classList.remove("is-open"); $(".qa__q", o).setAttribute("aria-expanded", "false"); });
      qa.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- aviso rápido ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  const toast = (text) => { toastEl.textContent = text; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000); };

  /* ---------- convite do licenciado: ?ref=CÓDIGO aparece no formulário ---------- */
  const params = new URLSearchParams(location.search);
  const referral = params.get("ref") || "";
  if (/^[a-zA-Z0-9_-]{1,60}$/.test(referral)) { $("#referral-code").textContent = referral; $("#referral-note").hidden = false; }

  /* ---------- pré-cadastro (demonstrativo: nada é enviado nem guardado) ---------- */
  const form = $("#lead-form"), success = $("#success"), card = $("#form-card");
  // celular: o formulário fica embaixo do convite; os botões "Quero participar" levam direto a ele
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#cadastro"]');
    if (!a || !mobile()) return;
    e.preventDefault();
    const r = card.getBoundingClientRect();
    window.scrollTo({ top: r.top + window.scrollY - 16, behavior: reduce ? "auto" : "smooth" });
  });
  $("#phone").addEventListener("input", (e) => {
    const n = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value = n.length > 6 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n;
  });
  form.addEventListener("input", (e) => {
    const err = $("#error-" + e.target.id);
    if (err) { err.textContent = ""; e.target.removeAttribute("aria-invalid"); }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const errors = {};
    const name = $("#name").value.trim(), phone = $("#phone").value.replace(/\D/g, ""), email = $("#email").value.trim();
    if (name.length < 3) errors.name = "Informe seu nome, com pelo menos 3 letras.";
    if (!/^[1-9]{2}9\d{8}$/.test(phone)) errors.phone = "Informe um WhatsApp com DDD e 9 dígitos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Confira seu e-mail.";
    if (!$("#consent").checked) errors.consent = "Marque a autorização para testar a próxima etapa.";
    ["name", "phone", "email", "consent"].forEach((k) => {
      $("#error-" + k).textContent = errors[k] || "";
      $("#" + k).setAttribute("aria-invalid", errors[k] ? "true" : "false");
    });
    const first = Object.keys(errors)[0];
    if (first) { $("#" + first).focus(); return; }
    form.hidden = true;
    success.hidden = false;
    $("#success-name").textContent = `${name.split(" ")[0]}, esse é o seu próximo passo.`;
    success.classList.remove("is-in");
    void success.offsetWidth;
    success.classList.add("is-in");
    success.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  });
  $("#restart").addEventListener("click", () => {
    form.hidden = false;
    success.hidden = true;
    form.reset();
    $("#name").focus();
  });

  /* ---------- agenda: o arquivo .ics é montado aqui (também funciona aberto direto do disco) ---------- */
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iGreen MOB//Live de lancamento//PT-BR", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", "UID:igreen-mob-live-20261020@igreen-mob", "DTSTAMP:20261013T220000Z", "DTSTART;VALUE=DATE:20261020", "DTEND;VALUE=DATE:20261021",
    "SUMMARY:Live de lancamento iGreen MOB - horario a confirmar", "DESCRIPTION:Reserve a data. Live no YouTube. Horario e link a confirmar pela organizacao.", "STATUS:TENTATIVE",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
  $$("[data-ics]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const t = document.createElement("a");
    t.href = url;
    t.download = "live-igreen.ics";
    document.body.appendChild(t);
    t.click();
    t.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }));

  /* ---------- janelas: privacidade e convite do licenciado ---------- */
  const dlgs = { privacy: $("#dlg-privacy"), invite: $("#dlg-invite"), model: $("#dlg-model") };
  $$("[data-dialog]").forEach((b) => b.addEventListener("click", () => {
    const d = dlgs[b.dataset.dialog];
    if (d && !d.open) d.showModal();
  }));
  Object.values(dlgs).forEach((d) => {
    $("[data-close]", d).addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  $("#invite-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = $("#invite-code").value.trim();
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(code)) { $("#invite-code").focus(); return; }
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("ref", code);
    $("#invite-url").textContent = url.href;
    $("#preview-invite").href = url.href + "#cadastro";
    $("#invite-output").hidden = false;
    $("#copy-invite").onclick = async () => {
      const text = `Quero te convidar para conhecer a iGreen MOB e a oportunidade por trás da mobilidade elétrica.\n\nDia 20 de outubro, ao vivo no YouTube. Horário a confirmar.\n\nVeja o convite: ${url.href}`;
      try { await navigator.clipboard.writeText(text); toast("Convite copiado. Agora é só compartilhar."); }
      catch (err) { toast("Não foi possível copiar automaticamente. Selecione o link acima."); }
    };
  });

  /* ---------- barra do celular: aparece depois do botão da abertura; some quando o formulário está na tela ---------- */
  const bar = $("[data-mbar]"), heroCta = $("[data-hero-cta]");
  if (bar && "IntersectionObserver" in window) {
    let pastHero = false, formOn = false;
    const sync = () => {
      const show = mobile() && pastHero && !formOn;
      bar.hidden = !mobile();
      bar.classList.toggle("is-away", !show);
      document.body.classList.toggle("has-bar", mobile() && pastHero);
    };
    new IntersectionObserver((es) => { pastHero = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; sync(); }).observe(heroCta);
    new IntersectionObserver((es) => { formOn = es[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(card);
    window.addEventListener("resize", sync);
    sync();
  }
})();
