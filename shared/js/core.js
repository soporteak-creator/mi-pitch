/* ==========================================================
   core.js — Funciones compartidas · VeriSmart Pitch
   ========================================================== */

'use strict';

/* ──────────────────────────────────────────
   Progress Bar
   ────────────────────────────────────────── */
function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
}

/* ──────────────────────────────────────────
   Animated counter (vanilla rAF)
   ────────────────────────────────────────── */
function animCounter(el, to, duration) {
  const isFloat   = !Number.isInteger(to);
  const prefix    = el.dataset.prefix || '';
  const suffix    = el.dataset.suffix || '';
  const start     = performance.now();

  function tick(now) {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);           // easeOutCubic
    const cur  = isFloat
      ? (to * ease).toFixed(1)
      : Math.round(to * ease);
    el.textContent = prefix + cur + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* observe counters, fire once on enter */
function initCounters() {
  const els = document.querySelectorAll('[data-counter]');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target._counted) {
        e.target._counted = true;
        animCounter(
          e.target,
          parseFloat(e.target.dataset.counter),
          parseInt(e.target.dataset.duration || '1800')
        );
      }
    });
  }, { threshold: 0.4 });

  els.forEach(el => obs.observe(el));
}

/* ──────────────────────────────────────────
   Video autoplay (phone mockup) — IntersectionObserver
   ────────────────────────────────────────── */
function initVideoAutoplay() {
  const vids = document.querySelectorAll('.phone__screen video, [data-autoplay]');
  if (!vids.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.muted = true;
        e.target.loop  = true;
        e.target.playsInline = true;
        e.target.play().catch(() => {});
      } else {
        e.target.pause();
      }
    });
  }, { threshold: 0.4 });

  vids.forEach(v => { v.muted = true; v.loop = true; v.playsInline = true; obs.observe(v); });
}

/* Videos that play on hover (cards) */
function initVideoHover() {
  document.querySelectorAll('[data-video-hover]').forEach(card => {
    const v = card.querySelector('video');
    if (!v) return;
    v.muted = true; v.loop = true; v.playsInline = true;
    card.addEventListener('mouseenter', () => v.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
  });
}

/* ──────────────────────────────────────────
   Severity bars — animate width on scroll enter
   ────────────────────────────────────────── */
function initSeverityBars() {
  const fills = document.querySelectorAll('.sev-bar__fill[data-w]');
  if (!fills.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.w + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  fills.forEach(f => obs.observe(f));
}

/* ──────────────────────────────────────────
   Roadmap — stagger animate on scroll
   ────────────────────────────────────────── */
function initRoadmap() {
  const items = document.querySelectorAll('.roadmap__item');
  if (!items.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, _) => {
      if (e.isIntersecting) {
        const idx = parseInt(e.target.dataset.idx || '0');
        setTimeout(() => e.target.classList.add('visible'), idx * 120);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => obs.observe(el));
}

/* ──────────────────────────────────────────
   Chart.js growth chart (triggered on scroll)
   ────────────────────────────────────────── */
function initGrowthChart(canvasId, chartData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  let initialized = false;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !initialized) {
      initialized = true;
      obs.disconnect();
      buildChart(canvas, chartData);
    }
  }, { threshold: 0.3 });

  obs.observe(canvas);
}

function buildChart(canvas, chartData) {
  const ctx = canvas.getContext('2d');

  const gradRed  = ctx.createLinearGradient(0, 0, 0, 320);
  gradRed.addColorStop(0, 'rgba(229,62,62,0.25)');
  gradRed.addColorStop(1, 'rgba(229,62,62,0)');

  const gradTeal = ctx.createLinearGradient(0, 0, 0, 320);
  gradTeal.addColorStop(0, 'rgba(11,167,147,0.2)');
  gradTeal.addColorStop(1, 'rgba(11,167,147,0)');

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'RAM en uso (%)',
          data: chartData.ramUsage,
          borderColor: '#E53E3E',
          backgroundColor: gradRed,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#E53E3E',
          pointRadius: 4,
          pointHoverRadius: 7,
        },
        {
          label: 'Storage DB (%)',
          data: chartData.storageUsage,
          borderColor: '#0BA793',
          backgroundColor: gradTeal,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0BA793',
          pointRadius: 4,
          pointHoverRadius: 7,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1600, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#6B7280', font: { family: 'DM Mono', size: 12 }, boxWidth: 12, padding: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(10,15,30,0.92)',
          titleColor: '#F0F4FF',
          bodyColor:  'rgba(240,244,255,0.65)',
          padding: 14,
          cornerRadius: 10,
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(10,15,30,0.05)' },
          ticks: { color: '#9CA3AF', font: { family: 'DM Mono', size: 11 } }
        },
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(10,15,30,0.05)' },
          ticks: {
            color: '#9CA3AF',
            font: { family: 'DM Mono', size: 11 },
            callback: v => v + '%'
          }
        }
      }
    }
  });
}

/* ──────────────────────────────────────────
   Stagger reveal on page load
   ────────────────────────────────────────── */
function staggerReveal(selector, baseDelay, stepDelay) {
  const els = document.querySelectorAll(selector);
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    const delay = baseDelay + i * stepDelay;
    setTimeout(() => {
      el.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 20);
  });
}

/* ──────────────────────────────────────────
   Nav dark/light switching by section
   ────────────────────────────────────────── */
function initNavObserver() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const darkSections = document.querySelectorAll('.section--dark, .section--dark2, [data-nav-dark]');
  if (!darkSections.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) nav.classList.add('dark');
      else {
        // check if any dark section is still visible
        const anyDark = Array.from(darkSections).some(s => s.getBoundingClientRect().top < window.innerHeight / 2 && s.getBoundingClientRect().bottom > 0);
        if (!anyDark) nav.classList.remove('dark');
      }
    });
  }, { threshold: 0.1 });

  darkSections.forEach(s => obs.observe(s));
}

/* ──────────────────────────────────────────
   Auto-init
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initCounters();
  initVideoAutoplay();
  initVideoHover();
  initSeverityBars();
  initRoadmap();
  initNavObserver();
});
