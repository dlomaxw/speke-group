'use client';

import { useActionState, useState, useTransition } from 'react';
import { uploadMedia, deleteMedia } from '@/app/admin/actions';

type FileRow = {
  id: number; url: string; filename: string;
  contentType: string | null; bytes: number | null;
  alt: string | null; createdAt: string;
};

const FOLDERS = ['general', 'properties', 'venues', 'dining', 'experiences', 'news', 'hero'];

function size(bytes: number | null) {
  if (!bytes) return '';
  return bytes > 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export default function MediaLibrary({
  files, canUpload, canDelete,
}: { files: FileRow[]; canUpload: boolean; canDelete: boolean }) {
  const [state, formAction, pending] = useActionState(uploadMedia, {});
  const [removing, start] = useTransition();
  const [copied, setCopied] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {canUpload && (
        <form action={formAction} className="card-surface p-5 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label htmlFor="file" className="block text-[13px] font-semibold mb-1.5">Choose a file</label>
            <input
              id="file" name="file" type="file" required
              accept="image/*,video/mp4,video/webm,application/pdf"
              className="field file:mr-3 file:rounded-md file:border-0 file:bg-[#eef1f5] file:px-3 file:py-1.5 file:text-[13px]"
            />
            <p className="text-[12px] text-[#7a8494] mt-1">
              Images, MP4 or WebM video, or PDF. Up to 100 MB.
            </p>
          </div>
          <div>
            <label htmlFor="folder" className="block text-[13px] font-semibold mb-1.5">Folder</label>
            <select id="folder" name="folder" className="field">
              {FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button type="submit" disabled={pending} className="btn-primary h-[42px]">
            {pending ? 'Uploading…' : 'Upload'}
          </button>

          <div className="sm:col-span-3">
            <label htmlFor="alt" className="block text-[13px] font-semibold mb-1.5">
              Describe the picture
            </label>
            <input id="alt" name="alt" className="field"
                   placeholder="Kabira Country Club swimming pool at sunset" />
            <p className="text-[12px] text-[#7a8494] mt-1">
              Read aloud by screen readers and used by search engines. Skip it for video.
            </p>
          </div>

          {state.error && (
            <p role="alert" className="sm:col-span-3 text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="sm:col-span-3 text-[13px] text-[#1e6b34] bg-[#e6f4ea] border border-[#bfe0c9] rounded-lg px-3 py-2">
              {state.ok}
            </p>
          )}
        </form>
      )}

      {files.length === 0 ? (
        <div className="card-surface p-8 text-center text-[14px] text-[#5a6474]">
          Nothing uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map((f) => {
            const isVideo = f.contentType?.startsWith('video');
            return (
              <div key={f.id} className="card-surface overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-[#f1f3f6] grid place-items-center overflow-hidden">
                  {isVideo ? (
                    <video src={f.url} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : f.contentType === 'application/pdf' ? (
                    <span className="text-[12px] text-[#7a8494]">PDF</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt={f.alt ?? ''} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                  <div className="text-[12.5px] font-medium truncate" title={f.filename}>{f.filename}</div>
                  <div className="text-[11.5px] text-[#7a8494]">{size(f.bytes)}</div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(f.url);
                        setCopied(f.id);
                        setTimeout(() => setCopied(null), 1600);
                      }}
                      className="text-[12px] font-semibold text-[color:var(--color-maroon)] hover:underline"
                    >
                      {copied === f.id ? 'Copied' : 'Copy link'}
                    </button>
                    {canDelete && (
                      <button
                        type="button" disabled={removing}
                        onClick={() => start(() => deleteMedia(f.id).then(() => {}))}
                        className="text-[12px] text-[#7a8494] hover:text-[#b3261e] hover:underline ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
