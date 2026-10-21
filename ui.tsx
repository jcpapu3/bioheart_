import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'blue' | 'secondary' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export function Button({
  variant = 'blue',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-3 font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-lg ${className}`}>
      {title && (
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function EcgChart({ data, height = 120 }: { data: number[]; height?: number }) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center rounded bg-gray-50 text-sm text-gray-400" style={{ height }}>Sin señal</div>;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const W = 600;
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(height - 8 - ((v - min) / span) * (height - 16)).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full rounded bg-gray-50" style={{ height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
