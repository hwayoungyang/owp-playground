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

`--stable`은 커밋되지 않은 변경이 있으면 실패합니다. 생성 자료도 현재 소스와 일치해야 합니다. `snapshot:create`는 자동 commit·패키지 게시·운영 서버 배포를 수행하지 않습니다. 아카이브는 기존 운영 배포의 `releases/`와 별도로 보존하므로 최근 5개 운영 릴리스 정리·rollback 정책의 영향을 받지 않습니다. `pnpm deploy`는 기존 최신 사이트 배포 절차를 유지합니다. 버전별 사이트와 MCP는 아래 `deploy:mcp` 명령으로 별도 서비스에 설치합니다.

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

배포 명령은 서비스별로 분리합니다. `deploy`는 30010의 최신 정적 Playground를 관리하고, `deploy:mcp`는 30011의 버전별 Playground와 HTTP MCP를 함께 관리합니다. 버전별 화면과 MCP는 같은 stable 아카이브를 조회하므로 한 서비스로 전환·검증합니다.

| 대상 | 명령 | 서버 경로 | 운영 방식 |
| --- | --- | --- | --- |
| 최신 정적 Playground · 30010 | `corepack pnpm deploy` | `/home/owp-playground` | 기존 Nginx·Docker |
| 버전별 Playground + MCP · 30011 | `pnpm deploy:mcp` | `/home/owp-playground-mcp` | `owp-playground-mcp.service` · systemd |

SSH 연결 공유 방식을 재사용하며 서비스·잠금·릴리스 보관 경로를 분리합니다. 기존 `deploy:status`·`deploy:rollback`·`deploy:cleanup`은 30010 정적 서비스 전용입니다.

### 기존 30010 정적 사이트

회사 VPN에 연결한 Mac의 프로젝트 루트에서 실행합니다.

```sh
corepack pnpm deploy:preflight
corepack pnpm deploy
corepack pnpm deploy:status
```

이 경로는 최신 정적 사이트를 새로 빌드해 기존 Nginx의 `current`를 전환합니다. 버전 아카이브 전송이나 MCP 프로세스 설치는 포함하지 않습니다. 실패 복구는 기존 `deploy:rollback`을 사용합니다. 자세한 서버 조건은 [README의 배포 CLI](../README.md#배포-cli)를 따릅니다.

### MCP 최초 설치와 이후 갱신

회사 VPN에 연결한 Mac의 프로젝트 루트에서 실행합니다. 서버에서 별도로 설치 명령을 입력할 필요 없이 다음 한 명령이 최신 stable 묶음 선택·검증·전송·설치·서비스 시작·검증을 수행합니다.

```sh
pnpm deploy:mcp
```

`--bundle`을 생략하면 저장소 루트의 `.omo/evidence/versioned-mcp/` 바로 아래에 있는 `deploy-bundle-*` 실제 디렉터리를 검사합니다. `release.json`의 `channel: "stable"`, `dirty: false`를 확인하고 `releaseId`의 날짜·시각이 가장 최신인 묶음을 선택합니다. 폴더 이름의 Git SHA나 수정 시각으로 순서를 정하지 않습니다. 기존 전체 검증을 마친 뒤 선택 경로와 release ID를 표시하므로 SSH 접속 전에 확인할 수 있습니다.

`release.json`이 없는 과거 형식·미완성 디렉터리와 draft·dirty 묶음은 선택 대상에서 제외합니다. 메타데이터가 손상됐거나 링크인 후보는 오류로 중단합니다. 최신 시각의 후보가 여러 개면 임의로 선택하지 않고 명시 경로를 요구합니다. 선택한 최신 stable의 파일·해시 검증에 실패해도 이전 묶음으로 넘어가지 않습니다.

특정 묶음을 선택하려면 `--bundle`을 지정합니다. 이 경우 자동 탐색을 생략하고 지정한 경로만 검사합니다. 아래 예시는 코드 commit `8f5e7db9d5c84028ed42c9ddceeda26f2524658e`와 stable `20261023-205804-8f5e7db9d5c8`을 담은 기존 묶음입니다.

```sh
pnpm deploy:mcp --bundle .omo/evidence/versioned-mcp/deploy-bundle-8f5e7db
```

CLI는 새 빌드·commit·스냅샷·배포 묶음을 생성하지 않습니다. 새 묶음을 준비하지 않았다면 기존 최신 stable을 다시 배포합니다. 자동 탐색 경로는 CLI 파일이 속한 저장소를 기준으로 하며 실행한 터미널의 작업 디렉터리에 따라 바뀌지 않습니다.

```sh
# 서버 접속 없이 묶음을 검증하고 배포 계획만 표시합니다.
pnpm deploy:mcp --dry-run

# SSH 인증과 서버 준비 상태만 검사합니다. 전송·설치·서비스 변경은 하지 않습니다.
pnpm deploy:mcp:preflight

# 비대화형 실행: 기존 키·SSH Agent의 비대화형 인증이 필요합니다.
pnpm deploy:mcp --assume-vpn

pnpm deploy:mcp --help
```

인증은 기존 OpenSSH 연결 공유 방식을 사용합니다. 첫 SSH 인증에서 입력한 비밀번호는 저장하지 않으며 이후 작업은 같은 연결을 재사용합니다. `StrictHostKeyChecking=yes`이므로 처음 연결하는 Mac에서는 `ssh root@192.168.100.20`으로 지문을 먼저 확인합니다. `--assume-vpn`은 VPN 확인 질문만 생략하며 실제 접근 검사는 유지합니다.

### 서버 준비 조건

배포 대상은 `root@192.168.100.20:22`이며 다음 조건이 필요합니다.

- 이번 배포 계약에 고정한 Node.js `24.22.1`과 pnpm `12.15.0`을 사용할 수 있어야 합니다. 설치된 pnpm의 버전이 일치하면 Corepack 없이 사용합니다. 설치된 pnpm이 없거나 버전이 다르거나 실행에 실패하면, 선택적으로 Corepack에 캐시된 pnpm `12.15.0`을 확인합니다. 두 경로 모두 사용할 수 없으면 중단하며 사전 검사에서 패키지 관리자를 설치하거나 내려받지 않습니다.
- systemd와 서비스 등록·시작 권한이 있어야 합니다. SSH 로그인 환경과 systemd의 실행 환경에서 런타임을 사용할 수 있어야 하며 `ss`와 `sha256sum`도 필요합니다.
- 서버에서 lockfile에 고정된 의존성과 사내 OWP registry에 접근할 수 있어야 합니다. registry 인증은 기존 서버 설정으로 제공합니다.
- 30011번 포트가 비어 있거나 이 스크립트로 설치한 MCP 서비스가 사용 중이어야 합니다. 기존 수동 서비스·알 수 없는 앱 경로·관리되지 않은 systemd 추가 설정(drop-in)은 자동으로 인수하지 않습니다.

CLI는 준비 조건이 부족하면 중단합니다. OS 런타임을 자동 설치하거나 방화벽·SELinux·Nginx·Docker·SSH·Verdaccio 설정을 변경하지 않습니다. 30011의 사내 접근 허용은 서버 운영 정책에 맞게 준비합니다.

로컬에서도 pnpm `12.15.0`을 직접 실행할 수 있으면 위 명령에 `corepack`을 붙일 필요가 없습니다. 로컬 pnpm 선택을 Corepack으로 관리하는 환경에서는 `corepack pnpm deploy:mcp`로 실행해도 됩니다.

### 묶음 형식과 검증

묶음 디렉터리에는 다음 네 파일이 필요합니다. 기존의 tar 파일 두 개만 만든 수동 전송 자료는 이 CLI의 입력으로 사용할 수 없습니다.

| 파일 | 내용 |
| --- | --- |
| `app.tar.gz` | 스냅샷과 같은 commit의 `git archive` 소스. `package.json`, lockfile, MCP 서버 코드를 포함 |
| `archive.tar.gz` | `versions/index.json`과 stable 스냅샷. draft를 포함하지 않음 |
| `SHA256SUMS` | 두 tar 파일의 SHA-256 |
| `release.json` | 배포할 `head`, `releaseId`, `channel: "stable"`, `dirty: false`, `manifestCommit`, 패키지 목록, stable ID 목록과 tar 파일별 크기·SHA-256 |

CLI는 로컬의 비공개 임시 경로에 묶음을 복사해 검증한 뒤 그 사본을 전송합니다. tar의 경로·타입·중복 항목, 코드 commit, index·manifest·파일별 SHA-256과 패키지 버전을 대조합니다. 링크·특수 파일·상위 경로·변조된 자료는 업로드 전에 거부합니다. 현재 작업 트리의 HEAD와 달라도 준비된 묶음 자체의 코드·스냅샷 계약이 일치하면 사용할 수 있습니다.

묶음 파일은 각각 64MiB 이하이며 tar 하나의 압축 해제 크기는 512MiB, 항목 수는 50,000개로 제한합니다. 서버의 모든 과거 스냅샷을 매번 전송할 필요는 없습니다. 신규 stable만 담은 묶음도 사용할 수 있으며 `release.json`의 목록과 묶음 안의 index는 서로 일치해야 합니다. 서버에서는 기존 stable과 병합합니다.

### 설치·전환·실패 복구

전송한 코드는 새 앱 디렉터리에 풀고, 배포 잠금 안의 사전 검사에서 선택한 pnpm으로 `install --prod --frozen-lockfile --ignore-scripts --config.manage-package-manager-versions=false`를 실행합니다. 설치된 pnpm이 유효하면 `pnpm`을 직접 실행하고, 대체 경로를 선택한 경우에만 `corepack pnpm@12.15.0`을 사용합니다. 서버에서 Playground를 빌드하거나 스냅샷을 다시 생성하지 않습니다. 서버의 설치·검증·복구를 담당하는 helper는 준비된 코드 묶음과 별도로 전송하므로, CLI 추가 전 생성한 위 stable 묶음도 배포할 수 있습니다. 배포 CLI와 MCP SDK 조회 검증은 로컬에서 실행합니다.

서버의 영구 archive는 실제 디렉터리로 유지합니다. 기존 stable을 보존하면서 신규 스냅샷을 등록하고 index를 전환합니다. 같은 release ID의 내용이 다르거나 서버의 최신 stable보다 오래된 묶음이면 중단합니다. archive에는 `rsync --delete`, 정적 사이트의 최근 5개 릴리스 정리나 자동 삭제를 적용하지 않습니다.

새 앱은 `apps/`에 보관하고 검증된 앱으로 `current` 연결을 전환한 뒤 `owp-playground-mcp.service`를 등록·활성화·시작합니다. 서비스는 `0.0.0.0:30011`에서 실행하며 공개 origin은 `http://192.168.100.20:30011`입니다. 선택적 서버 환경 파일 `/home/owp-playground-mcp/mcp.env`를 유지합니다. 인증 토큰을 쓴다면 서버의 `OWP_MCP_BEARER_TOKEN`과 같은 값을 로컬 검증 프로세스의 환경 변수에도 제공하며, 명령 인자나 저장소에 기록하지 않습니다. 브라우저 화면에도 토큰을 요구하면 인증 프록시가 해당 헤더를 처리해야 합니다.

전환 후에는 루트의 query 보존·307 이동, stable index와 최신 ID, 고정 버전 HTML·asset의 실제 SHA-256을 검사합니다. 로컬 MCP SDK로 연결·초기화하고 `list_packages`와 패키지별 가이드 조회의 release ID·버전을 확인합니다. 프로세스 시작 직후의 연결 거부·연결 시간 초과는 최대 30초 동안 재시도하며 파일 내용·릴리스 불일치는 즉시 실패합니다. HTTP 200 또는 `/mcp`의 단순 GET만으로 성공 처리하지 않습니다.

설치·시작·검증에 실패하면 배포 잠금을 유지한 상태에서 이전 앱 연결·index·unit과 활성화 상태를 복구합니다. 최초 설치가 실패하면 이번 실행이 만든 서비스와 앱 연결만 해제합니다. 실패한 자료와 과거 스냅샷은 원인 확인을 위해 보존하며, 복구에 성공해도 명령은 실패 코드로 끝납니다.

SSH 연결 중단·완료 응답 누락·강제 종료가 발생하면 결과를 추정해 반복 배포하거나 남은 잠금을 삭제하지 않습니다. 복구 중 unit 경로나 추가 설정이 예상과 달라도 서비스 조작을 중단하고 기록과 잠금을 남깁니다. 서버의 서비스·실제 앱 연결·배포 기록을 확인한 뒤 수동으로 복구합니다. CLI가 관리하지 않는 기존 unit이나 다른 실행의 잠금은 덮어쓰지 않습니다.

### 운영 확인

배포 명령이 검증까지 성공하면 버전별 화면은 `http://192.168.100.20:30011/`, 팀 공용 MCP는 `http://192.168.100.20:30011/mcp`에서 제공합니다. 서버에서 서비스 상태와 로그를 확인할 때는 다음 명령을 사용합니다.

```sh
systemctl status owp-playground-mcp.service --no-pager
journalctl -u owp-playground-mcp.service -n 100 --no-pager
```

AI 클라이언트 안내에는 `<OWP_MCP_URL>/mcp`로 표기하며 `<OWP_MCP_URL>`을 해당 서비스의 origin으로 바꿉니다. 운영 archive와 index는 함께 백업합니다. 배포 자동화 테스트는 다음 명령으로 실행합니다.

```sh
pnpm test:deploy:mcp
```

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
