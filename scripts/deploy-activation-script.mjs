import { remoteContentValidationScript } from './deploy-content-validation.mjs';
import { remoteHealthScript } from './deploy-health-script.mjs';
import { remoteFilesystemScript } from './deploy-filesystem-script.mjs';
import { remoteCleanupFunctions } from './deploy-cleanup-script.mjs';

export const remoteActivationScript = String.raw`
${remoteHealthScript}
${remoteCleanupFunctions}
transaction_started=0
transaction_committed=0
work=''
checklist_sha256=$7
expected_files=$8
metadata_sha256=$9
[[ "$checklist_sha256" =~ ^[0-9a-f]{64}$ && "$metadata_sha256" =~ ^[0-9a-f]{64}$ ]] || fail '전환 검증 해시가 올바르지 않습니다.'
[[ "$expected_files" =~ ^[1-9][0-9]*$ ]] && test "$expected_files" -ge 6 || fail '전환 파일 수가 올바르지 않습니다.'
require_owner
content="$incoming/content"
destination="$releases/$release"
temporary_link="$base/.current-$release-$owner"
record="$incoming/.activation.json"
current_link=$(readlink "$base/current")
previous=$(basename -- "$active")
[[ "$previous" = initial || "$previous" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{7,40}$ ]] || fail 'current가 정상 릴리스 디렉터리를 가리키지 않습니다.'
test "$current_link" = "releases/$previous" || test "$current_link" = "$releases/$previous" || fail 'current 대상 경로가 올바르지 않습니다.'
test "$previous" != "$release" || fail '이미 current가 가리키는 릴리스입니다.'

${remoteFilesystemScript}

lock="$base/.deploy-lock"
lock_owned=0
link_owned=0
cleanup_activation() {
  status=$?
  trap - EXIT HUP INT TERM
  set +e
  if test "$action" = deploy; then
    rollback_transaction || { status=1; printf '%s\n' '자동 복구를 완료하지 못했습니다. current와 배포 기록을 직접 확인해 주세요.' >&2; }
  fi
  if test "$link_owned" -eq 1 && test -L "$temporary_link" && test "$(readlink "$temporary_link")" = "releases/$release"; then
    rm -f -- "$temporary_link"
  fi
  if test "$lock_owned" -eq 1 && test -d "$lock" && test ! -L "$lock"; then
    if test -f "$lock/owner" && test ! -L "$lock/owner" && test "$(cat "$lock/owner")" = "$owner"; then
      rm -f -- "$lock/owner"
      rmdir -- "$lock" || printf '%s\n' '배포 잠금에 다른 항목이 있어 보존했습니다.' >&2
    else
      rmdir -- "$lock" 2>/dev/null || printf '%s\n' '배포 잠금 소유자를 확인할 수 없어 보존했습니다.' >&2
    fi
  fi
  if test -n "$work" && test -d "$work" && test ! -L "$work"; then rm -rf -- "$work"; fi
  if test "$action" = deploy && test "$transaction_committed" -eq 1; then
    if test -d "$incoming" && test ! -L "$incoming" && test -f "$incoming/.upload-owner" && test ! -L "$incoming/.upload-owner" && test "$(cat "$incoming/.upload-owner")" = "$owner"; then
      rm -rf -- "$incoming" || printf '%s\n' '배포는 성공했지만 업로드 임시 경로를 정리하지 못했습니다.' >&2
    fi
  fi
  exit "$status"
}

if ! mkdir -m 700 -- "$lock"; then fail '다른 배포가 진행 중이거나 배포 잠금이 남아 있습니다.'; fi
lock_owned=1
trap cleanup_activation EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
umask 077
printf '%s\n' "$owner" > "$lock/owner"
test "$(readlink "$base/current")" = "$current_link" && test "$(physical_directory "$base/current")" = "$active" || fail '전환 준비 중 current가 변경됐습니다.'
test -f "$incoming/.stage-verified" && test ! -L "$incoming/.stage-verified" || fail 'staging 검증 기록이 없습니다.'
expected_receipt=$(printf '{"release":"%s","artifactSha256":"%s","files":%s}' "$release" "$expected_sha256" "$expected_files")
test "$(cat "$incoming/.stage-verified")" = "$expected_receipt" || fail 'staging 검증 기록이 일치하지 않습니다.'
test -d "$content" && test ! -L "$content" && test "$(physical_directory "$content")" = "$content" || fail 'staging content 디렉터리가 올바르지 않습니다.'
test ! -e "$destination" && test ! -L "$destination" || fail '같은 릴리스가 이미 있습니다.'
test ! -e "$record" && test ! -L "$record" || fail '전환 기록이 이미 있습니다. 서버 상태를 확인해 주세요.'
test ! -e "$temporary_link" && test ! -L "$temporary_link" || fail '전환 임시 symlink 경로가 이미 있습니다.'
test "$(device_id "$content")" = "$(device_id "$releases")" && test "$(device_id "$releases")" = "$(device_id "$base")" || fail '원자적 전환에 필요한 경로가 같은 파일시스템에 있지 않습니다.'

export LC_ALL=C
validation_directory="$content"
${remoteContentValidationScript}
find "$content" -type d -exec chmod 755 {} +
find "$content" -type f -exec chmod 644 {} +
if test "$action" = deploy; then
  shift 9
  service_url=$1
  container=$2
  server_ready || fail '서버 배포 사전 검사에 실패했습니다.'
  initialize_state || fail '배포 상태 디렉터리가 올바르지 않습니다.'
  work=$(mktemp -d "$incoming/.health.XXXXXX")
  snapshot_release "$active" "$work/previous.sha256" || fail '이전 릴리스의 무결성을 확인할 수 없습니다.'
  if test -e "$state/healthy/$previous.sha256"; then
    test ! -L "$state/healthy/$previous.sha256" && cmp -s "$state/healthy/$previous.sha256" "$work/previous.sha256" || fail '이전 정상 릴리스의 파일이 변경됐습니다.'
  fi
  health_release "$active" "$work/previous.sha256" || fail '전환 전 기존 서비스 검증에 실패했습니다.'
  save_healthy "$previous" "$work/previous.sha256"
  snapshot_release "$content" "$work/new.sha256"
  transaction_started=1
fi
(set -C; printf '{"release":"%s","artifactSha256":"%s","previous":"%s","previousTarget":"%s"}\n' "$release" "$expected_sha256" "$previous" "$current_link" > "$record")
promote "$content" "$destination"
test ! -e "$content" && test ! -L "$content" && test -d "$destination" && test ! -L "$destination" || fail '릴리스 디렉터리 이동을 확인할 수 없습니다.'
test "$(physical_directory "$destination")" = "$destination" || fail '릴리스 경로가 올바르지 않습니다.'
ln -s -- "releases/$release" "$temporary_link"
link_owned=1
test "$(readlink "$base/current")" = "$current_link" && test "$(physical_directory "$base/current")" = "$active" || fail '전환 직전에 current가 변경됐습니다.'
replace_link "$temporary_link" "$base/current"
test -L "$base/current" && test "$(readlink "$base/current")" = "releases/$release" && test "$(physical_directory "$base/current")" = "$destination" || fail 'current 전환 결과를 확인할 수 없습니다.'
if test "$action" = deploy; then
  health_release "$destination" "$work/new.sha256" || fail '신규 릴리스의 HTTP 검증에 실패했습니다.'
  save_healthy "$release" "$work/new.sha256"
  test ! -e "$state/history/$release.json" && test ! -L "$state/history/$release.json" || fail '기존 배포 이력과 릴리스 ID가 충돌했습니다.'
  (set -C; cat "$record" > "$state/history/$release.json")
  save_previous "$previous"
  transaction_committed=1
  cleanup_releases apply || printf '%s\n' '배포는 성공했지만 이전 릴리스 정리를 완료하지 못했습니다. deploy:cleanup으로 확인해 주세요.' >&2
  printf 'OWP_DEPLOY_HEALTH_OK %s\n' "$release"
fi
printf 'OWP_CURRENT_SWITCHED %s %s %s %s\n' "$release" "$expected_sha256" "$previous" "$current_link"
`;
