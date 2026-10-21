/* Procesamiento de ECG (AD8232). La frecuencia de muestreo se estima a partir
   de los tiempos reales de llegada, así funciona con cualquier tasa de envío. */

import type { EcgAnalysis, Quality } from '../types';

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function percentile(a: number[], p: number): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
}

function movingAverage(x: number[], w: number): number[] {
  const n = x.length;
  const half = Math.max(0, Math.floor(w / 2));
  const pre = new Array<number>(n + 1);
  pre[0] = 0;
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(n - 1, i + half);
    out[i] = (pre[hi + 1] - pre[lo]) / (hi - lo + 1);
  }
  return out;
}

export function qualityLabel(score: number): Quality {
  if (score >= 0.7) return 'good';
  if (score >= 0.4) return 'moderate';
  return 'poor';
}

function empty(fs: number): EcgAnalysis {
  return { fs, bpm: 0, sdnn: 0, rmssd: 0, regularity: 0, quality: 0, qualityLabel: 'poor', peaks: [], filtered: [] };
}

export function analyzeEcg(samples: number[], times: number[], leadsOffFraction = 0): EcgAnalysis {
  const n = samples.length;
  if (n < 20) return empty(0);

  const seconds = (times[n - 1] - times[0]) / 1000;
  const fs = seconds > 0 ? (n - 1) / seconds : 50;
  if (n < fs * 5) return empty(fs);

  // 1) Quitar línea base (promedio móvil ~0.75 s) y suavizar (~40 ms)
  const baseline = movingAverage(samples, Math.max(3, Math.round(0.75 * fs) | 1));
  const detr = samples.map((v, i) => v - baseline[i]);
  let x = movingAverage(detr, Math.max(1, Math.round(0.04 * fs) | 1));

  // 2) Polaridad: el latido (R) es el pico más grande; si salió invertido, se voltea
  const hi = percentile(x, 0.98);
  const lo = percentile(x, 0.02);
  if (Math.abs(lo) > Math.abs(hi)) x = x.map((v) => -v);

  // 3) Umbral y ruido (MAD)
  const p98 = percentile(x, 0.98);
  const med = median(x);
  const mad = median(x.map((v) => Math.abs(v - med))) * 1.4826;
  const thr = Math.max(0.5 * p98, 3 * mad);

  // 4) Picos R con periodo refractario de 300 ms
  const refr = Math.max(1, Math.round(0.3 * fs));
  const peaks: number[] = [];
  if (p98 > 0 && thr > 0) {
    for (let i = 1; i < n - 1; i++) {
      if (x[i] > thr && x[i] >= x[i - 1] && x[i] > x[i + 1]) {
        const last = peaks.length ? peaks[peaks.length - 1] : -1e9;
        if (i - last < refr) {
          if (x[i] > x[last]) peaks[peaks.length - 1] = i;
        } else {
          peaks.push(i);
        }
      }
    }
  }

  // 5) Intervalos RR, BPM y variabilidad
  const rrAll: number[] = [];
  for (let i = 1; i < peaks.length; i++) rrAll.push((peaks[i] - peaks[i - 1]) / fs);
  const rrValid = rrAll.filter((r) => r >= 0.3 && r <= 2.0);
  const rrMed = median(rrValid);
  const rrGood = rrMed > 0 ? rrValid.filter((r) => Math.abs(r - rrMed) <= 0.25 * rrMed) : [];
  const regularity = rrAll.length ? rrGood.length / rrAll.length : 0;
  const bpm = rrMed > 0 ? 60 / rrMed : 0;

  const rrMean = mean(rrGood);
  const sdnn = rrGood.length > 1 ? Math.sqrt(mean(rrGood.map((r) => (r - rrMean) ** 2))) * 1000 : 0;
  const diffs: number[] = [];
  for (let i = 1; i < rrGood.length; i++) diffs.push(rrGood[i] - rrGood[i - 1]);
  const rmssd = diffs.length ? Math.sqrt(mean(diffs.map((d) => d * d))) * 1000 : 0;

  // 6) Calidad: regularidad de latidos + electrodos conectados + relación señal/ruido
  const snr = mad > 0 ? p98 / mad : 0;
  let quality = 0.5 * regularity + 0.2 * (1 - leadsOffFraction) + 0.3 * Math.min(1, snr / 8);
  if (peaks.length < 4) quality = Math.min(quality, 0.3);
  quality = Math.max(0, Math.min(1, quality));

  return {
    fs,
    bpm: Math.round(bpm),
    sdnn: Math.round(sdnn),
    rmssd: Math.round(rmssd),
    regularity,
    quality,
    qualityLabel: qualityLabel(quality),
    peaks,
    filtered: x,
  };
}
