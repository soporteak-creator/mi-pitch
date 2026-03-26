/* ==========================================================
   main.js — Lógica VeriSmart · GSAP + ScrollTrigger
   ========================================================== */

'use strict';

let D = null; // global data

/* ──────────────────────────────────────────
   Bootstrap
   ────────────────────────────────────────── */
async function init() {
  try {
    const res = await fetch('/data/verismart.json');
    D = await res.json();
  } catch (_) {
    console.warn('[VeriSmart] JSON load failed — using static fallback');
  }

  buildDOM();
  initGSAP();

  // core.js helpers (called after DOM is ready)
  staggerReveal('.hero-reveal', 80, 130);
}

/* ──────────────────────────────────────────
   DOM Builders (data → HTML)
   ────────────────────────────────────────── */
function buildDOM() {
  buildStackDiagram();
  buildProblems();
  buildComparisonTable();
  buildRoadmap();
  buildImprovements();
  buildCostCards();

  // re-init core observers after dynamic content
  initCounters();
  initSeverityBars();
  initRoadmap();

  // Chart
  if (D?.chartData) initGrowthChart('usage-chart', D.chartData);
}

/* Stack diagram */
function buildStackDiagram() {
  const el = document.getElementById('stack-diagram');
  if (!el || !D?.currentStack) return;

  const colorMap = {
    Frontend: 'vue', Backend: 'node',
    'Base Datos': 'mongo', Container: 'docker', Hosting: 'aws'
  };

  const statusBadge = s => s === 'ok'
    ? `<span class="badge badge--green">OK</span>`
    : s === 'crítico'
    ? `<span class="badge badge--red">CRÍTICO</span>`
    : `<span class="badge badge--amber">ALERTA</span>`;

  const html = D.currentStack.map((layer, i) => `
    ${i > 0 ? '<div class="stack-connector"></div>' : ''}
    <div class="stack-block stack-block--${colorMap[layer.layer] || 'docker'}">
      <div class="stack-block__left">
        <div class="stack-block__tech">${layer.icon} ${layer.tech}</div>
        <div class="stack-block__detail">${layer.layer} · ${layer.detail}</div>
      </div>
      ${statusBadge(layer.status)}
    </div>
  `).join('');

  el.innerHTML = html;
}

/* Problem cards */
function buildProblems() {
  const el = document.getElementById('problems-grid');
  if (!el || !D?.problems) return;

  el.innerHTML = D.problems.map(p => `
    <div class="card problem-card" data-sev="${p.severity === 'CRÍTICO' ? 'critical' : 'high'}">
      <div class="flex justify-between items-start mb-5">
        <div class="flex flex-col gap-2">
          <span class="badge ${p.severity === 'CRÍTICO' ? 'badge--red' : 'badge--amber'}">${p.severity}</span>
          <div class="h-sm">${p.icon} ${p.title}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--font-display);font-size:2rem;font-weight:900;letter-spacing:-0.04em;color:${p.severity === 'CRÍTICO' ? 'var(--c-red)' : 'var(--c-amber)'};line-height:1">${p.metric}</div>
          <div style="font-size:0.7rem;color:var(--c-text-3);margin-top:2px">${p.metricLabel}</div>
        </div>
      </div>
      <p style="font-size:0.875rem;color:var(--c-text-2);line-height:1.7;margin-bottom:var(--sp-4)">${p.description}</p>
      <div class="sev-bar">
        <div class="sev-bar__fill ${p.fill > 60 ? 'sev-bar__fill--red' : 'sev-bar__fill--amber'}" data-w="${p.fill}"></div>
      </div>
      <div class="flex justify-between mt-2" style="font-size:0.7rem;color:var(--c-text-3)">
        <span>0%</span><span>${p.fill}%</span>
      </div>
    </div>
  `).join('');
}

/* Comparison table */
function buildComparisonTable() {
  const tbody = document.getElementById('comp-tbody');
  const thead = document.getElementById('comp-thead');
  if (!tbody || !thead || !D?.comparison) return;

  // Header
  thead.innerHTML = `<tr>${D.comparison.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

  // Highlight recommended column (index 1 = second column = Railway)
  const recIdx = D.comparison.rows.findIndex(r => r.recommended);

  // Re-build headers with highlight on recommended col
  thead.innerHTML = `<tr>${D.comparison.headers.map((h, i) => {
    if (i === recIdx + 1) return `<th class="rec">${h} ★</th>`;
    return `<th>${h}</th>`;
  }).join('')}</tr>`;

  tbody.innerHTML = D.comparison.rows.map(row => {
    const cls = row.recommended ? 'rec-row' : row.current ? 'current-row' : '';
    const nameExtra = row.recommended
      ? ` <span class="rec-marker">Recomendado</span>`
      : row.current
      ? ` <span class="badge badge--red" style="font-size:0.65rem">Actual</span>`
      : '';

    const tdCls = row.recommended ? 'rec' : '';

    return `<tr class="${cls}">
      <td class="row-name">${row.name}${nameExtra}</td>
      <td class="${tdCls}">${row.ram}</td>
      <td class="${tdCls}">${row.cpu}</td>
      <td class="${tdCls}">${row.db}</td>
      <td class="${tdCls}">${row.cicd  ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td>
      <td class="${tdCls}">${row.docker ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td>
      <td class="${tdCls}">${row.price}</td>
      <td class="${tdCls}">${row.scale}</td>
    </tr>`;
  }).join('');
}

/* Roadmap */
function buildRoadmap() {
  const el = document.getElementById('roadmap-list');
  if (!el || !D?.roadmap) return;

  el.innerHTML = D.roadmap.map((ph, i) => `
    <div class="roadmap__item" data-idx="${i}">
      <div class="roadmap__dot" style="background:${ph.color}"></div>
      <div class="roadmap__weeks">${ph.weeks} · ${ph.title}</div>
      <div class="roadmap__phase-pill" style="background:${ph.color}">
        Fase ${ph.phase}: ${ph.title}
      </div>
      <div>
        ${ph.tasks.map(t => `<div class="roadmap__task">${t}</div>`).join('')}
      </div>
    </div>
  `).join('');
}

/* Improvements */
function buildImprovements() {
  const el = document.getElementById('impr-grid');
  if (!el || !D?.improvements) return;

  el.innerHTML = D.improvements.map(item => `
    <div class="impr-card">
      <div class="impr-card__icon">${item.icon}</div>
      <div class="impr-card__title">${item.title}</div>
      <div class="impr-card__desc">${item.desc}</div>
    </div>
  `).join('');
}

/* Cost cards */
function buildCostCards() {
  renderCost('cost-current',  D?.costs?.current,  false);
  renderCost('cost-proposed', D?.costs?.proposed, true);
}

function renderCost(id, data, highlighted) {
  const el = document.getElementById(id);
  if (!el || !data) return;

  const rows = data.items.map(item => `
    <div class="cost-row">
      <span class="cost-row__name">${item.name}</span>
      <span class="cost-row__val">${item.cost === 0 ? 'Gratis' : '$' + item.cost + '/mo'}</span>
    </div>
  `).join('');

  el.className = `cost-card${highlighted ? ' cost-card--highlighted' : ''}`;
  el.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <div style="font-family:var(--font-display);font-weight:800;font-size:1.1rem">${data.label}</div>
      ${highlighted
        ? `<span class="badge badge--green">Propuesto</span>`
        : `<span class="badge badge--neutral">Actual</span>`}
    </div>
    ${rows}
    <div class="cost-total">
      <span class="cost-total__label">Total / mes</span>
      <span class="cost-total__val">$${data.total}<span style="font-size:1rem;font-weight:500">/mo</span></span>
    </div>
    <p style="font-size:0.78rem;color:var(--c-text-3);margin-top:var(--sp-3)">${data.note}</p>
  `;
}

/* ──────────────────────────────────────────
   GSAP + ScrollTrigger
   ────────────────────────────────────────── */
function initGSAP() {
  if (typeof gsap === 'undefined') { console.warn('[VeriSmart] GSAP not found'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ── Generic fade-up ── */
  gsap.utils.toArray('.gsap-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%' }
      }
    );
  });

  /* ── Stagger children ── */
  gsap.utils.toArray('.gsap-stagger').forEach(parent => {
    gsap.fromTo(Array.from(parent.children),
      { opacity: 0, y: 32 },
      {
        opacity: 1, y: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: parent, start: 'top 82%' }
      }
    );
  });

  /* ── Problems: slide in from left ── */
  gsap.fromTo('#problems-grid .card',
    { opacity: 0, x: -24 },
    {
      opacity: 1, x: 0,
      stagger: 0.12,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#problems-grid', start: 'top 82%' }
    }
  );

  /* ── Stack layers stagger ── */
  gsap.fromTo('#stack-diagram .stack-block',
    { opacity: 0, x: 24 },
    {
      opacity: 1, x: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#stack-diagram', start: 'top 80%' }
    }
  );

  /* ── KPI section — PIN ── */
  const kpiSec = document.querySelector('#section-kpis');
  if (kpiSec) {
    ScrollTrigger.create({
      trigger: kpiSec,
      start: 'top top',
      end: '+=600',
      pin: true,
      scrub: 1,
    });

    gsap.fromTo('#section-kpis .kpi-card',
      { opacity: 0, scale: 0.88, y: 16 },
      {
        opacity: 1, scale: 1, y: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'back.out(1.5)',
        scrollTrigger: { trigger: '#section-kpis', start: 'top 70%' }
      }
    );
  }

  /* ── Table rows slide in ── */
  gsap.fromTo('#comp-tbody tr',
    { opacity: 0, x: -16 },
    {
      opacity: 1, x: 0,
      stagger: 0.07,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#section-comparison', start: 'top 75%' }
    }
  );

  /* ── Arch diagram boxes ── */
  gsap.fromTo('#arch-boxes > *',
    { opacity: 0, y: 20 },
    {
      opacity: 1, y: 0,
      stagger: 0.15,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#arch-boxes', start: 'top 80%' }
    }
  );

  /* ── Cost cards ── */
  gsap.fromTo('#cost-current, #cost-proposed',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      stagger: 0.18,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#section-costs', start: 'top 78%' }
    }
  );

  /* ── Improvements grid ── */
  gsap.fromTo('#impr-grid .impr-card',
    { opacity: 0, y: 24 },
    {
      opacity: 1, y: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#impr-grid', start: 'top 80%' }
    }
  );

  /* ── Closing — PIN with logo entrance ── */
  const closeSec = document.querySelector('#section-closing');
  if (closeSec) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: closeSec,
        start: 'top top',
        end: '+=800',
        pin: true,
        scrub: 1,
      }
    });

    tl.fromTo('.closing-mark',    { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, duration: 0.35 })
      .fromTo('.closing-sub',     { opacity: 0, y: 24 },        { opacity: 1, y: 0,    duration: 0.25 }, 0.25)
      .fromTo('.closing-actions', { opacity: 0, y: 16 },        { opacity: 1, y: 0,    duration: 0.25 }, 0.45);
  }
}

/* ──────────────────────────────────────────
   Run
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
