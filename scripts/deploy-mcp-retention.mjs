import { constants } from 'node:fs';
import { lstat, open, readFile, readlink, readdir, realpath, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { assertRealAncestors, hashContent, optionalStat } from './deploy-mcp-preflight.mjs';

export const mcpCommitMarker = '.owp-mcp-commit.json';
const cleanupJournal = '.retention-cleanup.json';
const journalLimit = 64 * 1024;
const sourceFiles = ['package.json', 'pnpm-lock.yaml', 'mcp/cli.ts', 'scripts/version-archive.ts'];
const ownerPattern = /^[0-9a-f-]{36}$/;
const canonicalOwner = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const releasePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const controls = ['owner', 'transaction.json', 'attempt.json', 'baseline.json', 'cleanup.json', 'release.json'];
const appPath = (root, releaseId, owner) => path.join(root, 'apps', `${releaseId}-${owner}`);
const directApp = (root, file) => typeof file === 'string' && path.dirname(file) === path.join(root, 'apps') && path.normalize(file) === file;

export async function durableMcpRecord(file, value, owner) {
  const previous = await optionalStat(file);
  if (previous && (!previous.isFile() || previous.isSymbolicLink())) throw new Error(`control 기록이 일반 파일이 아닙니다: ${file}`);
  const content = JSON.stringify(value);
  const temporary = path.basename(file) === cleanupJournal ? `${file}.tmp` : `${file}.${owner}.tmp`;
  const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { await handle.writeFile(content); await handle.sync(); }
  finally { await handle.close(); }
  await rename(temporary, file);
  const directory = await open(path.dirname(file), constants.O_RDONLY);
  try { await directory.sync(); }
  finally { await directory.close(); }
}

async function record(file) {
  const info = await optionalStat(file);
  if (!info) return undefined;
  if (!info.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024) throw new Error(`일반 control 파일이 아닙니다: ${file}`);
  return JSON.parse(await readFile(file, 'utf8'));
}
const envelope = (value) => ({ value, sha256: hashContent(JSON.stringify(value)) });
function unwrap(value) {
  if (!value || typeof value.sha256 !== 'string' || value.sha256 !== hashContent(JSON.stringify(value.value))) throw new Error('control marker SHA-256이 다릅니다.');
  return value.value;
}
async function sourceProof(directory) {
  await assertRealAncestors(path.join(directory, 'mcp'));
  await assertRealAncestors(path.join(directory, 'scripts'));
  const proof = {};
  for (const name of sourceFiles) {
    const file = path.join(directory, name);
    const info = await optionalStat(file);
    if (!info?.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024) throw new Error(`관리앱 source 구조를 확인하지 못했습니다: ${file}`);
    proof[name] = hashContent(await readFile(file));
  }
  return proof;
}
function receiptNamespace(root, receipt) {
  if (receipt?.schemaVersion !== 1 || receipt.root !== root || !ownerPattern.test(receipt.owner) || !releasePattern.test(receipt.releaseId) || !/^[0-9a-f]{40}$/.test(receipt.head) || receipt.appDirectory !== appPath(root, receipt.releaseId, receipt.owner)) throw new Error('관리앱 receipt namespace가 다릅니다.');
}
function receiptManifest(manifest, receipt) {
  if (manifest?.releaseId !== receipt.releaseId || typeof manifest.commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(manifest.commit) || !receipt.head.startsWith(manifest.commit) || manifest.dirty !== false || manifest.channel !== 'stable') throw new Error('관리앱 manifest와 receipt가 다릅니다.');
}
async function validateReceipt(root, receipt) {
  receiptNamespace(root, receipt);
  await assertRealAncestors(receipt.appDirectory);
  const manifestPath = path.join(root, 'archive/versions', receipt.releaseId, 'knowledge-release.json');
  await assertRealAncestors(path.dirname(manifestPath));
  const manifest = await record(manifestPath);
  receiptManifest(manifest, receipt);
  return manifest;
}
function legacyRelease(releaseId) {
  const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-([0-9a-f]{12})$/.exec(releaseId);
  if (!match) throw new Error('legacy releaseId namespace가 다릅니다.');
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== iso) throw new Error('legacy releaseId 날짜가 다릅니다.');
  return match[7];
}
function legacyIdentity(root, directory) {
  if (!directApp(root, directory)) throw new Error('legacy 앱이 apps 직계 경로가 아닙니다.');
  const name = path.basename(directory);
  const releaseId = name.slice(0, -37);
  const owner = name.slice(-36);
  const commit = legacyRelease(releaseId);
  if (!canonicalOwner.test(owner) || directory !== appPath(root, releaseId, owner)) throw new Error('legacy 앱 owner namespace가 다릅니다.');
  return { releaseId, owner, commit, appDirectory: directory };
}
function legacyReceipt(root, receipt) {
  if (receipt?.schemaVersion !== 1 || receipt.root !== root || !/^[0-9a-f]{40}$/.test(receipt.head)) throw new Error('legacy receipt 구조가 다릅니다.');
  const identity = legacyIdentity(root, receipt.appDirectory);
  if (receipt.releaseId !== identity.releaseId || receipt.owner !== identity.owner || !receipt.head.startsWith(identity.commit)) throw new Error('legacy receipt namespace가 다릅니다.');
  return identity;
}
function legacyManifest(manifest, identity) {
  if (manifest?.releaseId !== identity.releaseId || manifest.commit !== identity.commit || manifest.channel !== 'stable' || manifest.dirty !== false) throw new Error('legacy 관리앱의 clean stable archive 증거가 다릅니다.');
}
async function ownedDirectory(directory) {
  await assertRealAncestors(directory);
  if (await realpath(directory) !== directory) throw new Error('관리 디렉터리 realpath가 다릅니다.');
  const parent = await lstat(path.dirname(directory), { bigint: true });
  const candidate = await lstat(directory, { bigint: true });
  if (!candidate.isDirectory() || candidate.isSymbolicLink() || candidate.dev !== parent.dev || candidate.uid !== parent.uid) throw new Error('관리 디렉터리의 mount device 또는 owner가 다릅니다.');
}
async function readLegacyApp(root, directory) {
  const identity = legacyIdentity(root, directory);
  await ownedDirectory(directory);
  const manifestFile = path.join(root, 'archive/versions', identity.releaseId, 'knowledge-release.json');
  await assertRealAncestors(path.dirname(manifestFile));
  const manifest = await record(manifestFile);
  legacyManifest(manifest, identity);
  return { ...identity, manifestSha256: hashContent(JSON.stringify(manifest)), source: await sourceProof(directory) };
}
function legacyMetadata(metadata) {
  const commit = legacyRelease(metadata?.releaseId);
  if (metadata.channel !== 'stable' || metadata.dirty !== false || !/^[0-9a-f]{40}$/.test(metadata.head) || !metadata.head.startsWith(commit) || metadata.manifestCommit !== commit || (metadata.sourceTarCommit !== undefined && metadata.sourceTarCommit !== metadata.head) ||
      !Array.isArray(metadata.packages) || !metadata.packages.length || !Array.isArray(metadata.stableReleaseIds) || !metadata.stableReleaseIds.includes(metadata.releaseId) || new Set(metadata.stableReleaseIds).size !== metadata.stableReleaseIds.length) throw new Error('legacy 실패 묶음 metadata가 다릅니다.');
  for (const releaseId of metadata.stableReleaseIds) legacyRelease(releaseId);
  for (const name of ['app.tar.gz', 'archive.tar.gz']) {
    const file = metadata.files?.[name];
    if (!Number.isSafeInteger(file?.bytes) || file.bytes <= 0 || !/^[0-9a-f]{64}$/.test(file.sha256)) throw new Error('legacy 실패 묶음 파일 metadata가 다릅니다.');
  }
}
async function readLegacyFailure(context, directory, owner, transaction, attempt) {
  const root = context.config.remoteRoot;
  await ownedDirectory(directory);
  const metadata = await record(path.join(directory, 'release.json'));
  legacyMetadata(metadata);
  const appDirectory = appPath(root, metadata.releaseId, owner);
  legacyIdentity(root, appDirectory);
  const baselineRecord = await record(path.join(directory, 'baseline.json'));
  const baseline = baselineRecord?.baseline;
  if (baselineRecord?.root !== root || baselineRecord.owner !== owner || !baseline || !['active', 'inactive', 'failed'].includes(baseline.active) || !['enabled', 'disabled'].includes(baseline.enabled)) throw new Error('legacy 실패 baseline 귀속이 다릅니다.');
  if (baseline.receipt) legacyManifest(baseline.manifest, legacyReceipt(root, baseline.receipt));
  else if (baseline.manifest !== undefined || baseline.active === 'active' || baseline.enabled === 'enabled') throw new Error('legacy 최초 설치 baseline이 다릅니다.');
  const state = transaction ?? attempt;
  if (state && (state.owner !== owner || state.root !== root || state.appDirectory !== appDirectory || (state.beforeCurrent ? path.resolve(root, state.beforeCurrent) : undefined) !== baseline.receipt?.appDirectory)) throw new Error('legacy 실패 앱과 baseline 참조가 다릅니다.');
  if (attempt && (attempt.owner !== owner || attempt.root !== root || attempt.appDirectory !== appDirectory || attempt.phase !== 'installing' || attempt.releaseId !== metadata.releaseId || attempt.head !== metadata.head ||
      (attempt.beforeCurrent ? path.resolve(root, attempt.beforeCurrent) : undefined) !== baseline.receipt?.appDirectory || (attempt.rollbackBaseline && JSON.stringify(attempt.rollbackBaseline) !== JSON.stringify(baseline)))) throw new Error('legacy 전환 이전 attempt 증거가 다릅니다.');
  if (transaction) {
    const nextReceipt = JSON.parse(transaction.nextReceipt);
    legacyReceipt(root, nextReceipt);
    if (transaction.phase !== 'rolled-back' || JSON.stringify(transaction.rollbackBaseline) !== JSON.stringify(baseline) || transaction.unitPath !== path.join(context.config.unitDirectory, `${context.config.service}.service`) ||
        nextReceipt.owner !== owner || nextReceipt.appDirectory !== appDirectory || nextReceipt.head !== metadata.head || nextReceipt.unitSha256 !== hashContent(transaction.nextUnit) ||
        transaction.active !== baseline.active || transaction.enabled !== baseline.enabled || JSON.stringify(transaction.previousReceipt ? JSON.parse(transaction.previousReceipt) : undefined) !== JSON.stringify(baseline.receipt)) throw new Error('legacy rolled-back transaction 증거가 다릅니다.');
  }
  const identity = await optionalStat(appDirectory) ? await directoryIdentity(appDirectory) : null;
  return { directory, owner, appDirectory, identity, releaseId: metadata.releaseId, head: metadata.head, beforeCurrent: baseline.receipt?.appDirectory, rollbackBaseline: baseline, kind: transaction ? 'superseded-rolled-back' : 'superseded-pre-transaction' };
}
export async function readMcpCommit(root, directory) {
  if (!directApp(root, directory)) throw new Error('관리앱 경로가 apps 직계 경로가 아닙니다.');
  const marker = await record(path.join(directory, mcpCommitMarker));
  if (!marker) return undefined;
  const value = unwrap(marker);
  if (value.schemaVersion !== 1 || !['committed', 'verified-legacy-current'].includes(value.kind) || value.receipt?.appDirectory !== directory || (value.predecessor !== null && !directApp(root, value.predecessor))) throw new Error('정상 commit marker 구조가 다릅니다.');
  await validateReceipt(root, value.receipt);
  if (JSON.stringify(value.source) !== JSON.stringify(await sourceProof(directory))) throw new Error('정상 commit source가 변경됐습니다.');
  return value;
}
export async function markMcpCommit(context, receipt, predecessor, kind = 'committed') {
  await validateReceipt(context.config.remoteRoot, receipt);
  const value = { schemaVersion: 1, kind, receipt, predecessor: predecessor ?? null, source: await sourceProof(receipt.appDirectory) };
  await durableMcpRecord(path.join(receipt.appDirectory, mcpCommitMarker), envelope(value), context.owner);
}
export async function markMcpCleanup(context, kind, appDirectory) {
  await durableMcpRecord(path.join(context.incoming, 'cleanup.json'), envelope({ schemaVersion: 1, root: context.config.remoteRoot, owner: context.owner, kind, appDirectory }), context.owner);
}
export async function assertMcpMaintenanceOwner(context) {
  await assertRealAncestors(context.config.remoteRoot);
  for (const directory of [path.join(context.config.remoteRoot, '.deploy.lock'), context.incoming]) {
    const info = await optionalStat(directory);
    if (!info?.isDirectory() || info.isSymbolicLink() || await recordOwner(directory) !== context.owner) throw new Error('정리 잠금 owner가 다릅니다. 자료를 보존합니다.');
  }
}
async function recordOwner(directory) {
  const file = path.join(directory, 'owner');
  const info = await optionalStat(file);
  if (!info?.isFile() || info.isSymbolicLink() || info.size !== 36) throw new Error('owner control 파일이 다릅니다.');
  const owner = await readFile(file, 'utf8');
  if (!ownerPattern.test(owner)) throw new Error('owner namespace가 다릅니다.');
  return owner;
}
async function treeSnapshot(directory) {
  const root = await lstat(directory, { bigint: true });
  if (!root.isDirectory() || root.isSymbolicLink()) throw new Error('정리 대상은 실제 디렉터리여야 합니다.');
  const entries = [];
  async function visit(file) {
    const info = await lstat(file, { bigint: true });
    if (info.dev !== root.dev || info.uid !== root.uid) throw new Error('mount device 또는 파일 owner가 달라 보존합니다.');
    entries.push([file.slice(directory.length), ...['dev', 'ino', 'mode', 'uid', 'gid', 'size', 'mtimeNs', 'ctimeNs'].map((key) => String(info[key]))]);
    if (info.isDirectory()) for (const name of (await readdir(file)).sort()) await visit(path.join(file, name));
    else if (!info.isFile() && !info.isSymbolicLink()) throw new Error('특수 파일이 있어 보존합니다.');
  }
  await visit(directory);
  return JSON.stringify(entries);
}
async function guard(context, released = false) {
  if (!released) await assertMcpMaintenanceOwner(context);
  else await assertRealAncestors(context.config.remoteRoot);
  const root = context.config.remoteRoot;
  const signature = (info) => ['dev', 'ino', 'mode', 'uid', 'gid', 'size', 'mtimeMs', 'ctimeMs'].map((key) => String(info[key]));
  const lock = await optionalStat(path.join(root, '.deploy.lock'));
  const state = { lock: lock ? [signature(lock), signature(await lstat(path.join(root, '.deploy.lock/owner')))] : null, incoming: {} };
  const control = async (file, limit = 16 * 1024 * 1024) => {
    const info = await optionalStat(file);
    if (!info) return null;
    if (!info.isFile() || info.isSymbolicLink() || info.size > limit) throw new Error(`control metadata가 일반 파일이 아니거나 너무 큽니다: ${file}`);
    return [signature(info), hashContent(await readFile(file))];
  };
  state.journal = await control(path.join(root, cleanupJournal), journalLimit);
  for (const name of ['current', 'deployment.json']) {
    const file = path.join(root, name);
    const info = await optionalStat(file);
    if (!info) { state[name] = null; continue; }
    if (name === 'current') {
      if (!info.isSymbolicLink()) throw new Error('current가 symlink가 아니어서 정리를 중단합니다.');
      state[name] = [signature(info), await readlink(file), await realpath(file)];
    } else state[name] = await control(file);
  }
  for (const name of (await readdir(root)).filter((entry) => entry.startsWith('.incoming-')).sort()) {
    const directory = path.join(root, name);
    const info = await optionalStat(directory);
    if (!info?.isDirectory() || info.isSymbolicLink()) { state.incoming[name] = 'unknown'; continue; }
    // 자기 control의 atomic write는 directory timestamp만 바꿀 수 있습니다.
    state.incoming[name] = { identity: ['dev', 'ino', 'mode', 'uid', 'gid'].map((key) => String(info[key])), controls: Object.fromEntries(await Promise.all(controls.map(async (file) => [file, await control(path.join(directory, file))]))) };
  }
  return state;
}
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
async function maintenanceBatch(context) {
  let expected = await guard(context);
  let applicationReferences;
  const checkReferences = async () => {
    if (applicationReferences && !equal(await applicationReferences.read(), applicationReferences.expected)) throw new Error('앱의 수집 시점 identity 또는 부재가 변경되어 이번 정리를 중단합니다.');
  };
  const check = async () => {
    if (!equal(await guard(context), expected)) throw new Error('배포 참조가 정리 계획 이후 변경되어 이번 정리를 중단합니다.');
    await checkReferences();
  };
  const accept = async (change) => {
    const actual = await guard(context);
    const next = structuredClone(expected);
    change(next, actual);
    if (!equal(actual, next)) throw new Error('자기 control 변경 중 외부 배포 참조가 변경되어 이번 정리를 중단합니다.');
    await checkReferences();
    expected = actual;
  };
  return {
    check,
    checkApplications: checkReferences,
    async checkReleased() {
      const released = structuredClone(expected);
      released.lock = null;
      if (!equal(await guard(context, true), released)) throw new Error('잠금 해제 뒤 배포 참조가 변경되어 종결 incoming을 보존합니다.');
      await checkReferences();
    },
    async watchApplications(directories, identities) {
      for (const directory of directories) if (!identities.has(directory)) throw new Error('최초 identity 또는 부재를 수집하지 않은 앱 참조가 있어 보존합니다.');
      const read = () => Promise.all([...directories].map(async (directory) => {
        if (!directApp(context.config.remoteRoot, directory)) throw new Error('앱 참조가 관리앱 namespace 밖입니다.');
        return [directory, await optionalStat(directory) ? await entryIdentity(directory) : null];
      }));
      applicationReferences = { read, expected: [...directories].map((directory) => [directory, identities.get(directory)]) };
      await check();
    },
    async removedApplication(directory) {
      if (!applicationReferences?.expected.some(([file]) => file === directory)) throw new Error('수집하지 않은 앱의 삭제 결과는 승인하지 않습니다.');
      const next = applicationReferences.expected.map(([file, identity]) => [file, file === directory ? null : identity]);
      if (!equal(await applicationReferences.read(), next)) throw new Error('앱 삭제 중 수집한 디렉터리 참조가 변경되어 이번 정리를 중단합니다.');
      applicationReferences.expected = next;
      await check();
    },
    async write(file, value, writer = durableMcpRecord) {
      await check();
      if (path.basename(file) === cleanupJournal && Buffer.byteLength(JSON.stringify(value)) > journalLimit) throw new Error('삭제 intent가 64 KiB 제한을 초과하여 보존합니다.');
      await writer(file, value, context.owner);
      await accept((next, actual) => {
        const name = path.basename(file);
        const entry = name === cleanupJournal ? actual.journal : actual.incoming[path.basename(path.dirname(file))]?.controls?.[name];
        if (entry?.[1] !== hashContent(JSON.stringify(value))) throw new Error('작성한 정리 control의 내용이 달라 보존합니다.');
        if (name === cleanupJournal) next.journal = entry;
        else next.incoming[path.basename(path.dirname(file))].controls[name] = entry;
      });
    },
    async removed(directory) {
      await accept((next) => { delete next.incoming[path.basename(directory)]; });
    },
    async retireJournal() {
      await check();
      await rm(path.join(context.config.remoteRoot, cleanupJournal));
      const directory = await open(context.config.remoteRoot, constants.O_RDONLY);
      try { await directory.sync(); } finally { await directory.close(); }
      await accept((next) => { next.journal = null; });
    },
  };
}
async function removeManaged(context, directory, dependencies, validate, batch) {
  await assertRealAncestors(directory);
  const parent = await lstat(path.dirname(directory), { bigint: true });
  const candidate = await lstat(directory, { bigint: true });
  if (candidate.dev !== parent.dev || candidate.uid !== parent.uid) throw new Error('정리 대상의 mount device 또는 owner가 상위와 달라 보존합니다.');
  await batch.check();
  const before = await treeSnapshot(directory);
  await validate?.();
  await dependencies.beforeRemove?.(directory);
  await batch.check();
  await assertRealAncestors(directory);
  if (await treeSnapshot(directory) !== before) throw new Error('관측 중 정리 대상이 변경되어 보존합니다.');
  await validate?.();
  await batch.check();
  let failure;
  try { await (dependencies.remove ?? rm)(directory, { recursive: true, force: false }); }
  catch (error) { failure = error; }
  if (directApp(context.config.remoteRoot, directory) && !(await optionalStat(directory))) await batch.removedApplication(directory);
  else if (path.dirname(directory) === context.config.remoteRoot && !(await optionalStat(directory))) await batch.removed(directory);
  else await batch.check();
  if (failure) throw failure;
  if (await optionalStat(directory)) throw new Error('정리 대상이 완전히 삭제되지 않아 증거를 보존합니다.');
}

async function directoryIdentity(directory) {
  await ownedDirectory(directory);
  return entryIdentity(directory);
}
async function entryIdentity(directory) {
  const info = await lstat(directory, { bigint: true });
  return Object.fromEntries(['dev', 'ino', 'uid', 'gid', 'mode'].map((key) => [key, String(info[key])]));
}
function terminalApplication(root, directory, owner, transaction, attempt, terminal) {
  const state = transaction ?? attempt;
  if (directory !== path.join(root, `.incoming-${owner}`) || terminal?.schemaVersion !== 1 || terminal.root !== root || terminal.owner !== owner || !state || state.owner !== owner || state.root !== root || terminal.appDirectory !== state.appDirectory ||
      !['committed', 'rollback-finalized', 'superseded-pre-transaction', 'superseded-rolled-back'].includes(terminal.kind)) throw new Error('앱의 종결 정리 증거가 다릅니다.');
  if (!attempt || attempt.root !== root || attempt.owner !== owner || !releasePattern.test(attempt.releaseId) || !/^[0-9a-f]{40}$/.test(attempt.head) || attempt.appDirectory !== state.appDirectory || attempt.appDirectory !== appPath(root, attempt.releaseId, owner)) throw new Error('실패앱의 attempt namespace가 다릅니다.');
  if (terminal.kind === 'committed') {
    if (transaction?.phase !== 'committed') throw new Error('commit 종결 증거가 다릅니다.');
  } else if (terminal.kind === 'rollback-finalized') {
    if (state.phase !== 'rollback-finalized') throw new Error('복구 검증 종결 증거가 다릅니다.');
  } else {
    legacyReceipt(root, terminal.anchor);
    const identity = legacyIdentity(root, state.appDirectory);
    if (!attempt.head.startsWith(identity.commit) || attempt.phase !== 'superseded' || attempt.supersededKind !== terminal.kind || !equal(attempt.supersededBy, terminal.anchor) || terminal.anchor.appDirectory === state.appDirectory ||
        (terminal.kind === 'superseded-pre-transaction' ? transaction !== undefined : transaction?.phase !== 'rolled-back')) throw new Error('현재 검증 anchor의 실패 대체 종결 증거가 다릅니다.');
  }
  return { directory, owner, appDirectory: attempt.appDirectory, releaseId: attempt.releaseId, head: attempt.head };
}
async function terminalEvidence(root, directory) {
  const identity = await directoryIdentity(directory);
  const owner = await recordOwner(directory);
  if (directory !== path.join(root, `.incoming-${owner}`)) throw new Error('실패앱 증거가 root 직계 incoming이 아닙니다.');
  const records = {};
  const controlSha256 = {};
  for (const name of controls) {
    const file = path.join(directory, name);
    const info = await optionalStat(file);
    if (!info) { controlSha256[name] = null; continue; }
    if (!info.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024) throw new Error('실패앱 control 증거가 일반 파일이 아니거나 너무 큽니다.');
    const bytes = await readFile(file);
    controlSha256[name] = hashContent(bytes);
    if (name !== 'owner') records[name] = JSON.parse(bytes.toString('utf8'));
  }
  const application = terminalApplication(root, directory, owner, records['transaction.json'], records['attempt.json'], unwrap(records['cleanup.json']));
  const attempt = records['attempt.json'];
  const transaction = records['transaction.json'];
  const baseline = records['baseline.json'];
  if (baseline !== undefined && (baseline?.root !== root || baseline.owner !== owner || !baseline.baseline)) throw new Error('실패앱 baseline 귀속이 다릅니다.');
  const baselines = [baseline?.baseline, attempt.rollbackBaseline, transaction?.rollbackBaseline].filter((value) => value !== undefined);
  for (const value of baselines) {
    if (!value || !['active', 'inactive', 'failed'].includes(value.active) || !['enabled', 'disabled'].includes(value.enabled) || !equal(value, baselines[0])) throw new Error('실패앱의 내부 복구 baseline이 다릅니다.');
    if (value.receipt !== undefined) { receiptNamespace(root, value.receipt); receiptManifest(value.manifest, value.receipt); }
    else if (value.manifest !== undefined || value.active === 'active' || value.enabled === 'enabled') throw new Error('실패앱의 최초 설치 baseline이 다릅니다.');
  }
  const before = baselines[0]?.receipt?.appDirectory;
  if ((attempt.beforeCurrent ? path.resolve(root, attempt.beforeCurrent) : undefined) !== before) throw new Error('실패앱 attempt의 이전 앱 참조가 baseline과 다릅니다.');
  if (transaction) {
    if (!baseline?.baseline || !attempt.rollbackBaseline || !transaction.rollbackBaseline) throw new Error('실패 transaction의 복구 baseline 증거가 없습니다.');
    const next = JSON.parse(transaction.nextReceipt);
    receiptNamespace(root, next);
    const previous = transaction.previousReceipt === undefined ? undefined : JSON.parse(transaction.previousReceipt);
    if (previous) receiptNamespace(root, previous);
    if (next.owner !== owner || next.appDirectory !== application.appDirectory || next.releaseId !== application.releaseId || next.head !== application.head ||
        typeof transaction.nextUnit !== 'string' || !transaction.nextUnit || next.unitSha256 !== hashContent(transaction.nextUnit) ||
        typeof next.service !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.@-]*$/.test(next.service) || typeof transaction.unitPath !== 'string' || !path.isAbsolute(transaction.unitPath) || path.normalize(transaction.unitPath) !== transaction.unitPath || path.basename(transaction.unitPath) !== `${next.service}.service` ||
        !equal(previous, baseline.baseline.receipt) || (transaction.beforeCurrent ? path.resolve(root, transaction.beforeCurrent) : undefined) !== before ||
        transaction.active !== baseline.baseline.active || transaction.enabled !== baseline.baseline.enabled ||
        (previous ? typeof transaction.previousUnit !== 'string' || previous.unitSha256 !== hashContent(transaction.previousUnit) : transaction.previousUnit !== undefined)) throw new Error('실패 transaction의 receipt·unit·baseline 증거가 다릅니다.');
    for (const name of ['previousIndex', 'nextIndex']) {
      if (transaction[name] === undefined && name === 'previousIndex') continue;
      const index = JSON.parse(transaction[name]);
      if (index?.schemaVersion !== 1 || !Array.isArray(index.releases) || !index.releases.length || !releasePattern.test(index.latestReleaseId) ||
          index.releases.some((entry) => !releasePattern.test(entry?.releaseId) || entry.channel !== 'stable') || new Set(index.releases.map((entry) => entry.releaseId)).size !== index.releases.length ||
          !index.releases.some((entry) => entry.releaseId === index.latestReleaseId) || (name === 'nextIndex' && index.latestReleaseId !== application.releaseId)) throw new Error('종결 transaction의 내부 archive index가 다릅니다.');
    }
  }
  const release = records['release.json'];
  if (release !== undefined && (release?.releaseId !== application.releaseId || release.head !== application.head)) throw new Error('종결 앱 release와 attempt 귀속이 다릅니다.');
  return { application, identity, controlSha256 };
}
async function validateTerminalEvidence(root, directory, expected) {
  if (!equal(await terminalEvidence(root, directory), expected)) throw new Error('종결 incoming의 identity 또는 귀속·종결 control 증거가 변경되어 보존합니다.');
}
async function plannedFailure(root, failure) {
  const evidence = await terminalEvidence(root, failure.directory);
  if (evidence.application.appDirectory !== failure.appDirectory || evidence.application.owner !== failure.owner) throw new Error('실패앱의 수집 시점 귀속이 변경되어 보존합니다.');
  return { schemaVersion: 1, root, kind: 'failed', appDirectory: failure.appDirectory, owner: failure.owner, releaseId: evidence.application.releaseId, head: evidence.application.head,
    identity: failure.identity, incoming: failure.directory, incomingIdentity: evidence.identity, controlSha256: evidence.controlSha256 };
}
const validIdentity = (identity) => identity && ['dev', 'ino', 'uid', 'gid', 'mode'].every((key) => typeof identity[key] === 'string' && /^\d+$/.test(identity[key]));
async function validateFailureIntent(root, intent, protect) {
  if (protect.has(intent.appDirectory)) throw new Error('미완료 실패앱 삭제 intent가 현재 보호 참조에 있어 보존합니다.');
  const evidence = await terminalEvidence(root, intent.incoming);
  if (!equal(evidence.identity, intent.incomingIdentity) || !equal(evidence.controlSha256, intent.controlSha256) || evidence.application.appDirectory !== intent.appDirectory || evidence.application.owner !== intent.owner || evidence.application.releaseId !== intent.releaseId || evidence.application.head !== intent.head) throw new Error('실패앱 삭제 intent의 귀속·종결 control 증거가 변경되어 보존합니다.');
}
async function plannedApp(root, directory, commit, legacy) {
  const receipt = commit?.receipt;
  const identity = receipt ?? legacy;
  const manifest = await record(path.join(root, 'archive/versions', identity.releaseId, 'knowledge-release.json'));
  return {
    schemaVersion: 1, root, appDirectory: directory, owner: identity.owner, releaseId: identity.releaseId,
    head: receipt?.head ?? legacy.commit, kind: commit ? 'committed' : 'legacy', identity: await directoryIdentity(directory),
    source: commit?.source ?? legacy.source, markerSha256: commit ? hashContent(await readFile(path.join(directory, mcpCommitMarker))) : null,
    manifestSha256: hashContent(JSON.stringify(manifest)), ...(receipt ? { receipt } : {}),
  };
}
async function pendingCleanup(root) {
  if (!(await optionalStat(path.join(root, cleanupJournal)))) return undefined;
  const wrapped = await record(path.join(root, cleanupJournal));
  const journal = await lstat(path.join(root, cleanupJournal), { bigint: true });
  const parent = await lstat(root, { bigint: true });
  if (journal.uid !== parent.uid || journal.dev !== parent.dev) throw new Error('삭제 intent의 owner 또는 device가 root와 다릅니다.');
  const value = unwrap(wrapped);
  if (value.schemaVersion !== 1 || value.root !== root || !['committed', 'legacy', 'failed'].includes(value.kind) || !ownerPattern.test(value.owner) || !releasePattern.test(value.releaseId) || value.appDirectory !== appPath(root, value.releaseId, value.owner) || !validIdentity(value.identity)) throw new Error('삭제 intent namespace 또는 identity 구조가 다릅니다.');
  if (value.kind === 'failed') {
    if (!/^[0-9a-f]{40}$/.test(value.head) || value.incoming !== path.join(root, `.incoming-${value.owner}`) || !validIdentity(value.incomingIdentity) ||
        !equal(Object.keys(value.controlSha256 ?? {}).sort(), [...controls].sort()) || !Object.values(value.controlSha256).every((digest) => digest === null || /^[0-9a-f]{64}$/.test(digest)) ||
        ['owner', 'attempt.json', 'cleanup.json'].some((name) => !value.controlSha256[name])) throw new Error('실패앱 삭제 intent의 incoming 증명 구조가 다릅니다.');
    return value;
  }
  if (!/^[0-9a-f]{64}$/.test(value.manifestSha256) ||
      !equal(Object.keys(value.source ?? {}).sort(), [...sourceFiles].sort()) || !Object.values(value.source).every((digest) => /^[0-9a-f]{64}$/.test(digest))) throw new Error('삭제 intent namespace 또는 증명 구조가 다릅니다.');
  if (value.kind === 'committed') {
    if (!/^[0-9a-f]{64}$/.test(value.markerSha256) || !/^[0-9a-f]{40}$/.test(value.head) || value.receipt?.schemaVersion !== 1 || value.receipt.root !== root || value.receipt.appDirectory !== value.appDirectory || value.receipt.owner !== value.owner || value.receipt.releaseId !== value.releaseId || value.receipt.head !== value.head) throw new Error('정상 앱 삭제 intent receipt가 다릅니다.');
  } else if (value.markerSha256 !== null || legacyIdentity(root, value.appDirectory).commit !== value.head) throw new Error('legacy 삭제 intent namespace가 다릅니다.');
  return value;
}
async function validatePending(root, intent, protect) {
  if (protect.has(intent.appDirectory)) throw new Error('미완료 삭제 intent의 앱이 현재 보호 참조에 있어 보존합니다.');
  if (!equal(await directoryIdentity(intent.appDirectory), intent.identity)) throw new Error('미완료 삭제 intent의 디렉터리 identity가 달라 보존합니다.');
  if (intent.kind === 'failed') return validateFailureIntent(root, intent, protect);
  const manifestFile = path.join(root, 'archive/versions', intent.releaseId, 'knowledge-release.json');
  await assertRealAncestors(path.dirname(manifestFile));
  const manifest = await record(manifestFile);
  if (hashContent(JSON.stringify(manifest)) !== intent.manifestSha256) throw new Error('삭제 intent의 영구 archive 증거가 변경되어 보존합니다.');
  if (intent.kind === 'committed') await validateReceipt(root, intent.receipt);
  else legacyManifest(manifest, legacyIdentity(root, intent.appDirectory));
  for (const name of [...sourceFiles, mcpCommitMarker]) {
    const file = path.join(intent.appDirectory, name);
    await assertRealAncestors(path.dirname(file));
    const info = await optionalStat(file);
    // 앞선 recursive rm에서 사라진 증명 파일은 앱 밖 intent로 확인합니다.
    if (!info) continue;
    const expected = name === mcpCommitMarker ? intent.markerSha256 : intent.source[name];
    if (!expected || !info.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024 || hashContent(await readFile(file)) !== expected) throw new Error(`삭제 intent의 남은 증명 파일이 변경되어 보존합니다: ${file}`);
  }
}

export async function maintainMcpDeployment(context, dependencies = {}) {
  await assertMcpMaintenanceOwner(context);
  const root = context.config.remoteRoot;
  const warnings = [];
  const removed = [];
  const protect = new Set();
  const commits = new Map();
  const legacy = new Map();
  const legacyWarnings = new Map();
  const unmarked = [];
  const failed = new Map();
  const finished = [];
  const superseded = [];
  let uncertain = false;
  const warn = (file, error) => warnings.push(`${file}: ${error.message ?? error}`);
  let batch;
  let pending;
  try { batch = await maintenanceBatch(context); }
  catch (error) { uncertain = true; warn('자동정리 중단', error); }
  try { pending = await pendingCleanup(root); }
  catch (error) { warn(cleanupJournal, error); return { removed, warnings }; }
  const plans = new Map();
  const observedApps = new Map();
  const observeApp = async (directory) => {
    if (observedApps.has(directory)) return;
    if (!directApp(root, directory)) throw new Error('관측할 앱 참조가 관리 namespace 밖입니다.');
    observedApps.set(directory, null);
    try { observedApps.set(directory, await entryIdentity(directory)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
  const protectApp = async (directory) => { protect.add(directory); await observeApp(directory); };
  const currentInfo = await optionalStat(path.join(root, 'current'));
  let current;
  if (currentInfo) {
    try {
      if (!currentInfo.isSymbolicLink()) throw new Error('current가 symlink가 아닙니다.');
      current = await realpath(path.join(root, 'current'));
      if (!directApp(root, current)) throw new Error('current가 관리앱 경로 밖입니다.');
      await protectApp(current);
    } catch (error) { uncertain = true; warn('current', error); }
  }
  const receipt = await record(path.join(root, 'deployment.json'));
  if (receipt?.appDirectory) await protectApp(receipt.appDirectory);
  let freshAnchor;
  if (receipt && receipt.appDirectory === current && context.baselineVerified?.appDirectory === current && context.baselineVerified.head === receipt.head && context.baselineVerified.releaseId === receipt.releaseId) {
    try { legacyReceipt(root, receipt); await validateReceipt(root, receipt); freshAnchor = receipt; }
    catch (error) { uncertain = true; warn('baselineVerified', error); }
  }
  const apps = path.join(root, 'apps');
  await assertRealAncestors(apps);
  if (await optionalStat(apps)) for (const name of (await readdir(apps)).sort()) {
    const directory = path.join(apps, name);
    try {
      await observeApp(directory);
      const info = await optionalStat(directory);
      if (!info?.isDirectory() || info.isSymbolicLink()) throw new Error('실제 관리앱 디렉터리가 아닙니다.');
      if (directory === pending?.appDirectory) continue;
      let commit = await readMcpCommit(root, directory);
      if (!commit && directory === current && freshAnchor) {
        await readLegacyApp(root, directory);
        await markMcpCommit(context, receipt, null, 'verified-legacy-current');
        commit = await readMcpCommit(root, directory);
      }
      if (commit) {
        const plan = await plannedApp(root, directory, commit);
        commits.set(directory, commit);
        plans.set(directory, plan);
      }
      else unmarked.push(directory);
    } catch (error) { warn(directory, error); }
  }
  const anchor = commits.get(current)?.receipt;
  const anchored = anchor && anchor.appDirectory === receipt?.appDirectory && anchor.releaseId === receipt.releaseId && anchor.head === receipt.head && anchor.owner === receipt.owner;
  for (const directory of unmarked) {
    try {
      if (!anchored) throw new Error('현재 정상 검증 anchor가 없어 legacy 실행본을 보존합니다.');
      const proof = await readLegacyApp(root, directory);
      const plan = await plannedApp(root, directory, undefined, proof);
      legacy.set(directory, proof);
      plans.set(directory, plan);
    } catch (error) { legacyWarnings.set(directory, error); }
  }
  const recovery = new Set();
  let predecessor = current;
  for (let index = 0; predecessor && index < 3; index++) {
    await protectApp(predecessor);
    if (!commits.has(predecessor) && !legacy.has(predecessor)) {
      if (await optionalStat(predecessor)) { uncertain = true; warn(predecessor, '현재 앱 또는 predecessor의 완전한 증명을 확인하지 못해 정리를 중단합니다.'); }
      else warn(predecessor, 'predecessor 실행본이 없어 복구 슬롯에 포함하지 않습니다.');
      break;
    }
    recovery.add(predecessor);
    if (!commits.has(predecessor)) {
      break;
    }
    predecessor = commits.get(predecessor)?.predecessor;
  }
  for (const name of (await readdir(root)).filter((entry) => entry.startsWith('.incoming-')).sort()) {
    const directory = path.join(root, name);
    try {
      const info = await optionalStat(directory);
      if (!info?.isDirectory() || info.isSymbolicLink()) throw new Error('실제 incoming 디렉터리가 아닙니다.');
      const owner = await recordOwner(directory);
      if (name !== `.incoming-${owner}`) throw new Error('incoming 이름과 owner가 다릅니다.');
      const transaction = await record(path.join(directory, 'transaction.json'));
      const attempt = await record(path.join(directory, 'attempt.json'));
      const state = transaction ?? attempt;
      const cleanup = await record(path.join(directory, 'cleanup.json'));
      if (cleanup) {
        let validate;
        const terminal = unwrap(cleanup);
        if (terminal.schemaVersion !== 1 || terminal.root !== root || terminal.owner !== owner || !state || state.owner !== owner || state.root !== root || terminal.appDirectory !== state.appDirectory || !directApp(root, state.appDirectory) || !['committed', 'rollback-finalized', 'superseded-pre-transaction', 'superseded-rolled-back'].includes(terminal.kind)) throw new Error('종결 정리 증거가 다릅니다.');
        if (terminal.kind === 'committed') {
          if (transaction?.phase !== 'committed') throw new Error('commit 종결 증거가 다릅니다.');
          const terminalProof = await terminalEvidence(root, directory);
          if (await optionalStat(state.appDirectory)) {
            if ((commits.get(state.appDirectory)?.receipt ?? (pending?.appDirectory === state.appDirectory && pending.kind === 'committed' ? pending.receipt : undefined))?.owner !== owner) throw new Error('commit 종결 증거가 다릅니다.');
            const commit = commits.get(state.appDirectory);
            const intent = pending?.appDirectory === state.appDirectory ? pending : undefined;
            validate = async () => {
              await validateTerminalEvidence(root, directory, terminalProof);
              await batch.checkApplications();
              if (!(await optionalStat(state.appDirectory))) return;
              if (commit) {
                if (!equal(await readMcpCommit(root, state.appDirectory), commit)) throw new Error('commit 앱의 정상 증거가 변경되어 종결 자료를 보존합니다.');
              } else await validatePending(root, intent, protect);
            };
          } else {
            if (typeof state.nextReceipt !== 'string') throw new Error('commit 종결 receipt가 다릅니다.');
            const nextReceipt = JSON.parse(state.nextReceipt);
            const archive = await validateReceipt(root, nextReceipt);
            if (archive.dirty !== false || !/^[0-9a-f]+$/.test(archive.commit)) throw new Error('commit 종결 archive의 clean commit 증거가 다릅니다.');
            const manifest = JSON.stringify(archive);
            if (nextReceipt.owner !== owner || nextReceipt.appDirectory !== state.appDirectory || attempt?.owner !== owner || attempt.root !== root || attempt.appDirectory !== state.appDirectory || attempt.releaseId !== nextReceipt.releaseId || attempt.head !== nextReceipt.head) throw new Error('commit 종결 receipt와 attempt 귀속이 다릅니다.');
            const evidence = JSON.stringify([transaction, attempt, cleanup]);
            validate = async () => {
              await validateTerminalEvidence(root, directory, terminalProof);
              if (uncertain || protect.has(state.appDirectory) || await optionalStat(state.appDirectory)) throw new Error('commit 앱의 부재 또는 보호 참조가 변경되어 종결 자료를 보존합니다.');
              const records = await Promise.all(['transaction.json', 'attempt.json', 'cleanup.json'].map((name) => record(path.join(directory, name))));
              if (JSON.stringify(records) !== evidence || JSON.stringify(await validateReceipt(root, nextReceipt)) !== manifest) throw new Error('commit 종결 자료 또는 archive 증거가 변경되어 보존합니다.');
            };
          }
        } else {
          const evidence = await terminalEvidence(root, directory);
          failed.set(state.appDirectory, { ...evidence.application, identity: await optionalStat(state.appDirectory) ? await directoryIdentity(state.appDirectory) : null });
          validate = () => validateTerminalEvidence(root, directory, evidence);
        }
        if (directory !== context.incoming || dependencies.finishCurrent) finished.push({ directory, failedApp: terminal.kind !== 'committed' ? state.appDirectory : undefined, committedApp: terminal.kind === 'committed' ? state.appDirectory : undefined, committed: terminal.kind === 'committed', validate });
      } else if (directory !== context.incoming && freshAnchor && (!state || (transaction ? transaction.phase === 'rolled-back' : attempt.phase === 'installing'))) {
        superseded.push(await readLegacyFailure(context, directory, owner, transaction, attempt));
      } else if (state) {
        const states = [transaction, attempt].filter((value) => value !== undefined);
        for (const value of states) if (value?.owner !== owner || value.root !== root || !directApp(root, value.appDirectory)) throw new Error('미종결 transaction 또는 attempt 귀속이 다릅니다.');
        const baseline = await record(path.join(directory, 'baseline.json'));
        if (baseline !== undefined && (!baseline || baseline.root !== root || baseline.owner !== owner || !baseline.baseline || typeof baseline.baseline !== 'object' || Array.isArray(baseline.baseline))) throw new Error('미종결 baseline 귀속이 다릅니다.');
        const references = [...states.flatMap((value) => [value.appDirectory, value.beforeCurrent, value.rollbackBaseline?.receipt?.appDirectory, value.baseline?.receipt?.appDirectory]), baseline?.baseline.receipt?.appDirectory];
        for (const reference of references) if (reference !== undefined) {
          const resolved = typeof reference === 'string' ? path.resolve(root, reference) : undefined;
          if (!directApp(root, resolved)) throw new Error('transaction 참조가 관리앱 경로 밖입니다.');
          await protectApp(resolved);
        }
        if (transaction) {
          if (typeof transaction.nextReceipt !== 'string') throw new Error('미종결 nextReceipt 보호 참조가 없습니다.');
          const next = JSON.parse(transaction.nextReceipt);
          receiptNamespace(root, next);
          await protectApp(next.appDirectory);
          const previous = transaction.previousReceipt === undefined ? undefined : JSON.parse(transaction.previousReceipt);
          if (previous !== undefined) { receiptNamespace(root, previous); await protectApp(previous.appDirectory); }
          if (next.owner !== owner || next.appDirectory !== transaction.appDirectory || (attempt && (next.releaseId !== attempt.releaseId || next.head !== attempt.head)) ||
              previous?.appDirectory !== (transaction.beforeCurrent === undefined ? undefined : path.resolve(root, transaction.beforeCurrent)) ||
              (transaction.rollbackBaseline !== undefined && !equal(previous, transaction.rollbackBaseline.receipt)) ||
              (baseline !== undefined && !equal(previous, baseline.baseline.receipt))) throw new Error('미종결 receipt의 대상 앱 또는 복구 보호 참조가 다릅니다.');
        }
        for (const value of states) if (baseline && value.rollbackBaseline !== undefined && !equal(value.rollbackBaseline, baseline.baseline)) throw new Error('미종결 control의 복구 baseline이 다릅니다.');
        if (transaction && attempt && (transaction.appDirectory !== attempt.appDirectory ||
            (transaction.beforeCurrent === undefined ? undefined : path.resolve(root, transaction.beforeCurrent)) !== (attempt.beforeCurrent === undefined ? undefined : path.resolve(root, attempt.beforeCurrent)) ||
            (transaction.rollbackBaseline !== undefined && attempt.rollbackBaseline !== undefined && !equal(transaction.rollbackBaseline, attempt.rollbackBaseline)))) throw new Error('미종결 transaction과 attempt의 앱 또는 복구 참조가 다릅니다.');
      } else if (directory !== context.incoming) throw new Error('종결 여부를 모르는 incoming 자료를 보존합니다.');
    } catch (error) { uncertain = true; warn(directory, error); }
  }
  const supersededApps = new Set(superseded.map((failure) => failure.appDirectory));
  for (const [directory, error] of legacyWarnings) if (!failed.has(directory) && !supersededApps.has(directory)) warn(directory, error);
  // 끊긴 chain의 빈 슬롯은 식별된 정상 앱, legacy 복사본 순으로 보충합니다.
  const newest = ([left, a], [right, b]) => (b.receipt?.releaseId ?? b.releaseId).localeCompare(a.receipt?.releaseId ?? a.releaseId) || left.localeCompare(right);
  for (const [directory] of [...[...commits].sort(newest), ...[...legacy].sort(newest)]) {
    if (recovery.size >= 3) break;
    if (failed.has(directory) || supersededApps.has(directory)) continue;
    recovery.add(directory);
    await protectApp(directory);
  }
  await dependencies.afterCollect?.();
  const identities = new Map(observedApps);
  for (const [directory, plan] of plans) if (!identities.has(directory)) identities.set(directory, plan.identity);
  for (const failure of [...failed.values(), ...superseded]) if (!identities.has(failure.appDirectory)) identities.set(failure.appDirectory, failure.identity);
  if (pending && !identities.has(pending.appDirectory)) identities.set(pending.appDirectory, null);
  for (const { committedApp } of finished) if (committedApp && !identities.has(committedApp)) identities.set(committedApp, null);
  try { await batch?.watchApplications(new Set([...protect, ...identities.keys()]), identities); }
  catch (error) { uncertain = true; warn('자동정리 중단', error); }
  if (pending && !uncertain) {
    try {
      const directory = pending.appDirectory;
      if (await optionalStat(directory)) {
        await removeManaged(context, directory, dependencies, () => validatePending(root, pending, protect), batch);
        removed.push(directory);
      } else if (pending.kind === 'failed') await validateFailureIntent(root, pending, protect);
      await batch.retireJournal();
      pending = undefined;
    } catch (error) { uncertain = true; warn(cleanupJournal, error); }
  }
  if (!uncertain) for (const failure of superseded) {
    if (protect.has(failure.appDirectory) || commits.has(failure.appDirectory)) { warn(failure.directory, '실패앱이 보호 참조 또는 정상 이력에 있어 보존합니다.'); continue; }
    try {
      await assertMcpMaintenanceOwner(context);
      if (await realpath(path.join(root, 'current')) !== freshAnchor.appDirectory || JSON.stringify(await record(path.join(root, 'deployment.json'))) !== JSON.stringify(freshAnchor)) throw new Error('실패 대체 기록 전에 현재 검증 anchor가 변경되어 보존합니다.');
      const attempt = { owner: failure.owner, root, releaseId: failure.releaseId, head: failure.head, appDirectory: failure.appDirectory, beforeCurrent: failure.beforeCurrent, rollbackBaseline: failure.rollbackBaseline, phase: 'superseded', supersededKind: failure.kind, supersededBy: freshAnchor };
      await batch.write(path.join(failure.directory, 'attempt.json'), attempt);
      await batch.write(path.join(failure.directory, 'cleanup.json'), envelope({ schemaVersion: 1, root, owner: failure.owner, kind: failure.kind, appDirectory: failure.appDirectory, anchor: freshAnchor }));
      const evidence = await terminalEvidence(root, failure.directory);
      failed.set(failure.appDirectory, failure);
      finished.push({ directory: failure.directory, failedApp: failure.appDirectory, validate: () => validateTerminalEvidence(root, failure.directory, evidence) });
    } catch (error) { uncertain = true; await protectApp(failure.appDirectory); warn(failure.directory, error); break; }
  }
  if (!uncertain) for (const directory of new Set([...commits.keys(), ...legacy.keys(), ...failed.keys()])) {
    if (protect.has(directory) || !(await optionalStat(directory))) continue;
    try {
      await batch.check();
      const proof = legacy.get(directory);
      const plan = failed.has(directory) ? await plannedFailure(root, failed.get(directory)) : plans.get(directory);
      if (plan) {
        await batch.check();
        if (plan.kind !== 'failed' && (proof ? !equal(await readLegacyApp(root, directory), proof) : !equal(await readMcpCommit(root, directory), commits.get(directory)))) throw new Error('앱의 계획된 source 또는 marker 증거가 변경되어 보존합니다.');
        await validatePending(root, plan, protect);
        await batch.write(path.join(root, cleanupJournal), envelope(plan), dependencies.writeIntent);
        pending = plan;
      }
      await removeManaged(context, directory, dependencies, () => validatePending(root, plan, protect), batch);
      removed.push(directory);
      if (pending) { await batch.retireJournal(); pending = undefined; }
    } catch (error) { uncertain = true; warn(directory, error); break; }
  }
  const preserveIncoming = [];
  let validateCurrentIncoming;
  // 다른 incoming의 정리가 끝난 뒤 현재 incoming의 삭제 허가를 검증합니다.
  finished.sort((left, right) => Number(left.directory === context.incoming) - Number(right.directory === context.incoming));
  for (const { directory, failedApp, committed, validate } of finished) {
    if (failedApp && await optionalStat(failedApp)) {
      preserveIncoming.push(directory);
      warn(directory, '실패앱을 보존하여 귀속·종결 증거도 유지합니다.');
      continue;
    }
    if (uncertain && !(directory === context.incoming && committed && validate)) continue;
    try {
      const validateFinished = async () => {
        await batch.checkApplications();
        if (failedApp && (protect.has(failedApp) || await optionalStat(failedApp))) throw new Error('실패앱의 부재 또는 보호 참조가 변경되어 종결 자료를 보존합니다.');
        await validate?.();
      };
      await batch.check();
      await validateFinished();
      // 현재 owner의 incoming은 검증을 통과한 경우에만 lock 해제 뒤 정리합니다.
      if (directory === context.incoming) {
        validateCurrentIncoming = async () => { await batch.checkReleased(); await validateFinished(); };
        continue;
      }
      await removeManaged(context, directory, dependencies, validateFinished, batch);
      removed.push(directory);
    }
    catch (error) { uncertain = true; warn(directory, error); }
  }
  return { removed, warnings, canRemoveCurrentIncoming: !!validateCurrentIncoming, validateCurrentIncoming, ...(preserveIncoming.length ? { preserveIncoming } : {}) };
}

export async function cleanupMcpTerminal(context, release, dependencies = {}) {
  const warnings = [];
  let result;
  try { result = await maintainMcpDeployment(context, { ...dependencies, finishCurrent: true }); warnings.push(...result.warnings); }
  catch (error) { warnings.push(`자동정리 중단: ${error.message}`); }
  try {
    await guard(context);
    const before = await treeSnapshot(context.incoming);
    await release(context);
    if (result?.canRemoveCurrentIncoming !== true) return warnings;
    await result.validateCurrentIncoming();
    if (await treeSnapshot(context.incoming) !== before) throw new Error('종결 incoming이 변경되어 보존합니다.');
    await (dependencies.remove ?? rm)(context.incoming, { recursive: true, force: false });
  } catch (error) { warnings.push(`종결 자료/잠금 정리 실패: ${error.message}`); }
  return warnings;
}
