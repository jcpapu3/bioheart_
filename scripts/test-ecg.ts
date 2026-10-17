/* Prueba del procesamiento con ECG sintético (sin hardware). Uso: npm run test:ecg */
import { analyzeEcg } from '../src/services/ecgProcessor';
import { demoSample } from '../src/services/dataSource';
import { buildMeasurement } from '../src/services/interpreter';

const fs = 100;
const seconds = 60;
const samples: number[] = [];
const times: number[] = [];
for (let i = 0; i < fs * seconds; i++) {
  const t = i / fs;
  const ecg = Math.round(demoSample(t));
  samples.push(ecg);
  times.push(i * (1000 / fs));
}

const a = analyzeEcg(samples, times, 0);
console.log('ECG limpio  → bpm', a.bpm, '| picos', a.peaks.length, '| calidad', a.quality.toFixed(2), a.qualityLabel, '| fs', a.fs.toFixed(1));
const m = buildMeasurement(a, seconds, 0);
console.log('Nivel:', m.level, '|', m.headline, '| BPM final', m.bpm);

// Señal invertida (electrodos al revés)
const inv = analyzeEcg(samples.map((v) => 1023 - v), times, 0);
console.log('ECG invertido → bpm', inv.bpm, '| calidad', inv.qualityLabel);

// Solo ruido
const noise = samples.map(() => 512 + (Math.random() - 0.5) * 80);
const n = analyzeEcg(noise, times, 0);
console.log('Solo ruido  → bpm', n.bpm, '| picos', n.peaks.length, '| calidad', n.qualityLabel);

// Señal plana (electrodos sueltos)
const flat = analyzeEcg(samples.map(() => 512), times, 0);
console.log('Señal plana → bpm', flat.bpm, '| calidad', flat.qualityLabel);

// Frecuencia distinta: 110 BPM con la misma forma de onda
const fast: number[] = [];
for (let i = 0; i < fs * seconds; i++) {
  const t = i / fs;
  const ph = (t * 110) / 60 - Math.floor((t * 110) / 60);
  const g = (x: number, c: number, s: number) => Math.exp(-0.5 * ((x - c) / s) ** 2);
  const w = 1.0 * g(ph, 0.3, 0.02) - 0.2 * g(ph, 0.34, 0.02) + 0.25 * g(ph, 0.6, 0.05);
  fast.push(512 + 150 * w + (Math.random() - 0.5) * 8);
}
const f = analyzeEcg(fast, times, 0);
console.log('110 BPM     → bpm', f.bpm, '| calidad', f.qualityLabel);
