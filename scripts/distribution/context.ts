import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import {
  distributionContextSchema,
  distributionIdSchema,
  distributionPackageSchema,
} from '../../src/distribution/schema.ts';
import type {
  DistributionContext,
  DistributionPackage,
  DistributionProfile,
  DistributionTarget,
} from '../../src/distribution/schema.ts';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { DistributionError, parseProvidedManifest } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';
import { readSafeFile } from './files.ts';
import { runtimeDescriptorSchema, verifyCompanyRuntime } from './runtime.ts';
import type { PackageDigestVerifier, RuntimeDescriptor } from './runtime.ts';
import { historyInputSchema, readHistoryContext } from './history-context.ts';

const configPathSchema = z
  .string()
  .transform((path) => path.replace(/^\.\//, ''))
  .pipe(relativeDistributionPathSchema);
const profileConfigSchema = z
  .strictObject({
    label: z.string().min(1).optional(),
    audience: z.enum(['full', 'company']),
    companyId: distributionIdSchema.optional(),
    manifest: configPathSchema.optional(),
    runtimeSource: z.enum(['installed', 'company-build', 'local-tarballs']),
    runtime: runtimeDescriptorSchema.optional(),
    history: historyInputSchema.optional(),
    builds: z
      .array(
        z
          .strictObject({
            manifest: configPathSchema,
            runtime: runtimeDescriptorSchema,
            label: z.string().min(1).optional(),
          })
          .readonly(),
      )
      .readonly()
      .default([]),
  })
  .superRefine((profile, context) => {
    if (
      profile.audience === 'company' &&
      (!profile.companyId || !profile.manifest || profile.runtimeSource === 'installed')
    )
      context.addIssue({
        code: 'custom',
        message: '고객 프로필에 companyId, manifest와 고객 runtimeSource가 필요합니다.',
      });
    if (
      profile.audience === 'full' &&
      (profile.runtimeSource !== 'installed' ||
        profile.companyId ||
        profile.manifest ||
        profile.runtime ||
        profile.history ||
        profile.builds.length)
    )
      context.addIssue({
        code: 'custom',
        message: '전체 프로필은 설치된 full 패키지만 사용합니다.',
      });
  })
  .readonly();
export const distributionConfigSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    mode: z.enum(['internal', 'company']),
    defaultAudience: distributionIdSchema,
    profiles: z.record(distributionIdSchema, profileConfigSchema).readonly(),
  })
  .superRefine((config, context) => {
    const profile = config.profiles[config.defaultAudience];
    if (!profile || (config.mode === 'company' && profile.audience !== 'company'))
      context.addIssue({ code: 'custom', message: '기본 프로필이 없거나 mode와 맞지 않습니다.' });
  })
  .readonly();
export type DistributionConfig = z.infer<typeof distributionConfigSchema>;

export function readDistributionConfig(
  root: string,
  configFile = 'owp-distribution.config.json',
): {
  readonly config: DistributionConfig;
  readonly configRoot: string;
} {
  const path = configPathSchema.parse(configFile);
  return {
    config: distributionConfigSchema.parse(JSON.parse(readSafeFile(root, path).toString('utf8'))),
    configRoot: dirname(resolve(root, path)),
  };
}

export function readInstalledDistributionPackages(root: string): readonly DistributionPackage[] {
  const app = z
    .object({
      dependencies: z.record(z.string(), z.string()),
      devDependencies: z.record(z.string(), z.string()),
    })
    .parse(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')));
  return Object.keys({ ...app.dependencies, ...app.devDependencies })
    .filter((name) => name.startsWith('@owp/'))
    .sort()
    .map((name) => {
      const installed = z
        .object({ name: z.string(), version: z.string().min(1) })
        .parse(
          JSON.parse(readFileSync(resolve(root, 'node_modules', name, 'package.json'), 'utf8')),
        );
      if (installed.name !== name)
        throw new DistributionError('installed-package-mismatch', '설치된 패키지 이름이 다릅니다.');
      return distributionPackageSchema.parse({
        id: name.slice(5),
        name,
        version: installed.version,
      });
    });
}

export function readDistributionContext(
  root: string,
  options: {
    readonly configFile?: string;
    readonly verifyPackageDigest?: PackageDigestVerifier;
  } = {},
): DistributionContext {
  const { config, configRoot } = readDistributionConfig(root, options.configFile);
  function resolveTarget(
    label: string,
    entry: DistributionConfig['profiles'][string],
    manifestPath: string,
    descriptor: RuntimeDescriptor | undefined,
    registeredManifests: ProvidedManifest[],
  ): DistributionTarget {
    const base = {
      label,
      audience: entry.audience,
      runtimeSource: entry.runtimeSource,
      companyId: entry.companyId ?? null,
      buildId: null,
      manifestDigest: null,
      releaseId: null,
      bundleDigest: null,
      buildDigest: null,
      previewDigest: null,
      packages: [],
      features: [],
      previewUrl: null,
    };
    if (!entry.companyId)
      throw new DistributionError('profile-invalid', '고객 프로필이 잘못되었습니다.');
    try {
      const manifest = parseProvidedManifest(
        JSON.parse(readSafeFile(configRoot, manifestPath).toString('utf8')),
        entry.companyId,
      );
      const runtime = verifyCompanyRuntime(
        configRoot,
        manifest,
        descriptor,
        options.verifyPackageDigest,
      );
      registeredManifests.push(manifest);
      return {
        ...base,
        buildId: manifest.buildId,
        manifestDigest: manifest.manifestDigest,
        releaseId: runtime.releaseId,
        bundleDigest: runtime.bundleDigest,
        buildDigest: runtime.buildDigest,
        previewDigest: runtime.previewDigest,
        packages: Object.entries(manifest.packages).map(([packageId, pkg]) => ({
          id: packageId,
          name: pkg.packageName,
          version: pkg.version,
          baseVersion: pkg.baseVersion,
        })),
        features: manifest.features,
        manifestStatus: 'verified',
        runtimeStatus: runtime.status,
        issues: runtime.issues,
        previewUrl: runtime.previewUrl,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return {
          ...base,
          manifestStatus: 'missing',
          runtimeStatus: 'unconfigured',
          issues: [{ code: 'manifest-missing', message: '고객 제공 manifest가 없습니다.' }],
        };
      if (
        error instanceof z.ZodError ||
        error instanceof SyntaxError ||
        error instanceof DistributionError
      )
        return {
          ...base,
          manifestStatus: 'invalid',
          runtimeStatus: 'unconfigured',
          issues: [
            {
              code: error instanceof DistributionError ? error.code : 'manifest-invalid',
              message: '고객 제공 manifest를 검증하지 못했습니다.',
            },
          ],
        };
      throw error;
    }
  }
  const profiles: DistributionProfile[] = Object.entries(config.profiles).map(([id, entry]) => {
    const label = entry.label ?? id;
    if (entry.audience === 'full')
      return {
        id,
        label,
        audience: 'full',
        runtimeSource: 'installed',
        companyId: null,
        buildId: null,
        manifestDigest: null,
        releaseId: null,
        bundleDigest: null,
        buildDigest: null,
        previewDigest: null,
        packages: readInstalledDistributionPackages(root),
        features: [],
        previewUrl: null,
        manifestStatus: 'not-required',
        runtimeStatus: 'installed',
        issues: [],
        builds: [],
      };
    if (!entry.companyId || !entry.manifest)
      throw new DistributionError('profile-invalid', '고객 프로필이 잘못되었습니다.');
    // 이 프로필의 검증된 manifest만 이력의 package identity와 대조합니다.
    const registeredManifests: ProvidedManifest[] = [];
    const primary = resolveTarget(label, entry, entry.manifest, entry.runtime, registeredManifests);
    const builds = entry.builds.map((build) =>
      resolveTarget(
        build.label ?? build.runtime.buildId,
        entry,
        build.manifest,
        build.runtime,
        registeredManifests,
      ),
    );
    const ids = [primary, ...builds].flatMap((build) => (build.buildId ? [build.buildId] : []));
    if (ids.length !== new Set(ids).size)
      throw new DistributionError(
        'profile-build-duplicate',
        '프로필 안의 buildId는 중복할 수 없습니다.',
      );
    return {
      ...primary,
      id,
      builds,
      ...(config.mode === 'internal'
        ? {
            history: readHistoryContext(
              configRoot,
              entry.companyId,
              entry.history,
              registeredManifests,
            ),
          }
        : {}),
    };
  });
  return distributionContextSchema.parse({
    schemaVersion: 1,
    mode: config.mode,
    defaultProfileId: config.defaultAudience,
    profiles,
  });
}

export function assertFullApplicationContext(context: DistributionContext): void {
  if (context.mode !== 'internal')
    throw new DistributionError(
      'company-entry-required',
      '고객 mode는 격리된 전용 entry가 필요합니다. 전체 Playground entry로 build할 수 없습니다.',
    );
  const profile = context.profiles.find((entry) => entry.id === context.defaultProfileId);
  if (!profile || profile.audience !== 'full' || profile.runtimeSource !== 'installed')
    throw new DistributionError(
      'full-entry-required',
      '전체 Playground entry의 기본 프로필은 설치된 full 패키지여야 합니다.',
    );
}
