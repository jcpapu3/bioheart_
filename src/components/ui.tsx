import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'blue' | 'secondary' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20',
  blue: 'bg-gradient-to-r from-brand to-sky-500 text-white shadow-lg shadow-sky-500/25',
  secondary: 'border border-line bg-card2 text-ink hover:bg-line',
  danger: 'bg-gradient-to-r from-rose-600 to-heart text-white shadow-lg shadow-rose-500/20',
};

export function Button({
  variant = 'blue',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3.5 font-semibold tracking-wide transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${styles[variant]} ${className}`}
    />
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line bg-card shadow-card ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-5 pt-4">
          <span className="h-4 w-1 rounded-full bg-cyan-400" />
          <h2 className="text-base font-semibold tracking-wide text-ink">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Gráfica ECG estilo monitor: cuadrícula, línea con brillo y escala vertical suave. */
export function EcgChart({ data, height = 140, color = '#ff4d6d' }: { data: number[]; height?: number; color?: string }) {
  const W = 600;
  const grid = (
    <g stroke="#1f355f" strokeWidth="1" opacity="0.7">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={(i * W) / 10} y1="0" x2={(i * W) / 10} y2={height} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={(i * height) / 4} x2={W} y2={(i * height) / 4} />
      ))}
    </g>
  );
  if (data.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full rounded-2xl bg-bg" style={{ height }} preserveAspectRatio="none">
        {grid}
        <text x={W / 2} y={height / 2} textAnchor="middle" fill="#6f86ae" fontSize="18">Sin señal</text>
      </svg>
    );
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(height - 12 - ((v - min) / span) * (height - 24)).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full rounded-2xl bg-bg" style={{ height }} preserveAspectRatio="none">
      {grid}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" opacity="0.18" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Logo: corazón con línea de pulso */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * 1.7} height={size} viewBox="0 0 68 40" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h14l5-14 8 28 6-18 4 4h27" />
    </svg>
  );
}
