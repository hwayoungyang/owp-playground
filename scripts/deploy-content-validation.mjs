export const remoteContentValidationScript = String.raw`
test -z "$(find "$validation_directory" ! -type f ! -type d -print)" || fail '압축 해제 결과에 링크 또는 특수 파일이 있습니다.'
test "$(find "$validation_directory" -type f | wc -l)" -eq "$expected_files" || fail 'staging 파일 수가 일치하지 않습니다.'
test -s "$validation_directory/deploy-files.sha256" || fail '파일별 SHA-256 목록이 없습니다.'
printf '%s  %s\n' "$checklist_sha256" "$validation_directory/deploy-files.sha256" | sha256sum -c -
printf '%s  %s\n' "$metadata_sha256" "$validation_directory/release.json" | sha256sum -c -
awk -v expected="$((expected_files - 1))" '
  {
    name=$2
    if (NF != 2 || length($1) != 64 || $1 ~ /[^0-9a-f]/ || substr($0,65,2) != "  ") exit 1
    if (name !~ /^[A-Za-z0-9_.\/@+-]+$/ || name ~ /^\// || name ~ /\/\// || name ~ /(^|\/)\.\.?($|\/)/ || name == "deploy-files.sha256") exit 1
    if (seen[name]++) exit 1
  }
  END { if (NR != expected) exit 1 }
' "$validation_directory/deploy-files.sha256" || fail '파일별 SHA-256 목록의 경로·형식·파일 수가 올바르지 않습니다.'
(cd -- "$validation_directory" && sha256sum -c deploy-files.sha256 >/dev/null)
for required in index.html robots.txt packages.json release.json deploy-manifest.json; do
  test -s "$validation_directory/$required" || fail 'staging 필수 파일이 없거나 비어 있습니다.'
done
test -d "$validation_directory/assets" || fail 'staging assets 디렉터리가 없습니다.'
test -n "$(find "$validation_directory/assets" -type f -name '*.js' -size +0c -print)" || fail 'staging JavaScript asset이 없습니다.'
test -n "$(find "$validation_directory/assets" -type f -name '*.css' -size +0c -print)" || fail 'staging CSS asset이 없습니다.'
`;
