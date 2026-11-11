import { DistributionError, objectDigest, sha256 } from '../../scripts/distribution/integrity.ts';
import { z } from 'zod';
import { companyFileUrl, readCompanyBundle } from './bundle.ts';
import type { BundlePin, CompanyItem } from './model.ts';
import { apiInput, exampleInput, guideInput, listInput, searchInput } from './schema.ts';

export class CompanyKnowledgeError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CompanyKnowledgeError';
    this.code = code;
  }
}

export function createCompanyKnowledgeStore(options: {
  readonly bundleRoot: string;
  readonly pin: BundlePin;
}) {
  const bundle = readCompanyBundle(options.bundleRoot, options.pin);
  const release = bundle.pin.releaseId;
  const requestedItems = new Set(bundle.spec.requestedItems);
  const knowledgePackages = new Set(
    bundle.spec.items
      .filter((item) => item.kind !== 'source' || requestedItems.has(item.id))
      .map((item) => item.packageId),
  );
  function resolve(input: {
    readonly releaseId?: string | undefined;
    readonly package?: string | undefined;
    readonly version?: string | undefined;
  }) {
    if (input.releaseId !== undefined && input.releaseId !== release)
      throw new CompanyKnowledgeError('RELEASE_NOT_FOUND', '고정된 release만 조회할 수 있습니다.');
    const id = input.package?.replace(/^@owp\//, '');
    const pkg = id && knowledgePackages.has(id) ? bundle.manifest.packages[id] : undefined;
    if (id && !pkg)
      throw new CompanyKnowledgeError('PACKAGE_NOT_FOUND', '제공된 package만 조회할 수 있습니다.');
    if (input.version !== undefined && input.version !== pkg?.version)
      throw new CompanyKnowledgeError(
        'VERSION_NOT_FOUND',
        '제공된 정확한 package 버전만 조회할 수 있습니다.',
      );
    return { id, pkg };
  }
  const metadata = (id: string | undefined, files: readonly string[] = []) => ({
    schemaVersion: 1 as const,
    releaseId: release,
    package: id ? (bundle.manifest.packages[id]?.packageName ?? null) : null,
    packageVersion: id ? (bundle.manifest.packages[id]?.version ?? null) : null,
    sourceUrls: [...new Set(['provided-manifest.json', ...files])].map(companyFileUrl),
  });
  const itemUrl = (item: CompanyItem) =>
    companyFileUrl(`materials/${item.entrypoint ?? item.files[0]}`);
  const summary = (item: CompanyItem) => ({
    id: item.recordId ?? item.id,
    kind: item.kind === 'type' ? 'api' : item.kind,
    name: item.title,
    description: item.description.slice(0, 600),
    url: itemUrl(item),
  });
  const select = (id: string | undefined, kinds: readonly string[]) =>
    bundle.spec.items.filter((item) => item.packageId === id && kinds.includes(item.kind));
  const find = (candidates: readonly CompanyItem[], key: string, code: string) => {
    const exact = candidates.find((item) => item.id === key || item.recordId === key);
    const matches = candidates.filter(
      (item) => item.title === key || bundle.records.get(item.recordId ?? '')?.name === key,
    );
    const item = exact ?? (matches.length === 1 ? matches[0] : undefined);
    if (!item)
      throw new CompanyKnowledgeError(code, '정확한 포함 항목 ID 또는 고유한 이름을 지정하세요.');
    return item;
  };
  const sourceManifest = (item: CompanyItem) =>
    item.files.map((file) => {
      const module = bundle.spec.modules.find((entry) => entry.path === file);
      if (!module)
        throw new CompanyKnowledgeError('FILE_NOT_ALLOWED', '검토된 source 파일이 없습니다.');
      return {
        path: file,
        sha256: module.sha256,
        dependencies: Object.values(module.dependencies).flatMap((entry) =>
          entry.kind === 'file' ? [entry.path] : [],
        ),
        externalImports: Object.keys(module.dependencies).filter(
          (key) => module.dependencies[key]?.kind === 'package',
        ),
      };
    });
  const store = {
    async listPackages(raw: unknown) {
      resolve(listInput.parse(raw));
      return {
        ...metadata(undefined),
        packages: Object.entries(bundle.manifest.packages)
          .filter(([id]) => knowledgePackages.has(id))
          .map(([id, pkg]) => ({
            id,
            name: pkg.packageName,
            version: pkg.version,
            availableVersions: [pkg.version],
          })),
      };
    },
    async searchKnowledge(raw: unknown) {
      const input = searchInput.parse(raw);
      const { id } = resolve(input);
      const words = input.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const results = select(
        id,
        input.kind === 'all'
          ? ['api', 'type', 'guide', 'example']
          : input.kind === 'api'
            ? ['api', 'type']
            : [input.kind],
      )
        .filter((item) =>
          words.every((word) =>
            `${item.id} ${item.title} ${item.description} ${bundle.records.get(item.recordId ?? '')?.signature ?? ''}`
              .toLocaleLowerCase()
              .includes(word),
          ),
        )
        .map(summary);
      return {
        ...metadata(id),
        results: results.slice(input.offset, input.offset + input.limit),
        total: results.length,
        nextOffset: input.offset + input.limit < results.length ? input.offset + input.limit : null,
      };
    },
    async getApi(raw: unknown) {
      const input = apiInput.parse(raw);
      const { id } = resolve(input);
      const item = find(select(id, ['api', 'type']), input.symbol, 'API_NOT_FOUND');
      const declaration = bundle.records.get(item.recordId ?? '');
      if (!declaration)
        throw new CompanyKnowledgeError('API_NOT_FOUND', 'projected 선언에 API가 없습니다.');
      const source = item.files.find(
        (file) => sha256(bundle.read(`materials/${file}`)) === declaration.source.sha256,
      );
      if (!source)
        throw new CompanyKnowledgeError(
          'INTEGRITY_MISMATCH',
          '포함된 declaration source가 없습니다.',
        );
      const members = select(id, ['api', 'type'])
        .filter(
          (entry) =>
            entry.recordId !== item.recordId && entry.recordId?.startsWith(`${declaration.id}.`),
        )
        .map(summary);
      const record = {
        id: declaration.id,
        package: declaration.package,
        packageVersion: declaration.packageVersion,
        owner: declaration.owner,
        name: declaration.name,
        path: declaration.path,
        kind: declaration.kind,
        imports: declaration.imports,
        description: declaration.description,
        signature: declaration.signature,
        typeParameters: declaration.typeParameters,
        typeReferences: declaration.typeReferences,
        body: declaration.description,
        requirement: declaration.requirement ?? 'declaration',
        related: declaration.related,
        guideIds: item.references.filter((key) => bundle.items.get(key)?.kind === 'guide'),
        locale: 'ko',
        defaultDescription: null,
        usageNote: null,
        examples: [],
        source: { ...declaration.source, path: `materials/${source}` },
        sources: [companyFileUrl(`materials/${source}`)],
        url: itemUrl(item),
        contentHash: objectDigest(declaration),
      };
      return {
        ...metadata(id, [`api/${id}.json`, `materials/${source}`]),
        record,
        members: members.slice(input.offset, input.offset + input.limit),
        total: members.length,
        nextOffset: input.offset + input.limit < members.length ? input.offset + input.limit : null,
      };
    },
    async getGuide(raw: unknown) {
      const input = guideInput.parse(raw);
      const { id } = resolve(input);
      const item = find(select(id, ['guide']), input.guideId, 'GUIDE_NOT_FOUND');
      const file = `materials/${item.entrypoint}`;
      const bytes = bundle.read(file);
      const text = bytes.toString('utf8');
      if (input.offset > text.length)
        throw new CompanyKnowledgeError('INVALID_OFFSET', 'guide offset이 문서 길이를 넘습니다.');
      return {
        ...metadata(id, [file]),
        id: item.id,
        title: item.title,
        description: item.description,
        content: text.slice(input.offset, input.offset + input.maxChars),
        contentHash: sha256(bytes),
        url: companyFileUrl(file),
        totalChars: text.length,
        nextOffset:
          input.offset + input.maxChars < text.length ? input.offset + input.maxChars : null,
      };
    },
    async getExample(raw: unknown) {
      return getExampleData(raw, ['example', 'source']);
    },
    async resourceLinks() {
      return bundle.spec.items
        .filter((item) => knowledgePackages.has(item.packageId))
        .map((item) => ({
          uri: `owp://${release}/${item.packageId}/${item.kind === 'example' || item.kind === 'source' ? 'source' : item.kind === 'guide' ? 'guide' : 'api'}/${encodeURIComponent(item.recordId ?? item.id)}`,
          name: `${bundle.manifest.packages[item.packageId]?.packageName} ${item.title}`,
          mimeType: 'application/json',
        }));
    },
    async listResources(raw: unknown) {
      const input = z.strictObject({ cursor: z.string().max(100).optional() }).parse(raw);
      let offset = 0;
      if (input.cursor !== undefined) {
        const [digest, position, extra] = input.cursor.split(':');
        if (
          digest !== bundle.pin.bundleDigest ||
          !position ||
          !/^(?:0|[1-9]\d*)$/.test(position) ||
          extra !== undefined ||
          !Number.isSafeInteger(Number(position))
        )
          throw new CompanyKnowledgeError(
            'INVALID_CURSOR',
            '이 번들에서 반환한 resource cursor만 사용할 수 있습니다.',
          );
        offset = Number(position);
      }
      const resources = await store.resourceLinks();
      return {
        resources: resources.slice(offset, offset + 50),
        ...(offset + 50 < resources.length
          ? { nextCursor: `${bundle.pin.bundleDigest}:${offset + 50}` }
          : {}),
      };
    },
    async readResource(raw: string) {
      // URL 정규화가 traversal을 숨기기 전에 원문 구조와 canonical encoding을 검사합니다.
      const match =
        /^owp:\/\/([A-Za-z0-9][A-Za-z0-9._-]*)\/([a-z][a-z0-9-]*)\/(api|guide|source)\/([^/?#]+)$/.exec(
          raw,
        );
      if (!match)
        throw new CompanyKnowledgeError(
          'RESOURCE_NOT_FOUND',
          '정확한 포함 resource URI가 필요합니다.',
        );
      const [, releaseId, packageId, kind, encoded] = match;
      if (!encoded)
        throw new CompanyKnowledgeError('RESOURCE_NOT_FOUND', 'resource key가 없습니다.');
      let key: string;
      try {
        key = decodeURIComponent(encoded);
      } catch (error) {
        if (!(error instanceof URIError)) throw error;
        throw new CompanyKnowledgeError(
          'RESOURCE_NOT_FOUND',
          'resource encoding이 잘못되었습니다.',
        );
      }
      if (
        encodeURIComponent(key) !== encoded ||
        /[\\%]/.test(key) ||
        Array.from(key).some((char) => char.charCodeAt(0) < 32) ||
        key.split('/').some((part) => part === '.' || part === '..')
      )
        throw new CompanyKnowledgeError('RESOURCE_NOT_FOUND', 'resource 경로가 허용되지 않습니다.');
      const pin = { package: packageId, releaseId };
      if (kind === 'api') return store.getApi({ ...pin, symbol: key });
      if (kind === 'guide') return store.getGuide({ ...pin, guideId: key });
      return getExampleData({ ...pin, exampleId: key }, ['example', 'source']);
    },
    async readStatic(releaseId: string, relativeUrl: string) {
      resolve({ releaseId });
      if (!relativeUrl.startsWith('./') || companyFileUrl(relativeUrl.slice(2)) !== relativeUrl)
        throw new DistributionError('company-url-excluded', '정확한 포함 상대 URL이 필요합니다.');
      return bundle.read(relativeUrl.slice(2));
    },
  };
  async function getExampleData(raw: unknown, kinds: readonly string[]) {
    const input = exampleInput.parse(raw);
    const { id } = resolve(input);
    const item = find(select(id, kinds), input.exampleId, 'EXAMPLE_NOT_FOUND');
    const requested = input.file ?? item.entrypoint ?? item.files[0];
    if (!requested || !item.files.includes(requested))
      throw new CompanyKnowledgeError(
        'FILE_NOT_ALLOWED',
        '예제에 포함된 상대 파일만 읽을 수 있습니다.',
      );
    // dependency 조회의 offset은 요청 file과 무관한 entrypoint·item.files 순서입니다.
    const entrypoint = item.entrypoint ?? item.files[0];
    const candidates = input.includeDependencies
      ? [...new Set([entrypoint, ...item.files])].filter((file) => file !== undefined)
      : [requested];
    if (input.offset > candidates.length)
      throw new CompanyKnowledgeError('INVALID_OFFSET', 'source offset이 파일 수를 넘습니다.');
    const requestedIndex = candidates.indexOf(requested);
    const pendingStart =
      input.pendingStart ??
      (requestedIndex > input.offset
        ? { file: requested, startLine: input.startLine, startColumn: input.startColumn }
        : undefined);
    const pendingIndex = pendingStart ? candidates.indexOf(pendingStart.file) : -1;
    if (pendingStart) {
      if (
        !input.includeDependencies ||
        pendingIndex <= input.offset ||
        (input.pendingStart !== undefined && requested !== candidates[input.offset])
      )
        throw new CompanyKnowledgeError(
          'INVALID_OFFSET',
          '대기 source 위치가 파일 순서와 다릅니다.',
        );
      const pendingLines = bundle
        .read(`materials/${pendingStart.file}`)
        .toString('utf8')
        .split('\n');
      if (
        pendingStart.startLine > pendingLines.length ||
        pendingStart.startColumn > (pendingLines[pendingStart.startLine - 1]?.length ?? 0) + 1
      )
        throw new CompanyKnowledgeError(
          'INVALID_OFFSET',
          '대기 source 위치가 파일 길이를 넘습니다.',
        );
    }
    const manifest = sourceManifest(item);
    let budget = input.maxChars;
    let nextOffset: number | null = null;
    const files = [];
    for (const [index, file] of candidates
      .slice(input.offset, input.offset + input.limit)
      .entries()) {
      const lines = bundle.read(`materials/${file}`).toString('utf8').split('\n');
      const start =
        file === pendingStart?.file
          ? pendingStart
          : file === requested
            ? input
            : { startLine: 1, startColumn: 1 };
      const { startLine, startColumn } = start;
      if (startLine > lines.length)
        throw new CompanyKnowledgeError(
          'INVALID_OFFSET',
          'source startLine이 파일 줄 수를 넘습니다.',
        );
      if (startColumn > (lines[startLine - 1]?.length ?? 0) + 1)
        throw new CompanyKnowledgeError(
          'INVALID_OFFSET',
          'source startColumn이 해당 줄의 길이를 넘습니다.',
        );
      const picked: string[] = [];
      let length = 0;
      let lineIndex = startLine - 1;
      let column = startColumn - 1;
      while (lineIndex < lines.length) {
        const line = lines[lineIndex] ?? '';
        // newline도 소비한 content에 포함하며, 긴 한 줄만 column으로 나눕니다.
        const chunk = line.slice(column) + (lineIndex < lines.length - 1 ? '\n' : '');
        if (chunk.length + length > budget) {
          if (length === 0 && files.length === 0) {
            const part = chunk.slice(0, budget);
            picked.push(part);
            length += part.length;
            column += part.length;
          }
          break;
        }
        picked.push(chunk);
        length += chunk.length;
        lineIndex++;
        column = 0;
      }
      if (!picked.length && lineIndex < lines.length) {
        nextOffset = input.offset + index;
        break;
      }
      budget -= length;
      const truncated = lineIndex < lines.length;
      const identity = bundle.files.get(`materials/${file}`);
      if (!identity)
        throw new CompanyKnowledgeError('FILE_NOT_ALLOWED', 'source inventory가 없습니다.');
      files.push({
        path: file,
        sha256: identity.sha256,
        sourceUrl: companyFileUrl(`materials/${file}`),
        content: picked.join(''),
        startLine,
        startColumn,
        nextLine: truncated ? lineIndex + 1 : null,
        nextColumn: truncated ? column + 1 : null,
        truncated,
      });
      if (truncated) {
        nextOffset = input.offset + index;
        break;
      }
    }
    if (nextOffset === null && input.offset + files.length < candidates.length)
      nextOffset = input.offset + files.length;
    const nextFile = nextOffset === null ? undefined : candidates[nextOffset];
    const partial = files.at(-1);
    const nextStart =
      pendingStart && nextFile === pendingStart.file
        ? pendingStart
        : nextFile === requested
          ? input
          : { startLine: 1, startColumn: 1 };
    const continuation =
      nextOffset !== null && nextFile !== undefined
        ? {
            file: nextFile,
            startLine: partial?.path === nextFile ? (partial.nextLine ?? 1) : nextStart.startLine,
            startColumn:
              partial?.path === nextFile ? (partial.nextColumn ?? 1) : nextStart.startColumn,
            offset: nextOffset,
            ...(pendingStart && pendingIndex > nextOffset ? { pendingStart } : {}),
          }
        : null;
    return {
      ...metadata(
        id,
        files.map((file) => `materials/${file.path}`),
      ),
      id: item.id,
      title: item.title,
      entrypoint: item.entrypoint ?? item.files[0] ?? '',
      dependencyVersions: Object.fromEntries(
        Object.values(bundle.manifest.packages).map((pkg) => [pkg.packageName, pkg.version]),
      ),
      externalImports: [...new Set(manifest.flatMap((file) => file.externalImports))],
      manifest,
      files,
      total: candidates.length,
      nextOffset,
      continuation,
    };
  }
  return store;
}
export type CompanyKnowledgeStore = ReturnType<typeof createCompanyKnowledgeStore>;
