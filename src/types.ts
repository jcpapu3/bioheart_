export interface Packet {
  ecg: number; // 0-1023, -1 = electrodos desconectados
  bpm: number; // BPM del MAX30102 (0 = sin dedo)
  spo2: number; // SpO2 estimado (0 = sin dedo)
  t: number; // timestamp ms
}

export type Level = 'stable' | 'review' | 'attention';
export type Quality = 'good' | 'moderate' | 'poor';

export interface EcgAnalysis {
  fs: number;
  bpm: number;
  sdnn: number;
  rmssd: number;
  regularity: number;
  quality: number;
  qualityLabel: Quality;
  peaks: number[];
  filtered: number[];
}

export interface Measurement {
  id: string;
  date: string;
  durationSec: number;
  bpm: number; // valor final mostrado
  bpmEcg: number;
  bpmSensor: number;
  spo2: number;
  quality: Quality;
  qualityScore: number;
  beats: number;
  sdnn: number;
  rmssd: number;
  leadsOffPct: number;
  level: Level;
  headline: string;
  notes: string[];
  advice: string[];
  waveform: number[];
}

export interface Device {
  name: string;
  address: string;
}

export interface Connection {
  mode: 'bt' | 'demo';
  device?: Device;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface Settings {
  apiKey: string;
  model: string;
  voice: boolean;
}
