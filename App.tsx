import { useState } from 'react';
import { ConnectScreen } from './components/ConnectScreen';
import { PrepareScreen } from './components/PrepareScreen';
import { ScanScreen } from './components/ScanScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { SettingsModal } from './components/SettingsModal';
import { Logo } from './components/ui';
import { DISCLAIMER } from './config';
import { bluetooth } from './services/dataSource';
import { loadSettings, saveSettings } from './services/storage';
import type { Connection, Measurement, Settings } from './types';

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [conn, setConn] = useState<Connection | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  const newMeasurement = async () => {
    setMeasurement(null);
    setStep(conn ? 2 : 1);
  };

  const disconnect = async () => {
    if (conn?.mode === 'bt') await bluetooth.disconnect();
    setConn(null);
    setMeasurement(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-bg" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="border-b border-line bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-bold leading-tight text-ink">
                Bio<span className="text-cyan-400">-Heart</span>
              </h1>
              <p className="text-xs text-muted">
                Tu salud, en tiempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conn && step !== 3 && (
              <button onClick={disconnect} className="rounded-xl border border-line bg-card2 px-3 py-2 text-xs text-slate-300">Desconectar</button>
            )}
            <button onClick={() => setShowSettings(true)} className="rounded-xl border border-line bg-card2 px-3 py-2 text-lg text-slate-300" aria-label="Ajustes">⚙</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-xl items-center justify-center px-4 pb-3">
          <span className="sr-only">Paso {step} de 4</span>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  n < step
                    ? 'bg-emerald-500 text-white'
                    : n === step
                      ? 'bg-gradient-to-br from-brand to-sky-400 text-white shadow-glow'
                      : 'border border-line bg-card2 text-muted'
                }`}
              >
                {n < step ? '✓' : n}
              </div>
              {n < 4 && <div className={`h-0.5 w-10 ${n < step ? 'bg-emerald-500' : 'bg-line'}`} />}
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-5">
        {step === 1 && (
          <ConnectScreen
            onConnected={(c) => {
              setConn(c);
              setStep(2);
            }}
          />
        )}
        {step === 2 && <PrepareScreen onNext={() => setStep(3)} onBack={disconnect} />}
        {step === 3 && conn && (
          <ScanScreen
            conn={conn}
            onCancel={() => setStep(2)}
            onDone={(m) => {
              setMeasurement(m);
              setStep(4);
            }}
          />
        )}
        {step === 4 && measurement && (
          <ResultsScreen
            m={measurement}
            settings={settings}
            onNew={newMeasurement}
            onVoiceToggle={() => updateSettings({ ...settings, voice: !settings.voice })}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      <footer className="border-t border-line bg-card">
        <p className="mx-auto max-w-xl px-4 py-3 text-center text-xs text-muted">⚠️ {DISCLAIMER}</p>
      </footer>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(s) => {
            updateSettings(s);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
