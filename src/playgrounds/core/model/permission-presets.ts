import type { AuthenticatedUser, OwpNavItemType } from '@owp/core/types';

export const permissionRoles = ['Super admin', 'Admin', 'PM'] as const;
export const permissionPaths = ['/items', '/settings'] as const;
export type PermissionRole = (typeof permissionRoles)[number];

export const permissionPresets = {
  'Super admin': {
    user: {
      USERID: 'sample-super-admin',
      USERSEQ: 101,
      USERNAME: 'Super admin',
      token: 'playground-super-admin-token',
    },
    pages: {
      '/items': { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'T' },
      '/settings': { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'T' },
    },
  },
  Admin: {
    user: {
      USERID: 'sample-admin',
      USERSEQ: 102,
      USERNAME: 'Admin',
      token: 'playground-admin-token',
    },
    pages: {
      '/items': { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'F' },
      '/settings': { C_PERMISSION: 'F', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'F' },
    },
  },
  PM: {
    user: {
      USERID: 'sample-pm',
      USERSEQ: 103,
      USERNAME: 'PM',
      token: 'playground-pm-token',
    },
    pages: {
      '/items': { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'F', D_PERMISSION: 'F' },
      '/settings': { C_PERMISSION: 'F', R_PERMISSION: 'F', U_PERMISSION: 'F', D_PERMISSION: 'F' },
    },
  },
} as const satisfies Record<
  PermissionRole,
  {
    readonly user: AuthenticatedUser;
    readonly pages: Readonly<
      Record<(typeof permissionPaths)[number], NonNullable<OwpNavItemType['permission']>>
    >;
  }
>;

export function createPermissionNavigation(role: PermissionRole): OwpNavItemType[] {
  return permissionPaths.map((path) => ({
    id: path,
    title: path === '/items' ? '항목' : '설정',
    url: path,
    type: 'item',
    permission: { ...permissionPresets[role].pages[path] },
  }));
}
