import type { ChatMsg, Measurement } from '../types';

export function buildSystemPrompt(m: Measurement): string {
  const datos = {
    frecuencia_cardiaca_bpm: m.bpm,
    bpm_por_ECG: m.bpmEcg,
    bpm_por_sensor_dedo: m.bpmSensor,
    spo2_estimado_pct: m.spo2 || 'sin dato',
    calidad_senal: m.quality,
    latidos_detectados: m.beats,
    variabilidad_SDNN_ms: m.sdnn,
    electrodos_desconectados_pct: m.leadsOffPct,
    nivel: m.level,
    observaciones: m.notes,
    duracion_s: m.durationSec,
  };
  return `Eres el asistente de Bio-Heart, un prototipo educativo de monitoreo cardiovascular para una feria de ciencias en Panamá. Hablas con la persona a la que se le acaba de medir un ECG (AD8232) y pulso/oxígeno (MAX30102).

DATOS DE LA MEDICIÓN:
${JSON.stringify(datos)}

TU TRABAJO:
1. Explica los resultados en lenguaje sencillo, sin tecnicismos innecesarios.
2. Recopila información de contexto haciendo UNA pregunta corta por turno, en este orden: edad, si siente algún síntoma ahora (dolor o presión en el pecho, falta de aire, mareo, palpitaciones), si hizo ejercicio, tomó café o estuvo estresado en la última hora, y si tiene antecedentes cardíacos conocidos.
3. Relaciona sus respuestas con los datos (por ejemplo, un pulso alto después de café o ejercicio es esperable).
4. Cuando tengas la información, ofrece un resumen breve.

REGLAS:
- No diagnostiques ni recetes ni indiques dosis de medicamentos. Habla de posibilidades, no de certezas.
- Si la persona menciona dolor o presión en el pecho, falta de aire intensa, desmayo o confusión, indícale con claridad que busque atención médica urgente (llamar al 911) y no sigas con preguntas de rutina.
- Recuerda que SpO2 y ECG son estimaciones de un prototipo, no un equipo médico.
- Responde en español, cálido y breve (máximo 3 frases).
- Texto plano que se pueda leer en voz alta: sin markdown, sin listas, sin emojis, sin asteriscos.`;
}

export async function askClaude(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMsg[],
): Promise<string> {
  if (!apiKey) throw new Error('Falta la API key. Agrégala en Ajustes (⚙).');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 400, system, messages }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) {
    const msg = data?.error?.message || `Error ${res.status}`;
    if (res.status === 401) throw new Error('API key inválida. Revísala en Ajustes (⚙).');
    throw new Error(msg);
  }
  const text = (data?.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('La IA no devolvió texto.');
  return text;
}
