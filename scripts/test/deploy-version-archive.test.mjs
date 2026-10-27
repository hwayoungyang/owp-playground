import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { createArtifact } from '../deploy-artifact.mjs';
import { copyStableVersionArchive } from '../deploy-version-archive.mjs';
import { validateVersionPresentation } from '../deploy-version-presentation.mjs';
import { remoteHealthScript } from '../deploy-health-script.mjs';
import { archivePlaygroundBuild, readArchivedFile, readVersionArchive } from '../version-archive.ts';
import { collectArchiveFiles } from '../version-archive-files.ts';
import { archiveFixture, metadata, writeBuild } from './version-archive-fixture.mjs';

const execute = promisify(execFile);
const context = { commit: '0123456789ab', dirty: true, packages: { '@owp/datagrid': '3.5.0' } };

async function fixture(t) {
  const fixture = await archiveFixture(t);
  const directory = await writeBuild(path.join(fixture.root, 'dist'), { basePath: '/' });
  const content = path.join(fixture.root, 'content');
  await mkdir(content);
  const add = async (id, createdAt, channel = 'stable') => {
    const release = metadata(id, { createdAt, channel, dirty: channel === 'draft' });
    const build = await writeBuild(path.join(fixture.root, id), release);
    return archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory: build, release });
  };
  const first = await add('stable-first', '2026-10-23T03:00:00.000Z');
  const last = await add('stable-last', '2026-10-24T03:00:00.000Z');
  await add('draft-last', '2026-10-25T03:00:00.000Z', 'draft');
  return { ...fixture, directory, content, first, last, add };
}

test('stable archive survives tar extraction with every file hash, excludes drafts and preserves sources', async (t) => {
  const state = await fixture(t);
  const original = await collectArchiveFiles(state.archiveRoot);
  const build = await collectArchiveFiles(state.directory);
  const artifact = await createArtifact({ directory: state.directory, archiveRoot: state.archiveRoot, context });
  t.after(artifact.cleanup);
  await execute('tar', ['-xzf', artifact.archive, '-C', state.content]);
  const index = await validateVersionPresentation(state.content);
  assert.equal(index.latestReleaseId, state.last.releaseId);
  assert.deepEqual(index.releases, [state.first, state.last]);
  await assert.rejects(access(path.join(state.content, 'versions/draft-last')), { code: 'ENOENT' });
  const manifest = JSON.parse(await readFile(path.join(state.content, 'deploy-manifest.json')));
  const checklist = await readFile(path.join(state.content, 'deploy-files.sha256'), 'utf8');
  for (const [file, expected] of Object.entries(manifest.files)) {
    const bytes = await readFile(path.join(state.content, file));
    assert.equal(expected.bytes, bytes.length);
    assert.equal(expected.sha256, createHash('sha256').update(bytes).digest('hex'));
    assert.ok(checklist.includes(`${expected.sha256}  ${file}\n`));
  }
  const copied = await collectArchiveFiles(path.join(state.content, 'versions/stable-last'));
  const originalRelease = await collectArchiveFiles(path.join(state.archiveRoot, 'versions/stable-last'));
  assert.notDeepEqual(copied['index.html'], originalRelease['index.html']);
  assert.deepEqual({ ...copied, 'index.html': originalRelease['index.html'] }, { ...originalRelease });
  assert.deepEqual(await readFile(path.join(state.content, 'version-ui/raw/stable-last/index.html')), await readFile(path.join(state.archiveRoot, 'versions/stable-last/index.html')));
  for (const prefix of ['api/', 'catalogs/', 'assets/', 'snippets/', 'knowledge/']) assert.ok(Object.keys(copied).some((file) => file.startsWith(prefix)));
  const payload = Object.fromEntries(Object.entries(manifest.files).filter(([file]) => file !== 'release.json'));
  assert.equal(artifact.metadata.contentSha256, createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
  assert.deepEqual(await collectArchiveFiles(state.archiveRoot), original);
  assert.deepEqual(await collectArchiveFiles(state.directory), build);
});

test('preserves an explicitly selected stable latest even when a newer stable exists', async (t) => {
  const state = await fixture(t);
  const indexFile = path.join(state.archiveRoot, 'versions/index.json');
  const index = JSON.parse(await readFile(indexFile));
  index.latestReleaseId = state.first.releaseId;
  await writeFile(indexFile, JSON.stringify(index));
  const result = await copyStableVersionArchive(state);
  assert.equal(result.latestReleaseId, state.first.releaseId);
});

test('resolves equal stable creation times deterministically when latest is a draft', async (t) => {
  const state = await fixture(t);
  await state.add('stable-z', '2026-10-24T03:00:00.000Z');
  await state.add('draft-newest', '2026-10-26T03:00:00.000Z', 'draft');
  assert.equal((await copyStableVersionArchive(state)).latestReleaseId, 'stable-z');
});

test('fails clearly for missing archives and draft-only archives', async (t) => {
  const state = await fixture(t);
  await assert.rejects(createArtifact({ directory: state.directory, context, archiveRoot: path.join(state.root, 'missing') }), /버전 아카이브.*stable 스냅샷/);
  const indexFile = path.join(state.archiveRoot, 'versions/index.json');
  const index = JSON.parse(await readFile(indexFile));
  index.releases = index.releases.filter((entry) => entry.channel === 'draft');
  await writeFile(indexFile, JSON.stringify(index));
  await assert.rejects(createArtifact({ directory: state.directory, context, archiveRoot: state.archiveRoot }), /stable 버전 아카이브가 없습니다/);
});

test('artifact preparation removes its workspace when the required archive is missing', async (t) => {
  const state = await fixture(t);
  const script = `
    import { createArtifact } from ${JSON.stringify(new URL('../deploy-artifact.mjs', import.meta.url).href)};
    try {
      await createArtifact({ directory: process.argv[1], archiveRoot: process.argv[2], context: JSON.parse(process.argv[3]) });
      process.exit(2);
    } catch (error) {
      if (!error.message.includes('버전 아카이브를 검증하지 못했습니다')) throw error;
    }
  `;
  await execute(process.execPath, ['--input-type=module', '-e', script, state.directory, path.join(state.root, 'missing'), JSON.stringify(context)], { env: { ...process.env, TMPDIR: state.root } });
  assert.deepEqual((await readdir(state.root)).filter((file) => file.startsWith('owp-artifact-')), []);
});

for (const kind of ['file', 'directory', 'symlink']) {
  test(`rejects the reserved versions ${kind} without replacing it`, async (t) => {
    const state = await fixture(t);
    const target = path.join(state.content, 'versions');
    if (kind === 'file') await writeFile(target, 'preserved');
    if (kind === 'directory') await mkdir(target);
    if (kind === 'symlink') await symlink(state.archiveRoot, target);
    await assert.rejects(copyStableVersionArchive(state), /예약 경로.*versions/);
    assert.ok((await readdir(state.content)).includes('versions'));
  });
}

for (const attack of ['root-symlink', 'file-symlink', 'tamper', 'unsafe-path']) {
  test(`rejects ${attack} before exposing archive contents`, async (t) => {
    const state = await fixture(t);
    if (attack === 'root-symlink') {
      const linked = path.join(state.root, 'linked');
      await symlink(state.archiveRoot, linked);
      state.archiveRoot = linked;
    } else if (attack === 'unsafe-path') {
      const indexFile = path.join(state.archiveRoot, 'versions/index.json');
      const index = JSON.parse(await readFile(indexFile));
      index.releases[0].releaseId = '../outside';
      await writeFile(indexFile, JSON.stringify(index));
    } else {
      const file = path.join(state.archiveRoot, 'versions/stable-first/assets/app.js');
      if (attack === 'tamper') await writeFile(file, 'changed');
      else {
        await rm(file);
        await symlink(path.join(state.directory, 'assets/app.js'), file);
      }
    }
    await assert.rejects(copyStableVersionArchive(state), /버전 아카이브를 검증하지 못했습니다/);
    assert.deepEqual(await readdir(state.content), []);
  });
}

test('rejects source index changes during copying and cleans the partial destination', async (t) => {
  const state = await fixture(t);
  const indexFile = path.join(state.archiveRoot, 'versions/index.json');
  let changed = false;
  await assert.rejects(copyStableVersionArchive(state, {
    readFile: async (release, file) => {
      const bytes = await readArchivedFile(release, file);
      if (!changed) {
        changed = true;
        await writeFile(indexFile, `${await readFile(indexFile, 'utf8')}\n`);
      }
      return bytes;
    },
  }), /복사 중 원본 index가 변경/);
  assert.equal(changed, true);
  assert.deepEqual(await readdir(state.content), []);
});

test('rejects overlapping source and destination archive roots', async (t) => {
  const state = await fixture(t);
  await assert.rejects(copyStableVersionArchive({ archiveRoot: state.archiveRoot, content: state.archiveRoot }), /서로 포함/);
  assert.equal((await readVersionArchive(state.archiveRoot)).releases.length, 3);
});

for (const attack of ['source-change', 'destination-symlink', 'destination-change']) {
  test(`rejects ${attack} during copying and removes partial output`, async (t) => {
    const state = await fixture(t);
    const outside = path.join(state.root, 'outside');
    await mkdir(outside);
    await writeFile(path.join(outside, 'sentinel'), 'preserved');
    let copied;
    await assert.rejects(copyStableVersionArchive(state, {
      readFile: async (release, file) => {
        const bytes = await readArchivedFile(release, file);
        if (attack === 'source-change' && !copied) {
          await writeFile(path.join(release.directory, file), 'changed after verified read');
        } else if (attack === 'destination-symlink' && file.startsWith('assets/')) {
          await symlink(outside, path.join(state.content, 'versions', release.entry.releaseId, 'assets'));
        } else if (attack === 'destination-change' && copied) {
          await writeFile(copied, 'changed after copying');
        }
        copied = path.join(state.content, 'versions', release.entry.releaseId, file);
        return bytes;
      },
    }));
    assert.deepEqual(await readdir(state.content), []);
    assert.deepEqual(await readdir(outside), ['sentinel']);
    assert.equal(await readFile(path.join(outside, 'sentinel'), 'utf8'), 'preserved');
  });
}

test('HTTP health checks the static version index and representative archive files against HTML fallback', async (t) => {
  const state = await fixture(t);
  const artifact = await createArtifact({ directory: state.directory, archiveRoot: state.archiveRoot, context });
  t.after(artifact.cleanup);
  await execute('tar', ['-xzf', artifact.archive, '-C', state.content]);
  const script = `set -eu
${remoteHealthScript}
docker() { printf true; }
http_get() {
  local request=$1
  printf '%s\\n' "$request" >> "$HEALTH_LOG"
  case "$request" in
    /health) printf ok > "$work/response" ;;
    /|/__owp_deploy_check__) cp "$directory/index.html" "$work/response" ;;
    "$HEALTH_FALLBACK") cp "$directory/index.html" "$work/response" ;;
    /versions/*/) cp "$directory$request"index.html "$work/response" ;;
    *) cp "$directory$request" "$work/response" ;;
  esac
}
work=$HEALTH_WORK
container=test
health_release "$HEALTH_CONTENT" "$HEALTH_CONTENT/deploy-files.sha256"
`;
  const env = { ...process.env, HEALTH_CONTENT: state.content, HEALTH_WORK: state.root, HEALTH_LOG: path.join(state.root, 'http.log'), HEALTH_FALLBACK: '' };
  await execute('bash', ['-c', script], { env });
  const requested = (await readFile(env.HEALTH_LOG, 'utf8')).split('\n');
  assert.ok(requested.includes('/versions/index.json'));
  for (const prefix of ['api/', 'catalogs/', 'assets/', 'snippets/']) assert.ok(requested.some((file) => file.startsWith(`/versions/stable-last/${prefix}`)));
  for (const fallback of ['/versions/index.json', '/versions/stable-last/api/datagrid.json', '/versions/stable-last/snippets/datagrid/example.tsx']) {
    await assert.rejects(execute('bash', ['-c', script], { env: { ...env, HEALTH_FALLBACK: fallback } }), (error) => {
      assert.ok(error.stderr.includes(`HTTP 파일 내용 불일치: ${fallback}`));
      return true;
    });
  }
});
