'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveRecord } from '@/app/admin/actions';
import type { Field } from '@/lib/collections';
import MediaField from './MediaField';

export default function RecordForm({
  collection, collectionLabel, singular, fields, record, canPublish, mediaOptions,
  propertyOptions = [], allowGroupWide = true,
}: {
  collection: string;
  collectionLabel: string;
  singular: string;
  fields: Field[];
  record: Record<string, unknown> | null;
  canPublish: boolean;
  mediaOptions: { url: string; filename: string; alt: string | null }[];
  propertyOptions?: { id: number; name: string }[];
  allowGroupWide?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});

  const initial = (name: string) => {
    const v = record?.[name];
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  };

  function onSubmit(formData: FormData) {
    start(async () => {
      const result = await saveRecord(collection, formData);
      setMessage(result);
      if (result.ok && result.ok === 'Saved.') {
        router.push(`/admin/${collection}`);
        router.refresh();
      } else if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5 max-w-[760px]">
      {record?.id ? <input type="hidden" name="id" value={String(record.id)} /> : null}

      <div className="card-surface p-5 space-y-4">
        {fields.map((field) => {
          if (field.type === 'status' && !canPublish) return null;
          const id = `f_${field.name}`;

          return (
            <div key={field.name}>
              <label htmlFor={id} className="block text-[13px] font-semibold mb-1.5">
                {field.label}
                {field.required && <span className="text-[#b3261e]"> *</span>}
              </label>

              {field.type === 'textarea' || field.type === 'richtext' ? (
                <textarea
                  id={id} name={field.name} className="field"
                  rows={field.type === 'richtext' ? 10 : 4}
                  defaultValue={initial(field.name)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === 'property' ? (
                <select id={id} name={field.name} className="field" defaultValue={initial(field.name)}>
                  {allowGroupWide && <option value="">Group-wide (no single property)</option>}
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : field.type === 'select' || field.type === 'status' ? (
                <select id={id} name={field.name} className="field" defaultValue={initial(field.name) || field.options?.[0]?.value}>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-[13.5px]">
                  <input
                    id={id} name={field.name} type="checkbox"
                    defaultChecked={record?.[field.name] === true}
                    className="h-4 w-4 accent-[color:var(--color-maroon)]"
                  />
                  <span className="text-[#5a6474]">{field.help ?? 'Yes'}</span>
                </label>
              ) : field.type === 'image' ? (
                <MediaField
                  name={field.name}
                  defaultValue={initial(field.name)}
                  options={mediaOptions}
                />
              ) : (
                <input
                  id={id} name={field.name}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                  className="field"
                  defaultValue={initial(field.name)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.help && field.type !== 'checkbox' && (
                <p className="text-[12px] text-[#7a8494] mt-1">{field.help}</p>
              )}
            </div>
          );
        })}
      </div>

      {message.ok && message.ok !== 'Saved.' && (
        <p className="text-[13px] text-[#1e6b34] bg-[#e6f4ea] border border-[#bfe0c9] rounded-lg px-3 py-2">
          {message.ok}
        </p>
      )}

      {message.error && (
        <p role="alert" className="text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
          {message.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : `Save ${singular.toLowerCase()}`}
        </button>
        <Link href={`/admin/${collection}`} className="btn-ghost">Cancel</Link>
        <span className="text-[12.5px] text-[#7a8494]">Back to {collectionLabel.toLowerCase()}</span>
      </div>
    </form>
  );
}
