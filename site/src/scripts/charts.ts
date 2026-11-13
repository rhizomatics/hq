import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import type { ChartSpec } from '../lib/usage';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function config(spec: ChartSpec): ChartConfiguration {
  const text = css('--viz-text');
  const muted = css('--viz-muted');
  const grid = css('--viz-grid');
  const surface = css('--viz-surface');
  const many = spec.labels.length > 40;
  return {
    type: spec.type,
    data: {
      labels: spec.labels,
      datasets: spec.datasets.map((d) => {
        const color = css(`--viz-${d.slot}`);
        const type = d.type ?? spec.type;
        return type === 'line'
          ? {
              type: 'line' as const,
              label: d.label,
              data: d.data,
              borderColor: color,
              backgroundColor: color,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBorderColor: surface,
              pointHoverBorderWidth: 2,
              spanGaps: true,
              tension: 0,
            }
          : {
              type: 'bar' as const,
              label: d.label,
              data: d.data,
              backgroundColor: color,
              borderColor: surface,
              borderWidth: spec.stacked ? { top: 2 } : 0,
              borderRadius: 4,
              borderSkipped: 'start' as const,
              categoryPercentage: many ? 0.95 : 0.8,
              barPercentage: 0.9,
            };
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          stacked: spec.stacked,
          grid: { display: false },
          border: { color: grid },
          ticks: { color: muted, maxRotation: 0, autoSkip: true, autoSkipPadding: 16 },
        },
        y: {
          stacked: spec.stacked,
          beginAtZero: true,
          grid: { color: grid },
          border: { display: false },
          ticks: { color: muted, precision: 0 },
          title: spec.yLabel ? { display: true, text: spec.yLabel, color: muted } : undefined,
        },
      },
      plugins: {
        legend: {
          display: spec.datasets.length > 1,
          position: 'top',
          align: 'start',
          labels: { color: text, boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 2 },
        },
        tooltip: {
          backgroundColor: css('--viz-tooltip'),
          titleColor: text,
          bodyColor: text,
          footerColor: muted,
          borderColor: grid,
          borderWidth: 1,
          filter: (item) => item.raw != null,
          callbacks: {
            footer: (items) => {
              const extra = items.map((i) => spec.datasets[i.datasetIndex].extra?.[i.dataIndex]).filter(Boolean);
              if (extra.length) return extra.join('\n');
              if (!spec.stacked || items.length < 2) return '';
              const total = items.reduce((s, i) => s + (Number(i.raw) || 0), 0);
              return `Total ${total.toLocaleString('en-GB')}`;
            },
          },
        },
      },
    },
  };
}

export function renderCharts() {
  for (const figure of document.querySelectorAll<HTMLElement>('[data-chart]')) {
    if (figure.dataset.ready) continue;
    figure.dataset.ready = 'true';
    const views: Record<string, ChartSpec> = JSON.parse(figure.querySelector('script[type="application/json"]')!.textContent!);
    const canvas = figure.querySelector('canvas')!;
    let current = Object.keys(views)[0];
    let chart = new Chart(canvas, config(views[current]));
    const redraw = () => {
      chart.destroy();
      chart = new Chart(canvas, config(views[current]));
    };
    for (const button of figure.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      button.addEventListener('click', () => {
        current = button.dataset.view!;
        for (const b of figure.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b === button));
        redraw();
      });
    }
    // Starlight's theme switch changes data-theme; colours come from CSS, so redraw.
    new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}
