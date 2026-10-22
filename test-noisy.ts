/* Prueba con ECG sintético MUY ruidoso (parecido a lo que da el AD8232 mal conectado). Uso: npm run test:noisy */
import { analyzeEcg } from '../src/services/ecgProcessor';

const g = (x: number, c: number, s: number) => Math.exp(-0.5 * ((x - c) / s) ** 2);
function ecg(t: number, bpm: number) {
  const f = bpm / 60;
  const ph = t * f - Math.floor(t * f);
  return 1.0 * g(ph, 0.3, 0.02) - 0.15 * g(ph, 0.34, 0.02) + 0.2 * g(ph, 0.6, 0.04) + 0.08 * g(ph, 0.1, 0.03);
}
function run(label: string, fs: number, bpm: number, noiseAmp: number, alias10 = 0, spikes = 0) {
  const n = fs * 60;
  const s: number[] = [];
  const t: number[] = [];
  for (let i = 0; i < n; i++) {
    const tt = i / fs;
    let v = 512 + 100 * ecg(tt, bpm);
    v += 60 * Math.sin(2 * Math.PI * 0.25 * tt); // deriva respiración
    v += (Math.random() - 0.5) * 2 * noiseAmp; // ruido de banda ancha
    v += alias10 * Math.sin(2 * Math.PI * (fs === 50 ? 10 : 7) * tt + 1); // zumbido aliasado
    if (spikes && Math.random() < spikes) v += (Math.random() - 0.5) * 400;
    s.push(Math.max(0, Math.min(1023, Math.round(v))));
    t.push(i * (1000 / fs));
  }
  const a = analyzeEcg(s, t, 0);
  console.log(label.padEnd(34), '→ real', bpm, '| bpm', String(a.bpm).padStart(3), '| picos', String(a.peaks.length).padStart(3), '| calidad', a.quality.toFixed(2), a.qualityLabel);
}
for (const fs of [50, 60]) {
  console.log('--- fs', fs);
  run('limpio', fs, 72, 3);
  run('ruido medio', fs, 72, 40);
  run('ruido alto', fs, 72, 80);
  run('ruido + zumbido 10 Hz', fs, 72, 40, 40);
  run('ruido + picos sueltos', fs, 72, 40, 0, 0.02);
  run('ruido + zumbido + picos', fs, 90, 50, 40, 0.02);
}
console.log('--- solo ruido (debe dar calidad pobre)');
{
  const fs = 50, s: number[] = [], t: number[] = [];
  for (let i = 0; i < fs * 60; i++) { s.push(Math.round(512 + (Math.random() - 0.5) * 300)); t.push(i * 20); }
  const a = analyzeEcg(s, t, 0);
  console.log('solo ruido'.padEnd(34), '→ bpm', a.bpm, '| picos', a.peaks.length, '| calidad', a.quality.toFixed(2), a.qualityLabel);
}
