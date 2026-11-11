import { posix } from 'node:path';
import { planDistribution } from '../../src/distribution/content.ts';
import {
  DistributionError,
  objectDigest,
  parseProvidedManifest,
  sha256,
} from '../../scripts/distribution/integrity.ts';
import type { FileIdentity } from '../../scripts/distribution/files.ts';
import { validateIncludedGraph } from '../../scripts/distribution/graph.ts';
import {
  bundleDescriptorSchema,
  bundlePinSchema,
  bundleSpecSchema,
  materialDescriptorSchema,
  projectedDeclarationsSchema,
} from './model.ts';
import type { BundlePin, CompanyItem, ProjectedRecord } from './model.ts';
import { snapshotCompanyFiles } from './snapshot.ts';
import type { CompanySnapshot } from './snapshot.ts';

export function assertInventory(
  actual: readonly FileIdentity[],
  expected: readonly FileIdentity[],
): void {
  if (
    new Set(expected.map((file) => file.path)).size !== expected.length ||
    objectDigest([...actual].sort((a, b) => a.path.localeCompare(b.path))) !==
      objectDigest([...expected].sort((a, b) => a.path.localeCompare(b.path)))
  )
    throw new DistributionError(
      'company-inventory-mismatch',
      '번들 파일이 추가·누락·변경되었습니다.',
    );
}

export function readPreparedMaterial(root: string) {
  const snapshot = snapshotCompanyFiles(root);
  const materialBytes = snapshot.read('material.json');
  const material = materialDescriptorSchema.parse(JSON.parse(materialBytes.toString('utf8')));
  const { materialDigest, ...payload } = material;
  if (objectDigest(payload) !== materialDigest)
    throw new DistributionError('material-digest-mismatch', '준비 자료의 digest가 다릅니다.');
  assertInventory(snapshot.files, [
    ...material.files,
    {
      path: 'material.json',
      bytes: materialBytes.length,
      sha256: sha256(materialBytes),
    },
  ]);
  const manifest = parseProvidedManifest(
    JSON.parse(snapshot.read('provided-manifest.json').toString('utf8')),
    material.companyId,
  );
  if (material.buildId !== manifest.buildId || material.manifestDigest !== manifest.manifestDigest)
    throw new DistributionError(
      'material-identity-mismatch',
      '준비 자료와 manifest 식별자가 다릅니다.',
    );
  return { material, manifest, snapshot };
}

/** 검토된 명시 목록만 계획하며 미등록 항목이나 parent grant로 범위를 확장하지 않습니다. */
export function validateCompanySpec(
  root: string | CompanySnapshot,
  raw: unknown,
  expectedMaterialDigest: string,
) {
  const snapshot = typeof root === 'string' ? readPreparedMaterial(root).snapshot : root;
  const spec = bundleSpecSchema.parse(raw);
  const material = materialDescriptorSchema.parse(
    JSON.parse(snapshot.read('material.json').toString('utf8')),
  );
  const manifest = parseProvidedManifest(
    JSON.parse(snapshot.read('provided-manifest.json').toString('utf8')),
    spec.companyId,
  );
  if (
    spec.materialDigest !== expectedMaterialDigest ||
    material.materialDigest !== expectedMaterialDigest ||
    spec.buildId !== manifest.buildId ||
    spec.manifestDigest !== manifest.manifestDigest ||
    material.companyId !== spec.companyId ||
    material.buildId !== spec.buildId ||
    material.manifestDigest !== spec.manifestDigest
  )
    throw new DistributionError(
      'spec-identity-mismatch',
      '검토 spec과 준비 자료의 고객·build·digest가 다릅니다.',
    );
  if (spec.knownCapabilities.some((capability) => !manifest.features.includes(capability)))
    throw new DistributionError(
      'company-known-capability-excluded',
      'knownCapabilities에는 제공 manifest의 정확한 개별 capability만 지정할 수 있습니다.',
    );
  const plan = planDistribution({
    items: spec.items,
    requestedItems: spec.requestedItems,
    packageIds: Object.keys(manifest.packages),
    grantedCapabilities: manifest.features,
    knownCapabilities: spec.knownCapabilities,
  });
  if (!plan.ready || plan.includedItems.length !== spec.items.length)
    throw new DistributionError(
      'company-plan-blocked',
      '모든 번들 항목의 개별 capability와 의존성이 포함되어야 합니다.',
    );
  const items = new Map(spec.items.map((item) => [item.id, item]));
  const byRecord = new Map<string, CompanyItem>();
  for (const item of spec.items) {
    if (
      item.files.length === 0 ||
      item.references.some((id) => !items.has(id) || !item.dependencies.includes(id))
    )
      throw new DistributionError(
        'company-reference-excluded',
        '자료 파일과 참조 항목을 명시적인 의존성에 포함해야 합니다.',
      );
    if (item.kind === 'api' || item.kind === 'type') {
      if (!item.recordId || byRecord.has(item.recordId))
        throw new DistributionError(
          'company-record-unreviewed',
          'API·type record와 개별 capability를 정확하게 지정하세요.',
        );
      byRecord.set(item.recordId, item);
    } else if (item.recordId !== undefined)
      throw new DistributionError(
        'company-record-unexpected',
        'API·type 항목만 record ID를 가집니다.',
      );
    if (
      ((item.kind === 'example' || item.kind === 'guide') && !item.entrypoint) ||
      (item.entrypoint !== undefined && !item.files.includes(item.entrypoint))
    )
      throw new DistributionError('company-entry-excluded', '진입 파일이 포함 목록에 없습니다.');
  }
  const required = [
    'provided-manifest.json',
    ...Object.keys(manifest.packages).map((id) => `api/${id}.json`),
    ...plan.includedFiles.map((file) => `materials/${file}`),
  ].sort();
  if (
    required.join('\n') !==
    material.files
      .map((file) => file.path)
      .sort()
      .join('\n')
  )
    throw new DistributionError(
      'company-material-scope',
      '자료 inventory와 검토된 포함 목록이 다릅니다.',
    );
  const contents = validateIncludedGraph({
    root: `${snapshot.root}/materials`,
    readFile: (file) => snapshot.read(`materials/${file}`),
    includedFiles: plan.includedFiles,
    modules: spec.modules,
    packageNames: Object.values(manifest.packages).map((pkg) => pkg.packageName),
    externalPackages: spec.externalPackages,
    grantedCapabilities: manifest.features,
  });
  for (const [file, bytes] of contents) {
    const text = bytes.toString('utf8');
    if (
      file.endsWith('.md') &&
      (/^\s{0,3}\[[^\]]+\]:/m.test(text) ||
        /\]\s*\[[^\]]*\]/.test(text) ||
        /<(?:https?:|owp:|\/\/)/i.test(text))
    )
      throw new DistributionError(
        'company-document-link',
        '참조형·자동 링크는 검토된 상대 inline 링크로 바꿔야 합니다.',
      );
    if (/\{@link\s/.test(text))
      throw new DistributionError(
        'company-document-reference',
        'JSDoc 링크는 명시적인 포함 자료 참조로 검토해야 합니다.',
      );
  }
  for (const item of spec.items)
    for (const file of item.files) {
      const module = spec.modules.find((entry) => entry.path === file);
      if (!module)
        throw new DistributionError('company-module-missing', '자료 module 검토가 없습니다.');
      const linked = [
        ...module.links,
        ...Object.values(module.dependencies).flatMap((entry) =>
          entry.kind === 'file' ? [entry.path] : [],
        ),
      ];
      for (const target of linked)
        if (
          !item.files.includes(target) &&
          !item.dependencies.some((id) => items.get(id)?.files.includes(target))
        )
          throw new DistributionError(
            'company-file-dependency',
            '자료 링크·import 대상을 항목 의존성으로 포함해야 합니다.',
          );
    }
  const records = new Map<string, ProjectedRecord>();
  for (const [id, pkg] of Object.entries(manifest.packages)) {
    const declarations = projectedDeclarationsSchema.parse(
      JSON.parse(snapshot.read(`api/${id}.json`).toString('utf8')),
    );
    if (declarations.version !== pkg.version)
      throw new DistributionError('company-version-mismatch', 'projected API 버전이 다릅니다.');
    for (const record of declarations.records) {
      const item = byRecord.get(record.id);
      if (
        !item ||
        item.packageId !== id ||
        record.package !== pkg.packageName ||
        record.packageVersion !== pkg.version ||
        records.has(record.id) ||
        (record.kind === 'type') !== (item.kind === 'type')
      )
        throw new DistributionError(
          'company-api-excluded',
          'projected API의 모든 record와 member를 개별 검토해야 합니다.',
        );
      const capabilities = record.imports.length
        ? record.imports.map((entry) => {
            if (entry !== record.package && !entry.startsWith(`${record.package}/`))
              throw new DistributionError(
                'company-api-import',
                'API의 공개 import가 다른 package를 가리킵니다.',
              );
            const subpath = entry.slice(record.package.length).replace(/^\//, '');
            return `${id}:${subpath ? `${subpath}:` : ''}${record.owner}${record.path ? `.${record.path}` : ''}`;
          })
        : [record.id.replace(/^@owp\//, '')];
      if (
        capabilities.some(
          (capability) =>
            !item.requires.includes(capability) || !manifest.features.includes(capability),
        )
      )
        throw new DistributionError(
          'company-api-capability',
          'API의 public import와 개별 member capability를 정확하게 포함해야 합니다.',
        );
      const sourceFiles = item.files.filter(
        (file) => sha256(contents.get(file) ?? Buffer.alloc(0)) === record.source.sha256,
      );
      if (
        sourceFiles.length !== 1 ||
        !sourceFiles.some((file) =>
          spec.items.some(
            (source) =>
              source.kind === 'source' &&
              source.files.includes(file) &&
              item.dependencies.includes(source.id),
          ),
        )
      )
        throw new DistributionError(
          'company-api-source',
          '실제 declaration source와 포함된 source 항목의 hash가 다릅니다.',
        );
      records.set(record.id, record);
    }
  }
  if (records.size !== byRecord.size)
    throw new DistributionError(
      'company-api-missing',
      '검토된 API가 실제 projected 선언에 없습니다.',
    );
  for (const [id, record] of records) {
    const item = byRecord.get(id);
    for (const reference of [
      ...record.related,
      ...record.bases.map((base) => base.id),
      ...Object.values(record.typeReferences),
    ]) {
      const target = byRecord.get(reference);
      if (!target || (target.id !== item?.id && !item?.dependencies.includes(target.id)))
        throw new DistributionError(
          'company-api-reference',
          'API 참조 type이 포함되거나 의존성으로 검토되지 않았습니다.',
        );
    }
    for (const specifier of record.imports) {
      const packageName = specifier
        .split('/')
        .slice(0, specifier.startsWith('@') ? 2 : 1)
        .join('/');
      if (
        !(
          packageName.startsWith('@owp/')
            ? Object.values(manifest.packages).map((pkg) => pkg.packageName)
            : spec.externalPackages
        ).includes(packageName)
      )
        throw new DistributionError(
          'company-api-import',
          'API import가 허용되지 않은 package를 가리킵니다.',
        );
    }
  }
  const adapterIds = new Set<string>();
  for (const adapter of spec.executionAdapters) {
    const item = items.get(adapter.itemId);
    if (
      !item ||
      item.kind !== 'example' ||
      item.entrypoint !== adapter.entry ||
      !item.files.includes(adapter.entry) ||
      adapterIds.has(adapter.itemId)
    )
      throw new DistributionError(
        'company-adapter-excluded',
        '실행 adapter는 포함된 예제의 명시적 entry만 사용할 수 있습니다.',
      );
    adapterIds.add(adapter.itemId);
  }
  return { spec, manifest, items, records, contents };
}

export function readCompanyBundle(root: string, rawPin: BundlePin) {
  const pin = bundlePinSchema.parse(rawPin);
  const snapshot = snapshotCompanyFiles(root);
  const descriptorBytes = snapshot.read('company-bundle.json');
  const descriptor = bundleDescriptorSchema.parse(JSON.parse(descriptorBytes.toString('utf8')));
  const { bundleDigest, ...payload } = descriptor;
  if (objectDigest(payload) !== bundleDigest || bundleDigest !== pin.bundleDigest)
    throw new DistributionError('company-bundle-digest', '시작 시 고정한 번들 digest가 다릅니다.');
  for (const key of ['companyId', 'buildId', 'manifestDigest', 'releaseId'] as const)
    if (descriptor[key] !== pin[key] || descriptor.spec[key] !== pin[key])
      throw new DistributionError(
        'company-bundle-identity',
        '시작 시 고정한 고객·build·manifest·release가 다릅니다.',
      );
  assertInventory(snapshot.files, [
    ...descriptor.files,
    {
      path: 'company-bundle.json',
      bytes: descriptorBytes.length,
      sha256: sha256(descriptorBytes),
    },
  ]);
  const material = materialDescriptorSchema.parse(
    JSON.parse(snapshot.read('material.json').toString('utf8')),
  );
  const { materialDigest, ...materialPayload } = material;
  if (
    objectDigest(materialPayload) !== materialDigest ||
    descriptor.materialDigest !== materialDigest
  )
    throw new DistributionError('material-digest-mismatch', '준비 자료의 digest가 다릅니다.');
  assertInventory(
    descriptor.files.filter((file) => file.path !== 'material.json'),
    material.files,
  );
  const validated = validateCompanySpec(snapshot, descriptor.spec, materialDigest);
  const files = new Map(descriptor.files.map((file) => [file.path, file]));
  // 검증된 bytes를 보관하므로 실행 중 원본 파일 교체로 scope를 변경할 수 없습니다.
  const read = (file: string): Buffer => {
    const content = snapshot.read(file);
    const identity = files.get(file);
    if (!content || !identity || sha256(content) !== identity.sha256)
      throw new DistributionError('company-file-excluded', '포함된 파일만 읽을 수 있습니다.');
    return Buffer.from(content);
  };
  return {
    ...validated,
    descriptor,
    pin,
    read,
    files,
    descriptorBytes: Buffer.from(descriptorBytes),
  };
}
export type CompanyBundle = ReturnType<typeof readCompanyBundle>;

export function companyFileUrl(file: string): string {
  if (
    file.startsWith('/') ||
    file.includes('%') ||
    file.includes('\\') ||
    posix.normalize(file) !== file ||
    file.split('/').includes('..')
  )
    throw new DistributionError('company-url-excluded', '포함된 상대 URL만 사용할 수 있습니다.');
  return `./${file}`;
}
