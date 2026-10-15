// Duración del escaneo (segundos). Cámbiala aquí si quieren más o menos tiempo.
export const SCAN_SECONDS = 60;

export const DEFAULT_MODEL = 'claude-haiku-5-5';
export const MODELS = [
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 (rápido y barato)' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 (más completo)' },
];

export const DISCLAIMER =
  'Bio-Heart es un prototipo educativo. Sus resultados no constituyen un diagnóstico médico y no sustituyen la evaluación de un profesional de la salud.';

export const STEP_NAMES = ['Conexión', 'Electrodos', 'Escaneo', 'Resultados'];
