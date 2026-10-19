import path from 'node:path';
import { authenticationOptions } from './deploy-preflight.mjs';
import { remoteHealthScript } from './deploy-health-script.mjs';
import { remoteFilesystemScript } from './deploy-filesystem-script.mjs';

export const shellQuote = (value) => `'${String(value).replaceAll("'", `'"'"'`)}'`;

export function validateServerConfig(config) {
  if (!/^\/[A-Za-z0-9_./-]+$/.test(config.remoteRoot) || config.remoteRoot === '/'
    || path.posix.normalize(config.remoteRoot) !== config.remoteRoot || config.remoteRoot.split('/').includes('..')
    || !/^http:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(config.url)
    || config.container !== 'owp-playground-nginx') throw new Error('배포 서버 경로·URL·컨테이너 설정이 올바르지 않습니다.');
}

export const remoteServerPreamble = String.raw`set -euo pipefail
export LC_ALL=C
action=$1
base=$2
service_url=$3
container=$4
physical_directory() { (cd -- "$1" && pwd -P); }
fail() { printf '%s\n' "$1" >&2; exit 1; }
test "$(id -u)" -eq 0 || fail 'root SSH 인증이 필요합니다.'
test "$base" != / && test "$(physical_directory "$base")" = "$base" || fail '배포 기준 경로가 올바르지 않습니다.'
releases="$base/releases"
test -d "$releases" && test ! -L "$releases" && test "$(physical_directory "$releases")" = "$releases" || fail 'releases 경로가 올바르지 않습니다.'
test -L "$base/current" || fail 'current symlink가 없습니다.'
active=$(physical_directory "$base/current")
${remoteHealthScript}
${remoteFilesystemScript}
current=$(basename -- "$active")
safe_release_directory "$current" && test "$active" = "$releases/$current" || fail 'current가 정상 릴리스 경로를 가리키지 않습니다.'
state="$base/.deploy-state"
if test -e "$state" || test -L "$state"; then
  test -d "$state" && test ! -L "$state" && test "$(physical_directory "$state")" = "$state" || fail '배포 상태 경로가 올바르지 않습니다.'
fi
`;

const readinessScript = `${remoteServerPreamble}
for program in bash tar sha256sum awk find stat mv grep sed cmp cut mktemp curl docker; do
  command -v "$program" >/dev/null || fail "서버 명령이 없습니다: $program"
done
server_ready || fail '서버 배포 사전 검사에 실패했습니다.'
printf 'OWP_SERVER_READY\\n'
`;

export async function runRemoteOperation(config, script, action, values, { interactive, run }) {
  validateServerConfig(config);
  const command = ['bash', '-c', script, '--', action, config.remoteRoot, config.url, config.container, ...values].map(shellQuote).join(' ');
  return run('ssh', ['-p', String(config.sshPort), ...authenticationOptions(config, { interactive }), `${config.user}@${config.host}`, command], { capture: true });
}

export async function checkServerReady(config, { interactive, run }) {
  const stdout = await runRemoteOperation(config, readinessScript, 'preflight', [], { interactive, run });
  if (!stdout.split(/\r?\n/).includes('OWP_SERVER_READY')) throw new Error('서버 사전 검사 완료 응답이 없습니다.');
}
