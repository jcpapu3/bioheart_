import { useEffect, useRef, useState } from 'react';
import { Button, EcgChart } from './ui';
import { SCAN_SECONDS } from '../config';
import { bluetooth, demo } from '../services/dataSource';
import { analyzeEcg } from '../services/ecgProcessor';
import { buildMeasurement } from '../services/interpreter';
import type { Connection, Measurement, Packet } from '../types';

export function ScanScreen({
  conn,
  onDone,
  onCancel,
}: {
  conn: Connection;
  onDone: (m: Measurement) => void;
  onCancel: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState<number[]>([]);
  const [live, setLive] = useState({ bpm: 0, leadsOff: false });

  const packets = useRef<Packet[]>([]);
  const startedAt = useRef(0);
  const wake = useRef<any>(null);

  const stopSource = async () => {
    demo.stop();
    if (conn.mode === 'bt') await bluetooth.stopStream();
    try {
      await wake.current?.release();
    } catch {
      /* nada */
    }
  };

  useEffect(() => () => void stopSource(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setError('');
    packets.current = [];
    setElapsed(0);
    setView([]);
    try {
      wake.current = await (navigator as any).wakeLock?.request('screen');
    } catch {
      /* sin wake lock: no pasa nada */
    }
    const onPacket = (p: Packet) => packets.current.push(p);
    try {
      if (conn.mode === 'demo') demo.start(onPacket);
      else await bluetooth.startStream(onPacket);
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar la lectura. ¿Sigue conectado el HC-05?');
      return;
    }
    startedAt.current = Date.now();
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      const secs = (Date.now() - startedAt.current) / 1000;
      const all = packets.current;
      const lastT = all.length ? all[all.length - 1].t : 0;
      let i = all.length;
      while (i > 0 && lastT - all[i - 1].t <= 3000) i--; // últimos 3 s para la gráfica
      const recent = all.slice(i);
      let j = all.length;
      while (j > 0 && lastT - all[j - 1].t <= 10000) j--; // últimos 10 s para el pulso en vivo
      const win = all.slice(j).filter((p) => p.ecg >= 0);
      const est = win.length > 300 ? analyzeEcg(win.map((p) => p.ecg), win.map((p) => p.t)).bpm : 0;
      setElapsed(Math.min(secs, SCAN_SECONDS));
      setView(recent.filter((p) => p.ecg >= 0).map((p) => p.ecg));
      setLive({
        bpm: est,
        leadsOff: recent.length > 20 && recent.slice(-25).every((p) => p.ecg === -1),
      });

      if (secs >= SCAN_SECONDS) {
        clearInterval(id);
        setRunning(false);
        await stopSource();
        const ecgPk = all.filter((p) => p.ecg >= 0);
        const leadsOffPct = all.length ? ((all.length - ecgPk.length) / all.length) * 100 : 100;
        const analysis = analyzeEcg(
          ecgPk.map((p) => p.ecg),
          ecgPk.map((p) => p.t),
          leadsOffPct / 100,
        );
        onDone(buildMeasurement(analysis, SCAN_SECONDS, leadsOffPct));
      }
    }, 200);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, Math.ceil(SCAN_SECONDS - elapsed));

  const alert = running && live.leadsOff ? 'Electrodos sueltos: revisa que estén bien pegados' : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-line bg-card px-5 py-4 shadow-card">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-heart text-2xl ${running ? 'ring' : ''}`}>
            <span className={running ? 'beat' : ''}>❤️</span>
          </div>
          <div>
            <p className="text-4xl font-bold tabular-nums text-ink">
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted">{running ? 'Quieto y sin hablar' : 'Listo para iniciar'}</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm text-emerald-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Conectado
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-card2">
        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${(elapsed / SCAN_SECONDS) * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-card p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm font-semibold text-heart">♥ BPM</p>
          <p className="mt-2 text-5xl font-bold text-ink">
            {running && live.bpm > 0 ? live.bpm : '--'} <span className="text-base font-medium text-muted">lpm</span>
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300">💧 Electrodos</p>
          <p className="mt-2 text-4xl font-bold text-ink">{!running ? '--' : live.leadsOff ? 'Sueltos' : 'Bien'}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-card p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300">◆ ECG</p>
        <EcgChart data={view} height={150} />
        <div className="mt-1 flex justify-between px-1 text-xs text-muted">
          <span>-3 s</span><span>-2 s</span><span>-1 s</span><span>ahora</span>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          alert ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
        }`}
      >
        <span>⚠</span> {alert || 'Sin alertas'}
      </div>
      {error && <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          className={running ? 'flex-1' : ''}
          onClick={async () => {
            setRunning(false);
            await stopSource();
            onCancel();
          }}
        >
          {running ? 'Desconectar' : '← Atrás'}
        </Button>
        {!running && (
          <Button variant="blue" className="flex-1" onClick={start}>
            INICIAR ESCANEO
          </Button>
        )}
      </div>
    </div>
  );
}
