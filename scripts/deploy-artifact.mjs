import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, cp, lstat, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { validateBuild } from './deploy-build.mjs';

const execute = promisify(execFile);

export async function fileSha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function regularFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await regularFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`일반 파일·디렉터리가 아닌 항목을 거부했습니다: ${relative}`);
  }
  return files.sort();
}

async function fileManifest(directory) {
  const files = Object.create(null);
  for (const relative of await regularFiles(directory)) {
    const file = path.join(directory, relative);
    files[relative.split(path.sep).join('/')] = {
      bytes: (await lstat(file)).size,
      sha256: await fileSha256(file),
    };
  }
  return files;
}

export async function readBuildContext(repoRoot) {
  const { stdout: gitOutput } = await execute('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: repoRoot });
  const commit = gitOutput.trim();
  if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error('Git commit을 확인할 수 없습니다.');
  const { stdout: status } = await execute('git', ['status', '--porcelain=v1'], { cwd: repoRoot });
  const project = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const packages = {};
  const hash = createHash('sha256').update(commit);

  for (const name of Object.keys(project.dependencies).filter((name) => name.startsWith('@owp/')).sort()) {
    const installedPath = path.join(repoRoot, 'node_modules', name);
    const contents = await readFile(path.join(installedPath, 'package.json'));
    const installed = JSON.parse(contents);
    if (installed.name !== name || typeof installed.version !== 'string') {
      throw new Error(`설치된 패키지 정보를 확인할 수 없습니다: ${name}`);
    }
    if (/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(project.dependencies[name]) && project.dependencies[name] !== installed.version) {
      throw new Error(`${name}의 선언 버전과 설치 버전이 다릅니다. 의존성 설치 상태를 확인해 주세요.`);
    }
    packages[name] = installed.version;
    hash.update(name).update(await realpath(installedPath)).update(contents);
  }

  const inputs = [
    'package.json', 'pnpm-lock.yaml', 'index.html', 'vite.config.ts', 'tsconfig.json',
    'scripts/source-graph.ts',
    ...(await regularFiles(path.join(repoRoot, 'src'))).map((file) => path.join('src', file)),
    ...(await regularFiles(path.join(repoRoot, 'public'))).map((file) => path.join('public', file)),
  ].sort();
  for (const file of inputs) hash.update(file).update('\0').update(await readFile(path.join(repoRoot, file))).update('\0');
  return { commit, dirty: status.trim().length > 0, packages, fingerprint: hash.digest('hex') };
}

export function assertBuildContext(expected, actual) {
  if (expected.fingerprint !== actual.fingerprint) {
    throw new Error('빌드·artifact 생성 중 소스·설정·설치 패키지가 변경됐습니다. 변경 작업이 끝난 뒤 다시 배포해 주세요.');
  }
}

export function createReleaseId(commit, date = new Date()) {
  if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error('릴리스에 사용할 Git SHA가 올바르지 않습니다.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-${commit}`;
}

export async function createArtifact({ directory, context, builtAt = new Date() }) {
  await validateBuild(directory);
  const original = await fileManifest(directory);
  for (const reserved of ['release.json', 'deploy-manifest.json', 'deploy-files.sha256']) {
    if (Object.hasOwn(original, reserved)) throw new Error(`빌드에 배포용 예약 파일이 이미 있습니다: ${reserved}`);
  }
  for (const file of Object.keys(original)) {
    if (!/^[A-Za-z0-9_./@+-]+$/.test(file) || file.split('/').some((part) => part === '.' || part === '..')) {
      throw new Error(`artifact에서 지원하지 않는 파일 경로입니다: ${file}`);
    }
  }
  const release = createReleaseId(context.commit, builtAt);
  const workspace = await mkdtemp(path.join(tmpdir(), 'owp-artifact-'));
  const cleanup = () => rm(workspace, { recursive: true, force: true });
  try {
    const content = path.join(workspace, 'content');
    await cp(directory, content, { recursive: true, dereference: false });
    await validateBuild(content);
    if (JSON.stringify(original) !== JSON.stringify(await fileManifest(content))) {
      throw new Error('artifact 복사 중 dist 내용이 변경됐습니다. 다시 빌드해 주세요.');
    }
    const metadata = {
      release,
      commit: context.commit,
      builtAt: builtAt.toISOString(),
      packages: context.packages,
      dirty: context.dirty,
      contentSha256: createHash('sha256').update(JSON.stringify(original)).digest('hex'),
    };
    const metadataFile = path.join(content, 'release.json');
    await writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, { flag: 'wx' });
    const manifest = { version: 1, files: {
      ...original,
      'release.json': { bytes: (await lstat(metadataFile)).size, sha256: await fileSha256(metadataFile) },
    } };
    await writeFile(path.join(content, 'deploy-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    const checksummed = await fileManifest(content);
    const checklist = path.join(content, 'deploy-files.sha256');
    await writeFile(checklist, Object.entries(checksummed)
      .map(([file, entry]) => `${entry.sha256}  ${file}\n`).join(''), { flag: 'wx' });
    const integrity = {
      checklistSha256: await fileSha256(checklist),
      metadataSha256: manifest.files['release.json'].sha256,
      files: Object.keys(checksummed).length + 1,
    };
    const archive = path.join(workspace, `${release}.tar.gz`);
    await execute('tar', ['--format=ustar', '-C', content, '-czf', archive, '.'], {
      env: { ...process.env, COPYFILE_DISABLE: '1' },
    });
    await chmod(archive, 0o600);
    const bytes = (await lstat(archive)).size;
    if (bytes === 0) throw new Error('생성된 artifact가 비어 있습니다.');
    return { release, archive, bytes, sha256: await fileSha256(archive), metadata, integrity, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
