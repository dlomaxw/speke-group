import type { Role } from '@/db/schema';

/**
 * What each role may do.
 *
 * admin     — IT. Everything, including user accounts and site settings.
 * manager   — General Manager. Publishes anything, handles enquiries,
 *             but does not administer user accounts.
 * marketing — Creates and edits content and works enquiries. Cannot publish;
 *             a manager or admin promotes a draft.
 * viewer    — Read-only.
 */
export const PERMISSIONS = {
  'content.view':    ['admin', 'manager', 'marketing', 'viewer'],
  'content.edit':    ['admin', 'manager', 'marketing'],
  'content.delete':  ['admin', 'manager'],
  'content.publish': ['admin', 'manager'],

  'media.view':      ['admin', 'manager', 'marketing', 'viewer'],
  'media.upload':    ['admin', 'manager', 'marketing'],
  'media.delete':    ['admin', 'manager'],
  /** Confirms the Group holds the rights to use a file publicly. */
  'media.approve':   ['admin', 'manager'],

  'enquiries.view':   ['admin', 'manager', 'marketing'],
  'enquiries.manage': ['admin', 'manager', 'marketing'],
  'enquiries.delete': ['admin', 'manager'],

  'settings.view': ['admin', 'manager', 'marketing', 'viewer'],
  'settings.edit': ['admin', 'manager'],

  'users.view':   ['admin', 'manager'],
  'users.manage': ['admin'],

  'activity.view': ['admin', 'manager'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/** Throws instead of returning false — for use inside server actions. */
export function assertCan(role: Role | undefined | null, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Your role does not allow this action (${permission}).`);
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'General Manager',
  marketing: 'Marketing',
  viewer: 'Viewer',
};

export const ROLE_BLURB: Record<Role, string> = {
  admin: 'Full access, including staff accounts and site settings.',
  manager: 'Publishes content and handles enquiries. Cannot manage accounts.',
  marketing: 'Creates and edits content and works enquiries. A manager publishes.',
  viewer: 'Can look at everything, change nothing.',
};
