'use client';

import { useActionState, useState, useTransition } from 'react';
import { saveUser, deleteUser, resetUserMfa } from '@/app/admin/actions';
import { ROLE_LABELS } from '@/lib/rbac';

type Row = {
  id: number; email: string; name: string; role: keyof typeof ROLE_LABELS;
  department: string | null; isActive: boolean; lastLoginAt: string | null;
  propertyScope: 'all' | 'assigned'; propertyIds: number[]; totpEnabled: boolean;
};

export default function UserManager({
  users, canManage, currentUserId, properties,
}: { users: Row[]; canManage: boolean; currentUserId: number; properties: { id: number; name: string }[] }) {
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [state, formAction, pending] = useActionState(saveUser, {});
  const [removing, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const target = editing === 'new' ? null : editing;
  const [scope, setScope] = useState<'all' | 'assigned'>('all');
  const nameOf = new Map(properties.map((p) => [p.id, p.name]));

  const openEditor = (row: Row | 'new') => {
    setScope(row === 'new' ? 'all' : row.propertyScope);
    setEditing(row);
  };

  return (
    <div className="space-y-4">
      {canManage && !editing && (
        <button type="button" className="btn-primary" onClick={() => openEditor('new')}>
          Add a staff account
        </button>
      )}

      {editing && (
        <form key={target?.id ?? 'new'} action={formAction} className="card-surface p-5 space-y-4 max-w-[560px]">
          <h2 className="font-semibold text-[16px]">
            {target ? `Edit ${target.name}` : 'New staff account'}
          </h2>
          {target && <input type="hidden" name="id" value={target.id} />}

          <div>
            <label htmlFor="u_name" className="block text-[13px] font-semibold mb-1.5">Full name</label>
            <input id="u_name" name="name" className="field" required defaultValue={target?.name ?? ''} />
          </div>

          <div>
            <label htmlFor="u_email" className="block text-[13px] font-semibold mb-1.5">Work email</label>
            <input id="u_email" name="email" type="email" className="field" required defaultValue={target?.email ?? ''} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="u_role" className="block text-[13px] font-semibold mb-1.5">Role</label>
              <select id="u_role" name="role" className="field" defaultValue={target?.role ?? 'marketing'}>
                {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="u_dept" className="block text-[13px] font-semibold mb-1.5">Department</label>
              <input id="u_dept" name="department" className="field" defaultValue={target?.department ?? ''}
                     placeholder="Marketing" />
            </div>
          </div>

          <div>
            <label htmlFor="u_pw" className="block text-[13px] font-semibold mb-1.5">
              {target ? 'New password' : 'Starting password'}
            </label>
            <input id="u_pw" name="password" type="password" className="field"
                   autoComplete="new-password"
                   placeholder={target ? 'Leave blank to keep the current one' : 'At least 10 characters'} />
            <p className="text-[12px] text-[#7a8494] mt-1">
              They will be asked to choose their own password the first time they sign in.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="block text-[13px] font-semibold mb-1.5">Properties</legend>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="radio" name="propertyScope" value="all" checked={scope === 'all'}
                     onChange={() => setScope('all')} className="accent-[color:var(--color-maroon)]" />
              All properties and group-wide content
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="radio" name="propertyScope" value="assigned" checked={scope === 'assigned'}
                     onChange={() => setScope('assigned')} className="accent-[color:var(--color-maroon)]" />
              Only these properties
            </label>
            {scope === 'assigned' && (
              <div className="grid sm:grid-cols-2 gap-1.5 pl-6">
                {properties.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" name="propertyIds" value={p.id}
                           defaultChecked={target?.propertyIds.includes(p.id)}
                           className="h-4 w-4 accent-[color:var(--color-maroon)]" />
                    {p.name}
                  </label>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[#7a8494]">
              Administrators and general managers always cover every property.
            </p>
          </fieldset>

          <label className="flex items-center gap-2 text-[13.5px]">
            <input name="isActive" type="checkbox" defaultChecked={target?.isActive ?? true}
                   className="h-4 w-4 accent-[color:var(--color-maroon)]" />
            <span>Account is active and can sign in</span>
          </label>

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

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : 'Save account'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Close</button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-[13px] text-[#b3261e]">{error}</p>}

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e6e9ee]">
                {['Name', 'Email', 'Role', 'Properties', 'Two-step', 'Last signed in', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#5a6474] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#eef1f5] last:border-0">
                  <td className="px-4 py-2.5 text-[13.5px] font-medium">
                    {u.name}
                    {u.id === currentUserId && <span className="text-[#7a8494] font-normal"> (you)</span>}
                    {!u.isActive && (
                      <span className="ml-2 text-[10.5px] uppercase font-bold bg-[#fdeceb] text-[#b3261e] px-1.5 py-0.5 rounded-full">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[#5a6474]">{u.email}</td>
                  <td className="px-4 py-2.5 text-[13px]">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#5a6474] max-w-[220px]">
                    {u.role === 'admin' || u.role === 'manager' || u.propertyScope === 'all'
                      ? 'All'
                      : u.propertyIds.map((id) => nameOf.get(id)).filter(Boolean).join(', ') || 'None'}
                  </td>
                  <td className="px-4 py-2.5 text-[13px]">
                    {u.totpEnabled
                      ? <span className="text-[#1e6b34] font-semibold">On</span>
                      : <span className={u.role === 'admin' ? 'text-[#b3261e] font-semibold' : 'text-[#7a8494]'}>
                          {u.role === 'admin' ? 'Required' : 'Off'}
                        </span>}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[#5a6474]">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {canManage && (
                      <>
                        {u.totpEnabled && u.id !== currentUserId && (
                          <button
                            type="button" disabled={removing}
                            onClick={() => start(async () => {
                              setError(null);
                              try { await resetUserMfa(u.id); }
                              catch (e) { setError(e instanceof Error ? e.message : 'Could not reset.'); }
                            })}
                            className="mr-3 text-[12.5px] text-[#7a8494] hover:underline"
                            title="For a lost or replaced phone"
                          >
                            Reset two-step
                          </button>
                        )}
                        <button type="button" onClick={() => openEditor(u)}
                                className="text-[12.5px] font-semibold text-[#38414f] hover:underline">
                          Edit
                        </button>
                        {u.id !== currentUserId && (
                          <button
                            type="button" disabled={removing}
                            onClick={() => start(async () => {
                              setError(null);
                              try { await deleteUser(u.id); }
                              catch (e) { setError(e instanceof Error ? e.message : 'Could not delete.'); }
                            })}
                            className="ml-3 text-[12.5px] text-[#7a8494] hover:text-[#b3261e] hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
