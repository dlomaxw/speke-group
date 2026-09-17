'use client';

import { useEffect, useRef, useState } from 'react';

const DEVICES = [
  { key: 'phone', label: 'Phone', width: 390, height: 844 },
  { key: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { key: 'desktop', label: 'Desktop', width: 1440, height: 900 },
] as const;

const PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/about', label: 'About us' },
  { path: '/events', label: 'Events & meetings' },
  { path: '/experiences', label: 'Experiences' },
  { path: '/news', label: 'News' },
  { path: '/contact', label: 'Contact' },
];

/** The site at a real device width, scaled down to fit the dashboard column. */
export default function PreviewFrame({ initialPath }: { initialPath: string }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]>(DEVICES[0]);
  const [path, setPath] = useState(initialPath);
  const [nonce, setNonce] = useState(0);
  const holder = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(1000);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = Math.min(1, available / device.width);
  const src = `/api/preview?action=enable&path=${encodeURIComponent(path)}&v=${nonce}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Device" className="flex rounded-lg border border-[#d7dbe2] overflow-hidden">
          {DEVICES.map((d) => (
            <button
              key={d.key} type="button" onClick={() => setDevice(d)} aria-pressed={device.key === d.key}
              className={`px-3 py-1.5 text-[12.5px] font-semibold ${device.key === d.key ? 'bg-[color:var(--color-maroon)] text-white' : 'bg-white text-[#38414f]'}`}
            >
              {d.label} <span className="font-normal opacity-70">{d.width}</span>
            </button>
          ))}
        </div>
        <label htmlFor="pv-page" className="sr-only">Page</label>
        <select id="pv-page" className="field max-w-[220px]" value={path} onChange={(e) => setPath(e.target.value)}>
          {PAGES.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
        </select>
        <button type="button" className="btn-ghost" onClick={() => setNonce((n) => n + 1)}>Reload</button>
        <a href={src} target="_blank" rel="noopener" className="btn-ghost">Open full size</a>
        <a href={`/api/preview?action=disable&path=${encodeURIComponent(path)}`} target="_blank" rel="noopener"
           className="text-[12.5px] text-[#5a6474] hover:underline ml-auto">
          See it as a visitor
        </a>
      </div>

      <div ref={holder} className="w-full">
        <div
          className="mx-auto rounded-xl border border-[#d7dbe2] bg-white shadow-sm overflow-hidden"
          style={{ width: device.width * scale, height: device.height * scale }}
        >
          <iframe
            key={`${device.key}-${src}`}
            title={`Preview of ${path} at ${device.width} pixels`}
            src={src}
            style={{ width: device.width, height: device.height, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
