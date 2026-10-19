export const remoteCleanupFunctions = String.raw`
cleanup_releases() {
  mode=$1
  allowed='*'
  if test "$#" -ge 2; then allowed=$2; fi
  test -d "$state/healthy" && test ! -L "$state/healthy" || return 0
  test -d "$state/protected" && test ! -L "$state/protected" || return 1
  retained_previous=''
  if test -e "$state/previous" || test -L "$state/previous"; then
    test -f "$state/previous" && test ! -L "$state/previous" || return 1
    retained_previous=$(cat "$state/previous")
    valid_release "$retained_previous" || return 1
  fi
  live=$(physical_directory "$base/current") || return 1
  names=''
  for receipt in "$state/healthy/"*.sha256; do
    test -f "$receipt" && test ! -L "$receipt" || continue
    candidate=$(basename -- "$receipt" .sha256)
    [[ "$candidate" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{7,40}$ ]] || continue
    safe_release_directory "$candidate" || continue
    names=$(printf '%s\n%s' "$names" "$candidate")
  done
  count=0
  while IFS= read -r candidate; do
    test -n "$candidate" || continue
    count=$((count + 1))
    test "$count" -gt 5 || continue
    if test "$allowed" != '*'; then case ",$allowed," in *",$candidate,"*) ;; *) continue ;; esac; fi
    target="$releases/$candidate"
    if test "$target" = "$live" || test "$candidate" = "$retained_previous" || test -e "$state/protected/$candidate" || test -L "$state/protected/$candidate"; then continue; fi
    safe_release_directory "$candidate" || return 1
    test "$(physical_directory "$base/current")" = "$live" || return 1
    printf 'OWP_CLEANUP_CANDIDATE %s\n' "$candidate"
    if test "$mode" = apply; then
      rm -rf -- "$target" || return 1
      rm -f -- "$state/healthy/$candidate.sha256" || return 1
      printf 'OWP_RELEASE_REMOVED %s\n' "$candidate"
    fi
  done < <(printf '%s\n' "$names" | sort -ru)
}
`;

export const remoteCleanupScript = String.raw`
owner=$5
mode=$6
allowed=$7
[[ "$owner" =~ ^[0-9a-f]{32}$ && ( "$mode" = apply || "$mode" = dry-run ) ]] || fail '릴리스 정리 요청이 올바르지 않습니다.'
lock="$base/.deploy-lock"
lock_owned=0
cleanup_lock() {
  status=$?
  trap - EXIT HUP INT TERM
  set +e
  if test "$lock_owned" -eq 1 && test -f "$lock/owner" && test ! -L "$lock/owner" && test "$(cat "$lock/owner")" = "$owner"; then
    rm -f -- "$lock/owner"
    rmdir -- "$lock" || printf '%s\n' '배포 잠금에 다른 항목이 있어 보존했습니다.' >&2
  fi
  exit "$status"
}
mkdir -m 700 -- "$lock" || fail '다른 배포가 진행 중이거나 배포 잠금이 남아 있습니다.'
lock_owned=1
trap cleanup_lock EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
umask 077
printf '%s\n' "$owner" > "$lock/owner"
test "$(physical_directory "$base/current")" = "$active" || fail '정리 준비 중 current가 변경됐습니다.'
cleanup_releases "$mode" "$allowed" || fail '안전한 릴리스 정리를 완료하지 못했습니다.'
printf 'OWP_CLEANUP_OK %s\n' "$mode"
`;
