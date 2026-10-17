/* Interpretación educativa. Nunca diagnostica: solo describe y orienta. */

import type { EcgAnalysis, Level, Measurement } from '../types';

export function buildMeasurement(analysis: EcgAnalysis, durationSec: number, leadsOffPct: number): Measurement {
  const bpm = analysis.bpm;
  const notes: string[] = [];
  const advice: string[] = [];
  let level = 'stable' as Level;
  let headline = 'Los datos registrados no muestran una alteración evidente en esta medición.';

  const raise = (l: Level) => {
    const order: Level[] = ['stable', 'review', 'attention'];
    if (order.indexOf(l) > order.indexOf(level)) level = l;
  };

  if (analysis.qualityLabel === 'poor' || bpm === 0) {
    raise('review');
    headline = 'No se obtuvo una señal suficientemente clara para interpretar.';
    if (leadsOffPct > 20) notes.push(`Los electrodos estuvieron desconectados el ${Math.round(leadsOffPct)}% del tiempo.`);
    advice.push(
      'Revisa que los electrodos estén firmes y la piel limpia y seca.',
      'Permanece quieto, sin hablar, y repite la medición.',
    );
  } else {
    if (analysis.qualityLabel === 'moderate') {
      notes.push('La señal tiene algo de ruido, interprétala con cautela.');
    }

    if (bpm < 40 || bpm > 120) {
      raise('attention');
      notes.push(`Frecuencia cardíaca de ${bpm} BPM, bastante fuera del rango habitual en reposo (50-100).`);
    } else if (bpm < 50 || bpm > 100) {
      raise('review');
      notes.push(`Frecuencia cardíaca de ${bpm} BPM, fuera del rango habitual en reposo (50-100).`);
    }

    if (analysis.regularity < 0.7 && analysis.peaks.length >= 8) {
      raise('review');
      notes.push('Los intervalos entre latidos fueron poco regulares en esta medición.');
    }

    if (leadsOffPct > 10) {
      notes.push(`Los electrodos estuvieron desconectados el ${Math.round(leadsOffPct)}% del tiempo.`);
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
    waveform: analysis.filtered.slice(-Math.round(6 * (analysis.fs || 100))),
  };
}
