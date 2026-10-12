'use client';

import { useRef, useState, useTransition } from 'react';
import { beginFieldUpload, finishFieldUpload } from '@/app/admin/actions';

/** What the bucket accepts; the same figure as MAX_UPLOAD_BYTES on the server. */
const MAX_UPLOAD = 100 * 1024 * 1024;

/* Every file gets a random suffix, so a URL never changes meaning and can
   be cached hard. R2 only records this if the browser sends it. */
const UPLOAD_CACHE = 'public, max-age=31536000, immutable';

function readable(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

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

  /**
   * The file goes straight from here into the bucket, at whatever resolution
   * it was chosen at. It never passes through the application, which is what
   * lets a full-size photograph through: sending one as a server action hit
   * the 1MB request ceiling and failed with nothing to show for it.
   */
  function choose(file: File) {
    setNote(null);
    startUpload(async () => {
      if (file.size > MAX_UPLOAD) {
        setNote({ kind: 'error', text: `That file is ${readable(file.size)}, and the limit is ${readable(MAX_UPLOAD)}.` });
        return;
      }

      const contentType = file.type || 'application/octet-stream';
      const begun = await beginFieldUpload({
        filename: file.name, contentType, bytes: file.size, folder,
      });
      if (begun.error || !begun.uploadUrl) {
        setNote({ kind: 'error', text: begun.error ?? 'Could not start the upload.' });
        return;
      }

      let put: Response;
      try {
        put = await fetch(begun.uploadUrl, {
          method: 'PUT', body: file, headers: { 'Content-Type': contentType, 'Cache-Control': UPLOAD_CACHE },
        });
      } catch {
        /* Nearly always the bucket refusing the browser rather than the network. */
        setNote({ kind: 'error', text: 'The upload could not reach storage. If this keeps happening the bucket may not allow uploads from this site yet.' });
        return;
      }
      if (!put.ok) {
        setNote({ kind: 'error', text: `Storage refused the file (${put.status}).` });
        return;
      }

      const done = await finishFieldUpload({
        url: begun.url!, pathname: begun.pathname!,
        filename: file.name, contentType, bytes: file.size, folder,
      });
      if (done.error) { setNote({ kind: 'error', text: done.error }); return; }
      if (done.url) setValue(done.url);
      setNote(done.pending
        ? { kind: 'ok', text: `Uploaded at full size (${readable(file.size)}). A manager still needs to confirm its usage rights under Images & video.` }
        : { kind: 'ok', text: `Uploaded at full size (${readable(file.size)}).` });
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
