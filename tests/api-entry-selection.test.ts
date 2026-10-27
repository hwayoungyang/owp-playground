import { describe, expect, it } from 'vitest';
import { selectApiRecord } from '../src/features/api/model/knowledge';
import { packageDataset } from './fixtures/api-knowledge';

describe('API entry selection', () => {
  for (const [packageId, defaultSymbol, directSymbol] of [
    ['core', '@owp/core:OwpCoreProviderProps', '@owp/core:AnyFormFieldType'],
    ['datagrid', '@owp/datagrid:OwpDataGridProps', '@owp/datagrid:OwpDataGridApi'],
    ['charts', '@owp/charts:ChartFrameProps', '@owp/charts:BoxPlotDatasetOptions'],
  ] as const) {
    const installedKnowledge = packageDataset(packageId);

    for (const symbol of [null, '']) {
      it(`opens the installed representative type for ${packageId} when symbol is ${JSON.stringify(symbol)}`, () => {
        // Given
        const expected = installedKnowledge.recordsById.get(defaultSymbol);
        // When
        const selected = selectApiRecord(installedKnowledge, symbol);
        // Then
        expect(expected).toMatchObject({ id: defaultSymbol, kind: 'type', path: '' });
        expect(selected).toBe(expected);
        expect(selected?.signature).not.toBe('');
        expect(installedKnowledge.membersByOwner.get(defaultSymbol)?.length).toBeGreaterThan(0);
      });
    }

    it(`opens an explicitly requested ${packageId} symbol instead of its representative type`, () => {
      // Given
      const expected = installedKnowledge.recordsById.get(directSymbol);
      // When
      const selected = selectApiRecord(installedKnowledge, directSymbol);
      // Then
      expect(expected).toMatchObject({ id: directSymbol });
      expect(selected).toBe(expected);
    });

    for (const symbol of ['@owp/core:OwpSearchFilterProps', 'missing-symbol']) {
      it(`keeps an unresolved explicit ${packageId} symbol unresolved: ${symbol}`, () => {
        // Given
        const explicitSymbol = symbol;
        // When
        const selected = selectApiRecord(installedKnowledge, explicitSymbol);
        // Then
        expect(selected).toBeUndefined();
      });
    }
  }
});
