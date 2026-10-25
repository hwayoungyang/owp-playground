import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readDeclarations } from '../scripts/api-declarations.mjs';
import { readOwnerPackageContracts } from '../scripts/knowledge-package-contracts.mjs';

const roots = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
const writeJson = (file, value) => writeFile(file, JSON.stringify(value));
const contractOf = ({ version, declarationHash, runtimeHash }) => ({
  version,
  declarationHash,
  runtimeHash,
});

async function createPackage(root, name, version) {
  const directory = path.join(root, 'store', `${name.replace('/', '-')}-${version}`);
  await mkdir(path.join(directory, 'dist'), { recursive: true });
  await writeJson(path.join(directory, 'package.json'), {
    name,
    version,
    type: 'module',
    exports: {
      '.': { types: './index.d.ts', default: './dist/index.js' },
      './package.json': './package.json',
    },
  });
  await writeFile(
    path.join(directory, 'index.d.ts'),
    'export interface SharedProps { value: string; }',
  );
  await writeFile(
    path.join(directory, 'dist/index.js'),
    `throw new Error('browser module must not execute: ${version}');`,
  );
  return directory;
}

async function linkPackage(root, name, directory) {
  const target = path.join(root, 'node_modules', name);
  await mkdir(path.dirname(target), { recursive: true });
  await symlink(directory, target, 'dir');
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'knowledge-contracts-'));
  roots.push(root);
  const core = await createPackage(root, '@owp/core', '8.1.0');
  const grid = await createPackage(root, '@owp/datagrid', '3.5.1');
  const charts = await createPackage(root, '@owp/charts', '5.0.2');
  const components = await createPackage(root, '@owp/components', '3.1.1');
  const oldComponents = await createPackage(root, '@owp/components', '3.1.0');
  const theme = await createPackage(root, '@owp/theme', '2.2.1');
  const oldTheme = await createPackage(root, '@owp/theme', '2.2.0');
  for (const [name, directory] of Object.entries({
    '@owp/core': core,
    '@owp/datagrid': grid,
    '@owp/charts': charts,
    '@owp/components': components,
    '@owp/theme': theme,
  })) {
    await linkPackage(root, name, directory);
  }
  for (const [owner, packages] of [
    [core, { '@owp/components': components, '@owp/theme': theme }],
    [grid, { '@owp/components': oldComponents, '@owp/theme': oldTheme }],
    [charts, { '@owp/components': oldComponents }],
  ]) {
    for (const [name, directory] of Object.entries(packages))
      await linkPackage(owner, name, directory);
  }
  const currentComponents = contractOf(await readDeclarations(components));
  const currentTheme = contractOf(await readDeclarations(theme));
  const previousComponents = contractOf(await readDeclarations(oldComponents));
  const previousTheme = contractOf(await readDeclarations(oldTheme));
  const registry = {
    schemaVersion: 1,
    owners: {
      '@owp/core': {
        version: '8.1.0',
        dependencies: { '@owp/components': currentComponents, '@owp/theme': currentTheme },
      },
      '@owp/datagrid': {
        version: '3.5.1',
        dependencies: { '@owp/components': previousComponents, '@owp/theme': previousTheme },
      },
      '@owp/charts': { version: '5.0.2', dependencies: { '@owp/components': previousComponents } },
    },
  };
  const registryFile = path.join(root, 'knowledge/reviewed-package-resolutions.json');
  await mkdir(path.dirname(registryFile), { recursive: true });
  await writeJson(registryFile, registry);
  const adapters = [
    {
      name: '@owp/core',
      referenceOnlyPackages: ['@owp/components'],
      contractPackages: ['@owp/theme'],
    },
    {
      name: '@owp/datagrid',
      referenceOnlyPackages: [],
      contractPackages: ['@owp/components', '@owp/theme'],
    },
    { name: '@owp/charts', referenceOnlyPackages: [], contractPackages: ['@owp/components'] },
  ];
  return {
    root,
    oldTheme,
    registry,
    registryFile,
    adapters,
    reviewed: { '@owp/components': currentComponents, '@owp/theme': currentTheme },
  };
}

describe('owner-aware installed package contracts', () => {
  it('keeps each actual owner resolution separate from workspace dependencies and API references', async () => {
    // Given
    const fixture = await createFixture();
    // When
    const result = await readOwnerPackageContracts(
      fixture.root,
      fixture.adapters,
      fixture.reviewed,
    );
    // Then
    expect(result.dependencyVersions).toEqual({
      '@owp/components': '3.1.1',
      '@owp/theme': '2.2.1',
    });
    expect(result.resolvedDependencies).toEqual(fixture.registry.owners);
    expect(result.referenceOnly.map((entry) => entry.version)).toEqual(['3.1.1']);
    expect(
      result.referenceOnly[0].records.every((record) => record.packageVersion === '3.1.1'),
    ).toBe(true);
    expect(JSON.stringify(result.resolvedDependencies)).not.toContain(fixture.root);
  });

  it('rejects changed nested Theme runtime even when the first owner and workspace still match', async () => {
    // Given
    const fixture = await createFixture();
    await writeFile(path.join(fixture.oldTheme, 'dist/index.js'), 'export const changed = true;');
    // When
    const result = readOwnerPackageContracts(fixture.root, fixture.adapters, fixture.reviewed);
    // Then
    await expect(result).rejects.toMatchObject({
      name: 'KnowledgePackageContractError',
      owner: '@owp/datagrid',
      dependency: '@owp/theme',
    });
  });

  it('rejects an owner dependency pair missing from the reviewed registry', async () => {
    // Given
    const fixture = await createFixture();
    delete fixture.registry.owners['@owp/datagrid'].dependencies['@owp/theme'];
    await writeJson(fixture.registryFile, fixture.registry);
    // When
    const result = readOwnerPackageContracts(fixture.root, fixture.adapters, fixture.reviewed);
    // Then
    await expect(result).rejects.toMatchObject({
      owner: '@owp/datagrid',
      dependency: '@owp/theme',
      message: expect.stringContaining('소유자·의존성 검토본이 없습니다'),
    });
  });

  it('rejects a changed owner version before accepting its dependency contracts', async () => {
    // Given
    const fixture = await createFixture();
    fixture.registry.owners['@owp/datagrid'].version = '3.5.0';
    await writeJson(fixture.registryFile, fixture.registry);
    // When
    const result = readOwnerPackageContracts(fixture.root, fixture.adapters, fixture.reviewed);
    // Then
    await expect(result).rejects.toMatchObject({
      owner: '@owp/datagrid',
      dependency: '@owp/datagrid',
      message: expect.stringContaining('소유자 버전'),
    });
  });

  it('rejects conflicting reference API versions instead of merging their record IDs', async () => {
    // Given
    const fixture = await createFixture();
    fixture.adapters[1].referenceOnlyPackages = ['@owp/components'];
    // When
    const result = readOwnerPackageContracts(fixture.root, fixture.adapters, fixture.reviewed);
    // Then
    await expect(result).rejects.toMatchObject({
      owner: '@owp/datagrid',
      dependency: '@owp/components',
      message: expect.stringContaining('서로 다른 버전의 API record를 합칠 수 없습니다'),
    });
  });
});
