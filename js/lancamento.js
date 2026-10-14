/* =========================================================
   iGreen MOB · lançamento — escolha do modelo e o pedido em passos (prévia: nada é enviado nem cobrado).
   - Os cartões são opções (rádio): tocar escolhe; o botão do cartão escolhe e leva ao pedido ("Escolher X" → "Continuar com X").
     No celular, o cartão que está na tela é o escolhido (abas e deslize).
   - O modelo vai para o endereço (?modelo=fast) quando a pessoa escolhe: a live pode mandar o link direto de cada um.
   - Pedido: 1 seus dados (CPF/CNPJ primeiro; máscaras e erros no campo) → 2 revisão e aceite → 3 pagamento (PIX ou cartão,
     simulado) → confirmação. Resumo e plano por etapa (recolhido) ao lado; no celular, em cima, com a barra fixa embaixo.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const brl = (v) => "R$ " + v.toLocaleString("pt-BR");
  const IMG = "img/lancamento/";

  const MODELS = {
    mobi: { name: "Mobi", short: "Mobi", pw: "7 kW · AC", kw: "7", unit: "kW · AC", feat: "1 ponto de recarga AC", aud: "Para residências, condomínios e estabelecimentos comerciais.", img: IMG + "equip-mobi.webp", w: 245, h: 1110, today: 9997, total: 9997, parts: 0 },
    fast: { name: "Mobi Fast", short: "Mobi Fast", pw: "7 + 40 kW · AC + DC", kw: "7 + 40", unit: "kW · AC + DC", feat: "2 pontos de recarga · AC + DC", aud: "Para estacionamentos e estabelecimentos comerciais.", img: IMG + "equip-mobi-fast.webp", w: 713, h: 1252, today: 9997, total: 89997, parts: 4 },
    ultra: { name: "Mobi Ultra Fast", short: "Ultra Fast", pw: "80 kW · DC", kw: "80", unit: "kW · DC", feat: "Recarga rápida DC", aud: "Para operações com maior demanda de recarga.", img: IMG + "equip-mobi-ultra-fast.webp", w: 724, h: 1294, today: 9997, total: 149997, parts: 4 }
  };
  const STAGES = [["Após a validação técnica", ""], ["Na emissão da nota fiscal para envio", ""], ["Na entrega do equipamento", ""], ["Após a primeira recarga", "Última parcela · já em operação"]];
  const ORDER = ["mobi", "fast", "ultra"];
  const part = (m) => (m.total - m.today) / m.parts;

  let sel = null, step = 1, reached = 1, orderNo = "", method = "pix";
  const order = $("#pedido"), wiz = $("[data-wiz]"), bar = $("[data-bar]"), live = $("[data-live]"), track = $("[data-track]");
  const cards = $$(".card"), dots = $$(".dots i");
  const mobile = () => window.matchMedia("(max-width: 899px)").matches;

  /* ---------- escolher o modelo ---------- */
  function choose(key, opts) {
    const m = MODELS[key];
    if (!m) return;
    opts = opts || {};
    sel = key;
    const i = ORDER.indexOf(key);
    cards.forEach((c, j) => {
      const on = j === i, k = c.dataset.model, b = $("[data-cta]", c);
      c.setAttribute("aria-checked", String(on)); c.tabIndex = on ? 0 : -1;
      b.classList.toggle("btn--neon", on); b.classList.toggle("btn--ghost", !on);
      $("[data-cta-l]", b).textContent = (on ? "Continuar com " : "Escolher ") + MODELS[k].short;
    });
    view(i);
    $$(".cmp__v").forEach((v) => v.classList.toggle("is-sel", v.dataset.m === key));
    $$(".cmp__btn").forEach((b) => { b.textContent = b.dataset.choose === key ? "Escolhido" : "Escolher"; });
    const si = $("[data-sum-img]"); si.src = m.img; si.width = m.w; si.height = m.h;
    $("[data-sum-name]").textContent = m.name;
    $("[data-sum-pw]").textContent = m.pw;
    $("[data-sum-today-k]").textContent = m.parts ? "Entrada hoje" : "Pagamento único, hoje";
    $("[data-sum-today]").textContent = brl(m.today);
    $("[data-sum-total]").textContent = brl(m.total);
    $("[data-sum-rest-row]").hidden = !m.parts;
    if (m.parts) $("[data-sum-rest]").textContent = m.parts + "× " + brl(part(m));
    $("[data-bar-name]").textContent = m.name;
    $("[data-bar-today]").textContent = brl(m.today);
    $$("[data-pay]").forEach((e) => { e.textContent = brl(m.today); });
    renderPlan(m);
    if (step === 2) renderReview();
    if (step === 4) newOrder();   // trocou de modelo depois de concluir: começa um pedido novo
    if (opts.url !== false) { try { const u = new URL(location.href); u.searchParams.set("modelo", key); history.replaceState(null, "", u); } catch (e) { /* file:// em alguns navegadores */ } }
    if (opts.scroll && mobile()) scrollToCard(i, opts.instant);
    order.hidden = false; bar.hidden = false; document.body.classList.add("has-bar");
    watchBar();
    if (opts.go) toOrder();
  }
  // as abas e os pontinhos mostram qual cartão está na tela (no celular); não escolhem nada
  let viewing = 1;
  function view(i) {
    viewing = i;
    dots.forEach((d, j) => d.classList.toggle("is-on", j === i));
    const m = MODELS[ORDER[i]], name = $("[data-pg-name]");
    name.textContent = m.name;
    name.parentElement.classList.toggle("is-chosen", ORDER[i] === sel);
    $("[data-pg-count]").textContent = ", " + (i + 1) + " de " + ORDER.length + (ORDER[i] === sel ? ", escolhido" : "");   // só para leitores de tela
    $$("[data-pg]").forEach((b) => { b.disabled = (+b.dataset.pg < 0 && i === 0) || (+b.dataset.pg > 0 && i === ORDER.length - 1); });
  }
  $$("[data-pg]").forEach((b) => b.addEventListener("click", () => {
    const i = Math.max(0, Math.min(ORDER.length - 1, viewing + +b.dataset.pg));
    view(i); scrollToCard(i);
  }));
  // rola até o título da seção do pedido (um respiro acima), para a pessoa ver do que se trata
  function toOrder() {
    requestAnimationFrame(() => {
      const h = $(".shead", order), shift = h.classList.contains("is-in") ? 0 : 22;   // ainda vai subir 22px ao aparecer
      const top = h.getBoundingClientRect().top - shift + window.scrollY - (mobile() ? 24 : 40);
      window.scrollTo({ top: top, behavior: "smooth" });
      setTimeout(() => $('[data-step="' + step + '"]').focus({ preventScroll: true }), 700);
    });
  }
  function scrollToCard(i, instant) {
    track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: instant ? "auto" : "smooth" });
  }
  cards.forEach((c) => {
    c.addEventListener("click", (e) => { if (!e.target.closest("[data-zoom], [data-cta]")) choose(c.dataset.model); });
    c.addEventListener("keydown", (e) => {
      if (e.target !== c) return;
      const i = ORDER.indexOf(c.dataset.model);
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); choose(c.dataset.model); }
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        const n = ORDER[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 2)) % 3];
        cards.forEach((x) => { x.tabIndex = x.dataset.model === n ? 0 : -1; }); cards[ORDER.indexOf(n)].focus(); if (mobile()) scrollToCard(ORDER.indexOf(n)); view(ORDER.indexOf(n));
      }
    });
  });
  // o botão do cartão: escolhe (se ainda não estava) e leva ao pedido
  $$("[data-cta]").forEach((b) => b.addEventListener("click", () => choose(b.dataset.cta, { go: true })));
  // no celular, o deslize só muda qual cartão está na tela (abas e pontinhos)
  let settle = 0;
  track.addEventListener("scroll", () => {
    if (!mobile()) return;
    clearTimeout(settle);
    settle = setTimeout(() => {
      const x = track.scrollLeft + track.clientWidth * 0.3;
      let best = 0;
      cards.forEach((c, i) => { if (c.offsetLeft - track.offsetLeft <= x) best = i; });
      view(best);
    }, 90);
  }, { passive: true });
  $$("[data-choose]").forEach((b) => b.addEventListener("click", () => { const d = b.closest("dialog"); if (d) d.close(); choose(b.dataset.choose, { scroll: true, go: true }); }));

  function renderPlan(m) {
    $("[data-plan-p]").textContent = m.parts
      ? "Hoje você paga só a entrada. O saldo vem em " + m.parts + " parcelas iguais, cada uma quando uma etapa for concluída."
      : "No Mobi você paga tudo hoje. Não tem saldo nem parcelas.";
    const rows = [["Hoje, no pedido", m.parts ? "Entrada na live" : "Pagamento único", m.today]].concat(m.parts ? STAGES.map((s) => [s[0], s[1], part(m)]) : []);
    $("[data-plan]").innerHTML = rows.map((r, i) => '<li class="' + (i ? "" : "is-now") + '"><i>' + (i + 1) + "</i><span>" + r[0] + (r[1] ? "<small>" + r[1] + "</small>" : "") + "</span><b>" + brl(r[2]) + "</b></li>").join("");
  }

  /* ---------- janelas: ampliar, comparar, documentos ---------- */
  const dlg = (n) => $('[data-dlg="' + n + '"]');
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => dlg(b.dataset.open).showModal()));
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));   // clique fora fecha
  let zoomKey = "fast";
  $$("[data-zoom]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const m = MODELS[(zoomKey = b.dataset.zoom)];
    const im = $("[data-zoom-img]"); im.src = m.img; im.alt = "Carregador iGreen " + m.name; im.width = m.w; im.height = m.h;
    $("[data-zoom-name]").textContent = m.name;
    $("[data-zoom-pw]").innerHTML = "<b>" + m.kw + "</b>" + m.unit;
    $("[data-zoom-feat]").textContent = m.feat;
    $("[data-zoom-aud]").textContent = m.aud;
    $("[data-zoom-k]").textContent = m.parts ? "Entrada hoje" : "Pagamento único";
    $("[data-zoom-today]").textContent = brl(m.today);
    $("[data-zoom-total]").textContent = m.parts ? "Total " + brl(m.total) + " · saldo em " + m.parts + "× " + brl(part(m)) + " por etapa" : "É o valor total da licença.";
    $("[data-zoom-l]").textContent = "Escolher " + m.short;
    dlg("zoom").showModal();
  }));
  $("[data-zoom-choose]").addEventListener("click", () => { dlg("zoom").close(); choose(zoomKey, { scroll: true, go: true }); });

  /* ---------- passos do pedido ---------- */
  const NAMES = { 1: "Seus dados", 2: "Revisão", 3: "Pagamento", 4: "Pedido confirmado" };
  function goto(n, focus) {
    step = n; reached = Math.max(reached, n);
    $$("[data-step]").forEach((s) => { s.hidden = +s.dataset.step !== n; });
    $$("[data-goto]").forEach((b) => {
      const k = +b.dataset.goto;
      b.disabled = n === 4 || k > reached;
      b.classList.toggle("is-done", k < n || n === 4);
      if (k === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    $$(".steps__ln").forEach((l, j) => l.classList.toggle("is-done", j + 2 <= n || n === 4));
    $("[data-count]").innerHTML = n === 4 ? "<b>Pedido confirmado</b>" : "<b>" + NAMES[n] + "</b><span>Etapa " + n + " de 3</span>";
    live.textContent = "Etapa: " + NAMES[n];
    if (n === 2) renderReview();
    if (n === 3) renderPix();
    wiz.classList.toggle("is-done", n === 4);
    const done = $(".done");
    done.classList.remove("is-in");
    if (n === 4) { renderDone(); void done.offsetWidth; done.classList.add("is-in"); }
    if (focus !== false) toWiz();
    watchBar();
  }
  function toWiz() {
    const top = wiz.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.5) window.scrollTo({ top: top + window.scrollY - (mobile() ? 16 : 24), behavior: "smooth" });
    setTimeout(() => $('[data-step="' + step + '"]').focus({ preventScroll: true }), 350);
  }
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => goto(+b.dataset.goto)));
  $$("[data-prev]").forEach((b) => b.addEventListener("click", () => goto(step - 1)));
  const form = $('[data-step="1"]');
  form.addEventListener("submit", (e) => { e.preventDefault(); if (validate(form)) goto(2); });
  $('[data-step="2"] [data-next]').addEventListener("click", () => {
    const ok = $("[data-accept]").checked;
    $("[data-accept-err]").textContent = ok ? "" : "Marque a confirmação para seguir para o pagamento.";
    if (ok) goto(3); else $("[data-accept]").focus();
  });
  $("[data-accept]").addEventListener("change", () => { $("[data-accept-err]").textContent = ""; });
  // forma de pagamento
  $$('[name="pay"]').forEach((r) => r.addEventListener("change", () => {
    method = r.value;
    $$("[data-paybox]").forEach((b) => { b.hidden = b.dataset.paybox !== method; });
    watchBar();
  }));
  $("[data-pay-ok]").addEventListener("click", () => goto(4));   // finaliza o pedido; o PIX aparece na confirmação
  const cardForm = $('[data-paybox="card"]');
  cardForm.addEventListener("submit", (e) => { e.preventDefault(); if (validate(cardForm)) goto(4); });
  // pedido novo (trocou de modelo depois de concluir): mantém os dados digitados, pede o aceite de novo e um novo número
  function newOrder() {
    cardForm.reset(); $("[data-accept]").checked = false; reached = 1; orderNo = "";
    $$("[data-paybox] [data-err]").forEach((e) => { e.textContent = ""; });
    goto(1, false);
  }

  /* ---------- máscaras e validação no próprio campo ---------- */
  const digits = (v) => v.replace(/\D/g, "");
  const MASK = {
    doc: (v) => {
      const d = digits(v).slice(0, 14);
      if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    },
    whats: (v) => {
      const d = digits(v).slice(0, 11);
      if (d.length <= 2) return d.length ? "(" + d : "";
      if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    },
    cc: (v) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
    ccnome: (v) => v.toUpperCase(),
    ccval: (v) => { const d = digits(v).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; },
    cccvv: (v) => digits(v).slice(0, 4)
  };
  const RULES = {
    doc: (v) => { const d = digits(v); return (d.length === 11 || d.length === 14) && !/^(\d)\1+$/.test(d) ? "" : "Digite um CPF (11 números) ou CNPJ (14 números)."; },
    nome: (v) => (v.trim().length >= 3 && /[a-zà-ú]/i.test(v) ? "" : "Escreva seu nome completo ou a razão social."),
    whats: (v) => { const d = digits(v); return d.length >= 10 && d.length <= 11 ? "" : "Digite o WhatsApp com DDD, ex.: (11) 99999-9999."; },
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Confira o e-mail, ex.: voce@exemplo.com."),
    cc: (v) => { const d = digits(v); return d.length >= 13 && d.length <= 19 ? "" : "Confira o número do cartão."; },
    ccnome: (v) => (v.trim().length >= 3 ? "" : "Escreva o nome como está no cartão."),
    ccval: (v) => {
      const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return "Use mês e ano, ex.: 08/29.";
      const mm = +m[1], yy = 2000 + +m[2], now = new Date();
      if (mm < 1 || mm > 12) return "Mês inválido.";
      return yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1) ? "" : "Esse cartão já venceu.";
    },
    cccvv: (v) => (/^\d{3,4}$/.test(v) ? "" : "O CVV tem 3 ou 4 números.")
  };
  function check(input) {
    const msg = RULES[input.name](input.value);
    const em = $("[data-err]", input.closest(".fld"));
    em.textContent = msg; em.id = "err-" + input.name;
    if (msg) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", em.id); }
    else { input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby"); }
    return !msg;
  }
  function validate(f) {
    let first = null;
    $$("input", f).forEach((i) => { if (RULES[i.name] && !check(i) && !first) first = i; });
    if (first) first.focus();
    return !first;
  }
  $$(".fld input").forEach((i) => {
    i.addEventListener("input", () => {
      if (MASK[i.name]) i.value = MASK[i.name](i.value);
      if (i.getAttribute("aria-invalid")) check(i);   // corrigindo: o erro some assim que fica certo
    });
    i.addEventListener("blur", () => { if (i.value) check(i); });
  });

  /* ---------- revisão, PIX e confirmação ---------- */
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rows = (list) => "<dl>" + list.map((r) => '<div class="' + (r[2] || "") + '"><dt>' + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>").join("") + "</dl>";
  function renderReview() {
    const m = MODELS[sel], f = form.elements;
    const lic = [["Modelo", m.name + " · " + m.pw], [m.parts ? "Entrada hoje" : "Pagamento único", brl(m.today), "is-hl"], ["Total da licença", brl(m.total)]];
    if (m.parts) lic.push(["Saldo", m.parts + "× " + brl(part(m)) + " por etapa"]);
    const you = [["CPF ou CNPJ", f.doc.value], ["Nome", f.nome.value], ["WhatsApp", f.whats.value], ["E-mail", f.email.value]];
    $("[data-review]").innerHTML =
      '<section class="rgrp"><div class="rgrp__h"><strong>Licença</strong><a href="#modelos">Trocar</a></div>' + rows(lic) + "</section>" +
      '<section class="rgrp"><div class="rgrp__h"><strong>Seus dados</strong><button type="button" data-edit>Editar</button></div>' + rows(you) + "</section>";
    $("[data-edit]").addEventListener("click", () => { goto(1); setTimeout(() => form.elements.doc.focus(), 380); });
  }
  function renderPix() {
    $("[data-code]").textContent = "00020126EXEMPLO.IGREEN.MOB/" + orderNo + "/" + sel.toUpperCase() + "/NAO-PAGUE-PREVIA6304ABCD";
    $("[data-copy-l]").textContent = "Copiar";
    $("[data-qr]").innerHTML = qr(orderNo);
  }
  $("[data-copy]").addEventListener("click", async () => {
    const t = $("[data-code]").textContent;
    try { await navigator.clipboard.writeText(t); $("[data-copy-l]").textContent = "Copiado"; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("[data-code]")); const g = getSelection(); g.removeAllRanges(); g.addRange(r); $("[data-copy-l]").textContent = "Selecionado"; }
  });
  function renderDone() {
    const m = MODELS[sel], nome = form.elements.nome.value.trim().split(/\s+/)[0];
    if (!orderNo) orderNo = "MOB-" + String(Math.floor(100000 + Math.random() * 900000));
    const pix = method === "pix";
    $("[data-done-p]").innerHTML = "Pedido <b>" + orderNo + "</b> registrado" + (nome ? ", " + esc(nome) : "") + ". " + m.name + " · entrada de " + brl(m.today) + (pix ? ": pague agora no PIX." : " paga no cartão.");
    $("[data-done-pix]").hidden = !pix;
    $("[data-done-card]").hidden = pix;
    if (pix) renderPix();
  }
  // acompanhar a implantação: na versão oficial abre o link do pedido (PIX, status do pagamento e implantação)
  $("[data-follow]").addEventListener("click", (e) => { e.preventDefault(); dlg("follow").showModal(); });
  // um QR de mentira (desenho parecido, sem conteúdo): só para a prévia
  function qr(seed) {
    let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
    const N = 25, cells = [];
    const finder = (x, y) => { cells.push('<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#021204"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#f2f6ef"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#021204"/>'); };
    const inF = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inF(x, y) && rnd() < 0.5) cells.push('<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#021204"/>');
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    return '<svg viewBox="0 0 ' + N + " " + N + '" shape-rendering="crispEdges">' + cells.join("") + "</svg>";
  }

  /* ---------- dúvidas: uma pergunta aberta por vez ---------- */
  $$(".qa__q").forEach((q) => q.addEventListener("click", () => {
    const item = q.closest(".qa"), open = !item.classList.contains("is-open");
    $$(".qa").forEach((o) => { o.classList.remove("is-open"); $(".qa__q", o).setAttribute("aria-expanded", "false"); });
    if (open) { item.classList.add("is-open"); q.setAttribute("aria-expanded", "true"); }
  }));
  /* ---------- falar com o consultor: o mesmo config.js do site (ou ?whats= no link), com a mensagem pronta ---------- */
  (function () {
    const cfg = (window.IGREEN_CONFIG && window.IGREEN_CONFIG.consultor) || {};
    const q = new URLSearchParams(location.search);
    let num = String(q.get("whats") || cfg.whatsapp || "").replace(/\D/g, "");
    if (num.length < 10 || num.length > 15) num = "";
    const nome = String(q.get("nome") || cfg.nome || "").trim().split(/\s+/)[0];
    const msg = (nome ? "Olá, " + nome + "!" : "Olá!") + " Estou na live de lançamento da iGreen MOB e tenho uma dúvida sobre as licenças.";
    $$("[data-wa]").forEach((el) => { el.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(msg); el.target = "_blank"; el.rel = "noopener"; });
  })();

  /* ---------- barra do celular: some quando o botão do cartão escolhido ou o do passo está na tela, ou o teclado abre ---------- */
  let io = null, typing = false;
  const seen = new Set();
  function watchBar() {
    if (io) io.disconnect();
    if (!sel) return;
    seen.clear();
    if (!("IntersectionObserver" in window)) return;
    const box = $('[data-step="' + step + '"]');
    const act = step === 3 ? $('[data-paybox="' + method + '"] .step__act', box) : $(".step__act, .done__go", box);
    const cta = $('.card[aria-checked="true"] [data-cta]');
    io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      bar.classList.toggle("is-away", seen.size > 0 || typing);
    });
    [act, cta].forEach((t) => { if (t) io.observe(t); });
    $("[data-bar-l]").textContent = step === 1 ? "Continuar" : step === 4 ? "Ver pedido" : NAMES[step];
  }
  document.addEventListener("focusin", (e) => { if (e.target.matches("input:not([type=radio]):not([type=checkbox])")) { typing = true; bar.classList.add("is-away"); } });
  document.addEventListener("focusout", (e) => { if (e.target.matches("input")) { typing = false; watchBar(); } });
  $("[data-bar-go]").addEventListener("click", () => { if (order.getBoundingClientRect().top > 0) toOrder(); else toWiz(); });

  /* ---------- aparições: desfoque + subida quando entra na tela; o título da hero palavra por palavra ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--i", i++); w.textContent = part; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(el);
  });
  $$("[data-delay]").forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.style.setProperty("--d", el.dataset.delay + "s"); });
  const revealAll = () => $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
  if ("IntersectionObserver" in window) {
    const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach((el) => ro.observe(el));
  } else revealAll();

  /* ---------- início: só o modelo do link (?modelo=fast) vem escolhido; o cartão em destaque aparece primeiro no celular ---------- */
  const pre = new URLSearchParams(location.search).get("modelo");
  goto(1, false);
  if (MODELS[pre]) choose(pre, { url: false });
  requestAnimationFrame(() => { const i = ORDER.indexOf(MODELS[pre] ? pre : "fast"); view(i); if (mobile()) scrollToCard(i, true); });
})();
