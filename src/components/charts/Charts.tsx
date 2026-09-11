'use client';

import { useState } from 'react';

/* ============================================================
   Palette
   Categorical slots come from the validated reference set
   (light surface): all six checks pass, worst adjacent CVD
   ΔE 9.1 and normal-vision ΔE 22.9. Contrast against the white
   card is below 3:1 for two slots, so every segment carries a
   visible label and a legend — never colour alone.
   ============================================================ */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const;

/** Sequential ramp, one hue, light to dark — for magnitude. */
const SEQ = ['#cde2fb', '#86b6ef', '#2a78d6', '#1c5aa3'] as const;

const INK = '#1d2430';
const INK_SOFT = '#5a6474';
const GRID = '#e6e9ee';
const SURFACE = '#ffffff';

/* ============================================================
   Part-to-whole: horizontal stacked bar
   ============================================================ */
export function StackedShare({
  title, caption, data,
}: {
  title: string;
  caption?: string;
  data: { label: string; value: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const W = 100;         // percent-based widths keep it fluid
  const GAP = 0.6;       // surface gap between segments

  let x = 0;
  const segments = data.map((d, i) => {
    const w = Math.max((d.value / total) * W - GAP, 0);
    const seg = { ...d, x, w, colour: SERIES[i % SERIES.length] };
    x += (d.value / total) * W;
    return seg;
  });

  return (
    <figure className="card-surface p-5 m-0">
      <figcaption className="mb-1">
        <h3 className="font-semibold text-[15px] text-[color:#1d2430]">{title}</h3>
        {caption && <p className="text-[12.5px] text-[#5a6474] mt-0.5">{caption}</p>}
      </figcaption>

      <div className="relative mt-4">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-[34px]" role="img"
             aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
          {segments.map((s, i) => (
            <rect
              key={s.label}
              x={s.x} y={0} width={s.w} height={10} rx={0.9}
              fill={s.colour}
              opacity={hover === null || hover === i ? 1 : 0.45}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: 'opacity .18s ease' }}
            />
          ))}
        </svg>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center gap-2 text-[13px]"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ background: s.colour }} />
            <span className="text-[color:#5a6474] truncate">{s.label}</span>
            <span className="ml-auto font-semibold tabular-nums" style={{ color: INK }}>
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ============================================================
   Magnitude over time: columns, one hue
   ============================================================ */
export function Columns({
  title, caption, data, emptyNote,
}: {
  title: string;
  caption?: string;
  data: { label: string; value: number }[];
  emptyNote?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const allZero = data.every((d) => d.value === 0);

  const W = 320, H = 110, PAD_B = 20;
  const band = W / data.length;
  const barW = Math.min(band * 0.55, 26);

  return (
    <figure className="card-surface p-5 m-0">
      <figcaption className="mb-1">
        <h3 className="font-semibold text-[15px]" style={{ color: INK }}>{title}</h3>
        {caption && <p className="text-[12.5px] text-[#5a6474] mt-0.5">{caption}</p>}
      </figcaption>

      {allZero && emptyNote ? (
        <p className="text-[13px] text-[#7a8494] mt-4">{emptyNote}</p>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
               aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
            <line x1={0} y1={H - PAD_B} x2={W} y2={H - PAD_B} stroke={GRID} strokeWidth={1} />

            {data.map((d, i) => {
              const h = (d.value / max) * (H - PAD_B - 16);
              const x = i * band + (band - barW) / 2;
              const y = H - PAD_B - h;
              return (
                <g key={d.label}
                   onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* a generous invisible hit area, bigger than the mark */}
                  <rect x={i * band} y={0} width={band} height={H} fill="transparent" />
                  <rect
                    x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 2 : 0)}
                    rx={3} fill={hover === i ? SEQ[3] : SEQ[2]}
                    style={{ transition: 'fill .18s ease' }}
                  />
                  {hover === i && d.value > 0 && (
                    <text x={i * band + band / 2} y={y - 5} textAnchor="middle"
                          fontSize={11} fontWeight={700} fill={INK}>
                      {d.value}
                    </text>
                  )}
                  <text x={i * band + band / 2} y={H - 6} textAnchor="middle"
                        fontSize={9.5} fill={INK_SOFT}>
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </figure>
  );
}

/* ============================================================
   A single ratio against a limit: meter
   ============================================================ */
export function Meters({
  title, caption, rows,
}: {
  title: string;
  caption?: string;
  rows: { label: string; done: number; total: number }[];
}) {
  return (
    <figure className="card-surface p-5 m-0">
      <figcaption className="mb-1">
        <h3 className="font-semibold text-[15px]" style={{ color: INK }}>{title}</h3>
        {caption && <p className="text-[12.5px] text-[#5a6474] mt-0.5">{caption}</p>}
      </figcaption>

      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const pct = r.total === 0 ? 0 : Math.round((r.done / r.total) * 100);
          return (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[13px]" style={{ color: INK_SOFT }}>{r.label}</span>
                <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: INK }}>
                  {r.done} of {r.total}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: SEQ[0] }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? '#1baf7a' : SEQ[2],
                    transition: 'width .6s cubic-bezier(.16,1,.3,1)',
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/* ============================================================
   Reserved status colours — never used for a series.
   Each ships with a label, never colour alone.
   ============================================================ */
const STATUS: Record<string, { dot: string; bg: string; ink: string }> = {
  new:      { dot: '#eda100', bg: '#fff6e3', ink: '#7a5c00' },
  assigned: { dot: '#2a78d6', bg: '#e8f1fd', ink: '#1c5aa3' },
  answered: { dot: '#1baf7a', bg: '#e6f6ef', ink: '#12654a' },
  closed:   { dot: '#8a94a4', bg: '#eef1f5', ink: '#4b5565' },
  spam:     { dot: '#e34948', bg: '#fdecec', ink: '#8f2320' },
};

export function StatusBreakdown({
  title, caption, rows,
}: {
  title: string;
  caption?: string;
  rows: { status: string; count: number }[];
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <figure className="card-surface p-5 m-0">
      <figcaption className="mb-1">
        <h3 className="font-semibold text-[15px]" style={{ color: INK }}>{title}</h3>
        {caption && <p className="text-[12.5px] text-[#5a6474] mt-0.5">{caption}</p>}
      </figcaption>

      {total === 0 ? (
        <p className="text-[13px] text-[#7a8494] mt-4">
          No enquiries yet. They arrive here from the website contact form.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {rows.filter((r) => r.count > 0).map((r) => {
            const s = STATUS[r.status] ?? STATUS.closed;
            return (
              <li key={r.status}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ background: s.bg }}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
                <span className="text-[12.5px] font-semibold capitalize" style={{ color: s.ink }}>
                  {r.status}
                </span>
                <span className="text-[12.5px] tabular-nums" style={{ color: s.ink }}>
                  {r.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}

/* ============================================================
   Hero figure — the one number the dashboard leads with
   ============================================================ */
export function HeroFigure({
  value, label, sub,
}: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="card-surface p-5">
      <div className="serif font-bold leading-none text-[52px]" style={{ color: INK }}>
        {value}
      </div>
      <div className="text-[13px] font-semibold mt-2" style={{ color: INK }}>{label}</div>
      {sub && <div className="text-[12.5px] text-[#5a6474] mt-0.5">{sub}</div>}
    </div>
  );
}
