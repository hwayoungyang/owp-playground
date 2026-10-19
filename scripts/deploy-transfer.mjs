import { randomBytes } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileSha256 } from './deploy-artifact.mjs';
import { authenticationOptions } from './deploy-preflight.mjs';
import { remoteActivationScript } from './deploy-activation-script.mjs';
import { remoteStagingScript } from './deploy-staging-script.mjs';

export const remoteUploadScript = String.raw`set -euo pipefail
action=$1
base=$2
release=$3
expected_sha256=$4
expected_bytes=$5
owner=$6

fail() { printf '%s\n' "$1" >&2; exit 1; }
physical_directory() { (cd -- "$1" && pwd -P); }
[[ "$release" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{7,40}$ ]] || fail '릴리스 ID가 올바르지 않습니다.'
[[ "$expected_sha256" =~ ^[0-9a-f]{64}$ ]] || fail 'SHA-256 형식이 올바르지 않습니다.'
[[ "$expected_bytes" =~ ^[1-9][0-9]*$ ]] || fail 'artifact 크기가 올바르지 않습니다.'
[[ "$owner" =~ ^[0-9a-f]{32}$ ]] || fail '업로드 소유 식별자가 올바르지 않습니다.'
[[ "$base" = /* && "$base" != / && "$base" != */../* && "$base" != */.. ]] || fail '배포 기준 경로가 올바르지 않습니다.'
test "$(physical_directory "$base")" = "$base" || fail '배포 기준 경로에 symlink가 있습니다.'
releases="$base/releases"
test -d "$releases" && test ! -L "$releases" || fail 'releases 디렉터리를 확인할 수 없습니다.'
test "$(physical_directory "$releases")" = "$releases" || fail 'releases 경로가 배포 기준 경로 밖에 있습니다.'
test -L "$base/current" || fail 'current symlink가 없습니다.'
active=$(physical_directory "$base/current")
case "$active" in "$releases"/*) ;; *) fail 'current가 releases 밖을 가리킵니다.' ;; esac
incoming="$releases/.incoming-$release"
archive="$incoming/artifact.tar.gz"

require_owner() {
  test -d "$incoming" && test ! -L "$incoming" || fail '업로드 디렉터리를 확인할 수 없습니다.'
  test "$(physical_directory "$incoming")" = "$incoming" || fail '업로드 경로가 올바르지 않습니다.'
  test -f "$incoming/.upload-owner" && test ! -L "$incoming/.upload-owner" || fail '업로드 소유 식별자가 없습니다.'
  test "$(cat "$incoming/.upload-owner")" = "$owner" || fail '다른 업로드가 소유한 디렉터리입니다.'
}

case "$action" in
  prepare)
    test ! -e "$releases/$release" && test ! -L "$releases/$release" || fail '같은 릴리스가 이미 있습니다. 잠시 후 다시 실행해 주세요.'
    test ! -e "$base/.deploy-state/history/$release.json" && test ! -L "$base/.deploy-state/history/$release.json" || fail '같은 릴리스의 배포 이력이 이미 있습니다. 잠시 후 다시 실행해 주세요.'
    if ! mkdir -m 700 -- "$incoming"; then
      fail '같은 릴리스의 업로드가 이미 있습니다. 잠시 후 다시 실행해 주세요.'
    fi
    trap 'rm -rf -- "$incoming"' ERR
    printf '%s\n' "$owner" > "$incoming/.upload-owner"
    printf 'OWP_UPLOAD_READY %s\n' "$release"
    trap - ERR
    ;;
  verify)
    require_owner
    trap 'rm -rf -- "$incoming"' ERR
    test -f "$archive" && test ! -L "$archive"
    test "$(wc -c < "$archive")" -eq "$expected_bytes"
    printf '%s  %s\n' "$expected_sha256" "$archive" | sha256sum -c -
    test ! -L "$incoming/artifact.sha256"
    if test -e "$incoming/artifact.sha256"; then
      test "$(cat "$incoming/artifact.sha256")" = "$expected_sha256  artifact.tar.gz"
    else
      (set -C; printf '%s  artifact.tar.gz\n' "$expected_sha256" > "$incoming/artifact.sha256")
    fi
    printf 'OWP_UPLOAD_VERIFIED %s %s\n' "$release" "$expected_sha256"
    trap - ERR
    ;;
  cleanup)
    if test -e "$incoming" || test -L "$incoming"; then
      require_owner
      rm -rf -- "$incoming"
    fi
    printf 'OWP_UPLOAD_CLEANED %s\n' "$release"
    ;;
  stage)
${remoteStagingScript}
    ;;
  activate|deploy)
${remoteActivationScript}
    ;;
  *) fail '알 수 없는 업로드 동작입니다.' ;;
esac
`;

const shellQuote = (value) => `'${String(value).replaceAll("'", `'"'"'`)}'`;

export function remoteUploadCommand(action, config, artifact, owner) {
  if (!['prepare', 'verify', 'cleanup', 'stage', 'activate', 'deploy'].includes(action)) throw new Error('알 수 없는 업로드 동작입니다.');
  if (!/^\d{8}-\d{6}-[0-9a-f]{7,40}$/.test(artifact.release)
    || !/^[0-9a-f]{64}$/.test(artifact.sha256)
    || !Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0
    || !/^[0-9a-f]{32}$/.test(owner)) {
    throw new Error('artifact 업로드 정보가 올바르지 않습니다.');
  }
  const base = config.remoteRoot;
  if (typeof base !== 'string' || !/^\/[A-Za-z0-9_./-]+$/.test(base)
    || base === '/' || path.posix.normalize(base) !== base || base.split('/').includes('..')) {
    throw new Error('배포 기준 경로가 올바르지 않습니다.');
  }
  const extra = [];
  if (['stage', 'activate', 'deploy'].includes(action)) {
    const integrity = artifact.integrity;
    if (!integrity || !/^[0-9a-f]{64}$/.test(integrity.checklistSha256)
      || !/^[0-9a-f]{64}$/.test(integrity.metadataSha256)
      || !Number.isSafeInteger(integrity.files) || integrity.files < 6) {
      throw new Error('staging 검증 정보가 올바르지 않습니다.');
    }
    extra.push(integrity.checklistSha256, integrity.files, integrity.metadataSha256);
  }
  if (action === 'deploy') {
    if (!/^http:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(config.url) || config.container !== 'owp-playground-nginx') {
      throw new Error('HTTP 검증 URL 또는 컨테이너가 올바르지 않습니다.');
    }
    extra.push(config.url, config.container);
  }
  return ['bash', '-c', remoteUploadScript, '--', action, base, artifact.release,
    artifact.sha256, artifact.bytes, owner, ...extra].map(shellQuote).join(' ');
}

export async function transferArtifact(config, artifact, { interactive, run, log = console.log }) {
  const info = await lstat(artifact.archive);
  if (!info.isFile() || info.isSymbolicLink() || info.size !== artifact.bytes
    || await fileSha256(artifact.archive) !== artifact.sha256) {
    throw new Error('전송할 artifact가 없거나 생성 후 내용이 변경됐습니다.');
  }
  const owner = randomBytes(16).toString('hex');
  const destination = `${config.remoteRoot}/releases/.incoming-${artifact.release}/artifact.tar.gz`;
  const remote = (action) => run('ssh', [
    '-p', String(config.sshPort), ...authenticationOptions(config, { interactive }),
    `${config.user}@${config.host}`, remoteUploadCommand(action, config, artifact, owner),
  ], { capture: true });
  let prepared = false;
  try {
    const ready = await remote('prepare');
    prepared = true;
    if (!ready.split(/\r?\n/).includes(`OWP_UPLOAD_READY ${artifact.release}`)) {
      throw new Error('서버의 업로드 준비 응답을 확인할 수 없습니다.');
    }
    log('SCP artifact 전송 중...');
    await run('scp', [
      '-P', String(config.sshPort), ...authenticationOptions(config, { interactive }),
      '--', artifact.archive, `${config.user}@${config.host}:${destination}`,
    ]);
    const verified = await remote('verify');
    if (!verified.split(/\r?\n/).includes(`OWP_UPLOAD_VERIFIED ${artifact.release} ${artifact.sha256}`)) {
      throw new Error('서버의 SHA-256 검증 응답을 확인할 수 없습니다.');
    }
    return { release: artifact.release, sha256: artifact.sha256, bytes: artifact.bytes, archive: destination, owner };
  } catch (error) {
    if (prepared) {
      try { await remote('cleanup'); }
      catch { log(`임시 업로드를 정리하지 못했습니다. 서버 상태를 확인해 주세요: ${path.posix.dirname(destination)}`); }
    }
    throw error;
  }
}
