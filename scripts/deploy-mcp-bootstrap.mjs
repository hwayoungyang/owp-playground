import path from 'node:path';
import { authenticationOptions } from './deploy-ssh-options.mjs';
import { shellQuote, validateMcpConfig } from './deploy-mcp-config.mjs';
import { validateMcpOfflineManifest } from './deploy-mcp-offline-format.mjs';

const runtimeNames = ['runtime-node', 'runtime-pnpm'];
const ssh = (config, command, execution) => execution.run('ssh', ['-p', String(config.sshPort), ...authenticationOptions(config, execution), `${config.user}@${config.host}`, command], { capture: true });
const result = (output) => {
  const line = output.trim().split('\n').findLast((item) => item.startsWith('OWP_MCP_RESULT '));
  if (!line) throw new Error('서버가 검증 가능한 런타임 준비 결과를 반환하지 않았습니다.');
  return JSON.parse(line.slice('OWP_MCP_RESULT '.length));
};

export function mcpRuntimeForPlan(plan) {
  const config = validateMcpConfig(plan.config);
  const manifest = validateMcpOfflineManifest(plan.offline, { head: plan.metadata.head, releaseId: plan.metadata.releaseId, sourceSha256: plan.metadata.files['app.tar.gz'].sha256 });
  const nodeSha256 = manifest.files['runtime-node'].sha256;
  const pnpmSha256 = manifest.files['runtime-pnpm'].sha256;
  const directory = `${config.remoteRoot}/runtime/node24.22.1-pnpm12.15.0-${nodeSha256}-${pnpmSha256}`;
  return { directory, node: `${directory}/bin/node`, packageManager: { command: `${directory}/bin/pnpm`, prefix: [], version: '12.15.0' }, nodeSha256, pnpmSha256 };
}

function shellContext(plan) {
  const config = validateMcpConfig(plan.config);
  if (!/^[0-9a-f-]{36}$/.test(plan.owner)) throw new Error('배포 owner가 올바르지 않습니다.');
  const runtime = mcpRuntimeForPlan(plan);
  const receipt = `OWP-MCP-RUNTIME v1\nnode 24.22.1 ${runtime.nodeSha256}\npnpm 12.15.0 ${runtime.pnpmSha256}`;
  return { config, runtime, receipt };
}

export function renderMcpBootstrapScript(plan, phase = 'probe') {
  if (!['probe', 'incoming', 'install', 'discard'].includes(phase)) throw new Error('지원하지 않는 런타임 준비 단계입니다.');
  const { config, runtime, receipt } = shellContext(plan);
  const pending = JSON.stringify({ runtimePending: true });
  const ready = JSON.stringify({ runtimePending: false, runtime });
  const script = `set -eu
umask 077
root=${shellQuote(config.remoteRoot)}
runtime=${shellQuote(runtime.directory)}
owner=${shellQuote(plan.owner)}
incoming="$root/.incoming-$owner"
lock="$root/.deploy.lock"
stage="$root/runtime/.stage-$owner"
selinux_mode=Disabled
fail() { printf '%s\\n' "$1" >&2; exit 1; }
real_ancestors() {
  here=''
  oldifs=$IFS; IFS='/'; set -f; set -- $1; IFS=$oldifs; set +f
  for part do
    [ -n "$part" ] || continue
    here="$here/$part"
    [ ! -L "$here" ] || fail "symlink 경로를 거부했습니다: $here"
    if [ -e "$here" ]; then [ -d "$here" ] || fail "실제 디렉터리가 필요합니다: $here"; fi
  done
}
owned() { [ -d "$1" ] && [ ! -L "$1" ] && [ -f "$1/owner" ] && [ ! -L "$1/owner" ] && [ "$(cat "$1/owner")" = "$owner" ]; }
create_owned() {
  mkdir -- "$1"
  if (set -C; exec 3> "$1/owner" || exit 72; printf '%s' "$owner" >&3 || exit 73); then return 0;
  else owner_status=$?; fi
  if [ "$owner_status" -eq 73 ] && [ -f "$1/owner" ] && [ ! -L "$1/owner" ]; then rm -- "$1/owner"; fi
  rmdir -- "$1" || fail 'owner 기록 중 알 수 없는 파일이 생겨 해당 디렉터리를 보존합니다.'
  fail '배포 디렉터리 owner를 기록하지 못했습니다.'
}
check_selinux() {
  if command -v getenforce >/dev/null 2>&1; then selinux_mode=$(getenforce) || fail 'SELinux 상태를 확인하지 못했습니다.'; fi
  case "$selinux_mode" in
    Disabled) return 0 ;;
    Enforcing|Permissive) ;;
    *) fail 'SELinux 상태가 올바르지 않습니다.' ;;
  esac
  for command in restorecon matchpathcon; do command -v "$command" >/dev/null 2>&1 || fail "SELinux 기본 정책 확인에 필요한 명령이 없습니다: $command"; done
  for file in "$runtime/bin/node" "$runtime/bin/pnpm" "$stage/bin/node" "$stage/bin/pnpm"; do
    expected=$(matchpathcon -n -- "$file") || fail "SELinux 기본 컨텍스트를 확인하지 못했습니다: $file"
    case "$expected" in *:object_r:bin_t:*) ;; *) fail "SELinux 기본 정책의 실행 파일 type이 bin_t가 아닙니다: $file ($expected)" ;; esac
  done
}
restore_context() {
  [ "$selinux_mode" != Disabled ] || return 0
  restorecon -RF -- "$1" || fail "SELinux 기본 컨텍스트를 적용하지 못했습니다: $1"
}
restore_owned_context() {
  owned "$1" || fail "소유자가 달라 SELinux 컨텍스트를 변경하지 않습니다: $1"
  restore_context "$1"
}
create_parent() {
  [ ! -d "$1" ] || return 0
  mkdir -p -- "$1"
  if [ "$selinux_mode" != Disabled ]; then restorecon -F -- "$1" || fail "새 배포 디렉터리의 SELinux 기본 컨텍스트를 적용하지 못했습니다: $1"; fi
}
only_owner() {
  for entry in "$1"/* "$1"/.[!.]* "$1"/..?*; do
    if [ -e "$entry" ] || [ -L "$entry" ]; then [ "$entry" = "$1/owner" ] || return 1; fi
  done
}
cleanup() {
  if [ -e "$lock" ] || [ -L "$lock" ]; then owned "$lock" || return 1; only_owner "$lock" || return 1; fi
  if [ -e "$incoming" ] || [ -L "$incoming" ]; then
    owned "$incoming" || return 1
    if [ -e "$incoming/transaction.json" ] || [ -L "$incoming/transaction.json" ]; then return 1; fi
  fi
  if [ -e "$stage" ] || [ -L "$stage" ]; then owned "$stage" || return 1; fi
  if owned "$stage"; then rm -rf -- "$stage"; fi
  if owned "$incoming"; then
    if [ -e "$incoming/transaction.json" ] || [ -L "$incoming/transaction.json" ]; then return 1; fi
    rm -rf -- "$incoming"
  elif [ -e "$incoming" ] || [ -L "$incoming" ]; then return 1; fi
  if owned "$lock"; then only_owner "$lock" || return 1; rm -- "$lock/owner"; rmdir -- "$lock";
  elif [ -e "$lock" ] || [ -L "$lock" ]; then return 1; fi
}
check_runtime() {
  real_ancestors "$runtime/bin"
  [ -d "$runtime/bin" ] || fail '런타임 bin 디렉터리가 없습니다.'
  for name in bin/node bin/pnpm receipt owner; do [ -f "$runtime/$name" ] && [ ! -L "$runtime/$name" ] || fail "런타임 파일이 올바르지 않습니다: $runtime/$name"; done
  for entry in "$runtime"/* "$runtime"/.[!.]* "$runtime"/..?*; do
    if [ -e "$entry" ] || [ -L "$entry" ]; then
      case "$entry" in "$runtime/bin"|"$runtime/receipt"|"$runtime/owner") ;; *) fail "알 수 없는 런타임 파일을 보존합니다: $entry" ;; esac
    fi
  done
  for entry in "$runtime/bin"/* "$runtime/bin"/.[!.]* "$runtime/bin"/..?*; do
    if [ -e "$entry" ] || [ -L "$entry" ]; then
      case "$entry" in "$runtime/bin/node"|"$runtime/bin/pnpm") ;; *) fail "알 수 없는 런타임 파일을 보존합니다: $entry" ;; esac
    fi
  done
  [ "$(cat "$runtime/receipt")" = ${shellQuote(receipt)} ] || fail '런타임 receipt가 다릅니다.'
  printf '%s\\n' ${shellQuote(`${runtime.nodeSha256}  ${runtime.node}\n${runtime.pnpmSha256}  ${runtime.packageManager.command}`)} | sha256sum -c - >/dev/null
  [ -x "$runtime/bin/node" ] && [ -x "$runtime/bin/pnpm" ] || fail '런타임 실행 권한이 없습니다.'
  if [ "$1" = install ]; then restore_context "$runtime"; fi
  cd /
  [ "$("$runtime/bin/node" --version)" = 'v24.22.1' ] || fail 'Node 24.22.1이 필요합니다.'
  [ "$(env PATH="$runtime/bin:/usr/sbin:/usr/bin:/sbin:/bin" COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_PROJECT_SPEC=0 npm_config_manage_package_manager_versions=false "$runtime/bin/pnpm" --version)" = '12.15.0' ] || fail 'pnpm 12.15.0이 필요합니다.'
}
[ "$(id -u)" -eq 0 ] || fail 'root SSH가 필요합니다.'
for command in sh uname getconf sha256sum mkdir chmod mv rm rmdir cat wc env systemctl ss; do command -v "$command" >/dev/null 2>&1 || fail "서버 기본 명령이 필요합니다: $command"; done
`;
  if (phase === 'discard') return `${script}
real_ancestors "$root"
cleanup || fail '다른 소유자 또는 알 수 없는 파일이 있어 수신 자료와 잠금을 보존합니다.'
`;
  const checks = `${script}
[ "$(uname -s)" = 'Linux' ] && [ "$(uname -m)" = 'x86_64' ] || fail 'Linux x86_64 서버가 필요합니다.'
case "$(getconf GNU_LIBC_VERSION)" in 'glibc '*) ;; *) fail 'glibc 서버가 필요합니다.' ;; esac
for directory in "$root" ${shellQuote(config.unitDirectory)} "$root/apps" "$root/archive/versions" "$root/runtime" "$runtime"; do real_ancestors "$directory"; done
if [ -e "$lock" ] || [ -L "$lock" ]; then ${phase === 'install' ? 'owned "$lock"' : 'false'} || fail '다른 배포가 진행 중이거나 잠금이 남아 있습니다.'; fi
check_selinux
`;
  if (phase === 'probe') return `${checks}
if [ -d "$runtime" ]; then check_runtime probe; printf '%s\\n' ${shellQuote(`OWP_MCP_RESULT ${ready}`)};
else printf '%s\\n' ${shellQuote(`OWP_MCP_RESULT ${pending}`)}; fi
`;
  if (phase === 'incoming') return `${checks}
create_parent "$root"
create_owned "$lock"
create_owned "$incoming"
restore_owned_context "$lock"
restore_owned_context "$incoming"
`;
  const integrity = runtimeNames.map((name) => {
    const entry = plan.offline.files[name];
    return `[ -f "$incoming/${name}" ] && [ ! -L "$incoming/${name}" ] || fail '수신 런타임 파일이 올바르지 않습니다.'\n[ "$(wc -c < "$incoming/${name}")" -eq ${entry.bytes} ] || fail '수신 런타임 크기가 다릅니다.'\nprintf '%s\\n' ${shellQuote(`${entry.sha256}  ${config.remoteRoot}/.incoming-${plan.owner}/${name}`)} | sha256sum -c - >/dev/null`;
  }).join('\n');
  return `${checks}
owned "$incoming" || fail '수신 디렉터리 소유자가 다릅니다.'
${integrity}
if [ -d "$runtime" ]; then check_runtime install;
else
  create_parent "$root/runtime"
  create_owned "$stage"
  mkdir -- "$stage/bin"
  cat "$incoming/runtime-node" > "$stage/bin/node"
  cat "$incoming/runtime-pnpm" > "$stage/bin/pnpm"
  chmod 755 "$stage/bin/node" "$stage/bin/pnpm"
  printf '%s\\n' ${shellQuote(receipt)} > "$stage/receipt"
  restore_owned_context "$stage"
  cd /
  [ "$("$stage/bin/node" --version)" = 'v24.22.1' ] || fail 'Node 24.22.1 실행 검증에 실패했습니다.'
  [ "$(env PATH="$stage/bin:/usr/sbin:/usr/bin:/sbin:/bin" COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_PROJECT_SPEC=0 npm_config_manage_package_manager_versions=false "$stage/bin/pnpm" --version)" = '12.15.0' ] || fail 'pnpm 12.15.0 실행 검증에 실패했습니다.'
  mv -Tn -- "$stage" "$runtime"
  [ ! -d "$stage" ] || fail '런타임 경로 충돌로 기존 자료를 보존합니다.'
  check_runtime verify
fi
printf '%s\\n' ${shellQuote(`OWP_MCP_RESULT ${ready}`)}
`;
}

export async function probeMcpRemote(plan, execution) {
  return result(await ssh(plan.config, renderMcpBootstrapScript(plan), execution));
}

export async function discardMcpBootstrap(plan, execution) {
  await ssh(plan.config, renderMcpBootstrapScript(plan, 'discard'), execution);
}

export async function bootstrapMcpRemote(plan, bundle, execution) {
  let incomingAttempted = false;
  try {
    await probeMcpRemote(plan, execution);
    incomingAttempted = true;
    await ssh(plan.config, renderMcpBootstrapScript(plan, 'incoming'), execution);
    await execution.run('scp', ['-P', String(plan.config.sshPort), ...authenticationOptions(plan.config, execution), ...runtimeNames.map((name) => path.join(bundle.directory, name)), `${plan.config.user}@${plan.config.host}:${plan.config.remoteRoot}/.incoming-${plan.owner}/`]);
    const installed = result(await ssh(plan.config, renderMcpBootstrapScript(plan, 'install'), execution));
    plan.runtime = installed.runtime;
    return installed;
  } catch (error) {
    if (incomingAttempted) {
      try { await discardMcpBootstrap(plan, execution); }
      catch (cleanupError) { throw new Error(`${error.message} 런타임 준비 자료와 잠금 정리를 완료하지 못했습니다: ${cleanupError.message}`, { cause: error }); }
    }
    throw error;
  }
}
