import { createRequire } from 'node:module';
import { afterAll, expect, it, vi } from 'vitest';
import {
  coreThemePresets,
  createCorePresetTheme,
  getCoreThemePresetId,
  withCoreTableFontSize,
} from '../src/playgrounds/core/model/theme-presets';

const coreRequire = createRequire(import.meta.resolve('@owp/core'));
await import(coreRequire.resolve('notistack'));
vi.stubGlobal('window', { location: { search: '' } });
afterAll(() => vi.unstubAllGlobals());
const {
  createOwpStore,
  createOwpStoreState,
  currentSettingsAtom,
  defaultSettingsAtom,
  changeOwpThemeAtom,
  resetSettingsAtom,
  setSettingsAtom,
} = await import('@owp/core/store');

it('offers main presets including design systems while rejecting toolbar-only choices', () => {
  expect(coreThemePresets.some(({ id, mode }) => id === 'carbonBlueDark' && mode === 'dark')).toBe(
    true,
  );
  expect(coreThemePresets.some(({ id, mode }) => id === 'light1' && mode === 'light')).toBe(true);
  expect(coreThemePresets.some(({ id }) => id.startsWith('toolbar'))).toBe(false);
});

it('applies real theme colors and preserves the chosen size through preset changes and reset', () => {
  const store = createOwpStore(
    createOwpStoreState({
      theme: { main: { table: { header: { fontSize: 14 }, cell: { fontSize: 14 } } } },
    }),
  );
  const initial = store.get(currentSettingsAtom);
  const baseline = initial.theme.main;
  const sized = withCoreTableFontSize(baseline, 16);
  const dark = createCorePresetTheme('carbonBlueDark', baseline, sized);
  expect(dark.palette?.mode).toBe('dark');
  expect(dark.table?.header?.backgroundColor).toBe(dark.palette?.primary?.main);
  expect(dark.table?.cell?.backgroundColor).toBe(dark.palette?.background?.paper);
  expect(dark.table?.cell?.fontSize).toBe(16);
  expect(dark.table?.field?.cell?.fontSize).toBe(16);
  expect(baseline.table?.cell?.fontSize).toBe(14);
  store.set(changeOwpThemeAtom, { ...initial.theme, main: dark });
  store.set(setSettingsAtom, {
    ...store.get(currentSettingsAtom),
    theme: { ...initial.theme, main: withCoreTableFontSize(dark, 12) },
  });
  store.set(resetSettingsAtom);
  const reset = store.get(currentSettingsAtom).theme.main;
  expect(reset.table?.cell?.fontSize).toBe(16);
  expect(getCoreThemePresetId(reset, baseline)).toBe('carbonBlueDark');
  expect(reset).toEqual(store.get(defaultSettingsAtom).theme.main);
  const restored = createCorePresetTheme('app-default', baseline, reset);
  expect(restored.palette).toEqual(baseline.palette);
  expect(restored.table?.cell?.fontSize).toBe(16);
  expect(getCoreThemePresetId(restored, baseline)).toBe('app-default');
});
