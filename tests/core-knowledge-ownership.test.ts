import { describe, expect, it } from 'vitest';
import { knowledge } from './fixtures/api-knowledge';
import { createPackageKnowledge } from '../src/features/api/model/package-data';
import { completedPlaygroundPackages } from '../src/playgrounds/packages';
import data from '../src/features/api/data/knowledge.generated.json';

describe('Core sample ownership in generated Knowledge', () => {
  it('links migrated UI to Components while preserving Core policy owners', () => {
    const expectedExamples = [
      ['@owp/components:OwpDialog', ['dialog']],
      ['@owp/components:OwpPageCarded', ['getting-started', 'page-carded']],
      ['@owp/components:OwpPageContent', ['page-carded', 'page-content']],
      ['@owp/components:OwpErrorBoundary', ['error-boundary', 'getting-started']],
      ['@owp/core:useDialogPolicy', ['dialog']],
      ['@owp/core:usePageCardedPolicy', ['getting-started', 'page-carded']],
      ['@owp/core:errorBoundaryPolicy', ['error-boundary', 'getting-started']],
      ['@owp/core:OwpCoreResponsiveLayoutGlobalStyles', ['page-carded', 'page-content']],
    ] as const;
    for (const [id, examples] of expectedExamples) {
      const record = knowledge.records.find((entry) => entry.id === id);
      expect(record?.packageVersion).toBe(id.startsWith('@owp/components:') ? '3.1.1' : '8.1.0');
      expect(record?.examples.map((example) => example.id).sort()).toEqual(examples);
    }
    for (const name of ['OwpDialog', 'OwpPageCarded', 'OwpPageContent', 'OwpErrorBoundary']) {
      const coreAdapter = knowledge.records.find((record) => record.id === `@owp/core:${name}`);
      expect(coreAdapter?.examples).toEqual([]);
    }
  });

  it('links supporting result tables to Components and preserves settings adapter links', () => {
    const componentsTable = knowledge.records.find(
      (record) => record.id === '@owp/components:OwpTable',
    );
    const coreTable = knowledge.records.find((record) => record.id === '@owp/core:OwpTable');
    expect(componentsTable?.imports).toEqual(['@owp/components']);
    expect(componentsTable?.packageVersion).toBe('3.1.1');
    expect(componentsTable?.examples.map((example) => example.id).sort()).toEqual([
      'api-query',
      'excel-export',
      'getting-started',
      'page-carded',
      'page-content',
      'search-filter',
      'user-permissions',
    ]);
    expect(coreTable?.examples.map((example) => example.id)).toEqual(['app-settings']);
    expect(
      knowledge.records
        .find((record) => record.id === '@owp/components:OwpFieldTable')
        ?.examples.map((example) => example.id),
    ).toEqual(['dialog']);
    expect(
      knowledge.records
        .find((record) => record.id === '@owp/core:OwpFieldTable')
        ?.examples.map((example) => example.id),
    ).toEqual(['app-settings']);
  });

  it('keeps Core APIs and qualified supporting props in the same example', () => {
    const query = data.examples.find(
      (example) => example.packageId === 'core' && example.id === 'api-query',
    );
    const ids = query?.references.map((reference) => reference.id) ?? [];
    expect(ids).toContain('@owp/core:createOwpApiHooks');
    expect(ids).toContain('@owp/components:OwpTable');
    expect(ids.some((id) => id.startsWith('@owp/components:OwpTableProps.'))).toBe(true);
    expect(ids.some((id) => id.startsWith('@owp/core:OwpTable'))).toBe(false);
  });

  it('includes Components references in Core without registering a Components Playground', () => {
    const core = knowledge.packages.find((entry) => entry.id === 'core');
    if (!core) throw new TypeError('Core fixture is required');
    const result = createPackageKnowledge(knowledge, core);
    expect(result.records.every((record) => record.package === '@owp/core')).toBe(true);
    expect(result.referenceRecords.some((record) => record.id === '@owp/components:OwpTable')).toBe(
      true,
    );
    expect(
      result.referenceRecords.some((record) => record.id === '@owp/components:OwpFieldTable'),
    ).toBe(true);
    expect(completedPlaygroundPackages.map((entry) => entry.name)).not.toContain('@owp/components');
  });
});
