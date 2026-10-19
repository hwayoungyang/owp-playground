import { remoteServerPreamble, runRemoteOperation } from './deploy-server.mjs';

const statusScript = `${remoteServerPreamble}
previous=-
if test -e "$state/previous" || test -L "$state/previous"; then
  test -f "$state/previous" && test ! -L "$state/previous" || fail '이전 릴리스 기록이 올바르지 않습니다.'
  candidate=$(cat "$state/previous")
  valid_release "$candidate" || fail '이전 릴리스 ID가 올바르지 않습니다.'
  if test "$candidate" != "$current" && safe_release_directory "$candidate"; then
    test -d "$state/healthy" && test ! -L "$state/healthy" || fail '정상 릴리스 기록 경로가 올바르지 않습니다.'
    if test -f "$state/healthy/$candidate.sha256" && test ! -L "$state/healthy/$candidate.sha256" && test -z "$(find "$releases/$candidate" ! -type f ! -type d -print)"; then
      if (cd -- "$releases/$candidate" && sha256sum -c "$state/healthy/$candidate.sha256" >/dev/null 2>&1); then previous="$candidate"; fi
    fi
  fi
fi
running=$(docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null || printf unknown)
locked=no
if test -e "$base/.deploy-lock" || test -L "$base/.deploy-lock"; then locked=yes; fi
printf 'OWP_STATUS %s %s %s %s\\n' "$current" "$previous" "$running" "$locked"
printf 'OWP_METADATA\\n'
if test "$current" = initial || test "$action" = rollback-plan; then printf 'null\\n'; else
  test -f "$active/release.json" && test ! -L "$active/release.json" && test "$(wc -c < "$active/release.json")" -le 65536 || fail '현재 릴리스 메타데이터가 올바르지 않습니다.'
  cat "$active/release.json"
fi
test "$(physical_directory "$base/current")" = "$active" || fail '조회 중 current가 변경됐습니다. status를 다시 실행해 주세요.'
`;

export const isRelease = (value) => /^(?:initial|\d{8}-\d{6}-[0-9a-f]{7,40})$/.test(value);

export async function checkServedRelease(config, status) {
  if (status.current === 'initial') return;
  const response = await fetch(`${config.url}/release.json?owp-status=${Date.now()}`, {
    redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs), headers: { 'Cache-Control': 'no-cache' },
  });
  if (response.status !== 200) throw new Error(`릴리스 메타데이터 HTTP ${response.status}`);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > 65536) throw new Error('릴리스 메타데이터 응답이 너무 큽니다.');
    chunks.push(Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString('utf8');
  if (JSON.stringify(JSON.parse(body)) !== JSON.stringify(status.metadata)) throw new Error('HTTP가 제공하는 릴리스와 current가 일치하지 않습니다.');
}

export async function readReleaseStatus(config, options) {
  const includeMetadata = options.includeMetadata ?? true;
  const stdout = await runRemoteOperation(config, statusScript, includeMetadata ? 'status' : 'rollback-plan', [], options);
  const headers = stdout.split(/\r?\n/).filter((line) => line.startsWith('OWP_STATUS '));
  const fields = headers[0]?.split(' ') ?? [];
  const [, current, previous, running, locked] = fields;
  const marker = 'OWP_METADATA\n';
  const normalized = stdout.replaceAll('\r\n', '\n');
  const offset = normalized.indexOf(marker);
  if (headers.length !== 1 || fields.length !== 5 || !isRelease(current) || (previous !== '-' && !isRelease(previous))
    || !['true', 'false', 'unknown'].includes(running) || !['yes', 'no'].includes(locked) || offset < 0) {
    throw new Error('서버 status 응답을 확인할 수 없습니다.');
  }
  const metadata = JSON.parse(normalized.slice(offset + marker.length));
  if (includeMetadata && current !== 'initial' && (metadata?.release !== current || !metadata.packages || typeof metadata.packages !== 'object'
    || Array.isArray(metadata.packages) || Object.entries(metadata.packages).some(([name, version]) => !name.startsWith('@owp/') || typeof version !== 'string'))) {
    throw new Error('현재 릴리스와 서버 메타데이터가 일치하지 않습니다.');
  }
  return { current, previous: previous === '-' ? null : previous, running: running === 'true', locked: locked === 'yes', metadata };
}
