import { remoteContentValidationScript } from './deploy-content-validation.mjs';

export const remoteStagingScript = String.raw`
checklist_sha256=$7
expected_files=$8
metadata_sha256=$9
[[ "$checklist_sha256" =~ ^[0-9a-f]{64}$ && "$metadata_sha256" =~ ^[0-9a-f]{64}$ ]] || fail 'staging 검증 해시가 올바르지 않습니다.'
[[ "$expected_files" =~ ^[1-9][0-9]*$ ]] && test "$expected_files" -ge 6 || fail 'staging 파일 수가 올바르지 않습니다.'
require_owner
test ! -e "$incoming/content" && test ! -L "$incoming/content" || fail '이미 staging된 릴리스입니다.'
test ! -e "$incoming/.stage-verified" && test ! -L "$incoming/.stage-verified" || fail 'staging 검증 기록이 이미 있습니다.'
test ! -e "$releases/$release" && test ! -L "$releases/$release" || fail '같은 릴리스가 이미 있습니다.'
current_link=$(readlink "$base/current")
lock="$base/.deploy-lock"
extract="$incoming/.extract"
names=''
types=''
lock_owned=0
extract_owned=0
content_owned=0
receipt_owned=0
stage_success=0

remove_stage_directory() {
  target=$1
  live=$(physical_directory "$base/current" 2>/dev/null) || {
    printf '%s\n' 'current를 확인할 수 없어 staging 임시 경로를 보존했습니다.' >&2
    return
  }
  case "$live" in "$target"|"$target"/*)
    printf '%s\n' 'current가 참조하는 staging 경로를 보존했습니다.' >&2; return ;;
  esac
  test -d "$target" && test ! -L "$target" || return 0
  test "$(physical_directory "$target")" = "$target" || return 0
  rm -rf -- "$target"
}

cleanup_stage() {
  status=$?
  trap - EXIT HUP INT TERM
  set +e
  if test "$stage_success" -eq 0; then
    if test "$extract_owned" -eq 1; then remove_stage_directory "$extract"; fi
    if test "$content_owned" -eq 1; then remove_stage_directory "$incoming/content"; fi
    if test "$receipt_owned" -eq 1; then rm -f -- "$incoming/.stage-verified"; fi
  fi
  if test -n "$names"; then rm -f -- "$names"; fi
  if test -n "$types"; then rm -f -- "$types"; fi
  if test "$lock_owned" -eq 1 && test -d "$lock" && test ! -L "$lock"; then
    if test -f "$lock/owner" && test ! -L "$lock/owner" && test "$(cat "$lock/owner")" = "$owner"; then
      rm -f -- "$lock/owner"
      rmdir -- "$lock" || printf '%s\n' '배포 잠금에 다른 항목이 있어 보존했습니다.' >&2
    else
      rmdir -- "$lock" 2>/dev/null || printf '%s\n' '배포 잠금 소유자를 확인할 수 없어 보존했습니다.' >&2
    fi
  fi
  exit "$status"
}

if ! mkdir -m 700 -- "$lock"; then fail '다른 배포가 진행 중이거나 배포 잠금이 남아 있습니다.'; fi
lock_owned=1
trap cleanup_stage EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$owner" > "$lock/owner"
test -f "$archive" && test ! -L "$archive" || fail '검증할 artifact가 없습니다.'
test -f "$incoming/artifact.sha256" && test ! -L "$incoming/artifact.sha256" || fail '업로드 검증 기록이 없습니다.'
test "$(cat "$incoming/artifact.sha256")" = "$expected_sha256  artifact.tar.gz" || fail '업로드 검증 기록이 일치하지 않습니다.'
test "$(wc -c < "$archive")" -eq "$expected_bytes" || fail 'artifact 크기가 일치하지 않습니다.'
printf '%s  %s\n' "$expected_sha256" "$archive" | sha256sum -c -

export LC_ALL=C
unset TAR_OPTIONS
names=$(mktemp "$incoming/.stage-paths.XXXXXX")
types=$(mktemp "$incoming/.stage-types.XXXXXX")
tar -tzf "$archive" > "$names"
tar -tvzf "$archive" > "$types"
awk '
  {
    if ($0 == "." || $0 == "./") { if (root++) exit 1; next }
    name=$0
    sub(/^\.\//, "", name)
    sub(/\/$/, "", name)
    if (name == "" || name !~ /^[A-Za-z0-9_.\/@+-]+$/ || name ~ /^\// || name ~ /\/\// || name ~ /(^|\/)\.\.?($|\/)/) exit 1
    if (seen[name]++) exit 1
  }
  END { if (NR == 0) exit 1 }
' "$names" || fail 'archive에 경로 이탈·중복·지원하지 않는 경로가 있습니다.'
awk 'substr($0,1,1) !~ /^[-d]$/ { exit 1 } END { if (NR == 0) exit 1 }' "$types" || fail 'archive에 링크 또는 특수 파일이 있습니다.'
test ! -e "$extract" && test ! -L "$extract" || fail 'staging 임시 경로가 이미 있습니다.'
mkdir -m 700 -- "$extract"
extract_owned=1
umask 022
tar --no-same-owner --no-same-permissions -xzkf "$archive" -C "$extract"
validation_directory="$extract"
${remoteContentValidationScript}
find "$extract" -type d -exec chmod 755 {} +
find "$extract" -type f -exec chmod 644 {} +
test "$(readlink "$base/current")" = "$current_link" && test "$(physical_directory "$base/current")" = "$active" || fail 'staging 중 current가 변경됐습니다.'
mv -- "$extract" "$incoming/content"
extract_owned=0
content_owned=1
(set -C; printf '{"release":"%s","artifactSha256":"%s","files":%s}\n' "$release" "$expected_sha256" "$expected_files" > "$incoming/.stage-verified")
receipt_owned=1
stage_success=1
printf 'OWP_RELEASE_STAGED %s %s %s\n' "$release" "$expected_sha256" "$expected_files"
`;
