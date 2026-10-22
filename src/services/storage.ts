import { DEFAULT_MODEL, MODELS } from '../config';
import type { Settings } from '../types';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: se ignora */
  }
}

export const loadSettings = (): Settings => {
  const s = load<Settings>('bh_settings', { apiKey: '', model: DEFAULT_MODEL, voice: true });
  // Si había guardado un modelo que ya no existe, se usa el predeterminado
  if (!MODELS.some((m) => m.id === s.model)) s.model = DEFAULT_MODEL;
  return s;
};

export const saveSettings = (s: Settings) => save('bh_settings', s);
