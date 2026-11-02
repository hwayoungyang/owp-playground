import { execFile } from 'node:child_process';
import { mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isDeepStrictEqual, promisify } from 'node:util';
import { z } from 'zod';
import { createArtifact } from './deploy-artifact.mjs';
import { validateBuild } from './deploy-build.mjs';
import { readSnapshotBuildContext } from './version-archive-context.mjs';
import { archiveFileFingerprint } from './version-archive-files.ts';
import { createPreparedStage, preparedDirectoryExists, publishPreparedStage, readPreparedBytes } from './deploy-prepared-files.mjs';

const execute = promisify(execFile);
const hash = z.string().regex(/^[0-9a-f]{64}$/);
const commit = z.string().regex(/^[0-9a-f]{7,40}$/);
const release = z.string().regex(/^\d{8}-\d{6}-[0-9a-f]{7,40}$/);
const packages = z.record(z.string(), z.string());
const contextSchema = z.object({ commit, dirty: z.literal(false), packages, fingerprint: hash }).strict();
const stats = z.object({ files: z.number().int().positive(), assets: z.number().int().positive(), bytes: z.number().int().positive() }).strict();
const receiptSchema = z.object({
  schemaVersion: z.literal(1), context: contextSchema, archiveIndexSha256: hash, build: stats,
  artifact: z.object({
    release, bytes: z.number().int().positive().max(512 * 1024 * 1024), sha256: hash,
    metadata: z.object({ release, commit, dirty: z.literal(false), builtAt: z.string().datetime(), packages, contentSha256: hash }).strict(),
    integrity: z.object({ checklistSha256: hash, metadataSha256: hash, files: z.number().int().min(6) }).strict(),
  }).strict(),
}).strict();

function settings(options) {
  const root = path.resolve(options.repoRoot);
  return { root, archive: options.archiveRoot ?? path.join(root, '.playground-versions'), output: options.outputRoot ?? path.join(root, '.omo/evidence/deploy-prepared/playground') };
}
const indexSha = async (archive) => archiveFileFingerprint(await readPreparedBytes(path.join(archive, 'versions'), 'index.json', 1024 * 1024)).sha256;
const same = isDeepStrictEqual;

async function assertInputs(config, expected, archiveIndexSha256, readContext) {
  const actual = await readContext(config.root);
  if (!same(actual, expected) || actual.dirty || await indexSha(config.archive) !== archiveIndexSha256) {
    throw new Error('사전 준비 후 소스·설치 패키지·아카이브가 바뀌었습니다. clean commit에서 pnpm deploy:prepare를 다시 실행해 주세요.');
  }
}

export async function readPreparedStaticDeployment(options, dependencies = {}) {
  const config = settings(options);
  const readContext = dependencies.readContext ?? readSnapshotBuildContext;
  const context = await readContext(config.root);
  const directory = path.join(config.output, context.commit);
  if (!await preparedDirectoryExists(directory)) return undefined;
  const receipt = receiptSchema.parse(JSON.parse((await readPreparedBytes(directory, 'prepared.json', 65536)).toString('utf8')));
  if (!same((await readdir(directory)).sort(), ['artifact.tar.gz', 'prepared.json']) || !same(receipt.context, context) || receipt.artifact.metadata.commit !== context.commit || receipt.artifact.metadata.release !== receipt.artifact.release || !receipt.artifact.release.endsWith(`-${context.commit}`) || !same(receipt.artifact.metadata.packages, context.packages)) {
    throw new Error('정적 배포 준비 자료가 현재 clean commit과 다릅니다. pnpm deploy:prepare로 준비 상태를 확인해 주세요.');
  }
  await assertInputs(config, context, receipt.archiveIndexSha256, readContext);
  const bytes = await readPreparedBytes(directory, 'artifact.tar.gz', receipt.artifact.bytes);
  if (!same(archiveFileFingerprint(bytes), { bytes: receipt.artifact.bytes, sha256: receipt.artifact.sha256 })) throw new Error('준비 artifact 크기 또는 SHA-256이 다릅니다.');
  const stage = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-static-prepared-')));
  try {
    const archive = path.join(stage, 'artifact.tar.gz');
    await writeFile(archive, bytes, { flag: 'wx', mode: 0o600 });
    if (!same(archiveFileFingerprint(await readPreparedBytes(stage, 'artifact.tar.gz', bytes.length)), archiveFileFingerprint(bytes))) throw new Error('준비 artifact 복사 검증에 실패했습니다.');
    await assertInputs(config, context, receipt.archiveIndexSha256, readContext);
    return { artifact: { ...receipt.artifact, archive, cleanup: () => rm(stage, { recursive: true, force: true }) }, build: receipt.build, reused: true, directory, assertCurrent: () => assertInputs(config, context, receipt.archiveIndexSha256, readContext) };
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}

export async function prepareStaticDeployment(options, dependencies = {}) {
  const config = settings(options);
  const readContext = dependencies.readContext ?? readSnapshotBuildContext;
  const existing = await readPreparedStaticDeployment(options, { readContext });
  if (existing) {
    await existing.artifact.cleanup();
    return { directory: existing.directory, release: existing.artifact.release, reused: true };
  }
  const context = contextSchema.parse(await readContext(config.root));
  const archiveIndexSha256 = await indexSha(config.archive);
  const runBuild = dependencies.runBuild ?? (() => execute('pnpm', ['build'], { cwd: config.root, maxBuffer: 16 * 1024 * 1024 }));
  await runBuild();
  const build = await validateBuild(path.join(config.root, 'dist'));
  await assertInputs(config, context, archiveIndexSha256, readContext);
  const artifact = await (dependencies.pack ?? createArtifact)({ directory: path.join(config.root, 'dist'), context, archiveRoot: config.archive });
  let stage;
  try {
    stage = await createPreparedStage(config.output);
    const { release, bytes, sha256, metadata, integrity } = artifact;
    const receipt = receiptSchema.parse({ schemaVersion: 1, context, archiveIndexSha256, build, artifact: { release, bytes, sha256, metadata, integrity } });
    const content = await readPreparedBytes(path.dirname(artifact.archive), path.basename(artifact.archive), receipt.artifact.bytes);
    if (!same(archiveFileFingerprint(content), { bytes, sha256 })) throw new Error('저장할 정적 artifact의 무결성이 다릅니다.');
    await writeFile(path.join(stage, 'artifact.tar.gz'), content, { flag: 'wx', mode: 0o600 });
    await writeFile(path.join(stage, 'prepared.json'), `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await assertInputs(config, context, archiveIndexSha256, readContext);
    const directory = path.join(config.output, context.commit);
    await publishPreparedStage(stage, directory);
    return { directory, release, reused: false };
  } finally { await artifact.cleanup(); if (stage) await rm(stage, { recursive: true, force: true }); }
}
