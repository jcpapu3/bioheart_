/* Asistente de IA con Google Gemini (API gratuita).
   Clave gratis en https://aistudio.google.com/apikey */

import type { ChatMsg, Measurement } from '../types';

export function buildSystemPrompt(m: Measurement): string {
  const datos = {
    frecuencia_cardiaca_bpm: m.bpm,
    calidad_senal: m.quality,
    latidos_detectados: m.beats,
    variabilidad_SDNN_ms: m.sdnn,
    electrodos_desconectados_pct: m.leadsOffPct,
    nivel: m.level,
    observaciones: m.notes,
    duracion_s: m.durationSec,
  };
  return `Eres el asistente de Bio-Heart, un prototipo educativo de monitoreo cardiovascular para una feria de ciencias en Panamá. Hablas con la persona a la que se le acaba de medir un ECG (AD8232).

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
- Recuerda que el ECG de este prototipo es una estimación, no un equipo médico.
- Responde en español, cálido y breve (máximo 3 frases).
- Texto plano que se pueda leer en voz alta: sin markdown, sin listas, sin emojis, sin asteriscos.`;
}

export async function askAI(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMsg[],
): Promise<string> {
  if (!apiKey) throw new Error('Falta la API key de Gemini. Agrégala en Ajustes (⚙).');

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      // Margen amplio: los modelos nuevos gastan parte en "pensar" antes de responder
      generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
    }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    const msg: string = data?.error?.message || `Error ${res.status}`;
    if (res.status === 400 && /api key/i.test(msg)) throw new Error('API key inválida. Revísala en Ajustes (⚙).');
    if (res.status === 401 || res.status === 403) throw new Error('La API key no funciona o no tiene permiso. Revísala en Ajustes (⚙).');
    if (res.status === 404) throw new Error('Ese modelo no está disponible. Elige otro en Ajustes (⚙).');
    if (res.status === 429) throw new Error('Límite gratis alcanzado. Espera un minuto o elige el modelo "lite" en Ajustes.');
    throw new Error(msg);
  }

  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: any) => typeof p.text === 'string' && !p.thought)
    .map((p: any) => p.text)
    .join('')
    .trim();

  if (!text) {
    if (data?.promptFeedback?.blockReason) throw new Error('La IA no pudo responder a eso. Intenta de otra forma.');
    throw new Error('La IA no devolvió texto. Intenta de nuevo.');
  }
  return text;
}
