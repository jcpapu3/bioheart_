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

  // 1) Quitar línea base (~0.75 s) y suavizar (~40 ms, 2 pasadas)
  const despiked = samples;
  const baseline = movingAverage(despiked, Math.max(3, Math.round(0.75 * fs) | 1));
  const detr = despiked.map((v, i) => v - baseline[i]);
  const sw = Math.max(3, Math.round(0.04 * fs) | 1);
  let x = movingAverage(movingAverage(detr, sw), sw); // 2 pasadas ≈ filtro con forma de latido

  // 2) Nivel de ruido (MAD) y altura típica de los picos fuertes
  const med = median(x);
  const mad = median(x.map((v) => Math.abs(v - med))) * 1.4826;
  const p98 = percentile(x, 0.98);
  const p02 = percentile(x, 0.02);
  const sign = Math.abs(p02) > Math.abs(p98) ? -1 : 1; // si el latido sale hacia abajo, se voltea
  if (sign < 0) x = x.map((v) => -v);

  // 3) Candidatos: máximos locales positivos separados al menos 300 ms (gana el más alto)
  const refr = Math.max(1, Math.round(0.3 * fs));
  const cand: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (x[i] > 0 && x[i] >= x[i - 1] && x[i] > x[i + 1]) {
      const last = cand.length ? cand[cand.length - 1] : -1e9;
      if (i - last < refr) {
        if (x[i] > x[last]) cand[cand.length - 1] = i;
      } else {
        cand.push(i);
      }
    }
  }
  // Un latido de verdad destaca claramente del ruido: mínimo 3 × MAD y 40 % de la altura típica
  const heights = cand.map((i) => x[i]).sort((p, q) => q - p);
  const top = heights.slice(0, Math.max(1, Math.ceil(heights.length * 0.3)));
  const thr = Math.max(0.4 * median(top), 3.0 * mad);
  const peaks = cand.filter((i) => x[i] >= thr);

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

  // 6) Calidad de la SEÑAL (no del ritmo): relación señal/ruido + electrodos + cuántos latidos
  //    esperados se detectaron. La regularidad del ritmo se reporta aparte.
  const snr = mad > 0 ? median(peaks.map((i) => x[i])) / mad : 0;
  const expected = bpm > 0 ? (seconds * bpm) / 60 : 0;
  const coverage = expected > 0 ? Math.min(1, peaks.length / expected) : 0;
  let quality = 0.6 * Math.min(1, snr / 8) + 0.2 * (1 - leadsOffFraction) + 0.2 * coverage;
  if (peaks.length < 4) quality = Math.min(quality, 0.3);
  if (bpm === 0) quality = Math.min(quality, 0.35);
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
