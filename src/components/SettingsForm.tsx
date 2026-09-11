'use client';

import { useActionState } from 'react';
import { saveSettings } from '@/app/admin/actions';
import MediaField from './MediaField';

type Item = {
  key: string; label: string; value: string;
  valueType: string; helpText: string | null;
};

export default function SettingsForm({
  groups, canEdit, mediaOptions,
}: {
  groups: { key: string; title: string; blurb: string; items: Item[] }[];
  canEdit: boolean;
  mediaOptions: { url: string; filename: string; alt: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(saveSettings, {});

  return (
    <form action={formAction} className="space-y-5 max-w-[820px]">
      {groups.map((g) => (
        <section key={g.key} className="card-surface p-5">
          <h2 className="font-semibold text-[16px]">{g.title}</h2>
          {g.blurb && <p className="text-[13px] text-[#5a6474] mt-0.5 mb-4">{g.blurb}</p>}

          <div className="space-y-4">
            {g.items.map((item) => {
              const id = `s_${item.key}`;
              const name = `setting__${item.key}`;
              return (
                <div key={item.key}>
                  <label htmlFor={id} className="block text-[13px] font-semibold mb-1.5">
                    {item.label}
                  </label>

                  {item.valueType === 'textarea' ? (
                    <textarea id={id} name={name} className="field" rows={3}
                              defaultValue={item.value} disabled={!canEdit} />
                  ) : item.valueType === 'image' || item.valueType === 'video' ? (
                    <MediaField name={name} defaultValue={item.value} options={mediaOptions} />
                  ) : (
                    <input
                      id={id} name={name} className="field"
                      type={item.valueType === 'number' ? 'number' : item.valueType === 'url' ? 'url' : 'text'}
                      defaultValue={item.value} disabled={!canEdit}
                    />
                  )}

                  {item.helpText && (
                    <p className="text-[12px] text-[#7a8494] mt-1">{item.helpText}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {state.error && (
        <p role="alert" className="text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-[13px] text-[#1e6b34] bg-[#e6f4ea] border border-[#bfe0c9] rounded-lg px-3 py-2">
          {state.ok}
        </p>
      )}

      {canEdit ? (
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      ) : (
        <p className="text-[12.5px] text-[#7a8494]">
          Your role can view these but not change them.
        </p>
      )}
    </form>
  );
}
