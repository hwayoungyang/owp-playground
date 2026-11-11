import { z } from 'zod';
import {
  digestSchema,
  distributionBuildIdSchema,
  distributionIdSchema,
} from '../../src/distribution/schema.ts';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import type { DistributionProfile } from '../../src/distribution/schema.ts';
import { DistributionError, objectDigest } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';
import { fileIdentity, inventoryPackage, readSafeFile, safePath } from './files.ts';
import type { FileIdentity } from './files.ts';
import { verifyProjectedPackage } from './runtime-package.ts';
import { viewerBuildSchema } from '../../mcp/company/model.ts';

export const runtimeDescriptorSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    companyId: distributionIdSchema,
    buildId: distributionBuildIdSchema,
    manifestDigest: digestSchema,
    root: relativeDistributionPathSchema,
    packages: z.record(distributionIdSchema, relativeDistributionPathSchema).readonly(),
    preview: z
      .strictObject({
        root: relativeDistributionPathSchema,
        entry: z.literal('index.html'),
        files: z
          .array(
            z
              .strictObject({
                path: relativeDistributionPathSchema,
                bytes: z.number().int().nonnegative(),
                sha256: digestSchema,
              })
              .readonly(),
          )
          .readonly(),
        digest: digestSchema,
        releaseId: distributionBuildIdSchema,
        bundleDigest: digestSchema,
        buildDigest: digestSchema,
        executionBuilt: z.literal(true),
      })
      .readonly()
      .optional(),
  })
  .readonly();
export type RuntimeDescriptor = z.infer<typeof runtimeDescriptorSchema>;
export type PackageDigestVerifier = (input: {
  readonly packageRoot: string;
  readonly files: readonly FileIdentity[];
  readonly expectedDigest: string;
}) => boolean;
export type RuntimeVerification = {
  readonly status: DistributionProfile['runtimeStatus'];
  readonly issues: DistributionProfile['issues'];
  readonly packageRoots: Readonly<Record<string, string>>;
  readonly previewUrl: string | null;
  readonly releaseId: string | null;
  readonly bundleDigest: string | null;
  readonly buildDigest: string | null;
  readonly previewDigest: string | null;
};

export function verifyCompanyRuntime(
  root: string,
  manifest: ProvidedManifest,
  descriptor: RuntimeDescriptor | undefined,
  verifyPackageDigest?: PackageDigestVerifier,
): RuntimeVerification {
  const noPreview = {
    previewUrl: null,
    releaseId: null,
    bundleDigest: null,
    buildDigest: null,
    previewDigest: null,
  };
  if (!descriptor)
    return {
      status: 'unconfigured',
      issues: [{ code: 'runtime-unconfigured', message: '고객 runtime이 연결되지 않았습니다.' }],
      packageRoots: {},
      ...noPreview,
    };
  const packageRoots: Record<string, string> = {};
  try {
    if (
      descriptor.companyId !== manifest.companyId ||
      descriptor.buildId !== manifest.buildId ||
      descriptor.manifestDigest !== manifest.manifestDigest
    )
      throw new DistributionError(
        'runtime-identity-mismatch',
        'runtime과 manifest 식별자가 일치하지 않습니다.',
      );
    const runtimeRoot = safePath(root, descriptor.root);
    const ids = Object.keys(manifest.packages).sort();
    const grants = new Set<string>();
    if (ids.join('\n') !== Object.keys(descriptor.packages).sort().join('\n'))
      throw new DistributionError(
        'runtime-package-set-mismatch',
        '고객 패키지 목록이 일치하지 않습니다.',
      );
    for (const id of ids) {
      const expected = manifest.packages[id];
      const directory = descriptor.packages[id];
      if (!expected || !directory)
        throw new DistributionError('runtime-package-missing', '필수 고객 패키지가 없습니다.');
      const packageRoot = safePath(runtimeRoot, directory);
      const { files, metadata } = verifyProjectedPackage(packageRoot, id, manifest);
      for (const grant of metadata.owpDistribution.grantedCapabilities) grants.add(grant);
      if (
        verifyPackageDigest &&
        verifyPackageDigest({ packageRoot, files, expectedDigest: expected.artifactDigest }) !==
          true
      )
        throw new DistributionError(
          'runtime-digest-mismatch',
          '고객 패키지 바이트 digest가 다릅니다.',
        );
      packageRoots[id] = packageRoot;
    }
    if (manifest.features.some((grant) => !grants.has(grant)))
      throw new DistributionError(
        'runtime-capabilities-mismatch',
        '제공 manifest의 capability가 패키지 metadata에 없습니다.',
      );
    let previewUrl: string | null = null;
    if (descriptor.preview) {
      const preview = descriptor.preview;
      const previewRoot = safePath(runtimeRoot, preview.root);
      const actual = inventoryPackage(previewRoot);
      if (
        !preview.files.some((file) => file.path === preview.entry) ||
        objectDigest(actual) !== objectDigest(preview.files) ||
        objectDigest(preview.files) !== preview.digest
      )
        throw new DistributionError(
          'preview-digest-mismatch',
          '격리 preview의 파일 목록 또는 digest가 다릅니다.',
        );
      for (const file of preview.files) fileIdentity(previewRoot, file.path);
      const viewer = viewerBuildSchema.parse(
        JSON.parse(readSafeFile(previewRoot, 'playground-build.json').toString('utf8')),
      );
      const { buildDigest, ...payload } = viewer;
      if (
        viewer.companyId !== manifest.companyId ||
        viewer.buildId !== manifest.buildId ||
        viewer.manifestDigest !== manifest.manifestDigest ||
        viewer.releaseId !== preview.releaseId ||
        viewer.bundleDigest !== preview.bundleDigest ||
        buildDigest !== preview.buildDigest ||
        objectDigest(payload) !== buildDigest
      )
        throw new DistributionError(
          'preview-identity-mismatch',
          '미리보기와 고정 build의 식별자가 다릅니다.',
        );
      const expectedFiles = [
        ...viewer.files,
        fileIdentity(previewRoot, 'playground-build.json'),
      ].sort((a, b) => a.path.localeCompare(b.path));
      if (
        objectDigest(actual) !== objectDigest(expectedFiles) ||
        ![
          'index.html',
          'provided-manifest.json',
          'search-index.json',
          'module-inventory.json',
        ].every((path) => viewer.files.some((file) => file.path === path)) ||
        viewer.files.some(
          (file) =>
            !/^(?:index\.html|provided-manifest\.json|search-index\.json|module-inventory\.json|(?:assets|materials|api)\/.+)$/.test(
              file.path,
            ) || file.path.endsWith('.map'),
        ) ||
        objectDigest(viewer.modules) !== objectDigest([...new Set(viewer.modules)].sort()) ||
        viewer.executionReady !== true ||
        !viewer.modules.includes('viewer-entry') ||
        !viewer.modules.includes('company-runtime') ||
        !viewer.modules.includes('reviewed-material') ||
        objectDigest(
          JSON.parse(readSafeFile(previewRoot, 'module-inventory.json').toString('utf8')),
        ) !== objectDigest({ modules: viewer.modules })
      )
        throw new DistributionError(
          'preview-provenance-mismatch',
          '미리보기의 파일·module inventory가 맞지 않습니다.',
        );
      const includedManifest = JSON.parse(
        readSafeFile(previewRoot, 'provided-manifest.json').toString('utf8'),
      );
      // 같은 digest 문자열만 복사한 다른 payload도 거부합니다.
      if (objectDigest(includedManifest) !== objectDigest(manifest))
        throw new DistributionError(
          'preview-identity-mismatch',
          '미리보기의 제공 manifest가 다릅니다.',
        );
      previewUrl = `/company-previews/${manifest.companyId}/${preview.digest}/index.html`;
    }
    return {
      status: 'verified',
      issues: [],
      packageRoots,
      previewUrl,
      releaseId: descriptor.preview?.releaseId ?? null,
      bundleDigest: descriptor.preview?.bundleDigest ?? null,
      buildDigest: descriptor.preview?.buildDigest ?? null,
      previewDigest: descriptor.preview?.digest ?? null,
    };
  } catch (error) {
    if (error instanceof DistributionError)
      return {
        status: 'mismatch',
        issues: [
          {
            code: error.code,
            message: '고객 runtime의 파일·식별자·digest 검증을 통과하지 못했습니다.',
          },
        ],
        packageRoots: {},
        ...noPreview,
      };
    if (error instanceof z.ZodError)
      return {
        status: 'mismatch',
        issues: [
          { code: 'runtime-metadata-invalid', message: '고객 runtime의 schema가 맞지 않습니다.' },
        ],
        packageRoots: {},
        ...noPreview,
      };
    if (error instanceof SyntaxError)
      return {
        status: 'mismatch',
        issues: [
          { code: 'runtime-metadata-invalid', message: '고객 runtime의 JSON을 읽을 수 없습니다.' },
        ],
        packageRoots: {},
        ...noPreview,
      };
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return {
        status: 'missing',
        issues: [{ code: 'runtime-file-missing', message: '고객 runtime의 필수 파일이 없습니다.' }],
        packageRoots: {},
        ...noPreview,
      };
    throw error;
  }
}
