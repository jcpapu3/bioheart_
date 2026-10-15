/* Interpretación educativa. Nunca diagnostica: solo describe y orienta. */

import type { EcgAnalysis, Level, Measurement, Packet } from '../types';

const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

export function buildMeasurement(
  packets: Packet[],
  analysis: EcgAnalysis,
  durationSec: number,
  leadsOffPct: number,
): Measurement {
  // Valores del MAX30102: se usa la segunda mitad (ya estabilizado)
  const half = packets.slice(Math.floor(packets.length / 2));
  const bpmSensor = Math.round(avg(half.filter((p) => p.bpm > 0).map((p) => p.bpm)));
  const spo2 = Math.round(avg(half.filter((p) => p.spo2 > 0).map((p) => p.spo2)));

  const ecgOk = analysis.bpm > 0 && analysis.qualityLabel !== 'poor';
  const bpm = ecgOk ? analysis.bpm : bpmSensor || analysis.bpm;

  const notes: string[] = [];
  const advice: string[] = [];
  let level = 'stable' as Level;
  let headline = 'Los datos registrados no muestran una alteración evidente en esta medición.';

  const raise = (l: Level) => {
    const order: Level[] = ['stable', 'review', 'attention'];
    if (order.indexOf(l) > order.indexOf(level)) level = l;
  };

  if (analysis.qualityLabel === 'poor' && !bpmSensor) {
    raise('review');
    headline = 'No se obtuvo una señal suficientemente clara para interpretar.';
    advice.push('Revisa que los electrodos estén firmes y la piel limpia y seca.', 'Permanece quieto y repite la medición.');
  } else {
    if (analysis.qualityLabel === 'poor') {
      raise('review');
      notes.push('La señal ECG tuvo mala calidad; el pulso se tomó del sensor del dedo.');
    } else if (analysis.qualityLabel === 'moderate') {
      notes.push('La señal ECG tiene algo de ruido, interprétala con cautela.');
    }

    if (bpm > 0 && (bpm < 40 || bpm > 120)) {
      raise('attention');
      notes.push(`Frecuencia cardíaca de ${bpm} BPM, bastante fuera del rango habitual en reposo (50-100).`);
    } else if (bpm > 0 && (bpm < 50 || bpm > 100)) {
      raise('review');
      notes.push(`Frecuencia cardíaca de ${bpm} BPM, fuera del rango habitual en reposo (50-100).`);
    }

    if (spo2 > 0 && spo2 < 90) {
      raise('attention');
      notes.push(`Saturación de oxígeno estimada baja (${spo2}%).`);
    } else if (spo2 > 0 && spo2 < 95) {
      raise('review');
      notes.push(`Saturación de oxígeno estimada algo baja (${spo2}%).`);
    }

    if (analysis.qualityLabel !== 'poor' && analysis.regularity < 0.7 && analysis.peaks.length >= 8) {
      raise('review');
      notes.push('Los intervalos entre latidos fueron poco regulares en esta medición.');
    }

    if (analysis.bpm > 0 && bpmSensor > 0 && Math.abs(analysis.bpm - bpmSensor) > 15) {
      notes.push(`El ECG (${analysis.bpm}) y el sensor del dedo (${bpmSensor}) no coinciden; repite la medición.`);
    }

    if (level === 'review') {
      headline = 'Hay datos que conviene revisar.';
      advice.push('Repite la medición en reposo, sentado y sin hablar.', 'Si algo se repite o te preocupa, consulta a un profesional de la salud.');
    } else if (level === 'attention') {
      headline = 'El resultado es inusual y debe interpretarse con precaución.';
      advice.push(
        'Si sientes dolor o presión en el pecho, falta de aire, mareo o desmayo, busca atención médica urgente (911).',
        'No intentes diagnosticarte por tu cuenta. Repite la medición con supervisión.',
      );
    } else {
      advice.push('Mantén hábitos saludables: descanso, hidratación y actividad física.', 'Repite la medición en condiciones similares si quieres comparar.');
    }
  }

  return {
    id: String(Date.now()),
    date: new Date().toISOString(),
    durationSec: Math.round(durationSec),
    bpm,
    bpmEcg: analysis.bpm,
    bpmSensor,
    spo2,
    quality: analysis.qualityLabel,
    qualityScore: Math.round(analysis.quality * 100) / 100,
    beats: analysis.peaks.length,
    sdnn: analysis.sdnn,
    rmssd: analysis.rmssd,
    leadsOffPct: Math.round(leadsOffPct),
    level,
    headline,
    notes,
    advice,
    waveform: analysis.filtered.slice(-Math.round(6 * (analysis.fs || 50))),
  };
}
