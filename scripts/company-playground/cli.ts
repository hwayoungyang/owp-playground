import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { digestSchema } from '../../src/distribution/schema.ts';
import { DistributionError, sha256 } from '../distribution/integrity.ts';
import { readSafeFile, safePath } from '../distribution/files.ts';
import { runtimeDescriptorSchema } from '../distribution/runtime.ts';
import type { PackageDigestVerifier } from '../distribution/runtime.ts';
import { bundlePinSchema } from '../../mcp/company/model.ts';
import { planCompanyPlayground, prepareCompanyBundle } from './prepare.ts';
import type { RuntimeInput } from './prepare.ts';
import { buildCompanyPlayground } from './build.ts';
import { assembleCompanyPlayground } from './assemble.ts';

const runtimeInput = z.strictObject({
  descriptor: runtimeDescriptorSchema,
  digestAdapter: z
    .strictObject({ path: relativeDistributionPathSchema, sha256: digestSchema })
    .optional(),
});
const materialRequest = z.strictObject({
  schemaVersion: z.literal(1),
  materialRoot: relativeDistributionPathSchema,
  specFile: relativeDistributionPathSchema,
  output: relativeDistributionPathSchema.optional(),
  protectedRoots: z.array(relativeDistributionPathSchema),
  runtime: runtimeInput.optional(),
});
const buildRequest = z.strictObject({
  schemaVersion: z.literal(1),
  bundleRoot: relativeDistributionPathSchema,
  pin: bundlePinSchema,
  output: relativeDistributionPathSchema,
  protectedRoots: z.array(relativeDistributionPathSchema),
  runtime: runtimeInput.optional(),
});
const assembleRequest = z.strictObject({
  schemaVersion: z.literal(1),
  bundleRoot: relativeDistributionPathSchema,
  pin: bundlePinSchema,
  viewerRoot: relativeDistributionPathSchema,
  buildDigest: digestSchema,
  output: relativeDistributionPathSchema,
  protectedRoots: z.array(relativeDistributionPathSchema),
});

async function runtimeFrom(
  root: string,
  value: z.infer<typeof runtimeInput> | undefined,
): Promise<RuntimeInput | undefined> {
  if (!value) return undefined;
  if (!value.digestAdapter) return { runtimeConfigRoot: root, runtime: value.descriptor };
  const bytes = readSafeFile(root, value.digestAdapter.path);
  if (sha256(bytes) !== value.digestAdapter.sha256)
    throw new DistributionError(
      'company-adapter-hash',
      'Framework digest adapter가 검토 후 변경되었습니다.',
    );
  const path = safePath(root, value.digestAdapter.path);
  const module: unknown = await import(
    `${pathToFileURL(path).href}?sha256=${value.digestAdapter.sha256}`
  );
  if (
    !module ||
    typeof module !== 'object' ||
    !('verifyPackageDigest' in module) ||
    typeof module.verifyPackageDigest !== 'function'
  )
    throw new DistributionError(
      'company-adapter-invalid',
      '명시적인 verifyPackageDigest export가 필요합니다.',
    );
  const verify = module.verifyPackageDigest;
  const verifyPackageDigest: PackageDigestVerifier = (input) => verify(input) === true;
  return { runtimeConfigRoot: root, runtime: value.descriptor, verifyPackageDigest };
}

export async function runCompanyPlaygroundCommand(
  command: 'plan' | 'prepare' | 'build' | 'assemble',
  requestFile: string,
) {
  const root = dirname(resolve(requestFile));
  const file = resolve(requestFile).slice(root.length + 1);
  const raw: unknown = JSON.parse(readSafeFile(root, file).toString('utf8'));
  if (command === 'assemble') {
    const request = assembleRequest.parse(raw);
    return assembleCompanyPlayground({
      bundleRoot: safePath(root, request.bundleRoot),
      pin: request.pin,
      viewerRoot: safePath(root, request.viewerRoot),
      buildDigest: request.buildDigest,
      output: resolve(root, request.output),
      protectedRoots: request.protectedRoots.map((path) => safePath(root, path)),
    });
  }
  if (command === 'build') {
    const request = buildRequest.parse(raw);
    const runtime = await runtimeFrom(root, request.runtime);
    return buildCompanyPlayground({
      bundleRoot: safePath(root, request.bundleRoot),
      pin: request.pin,
      output: resolve(root, request.output),
      protectedRoots: request.protectedRoots.map((path) => safePath(root, path)),
      ...(runtime ? { runtime } : {}),
    });
  }
  const request = materialRequest.parse(raw);
  const materialRoot = safePath(root, request.materialRoot);
  const spec: unknown = JSON.parse(readSafeFile(root, request.specFile).toString('utf8'));
  if (command === 'plan') return planCompanyPlayground(materialRoot, spec);
  const runtime = await runtimeFrom(root, request.runtime);
  if (!runtime || !request.output)
    throw new DistributionError(
      'company-preparation-input',
      'prepare에는 실제 고객 runtime과 새 output이 필요합니다.',
    );
  return prepareCompanyBundle({
    materialRoot,
    spec,
    output: resolve(root, request.output),
    protectedRoots: request.protectedRoots.map((path) => safePath(root, path)),
    ...runtime,
  });
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: { request: { type: 'string' }, help: { type: 'boolean' } },
    allowPositionals: true,
    strict: true,
  });
  if (values.help) {
    process.stdout.write(
      '회사 전용 Playground\nnode --experimental-strip-types scripts/company-playground/cli.ts plan|prepare|build|assemble --request REQUEST.json\nplan은 읽기 전용이며 prepare·build·assemble은 요청에 명시된 새 output만 생성합니다.\n',
    );
    return;
  }
  const command = z
    .enum(['plan', 'prepare', 'build', 'assemble'])
    .parse(positionals.length === 1 ? positionals[0] : undefined);
  if (!values.request) throw new TypeError('--request가 필요합니다.');
  process.stdout.write(
    `${JSON.stringify(await runCompanyPlaygroundCommand(command, values.request), null, 2)}\n`,
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error: unknown) => {
    // no-excuse-ok: catch
    process.stderr.write(
      `회사 Playground 명령 실패: ${error instanceof Error ? error.name : 'unknown'}\n`,
    );
    process.exitCode = 1;
  });
