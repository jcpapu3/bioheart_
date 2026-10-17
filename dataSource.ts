/* Fuente de datos: Bluetooth clásico (HC-05) o modo demostración.
   El Arduino envía una línea por muestra con el valor del ECG:  512\n
   (se ignoran columnas extra por si el formato antiguo  ecg,bpm,spo2  sigue cargado) */

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { BluetoothSerial } from '@e-is/capacitor-bluetooth-serial';
import type { Device, Packet } from '../types';

export function parseLine(line: string): Packet | null {
  const first = line.trim().split(',')[0];
  if (first === '') return null;
  const ecg = Number(first);
  if (Number.isNaN(ecg) || ecg < -1 || ecg > 1023) return null;
  return { ecg, t: Date.now() };
}

export const isNative = Capacitor.isNativePlatform();

let address = '';
let listener: PluginListenerHandle | null = null;
let buffer = '';
let demoTimer: ReturnType<typeof setInterval> | null = null;

export const bluetooth = {
  async ensureEnabled(): Promise<void> {
    const s = await BluetoothSerial.isEnabled();
    if (!s.enabled) await BluetoothSerial.enable();
  },

  async scan(): Promise<Device[]> {
    await this.ensureEnabled();
    const r = await BluetoothSerial.scan();
    const seen = new Map<string, Device>();
    for (const d of r.devices) seen.set(d.address, { name: d.name || 'Sin nombre', address: d.address });
    return [...seen.values()];
  },

  async connect(addr: string): Promise<void> {
    await this.ensureEnabled();
    try {
      await BluetoothSerial.connect({ address: addr });
    } catch {
      await BluetoothSerial.connectInsecure({ address: addr });
    }
    address = addr;
  },

  async startStream(cb: (p: Packet) => void): Promise<void> {
    await this.stopStream();
    buffer = '';
    listener = await BluetoothSerial.addListener('onRead', (ev) => {
      buffer += ev.value;
      if (buffer.length > 400) buffer = buffer.slice(-100);
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const l of lines) {
        const p = parseLine(l);
        if (p) cb(p);
      }
    });
    await BluetoothSerial.startNotifications({ address, delimiter: '\n' });
  },

  async stopStream(): Promise<void> {
    try {
      if (listener) await listener.remove();
    } catch {
      /* nada */
    }
    listener = null;
    try {
      if (address) await BluetoothSerial.stopNotifications({ address });
    } catch {
      /* nada */
    }
  },

  async disconnect(): Promise<void> {
    await this.stopStream();
    try {
      if (address) await BluetoothSerial.disconnect({ address });
    } catch {
      /* nada */
    }
    address = '';
  },
};

/* ---------- Modo demostración: ECG sintético a 100 Hz ---------- */

const g = (x: number, c: number, s: number) => Math.exp(-0.5 * ((x - c) / s) ** 2);

export function demoSample(tSec: number): number {
  // 72 BPM con pequeña variabilidad (la fase se integra para que la frecuencia sea correcta)
  const w = 2 * Math.PI * 0.1;
  const cycles = (72 * tSec + (3 / w) * (1 - Math.cos(w * tSec))) / 60;
  const phase = cycles - Math.floor(cycles);
  const wave =
    0.12 * g(phase, 0.16, 0.025) -
    0.1 * g(phase, 0.28, 0.012) +
    1.0 * g(phase, 0.3, 0.014) -
    0.2 * g(phase, 0.33, 0.014) +
    0.28 * g(phase, 0.55, 0.05);
  const wander = 15 * Math.sin(2 * Math.PI * 0.2 * tSec);
  const noise = (Math.random() - 0.5) * 8;
  return Math.max(0, Math.min(1023, 512 + 150 * wave + wander + noise));
}

export const demo = {
  start(cb: (p: Packet) => void): void {
    demo.stop();
    const t0 = performance.now();
    demoTimer = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      cb({ ecg: Math.round(demoSample(t)), t: Date.now() });
    }, 10);
  },
  stop(): void {
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = null;
  },
};
