import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { createReleaseId } from './deploy-artifact.mjs';
import { readSnapshotBuildContext } from './version-archive-context.mjs';
import { exactPackageVersionSchema } from '../src/features/releases/model/schema.ts';
import { VersionArchiveError } from './version-archive-files.ts';
import { commitArchivedBuild, withVersionArchiveLock } from './version-archive-write.ts';

const execute = promisify(execFile);
const buildContextSchema = z.object({
  commit: z.string().regex(/^[0-9a-f]{7,40}$/), dirty: z.boolean(),
  packages: z.record(z.string(), exactPackageVersionSchema), fingerprint: z.string().regex(/^[0-9a-f]{64}$/),
});
const snapshotOptionsSchema = z.object({
  repoRoot: z.string().min(1), archiveRoot: z.string().min(1).optional(),
  channel: z.enum(['draft', 'stable']).optional(),
});
const projectSchema = z.object({ version: exactPackageVersionSchema });
const processOutputSchema = z.object({ stdout: z.string().optional(), stderr: z.string().optional() });

function buildFailure(error, message) {
  const result = processOutputSchema.safeParse(error);
  const output = result.success ? [result.data.stdout, result.data.stderr].filter(Boolean).join('\n').slice(-4000) : '';
  return new VersionArchiveError('BUILD_FAILED', `${message}${output ? `\n${output}` : ''}`, { cause: error });
}

export async function snapshotPlayground(options, dependencies = {}) {
  const config = snapshotOptionsSchema.parse(options);
  const repoRoot = path.resolve(config.repoRoot);
  const archiveRoot = path.resolve(repoRoot, config.archiveRoot ?? '.playground-versions');
  const readContext = dependencies.readContext ?? readSnapshotBuildContext;
  const prepare = dependencies.prepare ?? (() => execute('pnpm', ['knowledge:generate'], {
    cwd: repoRoot, env: process.env, maxBuffer: 16 * 1024 * 1024,
  }));
  const build = dependencies.build ?? ((env) => execute('pnpm', ['build'], {
    cwd: repoRoot, env, maxBuffer: 16 * 1024 * 1024,
  }));
  return withVersionArchiveLock(archiveRoot, async () => {
    try { await prepare(); }
    catch (error) { throw buildFailure(error, '스냅샷 Knowledge 생성에 실패했습니다.'); }
    const context = buildContextSchema.parse(await readContext(repoRoot));
    const channel = config.channel ?? (context.dirty ? 'draft' : 'stable');
    if (channel === 'stable' && context.dirty) {
      throw new VersionArchiveError('STABLE_REQUIRES_CLEAN_TREE', '--stable은 clean Git tree에서만 실행할 수 있습니다.');
    }
    const createdAt = (dependencies.now?.() ?? new Date()).toISOString();
    const releaseId = createReleaseId(context.commit, new Date(createdAt));
    const basePath = `/versions/${releaseId}/`;
    const project = projectSchema.parse(JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')));
    const directory = await mkdtemp(path.join(archiveRoot, `.build-${releaseId}-`));
    try {
      try {
        await build({
          ...process.env, OWP_PUBLIC_BASE: basePath, OWP_BUILD_OUT_DIR: directory,
          OWP_RELEASE_ID: releaseId, OWP_RELEASE_CREATED_AT: createdAt, OWP_RELEASE_CHANNEL: channel,
          OWP_RELEASE_COMMIT: context.commit, OWP_RELEASE_DIRTY: String(context.dirty),
          OWP_RELEASE_APP_VERSION: project.version,
        });
      } catch (error) { throw buildFailure(error, '버전 아카이브 빌드에 실패했습니다.'); }
      const actual = buildContextSchema.parse(await readContext(repoRoot));
      if (actual.fingerprint !== context.fingerprint || actual.commit !== context.commit || actual.dirty !== context.dirty ||
          JSON.stringify(actual.packages) !== JSON.stringify(context.packages)) {
        throw new VersionArchiveError('BUILD_CONTEXT_CHANGED', '빌드 중 소스·설정·Git 상태·설치 패키지가 변경됐습니다.');
      }
      return await commitArchivedBuild({
        archiveRoot, directory, installedPackages: context.packages,
        release: { releaseId, createdAt, appVersion: project.version, commit: context.commit, dirty: context.dirty, channel, basePath },
      });
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
}
