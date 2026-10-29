import { describe, expect, it } from 'vitest';
import { coreFeatureCoverage } from '../src/playgrounds/core/model/featureCoverage';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { coreEnglish } from '../src/playgrounds/core/locales/en';
import { knowledge } from './fixtures/api-knowledge';

describe('Core public feature coverage', () => {
  it('connects every Core-owned public runtime record to exactly one feature group', () => {
    const publicNames = knowledge.records
      .filter(
        (record) =>
          record.package === '@owp/core' &&
          !record.signature.startsWith('export {') &&
          ['function', 'component', 'constant'].includes(record.kind) &&
          !record.id.split(':').at(-1)?.includes('.') &&
          record.imports.length > 0,
      )
      .map((record) => record.name)
      .sort();
    const grouped = coreFeatureCoverage
      .flatMap((group) => [...group.api])
      .filter((name) => !name.includes(':'))
      .sort();
    expect(grouped).toEqual(publicNames);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped).not.toContain('useQueryClient');
    expect(grouped).not.toContain('OwpLoading');
  });
  it('provides translated roles and valid document/example targets', () => {
    for (const group of coreFeatureCoverage) {
      expect(coreEnglish[group.title], group.id).toBeTruthy();
      expect(coreEnglish[group.body], group.id).toBeTruthy();
      for (const id of group.samples)
        expect(
          coreCatalog.some((entry) => entry.id === id),
          id,
        ).toBe(true);
    }
    expect(coreCatalog.find((entry) => entry.id === 'file-transfer')?.category).toBe('hooks');
    expect(coreCatalog.find((entry) => entry.id === 'zip-download')?.category).toBe('utils');
  });
});
