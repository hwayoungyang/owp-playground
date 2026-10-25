import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { z } from 'zod';
import { readDeclarations } from './api-declarations.mjs';

const contractSchema = z.strictObject({
  version: z.string().min(1),
  declarationHash: z.string().regex(/^[a-f0-9]{64}$/),
  runtimeHash: z.string().regex(/^[a-f0-9]{64}$/),
});
const resolutionsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  owners: z.record(z.string(), z.strictObject({
    version: z.string().min(1),
    dependencies: z.record(z.string(), contractSchema),
  })),
});
const contractOf = ({ version, declarationHash, runtimeHash }) => ({ version, declarationHash, runtimeHash });
const matchesContract = (current, previous) => previous && Object.entries(contractOf(current)).every(([key, value]) => previous[key] === value);

export class KnowledgePackageContractError extends Error {
  name = 'KnowledgePackageContractError';

  constructor(owner, dependency, detail) {
    super(`설치 패키지 계약을 확인하세요: ${owner} → ${dependency}. ${detail}`);
    this.owner = owner;
    this.dependency = dependency;
  }
}

const readInstalledManifest = async (root, name) => {
  const file = await realpath(path.join(root, 'node_modules', name, 'package.json'));
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  if (manifest.name !== name || typeof manifest.version !== 'string') {
    throw new KnowledgePackageContractError(name, name, '설치된 package.json의 이름·버전이 올바르지 않습니다.');
  }
  return { file, version: manifest.version };
};

/** 각 adapter 소유자의 실제 설치본과 workspace 직접 의존성을 별도로 검증합니다. */
export async function readOwnerPackageContracts(root, adapters, reviewed) {
  const registry = resolutionsSchema.parse(JSON.parse(await readFile(path.join(root, 'knowledge/reviewed-package-resolutions.json'), 'utf8')));
  const referenceOnlyPackages = [...new Set(adapters.flatMap((adapter) => adapter.referenceOnlyPackages ?? []))];
  const declarations = new Map();
  const readPackage = async (directory) => {
    const actual = await realpath(directory);
    if (!declarations.has(actual)) declarations.set(actual, readDeclarations(actual, { externalPackages: referenceOnlyPackages }));
    return declarations.get(actual);
  };
  const referenceOnly = new Map();
  const dependencyNames = new Set();
  const resolvedDependencies = {};
  for (const adapter of adapters) {
    const expected = registry.owners[adapter.name];
    if (!expected) throw new KnowledgePackageContractError(adapter.name, adapter.name, 'reviewed-package-resolutions.json에 소유자 검토본이 없습니다.');
    const names = [...new Set([...(adapter.referenceOnlyPackages ?? []), ...(adapter.contractPackages ?? [])])];
    const extra = Object.keys(expected.dependencies).find((name) => !names.includes(name));
    if (extra) throw new KnowledgePackageContractError(adapter.name, extra, '검토본의 의존성이 adapter의 계약 목록에 없습니다.');
    let owner;
    try {
      owner = await readInstalledManifest(root, adapter.name);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new KnowledgePackageContractError(adapter.name, adapter.name, '소유 패키지의 설치본이 없습니다.');
      throw error;
    }
    if (expected.version !== owner.version) throw new KnowledgePackageContractError(adapter.name, adapter.name, `소유자 버전 ${owner.version}이 검토본 ${expected.version}과 다릅니다.`);
    const require = createRequire(owner.file);
    const dependencies = {};
    for (const name of names) {
      if (!expected.dependencies[name]) throw new KnowledgePackageContractError(adapter.name, name, 'reviewed-package-resolutions.json에 소유자·의존성 검토본이 없습니다.');
      let current;
      try {
        current = await readPackage(path.dirname(require.resolve(`${name}/package.json`)));
      } catch (error) {
        if (error instanceof Error && 'code' in error && ['ENOENT', 'MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(error.code)) throw new KnowledgePackageContractError(adapter.name, name, '소유자 기준으로 의존 패키지의 공개 설치본을 찾을 수 없습니다.');
        throw error;
      }
      if (!matchesContract(current, expected.dependencies[name])) throw new KnowledgePackageContractError(adapter.name, name, `설치본 ${current.version}의 선언·runtime 계약이 검토본과 다릅니다. API·동작을 대조한 뒤 reviewed-package-resolutions.json을 갱신하세요.`);
      dependencies[name] = contractOf(current);
      dependencyNames.add(name);
      if (adapter.referenceOnlyPackages?.includes(name)) {
        const previous = referenceOnly.get(name);
        if (previous && !matchesContract(current, previous)) throw new KnowledgePackageContractError(adapter.name, name, '소유자별 API 참조 설치본이 다릅니다. 서로 다른 버전의 API record를 합칠 수 없습니다.');
        referenceOnly.set(name, current);
      }
    }
    resolvedDependencies[adapter.name] = { version: owner.version, dependencies };
  }
  const extraOwner = Object.keys(registry.owners).find((name) => !adapters.some((adapter) => adapter.name === name));
  if (extraOwner) throw new KnowledgePackageContractError(extraOwner, extraOwner, '검토본의 소유자가 현재 adapter 목록에 없습니다.');
  const dependencyVersions = {};
  for (const name of dependencyNames) {
    let current;
    try {
      current = await readPackage(path.join(root, 'node_modules', name));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new KnowledgePackageContractError('workspace', name, '직접 의존 패키지의 설치본이 없습니다.');
      throw error;
    }
    if (!matchesContract(current, reviewed[name])) throw new KnowledgePackageContractError('workspace', name, `직접 설치본 ${current.version}의 선언·runtime 계약이 검토본과 다릅니다. reviewed-packages.json을 갱신하세요.`);
    dependencyVersions[name] = current.version;
  }
  return { referenceOnly: [...referenceOnly.values()], dependencyVersions, resolvedDependencies };
}
