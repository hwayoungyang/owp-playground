export const remoteRollbackScript = String.raw`
owner=$5
expected_current=$6
release=$7
[[ "$owner" =~ ^[0-9a-f]{32}$ ]] && valid_release "$expected_current" && valid_release "$release" || fail 'rollback 요청이 올바르지 않습니다.'
test "$current" = "$expected_current" && test "$current" != "$release" || fail '승인 후 current가 변경됐거나 같은 릴리스입니다.'
safe_release_directory "$release" || fail 'rollback 대상 경로가 올바르지 않습니다.'
test -d "$state/healthy" && test ! -L "$state/healthy" || fail '이전 정상 릴리스 기록이 없습니다.'
test -f "$state/healthy/$release.sha256" && test ! -L "$state/healthy/$release.sha256" || fail '검증된 rollback 대상이 없습니다.'
test -f "$state/previous" && test ! -L "$state/previous" && test "$(cat "$state/previous")" = "$release" || fail '승인 후 이전 릴리스가 변경됐습니다.'
lock="$base/.deploy-lock"
temporary_link="$base/.rollback-$owner"
current_link=$(readlink "$base/current")
previous="$current"
destination="$releases/$release"
work=''
transaction_started=0
transaction_committed=0
lock_owned=0
link_owned=0
cleanup_rollback() {
  status=$?
  trap - EXIT HUP INT TERM
  set +e
  rollback_transaction || { status=1; printf '%s\n' 'rollback 복구 검증에 실패했습니다. 추가 변경 없이 중단합니다.' >&2; }
  if test "$link_owned" -eq 1 && test -L "$temporary_link" && test "$(readlink "$temporary_link")" = "releases/$release"; then rm -f -- "$temporary_link"; fi
  if test -n "$work" && test -d "$work" && test ! -L "$work"; then rm -rf -- "$work"; fi
  if test "$lock_owned" -eq 1 && test -f "$lock/owner" && test ! -L "$lock/owner" && test "$(cat "$lock/owner")" = "$owner"; then
    rm -f -- "$lock/owner"
    rmdir -- "$lock" || printf '%s\n' '배포 잠금에 다른 항목이 있어 보존했습니다.' >&2
  fi
  exit "$status"
}
mkdir -m 700 -- "$lock" || fail '다른 배포가 진행 중이거나 배포 잠금이 남아 있습니다.'
lock_owned=1
trap cleanup_rollback EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
umask 077
printf '%s\n' "$owner" > "$lock/owner"
test "$(readlink "$base/current")" = "$current_link" && test "$(physical_directory "$base/current")" = "$active" || fail 'rollback 준비 중 current가 변경됐습니다.'
test -f "$state/previous" && test ! -L "$state/previous" && test "$(cat "$state/previous")" = "$release" || fail 'rollback 준비 중 이전 릴리스가 변경됐습니다.'
server_ready || fail '서버 배포 사전 검사에 실패했습니다.'
work=$(mktemp -d "$state/.rollback.XXXXXX")
if ! snapshot_release "$active" "$work/previous.sha256"; then
  printf '%s\n' '현재 릴리스가 손상되어 기존 정상 릴리스로 복구합니다. 되돌리기 시 현재 릴리스의 정상 응답은 보장할 수 없습니다.' >&2
  : > "$work/previous.sha256"
fi
snapshot_release "$destination" "$work/target.sha256" || fail 'rollback 대상이 손상됐습니다.'
cmp -s "$work/target.sha256" "$state/healthy/$release.sha256" || fail 'rollback 대상이 마지막 검증 이후 변경됐습니다.'
test "$(device_id "$base")" = "$(device_id "$releases")" || fail 'rollback 경로가 같은 파일시스템에 있지 않습니다.'
test ! -e "$temporary_link" && test ! -L "$temporary_link" || fail 'rollback 임시 경로가 이미 있습니다.'
transaction_started=1
ln -s -- "releases/$release" "$temporary_link"
link_owned=1
test "$(physical_directory "$base/current")" = "$active" || fail 'rollback 직전에 current가 변경됐습니다.'
replace_link "$temporary_link" "$base/current"
health_release "$destination" "$work/target.sha256" || fail 'rollback 대상 HTTP 검증에 실패했습니다.'
save_previous "$previous"
transaction_committed=1
printf 'OWP_ROLLBACK_OK %s %s\n' "$release" "$previous"
`;
