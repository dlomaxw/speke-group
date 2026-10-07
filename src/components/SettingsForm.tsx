'use client';

import { useActionState, useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');

  /* With a hundred or so fields, a reader needs to be able to find one. The
     filter hides whole groups that have nothing matching, and every field
     stays mounted so a filtered save still posts the lot. */
  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return null;
    const hit = (i: Item) =>
      i.label.toLowerCase().includes(needle) ||
      i.key.toLowerCase().includes(needle) ||
      i.value.toLowerCase().includes(needle);
    return new Set(groups.flatMap((g) => g.items.filter(hit).map((i) => i.key)));
  }, [needle, groups]);

  const visibleGroups = groups.filter((g) => !matches || g.items.some((i) => matches.has(i.key)));
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <form action={formAction} className="space-y-5 max-w-[820px]">
      <div className="card-surface p-4 sticky top-2 z-10">
        <label htmlFor="settings-find" className="block text-[13px] font-semibold mb-1.5">
          Find a setting
        </label>
        <input
          id="settings-find" type="search" className="field" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total} settings by name or by the words on the page…`}
        />
        <div className="flex flex-wrap gap-1.5 mt-3">
          {groups.map((g) => (
            <a key={g.key} href={`#g_${g.key}`}
               className="text-[11.5px] px-2.5 py-1 rounded-full border border-[#dfe3ea] text-[#5a6474] hover:border-[#6f2033] hover:text-[#6f2033]">
              {g.title}
            </a>
          ))}
        </div>
      </div>

      {visibleGroups.map((g) => (
        <section key={g.key} id={`g_${g.key}`} className="card-surface p-5 scroll-mt-24">
          <h2 className="font-semibold text-[16px]">{g.title}</h2>
          {g.blurb && <p className="text-[13px] text-[#5a6474] mt-0.5 mb-4">{g.blurb}</p>}

          <div className="space-y-4">
            {g.items.map((item) => {
              const id = `s_${item.key}`;
              const name = `setting__${item.key}`;
              const hidden = matches ? !matches.has(item.key) : false;
              return (
                <div key={item.key} className={hidden ? 'hidden' : undefined}>
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

      {matches && visibleGroups.length === 0 && (
        <p className="text-[13px] text-[#5a6474]">Nothing matches “{query}”.</p>
      )}

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
