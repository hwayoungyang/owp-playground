# 버전별 Playground와 MCP

DataGrid·Charts의 실행 화면, 공개 API, 가이드와 실제 예제 소스를 같은 불변 스냅샷으로 제공합니다. 팀 공용 HTTP와 개인 로컬 stdio는 같은 MCP 조회 로직과 아카이브를 사용합니다. 다른 OWP 패키지는 해당 Playground 구현과 Knowledge 검증을 마친 뒤 등록합니다. 설치된 의존 패키지나 `planned` 목록은 MCP 지원 목록으로 취급하지 않습니다.

## 버전 기준

| 대상 | 기준 |
| --- | --- |
| OWP 패키지 | 실제 설치본에서 확인한 정확한 패키지 버전 |
| 화면·Knowledge 스냅샷 | 한국 시간의 `YYYYMMDD-HHMMSS-<Git SHA>` 형식 `releaseId` |
| Playground 프로그램 | 루트 `package.json`의 버전 |
| MCP 서버 프로그램 | `mcp/package.json`의 버전 |
| Knowledge·아카이브 형식 | 각 데이터의 `schemaVersion` |

문서만 수정하면 패키지 버전을 유지하고 새 스냅샷을 만듭니다. 같은 `releaseId`는 덮어쓰지 않습니다. 과거 버전은 해당 버전의 패키지·소스·의존성과 동작을 검증할 수 있는 경우에만 등록합니다.

스냅샷에는 API JSON, 검색용 JSONL, 가이드 Markdown, 예제 의존 파일, 완전한 Playground 빌드와 파일별 SHA-256을 보관합니다. `knowledge-release.json`에 패키지 목록·프로그램 버전·commit·작업 트리 변경 여부·공개 경로·파일 목록을 기록하고, `versions/index.json`이 manifest 해시와 최신 포인터를 관리합니다. 원본 저장소와 lockfile을 함께 보존해야 이후 재빌드도 할 수 있습니다. 빌드 artifact 보관 자체는 재빌드를 대신하지 않습니다.

## 스냅샷 생성

프로젝트에 고정된 Node.js와 pnpm을 사용합니다.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm snapshot:create --draft
```

이 명령은 Knowledge 생성, 입력 상태 기록, 타입 검사·버전 경로 빌드, 자료·파일 해시 검사, 스냅샷 등록을 수행합니다. 빌드는 별도 임시 경로를 사용하며 일반 `dist/`는 유지합니다. 실패하면 이전 index와 최신 포인터를 유지합니다. 동시에 두 등록을 실행할 수 없습니다.

```text
.playground-versions/             # Git ignore, 장기 보존·백업 대상
  versions/
    index.json
    <releaseId>/
      knowledge-release.json
      index.html
      assets/...
      api/...
      catalogs/...
      snippets/...
      knowledge/...
      llms.txt
```

기본 명령은 Git 작업 트리가 변경되어 있으면 `draft`, 깨끗하면 `stable`로 등록합니다. 정식 등록은 명시적으로 다음 명령을 사용합니다.

```sh
corepack pnpm snapshot:create --stable
```

`--stable`은 커밋되지 않은 변경이 있으면 실패합니다. 생성 자료도 현재 소스와 일치해야 합니다. 이 구현은 자동 commit·패키지 게시·운영 서버 배포를 수행하지 않습니다. 아카이브는 기존 운영 배포의 `releases/`와 별도로 보존하므로 최근 5개 운영 릴리스 정리·rollback 정책의 영향을 받지 않습니다. `pnpm deploy`는 기존 최신 사이트 배포 절차를 유지합니다. 버전별 사이트와 MCP를 운영하려면 아카이브를 서비스 서버의 영구 디렉터리로 전달하고 아래 HTTP 프로세스를 별도로 운영합니다.

## 로컬에서 화면과 HTTP MCP 확인

```sh
corepack pnpm mcp:http --allow-drafts
```

- Playground: `http://127.0.0.1:30011/`
- MCP: `http://127.0.0.1:30011/mcp`
- 버전 목록: `http://127.0.0.1:30011/versions/index.json`
- 고정 링크: `http://127.0.0.1:30011/versions/<releaseId>/?package=datagrid`

루트 주소는 최신 제공 가능한 스냅샷으로 이동하며 query를 보존합니다. 헤더에서 패키지 버전과 문서 날짜를 선택할 수 있습니다. 버전을 바꾸면 대상의 실행 코드를 새로 로드하고, 대상에도 존재하는 예제·API 및 언어·화면 모드를 유지합니다. 과거 파일의 줄 강조는 제거합니다. 없는 버전·파일을 최신 HTML로 대체하지 않습니다.

기본 서버는 `stable`만 제공합니다. 로컬 미커밋 코드로 만든 스냅샷을 확인하려면 `--allow-drafts`를 명시합니다. 일반 `pnpm dev`·`pnpm build`는 현재 소스의 화면이며 아카이브를 자동 등록하지 않습니다. 일반 `pnpm dev`의 버전 메뉴는 현재 개발 버전만 표시하며, 아카이브 목록과 버전 이동은 위 HTTP 서버에서 제공합니다.

## 팀 공용 HTTP

정식 스냅샷을 서비스 서버의 영구 아카이브에 보관한 뒤 실행합니다. 아래 경로와 호스트는 운영 환경에 맞게 지정합니다.

```sh
corepack pnpm mcp:http \
  --archive-root /srv/owp-versions \
  --host 0.0.0.0 \
  --port 30011 \
  --public-url http://owp.internal:30011
```

AI 클라이언트에는 `http://owp.internal:30011/mcp`를 Streamable HTTP 서버로 연결합니다. `--public-url`은 허용할 Host·Origin과 반환할 절대 source URL에 사용합니다. `0.0.0.0`·`::` 바인딩에는 이 값을 지정해야 합니다. 정식 환경에서는 기존 사내 접근 제어나 인증된 reverse proxy를 적용합니다. 선택적으로 `OWP_MCP_BEARER_TOKEN`을 설정하면 MCP와 정적 파일 요청에 `Authorization: Bearer ...`가 필요합니다. 브라우저 화면까지 제공할 때는 기존 인증 프록시에서 해당 정책을 처리해야 합니다. 토큰은 저장소·클라이언트 예제에 기록하지 않습니다.

`--no-static`은 HTTP에서 Playground 파일 제공을 중지합니다. SDK transport는 요청 크기·Host·Origin을 검사하고, 파일 응답은 등록된 manifest와 SHA-256을 확인합니다. 스냅샷 추가는 서버를 재시작하지 않아도 다음 index 조회에 반영됩니다.

## 운영 배포 순서

기존 정적 사이트는 `http://192.168.100.20:30010`에서 제공하며, `pnpm deploy`가 이를 관리합니다. 버전 아카이브와 MCP는 Node.js 프로세스를 별도로 실행해야 합니다. 아래의 30011번 포트는 이 별도 서비스의 예시이며, 서버의 포트·접근 정책과 실행 계정은 배포자가 확인합니다.

### 기존 30010 정적 사이트

회사 VPN에 연결한 Mac의 프로젝트 루트에서 실행합니다.

```sh
corepack pnpm deploy:preflight
corepack pnpm deploy
corepack pnpm deploy:status
```

이 경로는 최신 정적 사이트를 새로 빌드해 기존 Nginx의 `current`를 전환합니다. 버전 아카이브 전송이나 MCP 프로세스 설치는 포함하지 않습니다. 실패 복구는 기존 `deploy:rollback`을 사용합니다. 자세한 서버 조건은 [README의 배포 CLI](../README.md#배포-cli)를 따릅니다.

### 버전별 Playground와 MCP 서비스

서버에는 프로젝트의 Node.js·pnpm 버전과 OWP 사설 registry 접근이 필요합니다. 코드와 아카이브는 기존 `/home/owp-playground/releases` 밖에 둡니다. 이 예시는 `/home/owp-playground-mcp/app`과 `/home/owp-playground-mcp/archive`를 사용합니다.

1. 로컬 작업 트리를 커밋하고 `corepack pnpm snapshot:create --stable`을 실행합니다. 이미 생성한 stable을 배포할 때는 다시 생성하지 않아도 됩니다. `git status --short` 출력이 없어야 하며, 배포할 스냅샷의 manifest에 기록된 commit과 배포 코드의 commit을 일치시킵니다.
2. 다음 명령으로 커밋된 코드와 **모든 stable 스냅샷만** 담은 전송 자료를 준비합니다. `.playground-versions`는 Git ignore 대상이므로 코드 전송과 별개로 보관합니다.

```sh
export OWP_EXPORT_DIR="$(mktemp -d)"
corepack pnpm exec node --experimental-strip-types --input-type=module <<'NODE'
import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readVersionArchive } from './scripts/version-archive.ts';
const index = await readVersionArchive('.playground-versions');
const releases = index.releases.filter((entry) => entry.channel === 'stable');
const latest = releases.at(-1);
if (!latest) throw new Error('배포할 stable 스냅샷이 없습니다.');
const target = path.join(process.env.OWP_EXPORT_DIR, 'archive', 'versions');
await mkdir(target, { recursive: true });
for (const entry of releases) {
  await cp(path.join('.playground-versions/versions', entry.releaseId),
    path.join(target, entry.releaseId), { recursive: true, force: false, errorOnExist: true });
}
await writeFile(path.join(target, 'index.json'),
  `${JSON.stringify({ ...index, releases, latestReleaseId: latest.releaseId }, null, 2)}\n`);
console.log(`stable ${releases.length}개, 최신 ${latest.releaseId}`);
NODE
git archive HEAD | gzip > "$OWP_EXPORT_DIR/app.tar.gz"
tar -czf "$OWP_EXPORT_DIR/archive.tar.gz" -C "$OWP_EXPORT_DIR/archive" versions
```

3. 서버에 `/home/owp-playground-mcp/incoming`을 준비한 뒤 두 파일을 전송합니다. 이 명령은 로컬에서 실행하며 SSH 인증은 기존 방식을 사용합니다.

```sh
scp "$OWP_EXPORT_DIR/app.tar.gz" "$OWP_EXPORT_DIR/archive.tar.gz" \
  root@192.168.100.20:/home/owp-playground-mcp/incoming/
```

4. 서버에서 코드는 새 앱 디렉터리에, archive는 별도 임시 디렉터리에 풉니다. 실행 중인 앱 파일 위에 덮어쓰지 않습니다. 새 앱 디렉터리에서 `corepack pnpm install --frozen-lockfile --prod`를 실행합니다. 서버 빌드나 스냅샷 재생성은 필요하지 않습니다.
5. 새 앱의 `scripts/version-archive.ts`에 있는 `readVersionArchive()`로 임시 archive 전체를 검증합니다. 예를 들어 새 앱 디렉터리에서 다음과 같이 실행합니다.

```sh
corepack pnpm exec node --experimental-strip-types --input-type=module \
  -e 'import { readVersionArchive } from "./scripts/version-archive.ts"; console.log(await readVersionArchive(process.argv[1]));' \
  /absolute/path/to/extracted-archive
```

6. archive를 등록할 때는 각 `versions/<releaseId>/` 디렉터리를 먼저 완전히 전달하고, `versions/index.json`은 마지막에 같은 디렉터리의 임시 파일에서 rename해 교체합니다. 같은 ID가 이미 있으면 파일별 내용이 동일한지 확인하고 재사용하며, 다른 내용으로 덮어쓰지 않습니다. 배포 기준 아카이브는 하나로 유지하고, 서버의 기존 stable 항목이 새 index에서 빠지지 않도록 확인합니다. 기존 아카이브에 `rsync --delete`나 운영 릴리스 정리 정책을 적용하지 않습니다.
7. 검증한 코드 디렉터리를 `/home/owp-playground-mcp/app`으로 연결하고 아래 명령으로 실행합니다. 초기 foreground 확인을 마친 뒤 서버의 systemd 등 기존 프로세스 관리 방식에 같은 작업 디렉터리·실행 명령·환경 변수를 등록합니다. `--allow-drafts`는 지정하지 않습니다.

```sh
cd /home/owp-playground-mcp/app
corepack pnpm mcp:http \
  --archive-root /home/owp-playground-mcp/archive \
  --host 0.0.0.0 \
  --port 30011 \
  --public-url http://192.168.100.20:30011
```

인증 프록시 뒤에서 제공하면 loopback으로 바인딩하고 `--public-url`에는 팀이 접속할 외부 origin을 지정합니다. 프록시는 `/mcp`, `/versions/`와 `/`를 같은 서비스로 전달하고 Streamable HTTP 응답을 버퍼링하지 않도록 설정합니다. `OWP_MCP_BEARER_TOKEN`을 사용하면 인증된 정적 GET·HEAD 응답은 `private, no-store`로 제공됩니다. 브라우저도 사용할 경우 인증 프록시가 필요한 헤더를 처리해야 합니다.

8. 클라이언트가 접근하는 주소에서 다음을 확인합니다. 인증을 설정했다면 같은 인증 정책으로 조회합니다.

```sh
curl -I 'http://192.168.100.20:30011/?package=datagrid'
curl --fail 'http://192.168.100.20:30011/versions/index.json'
```

루트는 stable 버전 경로로 307 이동해야 합니다. index에는 stable만 있어야 하며, 브라우저에서 DataGrid·Charts와 고정 버전 링크를 확인합니다. AI 클라이언트에는 `http://192.168.100.20:30011/mcp`를 Streamable HTTP로 연결하고 `list_packages`의 버전과 `get_api`·`get_example`의 `releaseId`를 확인합니다. `/mcp`에 대한 단순 GET은 MCP 연결 검증을 대신하지 않습니다.

코드 교체 후에는 프로세스를 재시작합니다. 아카이브만 추가할 때는 디렉터리와 index 등록을 마치면 다음 조회부터 반영됩니다. 코드 rollback은 이전 코드 디렉터리로 연결을 되돌려 재시작하고, 최신 스냅샷 포인터를 되돌릴 때는 같은 index의 `latestReleaseId`를 보존된 이전 stable ID로 바꿔 원자적으로 교체합니다. 개별 과거 조회는 계속 `releaseId`로 고정할 수 있습니다. archive와 index는 함께 백업합니다.

## 개인 로컬 stdio

```sh
corepack pnpm mcp:stdio --allow-drafts
```

AI 클라이언트가 실행할 명령에는 Node.js와 CLI의 절대 경로, 아카이브의 절대 경로를 지정하는 방식이 명확합니다. 아래 값은 경로 형식 예시입니다. Node.js는 이 프로젝트의 `engines.node` 범위를 충족해야 합니다.

```json
{
  "mcpServers": {
    "owp": {
      "command": "/absolute/path/to/node",
      "args": [
        "--experimental-strip-types",
        "/absolute/path/to/owp-playground/mcp/cli.ts",
        "--archive-root",
        "/absolute/path/to/owp-playground/.playground-versions",
        "--allow-drafts"
      ]
    }
  }
}
```

정식 스냅샷만 사용할 때는 `--allow-drafts`를 제거합니다. 로컬 CLI는 아카이브를 직접 읽으므로 조회에 네트워크 연결이 필요하지 않습니다. `--public-url`을 함께 지정하면 응답의 링크를 해당 HTTP 서비스의 동일한 `releaseId`로 연결할 수 있습니다. 그 서버에도 같은 스냅샷이 있어야 합니다. stdio의 stdout은 MCP 메시지에만 사용하고 로그는 stderr로 보냅니다.

## 공통 도구

| Tool | 입력과 동작 |
| --- | --- |
| `list_packages` | 선택한 `releaseId`의 완료된 패키지와 조회 가능한 버전 |
| `search_knowledge` | `package`, `query`, 선택적 `version`·`releaseId`·`kind`·`offset`·`limit` |
| `get_api` | `package`, `symbol`로 정확한 API 또는 고유한 이름 조회 |
| `get_example` | `package`, `exampleId`로 실행 진입 소스 조회. `includeDependencies`, `file`, `startLine`, `maxChars`, `offset`, `limit`으로 범위 제어 |
| `get_guide` | `package`, `guideId`로 가이드 조회. 기본 `setup`은 현재 패키지의 기본 사용 가이드에 연결. 긴 본문은 `offset`, `maxChars`로 조회 |

패키지는 `datagrid` 또는 `@owp/datagrid` 형식으로 지정합니다. `version`을 생략하면 최신 제공 가능한 검증본을 선택하고 응답에 실제 `packageVersion`과 `releaseId`를 명시합니다. `version`을 지정하면 정확히 해당 버전만 조회합니다. 버전 범위나 없는 버전을 다른 버전으로 대체하지 않습니다. 같은 패키지 버전의 문서 수정본이 여럿이면 최신 등록본을 선택합니다. 후속 호출에는 응답의 `releaseId`를 전달하면 배포가 바뀌어도 자료가 섞이지 않습니다.

```json
{
  "package": "@owp/datagrid",
  "version": "3.5.0",
  "releaseId": "<list_packages 응답의 releaseId>",
  "symbol": "@owp/datagrid:OwpDataGrid"
}
```

성공 응답은 `schemaVersion`, `releaseId`, `package`, `packageVersion`, `sourceUrls`를 포함합니다. 도구별 output schema를 제공하며 같은 결과를 `structuredContent`와 JSON text로 반환합니다. API record 자체의 패키지·버전은 소속 원본을 유지하므로 Charts를 통해 조회한 Chart.js 타입과 OWP 타입을 구분할 수 있습니다. 오류는 `isError`와 오류 코드·메시지·조회 가능한 버전으로 반환합니다. API·가이드·예제 소스의 Resource Template도 같은 조회 로직을 사용합니다.

## 다음 패키지 등록 조건

1. 해당 패키지의 Playground 화면·코드·가이드와 URL을 완성합니다.
2. `src/playgrounds/packages.ts`의 완료 목록과 `knowledge/package-adapters.mjs`에 등록합니다. 외부 참조 패키지는 `referencePackages`로 구분합니다.
3. 공개 선언·실행 계약·예제 연결을 검토하고 `knowledge/reviewed-packages.json`과 예제 검토 자료를 갱신합니다.
4. API JSON과 예제 sources manifest를 빌드에서 생성하고 Knowledge·타입·실행·소스 검증을 통과시킵니다.
5. 새 스냅샷을 등록합니다. MCP 공통 도구는 스냅샷의 지원 목록과 완료된 패키지 등록부를 확인해 이를 제공합니다.

의존성 설치나 메뉴의 `planned` 항목 추가만으로 MCP 지원을 활성화하지 않습니다. 초기 제공 대상은 DataGrid·Charts입니다.
