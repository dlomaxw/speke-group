'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadToField } from '@/app/admin/actions';

/**
 * An image or video field. The value is always a URL, so an editor can
 * either pick something already uploaded or paste a link from elsewhere.
 */
export default function MediaField({
  name, defaultValue, options, folder = 'general',
}: {
  name: string;
  defaultValue: string;
  options: { url: string; filename: string; alt: string | null }[];
  folder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [browsing, setBrowsing] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, startUpload] = useTransition();
  const picker = useRef<HTMLInputElement>(null);

  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value);

  function choose(file: File) {
    setNote(null);
    const body = new FormData();
    body.set('file', file);
    body.set('folder', folder);
    startUpload(async () => {
      const res = await uploadToField(body);
      if (res.error) { setNote({ kind: 'error', text: res.error }); return; }
      if (res.url) setValue(res.url);
      setNote(res.pending
        ? { kind: 'ok', text: 'Uploaded and in use here. A manager still needs to confirm its usage rights under Images & video.' }
        : { kind: 'ok', text: 'Uploaded.' });
    });
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />

      <div className="flex gap-2">
        <input
          className="field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://… or pick from the library"
          aria-label="Media URL"
        />
        <button
          type="button" className="btn-ghost whitespace-nowrap" disabled={busy}
          onClick={() => picker.current?.click()}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => setBrowsing((v) => !v)}>
          {browsing ? 'Close' : 'Library'}
        </button>
        {value && (
          <button type="button" className="btn-ghost" onClick={() => setValue('')} aria-label="Clear">
            Clear
          </button>
        )}
      </div>

      {/* Kept out of the form's own submission: the file goes up on its own. */}
      <input
        ref={picker} type="file" className="hidden"
        accept="image/*,video/mp4,video/webm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) choose(file);
          e.target.value = '';
        }}
      />

      {note && (
        <p className={`text-[12.5px] ${note.kind === 'error' ? 'text-[#b3261e]' : 'text-[#1e6b34]'}`}>
          {note.text}
        </p>
      )}

      {value && (
        <div className="rounded-lg border border-[#e6e9ee] bg-[#f9fafb] p-2 w-fit">
          {isVideo ? (
            <video src={value} className="h-24 rounded" muted playsInline preload="metadata" />
          ) : (
            // Remote media lives on R2, so a plain img avoids optimiser config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-24 rounded object-cover" />
          )}
        </div>
      )}

      {browsing && (
        <div className="rounded-lg border border-[#e6e9ee] bg-white p-3 max-h-[280px] overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-[13px] text-[#7a8494]">
              Nothing approved yet. Use Upload above, or add files under Images &amp; video.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {options.map((m) => (
                <button
                  key={m.url} type="button"
                  onClick={() => { setValue(m.url); setBrowsing(false); }}
                  className="group rounded-md overflow-hidden border border-[#e6e9ee] hover:border-[color:var(--color-gold)] transition-colors"
                  title={m.filename}
                >
                  {/\.(mp4|webm)(\?|$)/i.test(m.url) ? (
                    <video src={m.url} className="h-16 w-full object-cover" muted preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.alt ?? ''} className="h-16 w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
