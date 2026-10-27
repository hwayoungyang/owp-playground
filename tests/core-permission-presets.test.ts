import { describe, expect, it } from 'vitest';
import {
  createPermissionNavigation,
  permissionPresets,
  permissionRoles,
} from '../src/playgrounds/core/model/permission-presets';

describe('sample user permission navigation', () => {
  it('uses a distinct authentication identity for each sample role', () => {
    // Given
    const roles = permissionRoles;
    // When
    const users = roles.map((role) => permissionPresets[role].user);
    // Then
    expect(new Set(users.map((user) => user.USERID)).size).toBe(3);
    expect(new Set(users.map((user) => user.USERSEQ)).size).toBe(3);
  });

  it('maps Super admin to every CRUD action on both routable pages', () => {
    // Given
    const role = 'Super admin';
    // When
    const navigation = createPermissionNavigation(role);
    // Then
    expect(navigation).toEqual([
      {
        id: '/items',
        url: '/items',
        title: '항목',
        type: 'item',
        permission: { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'T' },
      },
      {
        id: '/settings',
        url: '/settings',
        title: '설정',
        type: 'item',
        permission: { C_PERMISSION: 'T', R_PERMISSION: 'T', U_PERMISSION: 'T', D_PERMISSION: 'T' },
      },
    ]);
  });

  it('limits Admin to item creation and both page updates without deletion or settings creation', () => {
    // Given
    const role = 'Admin';
    // When
    const navigation = createPermissionNavigation(role);
    // Then
    expect(navigation.find((page) => page.url === '/items')?.permission).toEqual({
      C_PERMISSION: 'T',
      R_PERMISSION: 'T',
      U_PERMISSION: 'T',
      D_PERMISSION: 'F',
    });
    expect(navigation.find((page) => page.url === '/settings')?.permission).toEqual({
      C_PERMISSION: 'F',
      R_PERMISSION: 'T',
      U_PERMISSION: 'T',
      D_PERMISSION: 'F',
    });
  });

  it('limits PM to item creation and reading while denying every settings action', () => {
    // Given
    const role = 'PM';
    // When
    const navigation = createPermissionNavigation(role);
    // Then
    expect(navigation.find((page) => page.url === '/items')?.permission).toEqual({
      C_PERMISSION: 'T',
      R_PERMISSION: 'T',
      U_PERMISSION: 'F',
      D_PERMISSION: 'F',
    });
    expect(navigation.find((page) => page.url === '/settings')?.permission).toEqual({
      C_PERMISSION: 'F',
      R_PERMISSION: 'F',
      U_PERMISSION: 'F',
      D_PERMISSION: 'F',
    });
  });

  it('keeps a generated menu isolated from later menu edits and other users', () => {
    // Given
    const originalNavigation = createPermissionNavigation('Super admin');
    const itemPage = originalNavigation.find((page) => page.url === '/items');
    if (!itemPage?.permission) throw new TypeError('Missing item permission fixture');
    // When
    itemPage.permission.D_PERMISSION = 'F';
    originalNavigation.pop();
    const nextNavigation = createPermissionNavigation('Super admin');
    // Then
    expect(nextNavigation).toHaveLength(2);
    expect(nextNavigation.find((page) => page.url === '/items')?.permission?.D_PERMISSION).toBe(
      'T',
    );
    expect(
      createPermissionNavigation('PM').find((page) => page.url === '/items')?.permission,
    ).toEqual({
      C_PERMISSION: 'T',
      R_PERMISSION: 'T',
      U_PERMISSION: 'F',
      D_PERMISSION: 'F',
    });
  });
});
