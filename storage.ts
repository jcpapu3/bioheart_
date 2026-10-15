import { DEFAULT_MODEL } from '../config';
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

export const loadSettings = (): Settings =>
  load<Settings>('bh_settings', { apiKey: '', model: DEFAULT_MODEL, voice: true });

export const saveSettings = (s: Settings) => save('bh_settings', s);
