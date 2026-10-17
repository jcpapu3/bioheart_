// Duración del escaneo (segundos). Cámbiala aquí si quieren más o menos tiempo.
export const SCAN_SECONDS = 60;

// Modelos de Google Gemini con capa gratuita
export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (recomendado)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (más límite gratis)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
];

export const DISCLAIMER =
  'Bio-Heart es un prototipo educativo. Sus resultados no constituyen un diagnóstico médico y no sustituyen la evaluación de un profesional de la salud.';

export const STEP_NAMES = ['Conexión', 'Electrodos', 'Escaneo', 'Resultados'];
