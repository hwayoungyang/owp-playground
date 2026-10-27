export const remoteHealthScript = String.raw`
valid_release() { [[ "$1" = initial || "$1" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{7,40}$ ]]; }
safe_release_directory() {
  valid_release "$1" && test -d "$releases/$1" && test ! -L "$releases/$1" && test "$(physical_directory "$releases/$1")" = "$releases/$1"
}
server_ready() {
  command -v curl >/dev/null && command -v docker >/dev/null || { printf '%s\n' '서버에 기존 curl과 Docker CLI가 필요합니다.' >&2; return 1; }
  test "$(docker inspect --format '{{.State.Running}}' "$container")" = true || { printf '%s\n' 'Nginx 컨테이너가 실행 중이 아닙니다.' >&2; return 1; }
  docker inspect --format '{{range .Mounts}}{{println .Source}}{{end}}' "$container" | awk -v base="$base" '$0 == base { found=1 } END { exit !found }' || {
    printf '%s\n' 'current와 releases가 함께 보이도록 배포 기준 디렉터리 전체의 bind mount가 필요합니다. 서버 설정은 자동 변경하지 않습니다.' >&2; return 1;
  }
}
initialize_state() {
  state="$base/.deploy-state"
  for directory in "$state" "$state/healthy" "$state/protected" "$state/history"; do
    if test ! -e "$directory" && test ! -L "$directory"; then mkdir -m 700 -- "$directory" || return 1; fi
    test -d "$directory" && test ! -L "$directory" && test "$(physical_directory "$directory")" = "$directory" || return 1
  done
}
snapshot_release() {
  directory=$1
  snapshot=$2
  test -d "$directory" && test ! -L "$directory" || return 1
  test -z "$(find "$directory" ! -type d ! -type f -print)" || return 1
  if test "$(basename -- "$directory")" != initial; then
    test -s "$directory/deploy-files.sha256" && test ! -L "$directory/deploy-files.sha256" || return 1
    awk '
      NF != 2 || length($1) != 64 || $1 ~ /[^0-9a-f]/ || substr($0,65,2) != "  " { exit 1 }
      $2 !~ /^[A-Za-z0-9_.\/@+-]+$/ || $2 ~ /^\// || $2 ~ /\/\// || $2 ~ /(^|\/)\.\.?($|\/)/ || seen[$2]++ { exit 1 }
      END { if (NR == 0) exit 1 }
    ' "$directory/deploy-files.sha256" || return 1
    (cd -- "$directory" && sha256sum -c deploy-files.sha256 >/dev/null) || return 1
    test "$(find "$directory" -type f | wc -l)" -eq "$(( $(wc -l < "$directory/deploy-files.sha256") + 1 ))" || return 1
    cat "$directory/deploy-files.sha256" > "$snapshot" || return 1
    (cd -- "$directory" && sha256sum deploy-files.sha256) >> "$snapshot" || return 1
  else
    (cd -- "$directory" && sha256sum index.html robots.txt) > "$snapshot" || return 1
  fi
}
http_get() {
  status=$(curl -q --silent --show-error --noproxy '*' --proto '=http' --connect-timeout 5 --max-time 8 --max-filesize 67108864 --header 'Cache-Control: no-cache' --output "$work/response" --write-out '%{http_code}' "$service_url$1?owp-deploy=$owner") || return 1
  test "$status" = 200 || { printf 'HTTP %s: %s\n' "$status" "$1" >&2; return 1; }
}
http_match() {
  http_get "$1" || return 1
  test "$(sha256sum "$work/response" | cut -d ' ' -f 1)" = "$(sha256sum "$2" | cut -d ' ' -f 1)" || { printf 'HTTP 파일 내용 불일치: %s\n' "$1" >&2; return 1; }
}
health_release() {
  directory=$1
  snapshot=$2
  test "$(docker inspect --format '{{.State.Running}}' "$container")" = true || return 1
  test -z "$(find "$directory" ! -type d ! -type f -print)" || return 1
  (cd -- "$directory" && sha256sum -c "$snapshot" >/dev/null) || return 1
  http_get /health && test "$(cat "$work/response")" = ok || return 1
  http_match / "$directory/index.html" || return 1
  http_match /robots.txt "$directory/robots.txt" || return 1
  http_match /__owp_deploy_check__ "$directory/index.html" || return 1
  if test "$(basename -- "$directory")" != initial; then
    http_match /release.json "$directory/release.json" || return 1
    http_match /deploy-manifest.json "$directory/deploy-manifest.json" || return 1
    if test -f "$directory/versions/index.json"; then
      version_files=$(awk '
        $2 == "versions/index.json" { print $2; next }
        $2 ~ /^versions\// {
          split($2, parts, "/"); category=parts[3]
          if (category ~ /^(index.html|packages.json|knowledge-release.json)$/ || $2 ~ /\/knowledge\/index.json$/) print $2
          else if (category ~ /^(api|catalogs|snippets)$/ && !seen[parts[2] "/" category]++) print $2
          else if (category == "assets" && $2 ~ /\.(js|css)$/) {
            extension=$2; sub(/^.*\./, "", extension)
            if (!seen[parts[2] "/assets/" extension]++) print $2
          }
        }
      ' "$snapshot")
      test -n "$version_files" || return 1
      for version_file in $version_files; do
        http_match "/$version_file" "$directory/$version_file" || return 1
      done
    fi
    assets=$(awk '$2 ~ /^assets\/.*\.(js|css)$/ { print $2 }' "$snapshot" | awk '/\.js$/ && !js++ { print } /\.css$/ && !css++ { print }')
    test "$(printf '%s\n' "$assets" | wc -l)" -eq 2 || return 1
    references=$(grep -oE '(src|href)="[^"]+"' "$directory/index.html" | cut -d '"' -f 2 | sed -E 's@^/@@; s@^\./@@' | sort -u) || return 1
    for asset in $assets $references; do
      case "$asset" in http:*|https:*|data:*|'#'*) continue ;; esac
      [[ "$asset" =~ ^[A-Za-z0-9_./@+-]+$ && "$asset" != /* && "$asset" != *..* ]] || return 1
      test -s "$directory/$asset" && test ! -L "$directory/$asset" || return 1
      http_match "/$asset" "$directory/$asset" || return 1
    done
  fi
}
save_healthy() {
  name=$1
  snapshot=$2
  test ! -L "$state/healthy/$name.sha256" && { test ! -e "$state/healthy/$name.sha256" || test -f "$state/healthy/$name.sha256"; } || return 1
  temporary=$(mktemp "$state/healthy/.receipt.XXXXXX") || return 1
  cat "$snapshot" > "$temporary" && chmod 600 "$temporary" && replace_link "$temporary" "$state/healthy/$name.sha256"
}
save_previous() {
  test ! -L "$state/previous" && { test ! -e "$state/previous" || test -f "$state/previous"; } || return 1
  temporary=$(mktemp "$state/.previous.XXXXXX") || return 1
  printf '%s\n' "$1" > "$temporary" && chmod 600 "$temporary" && replace_link "$temporary" "$state/previous"
}
rollback_transaction() {
  test "$transaction_started" -eq 1 && test "$transaction_committed" -eq 0 || return 0
  live=$(physical_directory "$base/current" 2>/dev/null) || { printf '%s\n' 'current 상태가 불명확하여 자동 복구를 중단했습니다.' >&2; return 1; }
  if test "$live" = "$destination"; then
    safe_release_directory "$previous" || return 1
    test ! -e "$temporary_link" && test ! -L "$temporary_link" || return 1
    ln -s -- "$current_link" "$temporary_link" && replace_link "$temporary_link" "$base/current" || return 1
  elif test "$live" != "$active"; then
    printf '%s\n' '다른 실행이 current를 변경하여 자동 복구를 중단했습니다.' >&2; return 1
  fi
  test "$(physical_directory "$base/current")" = "$active" || return 1
  if health_release "$active" "$work/previous.sha256"; then
    printf 'OWP_AUTO_ROLLBACK_OK %s\n' "$previous" >&2
  else
    printf '%s\n' '이전 current로 복구했지만 HTTP 검증에 실패했습니다. 추가 변경 없이 중단합니다.' >&2
    return 1
  fi
}
`;
