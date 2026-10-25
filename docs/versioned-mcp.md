# 버전별 Playground와 MCP

DataGrid·Charts·Core의 실행 화면, 공개 API, 가이드와 실제 예제 소스를 같은 불변 스냅샷으로 제공합니다. 팀 공용 HTTP와 개인 로컬 stdio는 같은 MCP 조회 로직과 아카이브를 사용합니다. 다른 OWP 패키지는 해당 Playground 구현과 Knowledge 검증을 마친 뒤 등록합니다. 설치된 의존 패키지나 `planned` 목록은 MCP 지원 목록으로 취급하지 않습니다.

Core의 앱 정책 adapter와 Components의 공통 UI는 소유 패키지를 구분합니다. Provider·API·상태 관리와 Core 고유 API는 Core 공개 경로를 유지하고, 보조 결과 UI는 Components에서 직접 가져옵니다. 앱 설정의 Table·FieldTable처럼 Core adapter를 시연하는 구간은 메뉴 분류와 관계없이 Core import를 유지합니다. Dialog·PageCarded는 Components UI에 Core policy hook의 props와 styles를 함께 연결할 수 있으며, ErrorBoundary callback 정책과 PageContent 반응형 스타일 slot도 Core 공개 API를 사용합니다. 기존 Core adapter에는 같은 정책을 중복 적용하지 않습니다. 코드 표시·API 연결·MCP 조회도 이 symbol별 기준을 따릅니다. Core 예제에 필요한 Components 선언은 Core API 자료의 `referenceRecords`로 연결하며 Components 전체 Playground의 지원 완료를 뜻하지 않습니다. 예를 들어 Core snapshot에서 `get_api`의 `symbol`에 `@owp/components:OwpLoading`을 지정하면 Components의 공개 import와 정확한 패키지 버전을 확인할 수 있습니다. 새 snapshot에는 제거된 `@owp/core:OwpLoading` 호환 API를 만들지 않으며 과거 snapshot은 당시 계약을 유지합니다.

새 자료를 로컬 draft로 생성해도 팀 서버는 자동으로 갱신되지 않습니다. 기존 MCP 연결에서 새 `releaseId`와 해당 패키지 버전을 지정해 자료를 검증하고, 팀 반영은 별도로 준비한 clean stable snapshot과 배포 묶음을 사용합니다. draft의 기본 선택 여부는 연결의 `allowDrafts` 설정에 따릅니다.

## 버전 기준

| 대상 | 기준 |
| --- | --- |
| OWP 패키지 | 실제 설치본에서 확인한 정확한 패키지 버전 |
| 화면·Knowledge 스냅샷 | 한국 시간의 `YYYYMMDD-HHMMSS-<Git SHA>` 형식 `releaseId` |
| Playground 프로그램 | 루트 `package.json`의 버전 |
| MCP 서버 프로그램 | `mcp/package.json`의 버전 |
| Knowledge·아카이브 형식 | 각 데이터의 `schemaVersion` |

설치 계약은 workspace 직접 의존성과 패키지 소유자별 해석을 구분합니다. `reviewed-packages.json`은 직접 설치본을, `reviewed-package-resolutions.json`은 각 소유 패키지의 실제 전이 의존 버전과 declaration/runtime 지문을 검토합니다. 생성 원본의 `resolvedDependencies`는 이 소유자별 설치 계약이며 번들의 dedupe 설정으로 패키지 설치 버전이 바뀌지는 않습니다. 기존 MCP의 `dependencies`를 특정 패키지의 전체 전이 의존 그래프로 해석하지 않습니다.

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
| 버전별 Playground + MCP · 30011 | `pnpm deploy:mcp` | `/opt/owp-playground-mcp` | `owp-playground-mcp.service` · systemd |

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

아래 [서버 준비 조건](#서버-준비-조건)을 확인한 뒤, 회사 VPN에 연결한 Mac의 프로젝트 루트에서 실행합니다. 다음 한 명령이 최신 stable 묶음 선택·검증, Linux x64용 Node.js·pnpm·production 의존성의 로컬 준비, 전송, 최초 런타임 설치, 서비스 시작과 검증을 수행합니다. 서버에서 외부 사이트나 registry에 접속하지 않습니다.

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

# 로컬 오프라인 자료 준비와 읽기 전용 서버 검사를 수행합니다. 서버 전송·설치·서비스 변경은 하지 않습니다.
pnpm deploy:mcp:preflight

# 비대화형 실행: 기존 키·SSH Agent의 비대화형 인증이 필요합니다.
pnpm deploy:mcp --assume-vpn

pnpm deploy:mcp --help
```

인증은 기존 OpenSSH 연결 공유 방식을 사용합니다. 첫 SSH 인증에서 입력한 비밀번호는 저장하지 않으며 이후 작업은 같은 연결을 재사용합니다. `StrictHostKeyChecking=yes`이므로 처음 연결하는 Mac에서는 `ssh root@192.168.100.20`으로 지문을 먼저 확인합니다. `--assume-vpn`은 VPN 확인 질문만 생략하며 실제 접근 검사는 유지합니다.

### 서버 준비 조건

배포 대상은 `root@192.168.100.20:22`이며 현재 오프라인 런타임의 대상은 Linux x64 glibc입니다. Rocky Linux 9 x86_64 서버에 다음 기본 환경이 필요합니다.

- SSH·SCP 접속, root 권한, systemd와 `ss`가 필요합니다.
- 기본 명령 `sh`, `id`, `uname`, `getconf`, `sha256sum`, `mkdir`, `chmod`, GNU `mv`(`-Tn` 지원), `rm`, `rmdir`, `cat`, `wc`, `env`가 필요합니다. Node.js 실행에 필요한 시스템 라이브러리도 있어야 합니다. 준비한 바이너리가 실제로 실행되는지 서비스 변경 전에 검사합니다.
- SELinux가 Enforcing 또는 Permissive이면 `restorecon`과 `matchpathcon`이 필요합니다. 런타임의 `bin/node`와 `bin/pnpm`에 적용될 기본 정책이 `bin_t`인지 읽기 전용으로 확인하며, 설치 시 소유권과 무결성을 확인한 전용 경로에 기본 컨텍스트를 적용합니다.
- 30011번 포트가 비어 있거나 이 스크립트로 설치한 MCP 서비스가 사용 중이어야 합니다. 기존 수동 서비스·알 수 없는 앱 경로·관리되지 않은 systemd 추가 설정(drop-in)은 자동으로 인수하지 않습니다.
- 30011의 사내 접근 허용과 선택적인 `mcp.env`는 운영 정책에 맞게 준비합니다.

서버에 전역 Node.js·pnpm·Corepack을 미리 설치할 필요가 없습니다. 서버의 외부 DNS·인터넷·npm registry 접근도 필요하지 않습니다. CLI는 `dnf`, `curl`, `npm install`, `pnpm install`을 서버에서 실행하지 않으며 OS 패키지·전역 실행 파일·방화벽·Nginx·Docker·SSH·Verdaccio 설정을 변경하지 않습니다. SELinux 정책과 실행 모드는 유지하며 `restorecon`으로 전용 설치 경로의 기본 컨텍스트만 복원합니다. 기본 도구나 시스템 라이브러리가 부족하면 필요한 항목을 안내하고 중단하므로 사내 OS 저장소나 별도 RPM으로 준비합니다.

### 로컬 준비와 최초 설치

Mac에서는 pnpm `12.15.0`을 실행할 수 있어야 하며 공식 Node.js 다운로드 사이트, npm registry와 사내 OWP registry에 접근할 수 있어야 합니다. 사내 registry 접근에는 회사 VPN과 기존 로컬 인증 설정을 사용합니다. 로컬 pnpm을 직접 실행할 수 있으면 Corepack은 필요하지 않습니다. Corepack으로 관리하는 환경은 캐시된 pnpm `12.15.0`을 사용할 수도 있습니다.

```sh
# 서버에 접속하거나 파일을 다운로드하지 않고 묶음과 준비 계획만 확인합니다.
pnpm deploy:mcp --dry-run

# 오프라인 자료를 로컬에서 준비한 뒤 서버의 기본 환경만 읽기 전용으로 확인합니다.
pnpm deploy:mcp:preflight

# 자료 준비·전송·최초 런타임 설치·서비스 시작·HTTP/MCP 검증을 이어서 수행합니다.
pnpm deploy:mcp
```

`--dry-run`의 오프라인 자료는 `pending-preparation`으로 표시됩니다. `--preflight-only`는 로컬 다운로드·의존성 준비를 수행할 수 있지만 서버에 파일을 전송하거나 설치하지 않습니다. 서버에 전용 런타임이 아직 없으면 `preflight-bootstrap-required` 상태와 설치 필요 안내를 반환합니다. 이 상태는 기본 환경만 확인한 결과이며 Node·앱·서비스 상세 검사 완료를 뜻하지 않습니다. 실제 배포에서는 런타임 설치 후 배포 잠금 안에서 전체 검사를 이어 갑니다.

Node.js `24.22.1`의 [공식 Linux x64 배포 파일](https://nodejs.org/en/blog/release/v24.22.1)과 pnpm `12.15.0`의 공식 Linux x64 배포 파일을 로컬에서 내려받아 고정된 SHA-256·integrity로 검사합니다. 압축 파일은 `.omo/evidence/mcp-offline/cache/`에 보관하며 재사용할 때도 검증합니다. 서버에서는 이 파일에서 추출한 실행 바이너리만 설치하므로 `tar`·`xz`·npm을 이용한 런타임 설치가 필요하지 않습니다.

런타임 경로는 `/opt/owp-playground-mcp/runtime/node24.22.1-pnpm12.15.0-<node SHA-256>-<pnpm SHA-256>/bin/`이며 이 안에 `node`와 `pnpm`을 설치합니다. `/usr/local/bin`이나 전역 PATH를 변경하지 않습니다. 동일 경로의 파일이 검증값과 다르면 덮어쓰지 않고 중단합니다. 설치한 런타임은 앱 배포의 실패·복구 이후에도 재사용할 수 있도록 보존합니다.

이 경로는 Rocky Linux의 SELinux 기본 정책에서 서비스가 실행할 수 있는 `bin_t`를 적용받도록 선택했습니다. 이전 `/home/owp-playground-mcp/runtime/`의 `user_home_t` 실행 파일은 SSH에서 실행되더라도 systemd에서 `203/EXEC`와 AVC `execute denied`로 차단될 수 있습니다. 이전 최초 설치가 실패한 경우에는 수정한 CLI로 `pnpm deploy:mcp`를 다시 실행하면 `/opt`에 설치합니다. `/home`에 남은 실패 자료는 자동으로 이동하거나 삭제하지 않습니다. 이미 다른 경로에서 운영 중인 서비스가 있으면 자동으로 인수·이전하지 않고 중단합니다.

앱 의존성은 선택한 stable 소스의 새 임시 사본에서 준비합니다. 고정 pnpm으로 `--prod --frozen-lockfile --ignore-scripts --ignore-pnpmfile --no-runtime --os linux --cpu x64 --libc glibc --node-linker=hoisted`를 적용하고, package·lockfile·workspace가 바뀌지 않았는지 검사합니다. 로컬 작업 트리의 `node_modules`를 재사용하지 않으며 pnpm store나 로컬 인증 설정을 서버에 복사하지 않습니다. 서버에서는 준비된 `node_modules`를 검증·배치하고 패키지 관리자를 실행하지 않습니다.

플랫폼 옵션은 Linux용으로 배포된 optional dependency를 선택하며 native 코드를 크로스 컴파일하지 않습니다. 설치 스크립트 실행이나 별도 컴파일이 필요한 의존성을 추가하면 이 배포 방식에서 실행 가능한지 검증해야 합니다.

이후 갱신도 `pnpm deploy:mcp`로 실행합니다. 검증된 같은 서버 런타임은 재사용하며, 앱 의존성은 선택한 묶음의 lockfile 기준으로 로컬에서 새로 준비합니다. 서버 외부 접속을 허용하거나 수동으로 Node.js·pnpm 설치 명령을 반복할 필요가 없습니다.

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

전송한 코드는 새 앱 디렉터리에 풉니다. 원본 소스와 연결된 `offline.json`, 의존성 압축 파일의 SHA-256, 내부 파일별 크기·SHA-256과 경로를 검증한 뒤 `node_modules`를 배치합니다. 상대 symlink는 전체 연결을 따라가도 의존성 루트 안에 있는 경우만 허용하며 일반 파일을 쓴 뒤 마지막에 생성합니다. 경로 이탈·순환·상위 경로와의 충돌·특수 파일은 거부합니다. 서버에서 Playground를 빌드하거나 스냅샷을 다시 생성하지 않습니다. 런타임·의존성·설치 helper는 기존 네 파일과 별도로 준비해 전송하므로 기존 stable 묶음도 변경 없이 배포할 수 있습니다. 배포 CLI와 MCP SDK 조회 검증은 로컬에서 실행합니다.

서버의 영구 archive는 실제 디렉터리로 유지합니다. 기존 stable을 보존하면서 신규 스냅샷을 등록하고 index를 전환합니다. 같은 release ID의 내용이 다르거나 서버의 최신 stable보다 오래된 묶음이면 중단합니다. archive에는 `rsync --delete`, 정적 사이트의 최근 5개 릴리스 정리나 자동 삭제를 적용하지 않습니다.

새 앱은 `apps/`에 보관하고 검증된 앱으로 `current` 연결을 전환한 뒤 `owp-playground-mcp.service`를 등록·활성화·시작합니다. 서비스는 `0.0.0.0:30011`에서 실행하며 공개 origin은 `http://192.168.100.20:30011`입니다. 선택적 서버 환경 파일 `/opt/owp-playground-mcp/mcp.env`를 유지합니다. 인증 토큰을 쓴다면 서버의 `OWP_MCP_BEARER_TOKEN`과 같은 값을 로컬 검증 프로세스의 환경 변수에도 제공하며, 명령 인자나 저장소에 기록하지 않습니다. 브라우저 화면에도 토큰을 요구하면 인증 프록시가 해당 헤더를 처리해야 합니다.

전환 후에는 루트의 query 보존·307 이동, stable index와 최신 ID, 고정 버전 HTML·asset의 실제 SHA-256을 검사합니다. 로컬 MCP SDK로 연결·초기화하고 `list_packages`와 패키지별 가이드 조회의 release ID·버전을 확인합니다. 프로세스 시작 직후의 연결 거부·연결 시간 초과는 최대 30초 동안 재시도하며 파일 내용·릴리스 불일치는 즉시 실패합니다. HTTP 200 또는 `/mcp`의 단순 GET만으로 성공 처리하지 않습니다.

설치·시작·검증에 실패하면 배포 잠금을 유지한 상태에서 이전 앱 연결·index·unit과 활성화 상태를 복구합니다. 최초 설치가 실패하면 이번 실행이 만든 서비스와 앱 연결만 해제합니다. 실패한 자료와 과거 스냅샷은 원인 확인을 위해 보존하며, 복구에 성공해도 명령은 실패 코드로 끝납니다.

서비스 시작에 실패하면 `ActiveState`, `SubState`, `Result`, `ExecMainStatus`와 로그 확인 명령을 로컬 오류에 함께 표시합니다. 예를 들어 `ExecMainStatus=203`이면 실행 파일과 실행 경로의 권한·SELinux 컨텍스트를 확인합니다. 상세 로그는 자동으로 수집하지 않습니다.

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
