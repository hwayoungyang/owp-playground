# OWP Playground

MUI 기반의 OWP 컴포넌트 실행·코드 Playground입니다. `@owp/datagrid`와 `@owp/charts`의 실행 예제와 시작 가이드를 제공합니다. 현재 [package.json](./package.json)에 고정된 OWP 의존성은 다음과 같습니다.

| 패키지 | 버전 |
| --- | --- |
| `@owp/datagrid` | `3.5.0` |
| `@owp/charts` | `5.0.1` |
| `@owp/core` | `7.0.1` |
| `@owp/components` | `3.0.1` |
| `@owp/date-picker` | `2.0.2` |
| `@owp/utils` | `1.0.1` |
| `@owp/theme` | `2.1.0` |
| `@owp/excel` · `@owp/pdf` | `2.0.0` |

`@owp/utils`는 Core·Components에서 분리된 공통 값·browser·barcode·QR·ZIP 유틸리티 패키지입니다. 직접 사용하는 함수는 `@owp/utils` 또는 `@owp/utils/browser` 등 기능별 public entry에서 import합니다. Core·Components는 이관된 함수의 호환 export를 제공하지 않습니다. DataGrid의 숫자 변환·focus 처리는 패키지 내부에서 Utils를 사용하므로 기존 DataGrid public API와 샘플의 `numberOptions` 설정은 유지합니다.

## 실행

Node.js 24.22.1 LTS와 프로젝트에 고정된 pnpm 12.15.0을 사용하며, 지원하는 Node.js 범위는 `package.json`의 `engines.node`를 따릅니다. 기존 OWP 사내 레지스트리 접근이 필요합니다. `.npmrc`의 `@owp:registry`를 환경에 맞게 설정하세요. 인증 정보는 저장소에 넣지 않습니다.

전역 pnpm이 프로젝트 버전과 다르면 `corepack pnpm`으로 실행합니다. 아래 명령은 전역 pnpm 설정을 바꾸지 않고 `packageManager`에 고정한 버전을 선택합니다. 다른 pnpm 명령에도 같은 방식으로 `corepack`을 붙일 수 있습니다.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --version
corepack pnpm node -v
corepack pnpm dev
```

`devEngines.runtime`에 따라 pnpm이 프로젝트용 Node.js `24.22.1`을 자동으로 내려받아 사용합니다. `pnpm node -v`가 `v24.22.1`인지 확인하고, 프로젝트 명령은 `pnpm run`, `pnpm exec` 또는 `pnpm node`로 실행합니다. 전역 Node.js 버전은 다를 수 있습니다.

`pnpm dev`는 개발 서버를 실행하고 브라우저를 자동으로 엽니다. TypeScript 7로 타입을 검사하고, Vite+로 개발·빌드·테스트를 실행합니다. 설치와 스크립트 실행에는 프로젝트에 고정한 pnpm CLI를 사용합니다. `packageManager`에 고정된 pnpm 12.15.0을 자동으로 선택하며 `pnpm-workspace.yaml`의 `pmOnFail: download`로 이를 유지합니다. `verifyDepsBeforeRun: false`로 명령 실행 전 자동 의존성 설치를 방지합니다. `.npmrc`는 사내 OWP 레지스트리 설정을 유지합니다.

macOS에서는 기본 브라우저가 Chrome 계열 또는 Safari이면 같은 개발 서버 주소의 기존 탭을 찾아 활성화하고 새로고침합니다. 선택한 예제의 경로·query·hash는 유지하며, 같은 포트의 `localhost`·`127.0.0.1`·`[::1]`은 같은 서버로 취급합니다. 해당 탭이 없거나 탭을 확인할 수 없으면 기본 브라우저로 새로 엽니다. 다른 운영체제나 브라우저에서는 기존 자동 열기 동작을 사용합니다. `BROWSER` 또는 `BROWSER_ARGS`를 직접 지정하면 해당 설정이 우선합니다.

프로덕션 미리보기:

```sh
pnpm build
pnpm preview
```

`pnpm preview`도 브라우저를 자동으로 엽니다. 기본 미리보기 주소는 `http://127.0.0.1:4173`입니다. GET 파라미터 `package`로 패키지를, `sample`로 예제를 바로 선택합니다.

| 주소 | 표시 |
| --- | --- |
| `/?package=datagrid` | OwpDataGrid 시작 안내 |
| `/?package=datagrid&sample=auto-span` | OwpDataGrid 자동 행 병합 |
| `/?package=charts` | OwpCharts 시작 안내 |
| `/?package=charts&sample=plan-actual` | OwpCharts Column & Line |
| `/?package=components` | OwpComponents 준비 상태 |
| `/?package=date-picker` | OwpDatePicker 준비 상태 |
| `/?package=pdf` | OwpPdf 준비 상태 |

패키지 값은 `datagrid`, `components`, `date-picker`, `core`, `charts`, `excel`, `pdf`, `theme`, `tailwind-config`입니다. `@owp/datagrid` 같은 전체 패키지 이름도 받으며 주소는 짧은 값으로 정리합니다. 현재 OwpDataGrid와 OwpCharts 예제를 실행할 수 있고 나머지는 해당 패키지의 준비 화면을 표시합니다. TreeGrid는 포함하지 않습니다.

기존 `?sample=auto-span` 링크도 OwpDataGrid 예제로 열립니다. 패키지를 생략하거나 알 수 없는 값을 넣으면 OwpDataGrid로, 알 수 없는 샘플은 시작 안내로 열립니다. 메뉴와 샘플 링크는 URL에 선택을 반영하며 새로고침·브라우저 앞/뒤 이동도 지원합니다. 패키지를 바꾸면 이전 패키지의 샘플 값은 지우고, 다른 GET 파라미터와 URL 해시는 유지합니다. Cmd/Ctrl+K로 샘플을 검색할 수 있습니다.

기본 언어는 한국어입니다. 상단 `EN` / `한` 버튼으로 영어와 한국어를 전환합니다. 메뉴·설명·컬럼·OWP 기본 컨트롤의 번역은 `shared/i18n`과 각 Playground의 `locales`에 정의하고 `app/i18n.ts`에서 등록하며 외부 번역 API를 사용하지 않습니다. 언어를 바꿔도 편집한 값과 행 선택을 유지합니다. 가상의 담당자 이름과 작업 데이터, 소스 코드는 원래 값으로 표시합니다. 새로고침하면 한국어로 시작합니다.

## 배포 CLI

배포 명령은 서비스별로 분리합니다. 버전별 Playground와 MCP는 같은 아카이브를 조회하므로 하나의 별도 서비스로 배포합니다.

| 명령 | 대상 | 서버 경로·포트 |
| --- | --- | --- |
| `deploy` | 최신 정적 Playground, 기존 Nginx | `/home/owp-playground` · `30010` |
| `deploy:mcp` | 최신 stable 묶음의 버전별 Playground와 HTTP MCP, systemd | `/home/owp-playground-mcp` · `30011` |

두 명령은 SSH 연결 공유 방식을 재사용하며 서비스·배포 잠금·릴리스 보관 경로는 별도로 관리합니다. MCP의 버전 아카이브에는 기존 정적 배포의 최근 5개 릴리스 정리를 적용하지 않습니다. MCP 최초 설치와 이후 갱신은 아래 [MCP 배포](#mcp-배포)를 따릅니다.

다음은 기존 정적 Playground 배포 절차입니다. Mac 터미널에서 회사 VPN에 연결한 뒤 **`pnpm deploy`**를 실행합니다. 프로젝트는 pnpm 12.15.0을 사용하며 모든 배포 명령을 `run` 없이 실행합니다. pnpm 11부터 같은 이름의 프로젝트 script가 내장 명령보다 우선합니다. 관련 변경은 [pnpm 공식 마이그레이션 문서](https://pnpm.io/migration)에 설명되어 있습니다.

```sh
# 실제 전환 없이 네트워크·인증·서버 구성을 먼저 검사합니다.
pnpm deploy:preflight

# 새 빌드부터 전송·current 전환·HTTP 검증까지 수행합니다.
pnpm deploy

# 현재 릴리스와 실제 서비스 상태를 조회합니다. 서버 파일은 변경하지 않습니다.
pnpm deploy:status

# 이전 정상 릴리스 정보를 표시하고 승인 후 전환합니다.
pnpm deploy:rollback

# 보호 대상을 제외한 오래된 정상 릴리스의 삭제 후보를 확인합니다.
pnpm deploy:cleanup --dry-run
pnpm deploy:cleanup
```

첫 배포 전에는 `pnpm deploy:preflight` 결과가 성공인지 확인합니다. 이 명령은 빌드·업로드·`current` 변경을 수행하지 않습니다. 실제 배포 후에는 `deploy:status`에서 릴리스와 health를 확인합니다. `deploy:rollback`은 현재 릴리스와 이전 정상 릴리스를 보여 주고 기본값이 취소인 승인 질문을 표시합니다. 이전 정상 기록이 없거나 배포 잠금이 있으면 중단합니다. rollback 대상의 검증 이후 파일 변경도 거부합니다.

`deploy`에 옵션을 전달할 때는 pnpm의 내장 옵션 해석과 구분하도록 `--`를 넣습니다. 예를 들어 `pnpm deploy -- --help`, `pnpm deploy -- --assume-vpn`, `pnpm deploy -- --preflight-only`로 실행합니다. `deploy:preflight`·`deploy:status`·`deploy:rollback`·`deploy:cleanup`은 옵션을 바로 붙일 수 있습니다.

### 서버와 인증

배포 대상은 `root@192.168.100.20:22`, 기준 경로는 `/home/owp-playground`, URL은 `http://192.168.100.20:30010`, 컨테이너는 `owp-playground-nginx`입니다. 서버에서 의존성 설치·빌드·Git pull을 실행하지 않으며, Docker·Nginx·SSH·SELinux 설정과 Verdaccio는 변경하지 않습니다.

인증은 한금 소비앱 업로드와 같은 기본 OpenSSH 방식을 사용합니다. **명령을 한 번 실행할 때 첫 SSH 인증에서만 비밀번호를 입력합니다.** 이후 SSH 검사·서버 사전 검사·SCP·staging·전환은 [OpenSSH 연결 공유](https://man.openbsd.org/ssh_config#ControlMaster)로 같은 연결을 재사용합니다. 비밀번호는 터미널의 SSH 프롬프트에만 입력하며 CLI가 저장하지 않습니다. 기존 키·SSH Agent도 사용할 수 있습니다. 연결이 끊기면 비밀번호를 다시 묻거나 자동으로 재접속하지 않고 중단합니다.

각 명령은 접근 권한이 `700`인 별도 임시 디렉터리에 연결 공유 socket을 만들며, 정상 종료·실패·Ctrl+C 시 해당 연결과 임시 경로를 정리합니다. SIGKILL 등으로 정리를 실행하지 못하면 연결은 유휴 상태가 된 뒤 최대 10분 후 종료되며 임시 경로가 남을 수 있습니다. `deploy:preflight`·`deploy:status`·`deploy:rollback`·`deploy:cleanup`에도 같은 방식이 적용됩니다. 새 명령을 실행하면 첫 SSH 인증을 다시 진행합니다. `StrictHostKeyChecking=yes`를 유지하므로 처음 접속하는 Mac에서는 `ssh root@192.168.100.20`으로 서버 지문을 확인해야 합니다. 키 생성·공개키 등록이나 SSH 설정 변경은 수행하지 않습니다.

사전 검사는 기존 Bash·tar·coreutils·curl·Docker CLI, 실행 중인 Nginx 컨테이너와 bind mount를 확인합니다. **컨테이너에 `/home/owp-playground` 전체가 bind mount되어 있고, Nginx가 그 안의 `current`를 통해 정적 파일을 제공해야 합니다.** `current` 또는 특정 릴리스만 직접 mount한 구성은 사전 검사에서 중단합니다. 실제 컨테이너 mount는 [Docker bind mount 문서](https://docs.docker.com/engine/storage/bind-mounts/)의 `docker inspect` 방법으로 확인할 수 있습니다. CLI는 mount 설정을 고치거나 컨테이너를 재시작하지 않습니다. 기존 SELinux 레이블과 Nginx 설정이 새 릴리스 접근을 허용하는지는 배포 후 실제 HTTP 파일 검증으로 확인합니다.

### 빌드·전송·전환

매번 로컬에서 `pnpm build`를 새로 실행합니다. 커밋되지 않은 파일 변경도 포함하며, 빌드·artifact 생성 중 소스·설정·설치된 OWP 패키지가 변경되면 전송 전에 중단합니다. 기존 `dist`를 재사용하거나 의존성 버전·lockfile을 변경하지 않습니다.

릴리스 ID는 한국 시간의 `YYYYMMDD-HHMMSS-<short-sha>`입니다. 같은 ID의 릴리스·업로드·배포 이력이 있으면 덮어쓰지 않고 중단하므로 잠시 후 다시 실행합니다. Git SHA만으로 빌드 내용이 같다고 판단하지 않습니다. artifact에는 다음 파일을 추가하며 원본 `dist`는 유지합니다.

- `release.json`: 실제 설치된 `@owp/*` 버전, 빌드 완료 시각(UTC ISO 8601), Git SHA, 작업 트리 변경 여부와 원본 파일 목록의 SHA-256을 기록합니다. 인증 정보·서버 경로는 포함하지 않습니다.
- `deploy-manifest.json`: 파일별 SHA-256과 크기를 기록합니다.
- `deploy-files.sha256`: 정적 파일과 두 JSON 파일의 SHA-256 목록입니다.

artifact 경로는 영문·숫자와 `_ . / @ + -`를 지원합니다. 공백·제어 문자·절대 경로·상위 경로·중복 항목·링크·특수 파일은 거부합니다. SCP 전송 위치는 `releases/.incoming-<release>/artifact.tar.gz`이며 서버에서 파일 크기와 SHA-256을 다시 확인합니다. staging은 소유 식별자와 검증 기록을 확인한 뒤 새로운 디렉터리에 압축을 풀고 전체 파일 수·타입·필수 파일·JavaScript/CSS assets·메타데이터와 파일별 해시를 검증합니다. [GNU tar 옵션](https://www.gnu.org/software/tar/manual/tar.html)으로 기존 파일 덮어쓰기와 소유권·권한 보존을 제한합니다. 디렉터리는 `755`, 정적 파일은 `644`로 설정합니다.

전환 직전에 동일한 파일 검증을 반복합니다. 검증된 `content`를 `releases/<release>`로 옮기고 `current`와 같은 디렉터리에 임시 symlink를 만듭니다. 같은 파일시스템인지 확인한 뒤 [GNU mv](https://www.gnu.org/s/coreutils/manual/html_node/mv-invocation.html)의 `mv -fT`로 `current` symlink 자체를 원자적으로 교체합니다. 로컬 macOS 검증에서는 `mv -fh`를 사용합니다. 기존 `current`를 먼저 삭제하지 않습니다.

### HTTP 검증과 실패 처리

전환부터 HTTP 검증·복구·정리까지 `.deploy-lock`을 유지합니다. 다른 실행은 잠금을 빼앗거나 강제로 삭제하지 않습니다. HTTP 검증은 서버의 curl로 서비스 URL에 접근하며 각 요청에 시간 제한과 cache 방지 query/header를 적용하고 redirect를 따르지 않습니다.

- Nginx 컨테이너 실행 여부와 `/health`의 HTTP 200·`ok` 응답을 확인합니다.
- `/`, `/robots.txt`, SPA fallback의 HTTP 200과 실제 파일 SHA-256을 확인합니다.
- 신규 릴리스의 `/release.json`, `/deploy-manifest.json`, JavaScript·CSS와 `index.html`이 참조하는 로컬 파일을 확인합니다. HTTP 200이어도 이전 HTML이나 잘못된 파일이 반환되면 실패합니다.

전환 전에 기존 릴리스의 파일과 HTTP 응답을 확인해 복구 기준을 확보합니다. 새 릴리스 검증에 실패하면 같은 잠금 안에서 이전 `current`로 원자적으로 복구하고 이전 파일의 HTTP 검증을 반복합니다. 복구에 성공해도 배포 명령은 실패 코드로 종료합니다. 복구까지 실패하면 오류를 표시하고 추가 변경 없이 중단합니다. 수동 rollback의 대상 검증 실패에도 원래 `current`를 복원하고 다시 검증합니다.

정상 릴리스의 파일 해시, 이전 정상 릴리스 포인터와 전환 이력은 `.deploy-state/healthy/`, `.deploy-state/previous`, `.deploy-state/history/`에 보관합니다. 이 상태 디렉터리는 `700`, 파일은 `600`이며 공개 정적 파일 경로에 포함하지 않습니다. 정상 배포 후에는 해당 실행의 서버 임시 업로드와 로컬 artifact를 정리합니다. 실패한 전환의 새 릴리스·artifact·복구 기록은 원인 확인을 위해 보존하며 활성 릴리스를 삭제하지 않습니다.

SSH 중단·완료 응답 누락 시 성공이나 실패를 추측해 재시도하지 말고 `deploy:status`와 서버의 `current`, `.deploy-state/history/`, 남은 `.incoming-<release>/.activation.json`을 확인합니다. SIGKILL·전원 장애 등 trap이 실행되지 않는 종료에서는 잠금과 임시 파일이 남을 수 있습니다. 이 경우 다른 배포가 실행 중인지 확인하고 실제 경로를 점검한 뒤 수동으로 복구해야 합니다. CLI는 남은 잠금을 자동으로 제거하지 않습니다.

`deploy:status`는 SSH로 현재/이전 릴리스·컨테이너·잠금·현재 메타데이터의 실제 패키지 버전을 읽습니다. Mac에서도 `/health`와 HTTP 릴리스 메타데이터를 확인하며 실패하면 종료 코드 1을 반환합니다. `initial`은 릴리스 메타데이터가 없으므로 패키지 목록을 표시하지 않습니다.

### 릴리스 보존과 자동화 옵션

정상 배포 후 릴리스 ID 순으로 최근 정상 릴리스 5개를 유지합니다. `current`, 이전 정상 릴리스, `initial`, 배포 중인 경로와 `.deploy-state/protected/<release>` 표시가 있는 릴리스는 별도로 보호하므로 실제 보존 수는 5개보다 많을 수 있습니다. 정리는 검증된 정상 기록이 있고 `releases` 바로 아래에 있는 실제 디렉터리만 대상으로 합니다. symlink·알 수 없는 디렉터리·실패한 릴리스·진행 중인 `.incoming-*`는 자동 삭제하지 않습니다. 필요하면 해당 서버의 `.deploy-state/protected/`에 릴리스 ID 이름의 파일을 만들어 보호할 수 있습니다. 정리 실패는 배포 성공을 취소하지 않고 별도 메시지로 안내합니다.

```sh
pnpm deploy -- --help
pnpm deploy:preflight --help
pnpm deploy:rollback --help
pnpm deploy:status --help
pnpm deploy:cleanup --help
pnpm test:deploy

# 비대화형 실행: 기존 키·Agent의 비대화형 인증이 필요합니다.
pnpm deploy -- --assume-vpn
pnpm deploy:status --assume-vpn
pnpm deploy:rollback --assume-vpn --yes
pnpm deploy:cleanup --assume-vpn --dry-run
```

`--assume-vpn`은 VPN 연결의 명시적 확인이며 실제 접근 검사를 생략하지 않습니다. 비대화형 실행에서 이 옵션이 없으면 네트워크 검사 전에 중단합니다. 변경 명령인 rollback과 cleanup에는 추가로 `--yes`가 필요하며, cleanup의 `--dry-run`은 삭제 후보만 표시합니다. 비대화형 SSH 인증이 없으면 비밀번호를 우회하거나 저장하지 않고 중단합니다.

배포 테스트는 임시 파일시스템, 실제 macOS Bash·tar·SHA-256·symlink 교체, 시스템 curl과 localhost HTTP 서버에서 실행합니다. SSH와 Docker 컨테이너 조회는 모의 환경을 사용합니다. 실제 프로젝트의 새 빌드로 배포·status·rollback·재복구·정리 미리보기까지 로컬에서 검증했으며 운영 서버의 Rocky Linux·Docker·Nginx 전환은 실행하지 않았습니다. 첫 운영 실행은 위 사전 검사로 서버 구성부터 확인합니다.

### MCP 배포

회사 VPN에 연결한 Mac의 프로젝트 루트에서 실행합니다. 다음 한 명령으로 최신 stable 배포 묶음 선택·검증·전송, 서버 의존성 설치, systemd 서비스 등록·시작, HTTP와 MCP 조회 검증까지 수행합니다.

```sh
pnpm deploy:mcp
```

```sh
# 서버 접속 없이 로컬 묶음과 배포 계획을 확인합니다.
pnpm deploy:mcp --dry-run

# 로컬 오프라인 자료 준비와 서버 상태를 확인합니다. 서버 전송·설치·서비스 변경은 하지 않습니다.
pnpm deploy:mcp:preflight

# 특정 묶음을 선택할 때만 경로를 지정합니다.
pnpm deploy:mcp --bundle .omo/evidence/versioned-mcp/deploy-bundle-8f5e7db

pnpm deploy:mcp --help
pnpm test:deploy:mcp
```

`--bundle`을 생략하면 저장소의 `.omo/evidence/versioned-mcp/` 바로 아래에 있는 `deploy-bundle-*` 디렉터리에서 clean stable 묶음을 찾고 `releaseId`의 날짜·시각이 가장 최신인 것을 선택합니다. 폴더 수정 시각은 사용하지 않습니다. 같은 최신 시각의 후보가 여러 개면 `--bundle`로 구분해야 합니다. 선택한 묶음의 검증이 실패해도 이전 묶음으로 자동 전환하지 않습니다. 검증을 마친 선택 경로와 release ID는 SSH 접속 전에 표시합니다.

묶음에는 `app.tar.gz`, `archive.tar.gz`, `SHA256SUMS`, `release.json`이 있어야 합니다. 명령은 준비된 묶음을 배포하며 새 빌드·commit·스냅샷·묶음 생성을 수행하지 않습니다. 새 묶음을 준비하지 않았다면 기존 최신 stable을 다시 배포합니다.

로컬에서 Linux x64 glibc용 Node.js `24.22.1`·pnpm `12.15.0`과 선택한 stable의 production 의존성을 준비해 전송합니다. 로컬에는 공식 다운로드 사이트·npm registry·사내 OWP registry 접근이 필요합니다. 서버에는 systemd·`ss`·기본 shell 도구가 필요하며, 외부 접속이나 전역 Node.js·pnpm·Corepack 설치는 필요하지 않습니다. 서버 전용 경로에 런타임과 의존성을 설치하므로 서버에서 패키지를 다운로드하지 않습니다. 로컬에서 pnpm `12.15.0`을 직접 실행할 수 있으면 `corepack` 접두어도 필요하지 않습니다.

CLI는 OS 패키지·전역 실행 파일·방화벽·Nginx·Docker 설정을 변경하지 않습니다. 최초 `preflight`에서 전용 런타임이 없으면 설치 필요 상태를 표시하며, 실제 배포에서 런타임 설치 후 전체 서비스 검사를 이어 갑니다. 배포 후 서비스는 `owp-playground-mcp.service`로 운영하며, MCP 주소는 `http://192.168.100.20:30011/mcp`입니다. 처음 연결하는 Mac은 위 SSH 서버 지문 확인 절차를 먼저 따릅니다. 비대화형 실행에는 `--assume-vpn`과 기존 키·Agent 인증이 필요합니다. [오프라인 준비·최초 설치·검증 절차](docs/versioned-mcp.md#로컬-준비와-최초-설치)를 따릅니다.

묶음 검증, 기존 아카이브 보존, 실패 시 복구와 운영 확인 명령은 [버전별 Playground와 MCP의 배포 절차](./docs/versioned-mcp.md#운영-배포-순서)를 따릅니다. 기존 `deploy:status`·`deploy:rollback`·`deploy:cleanup`은 30010 정적 서비스 전용입니다.

## 소스 구조

패키지별 코드와 공통 기능을 분리합니다. 실제 샘플이 있는 패키지만 디렉토리를 만듭니다.

```text
src/
├── app/                      # 앱 구성·번역 등록·레이아웃·Provider
│   ├── layout/
│   ├── providers/
│   └── styles/
├── features/                 # 여러 Playground에서 사용하는 기능
│   ├── api/                  # API·가이드·문서 데이터
│   ├── code/                 # 원본 보기·강조·복사·다운로드
│   └── theme-studio/         # 테마 편집 UI와 설정 모델
│       └── model/            # 프리셋·스키마·입출력·프로젝트 적용 코드
├── playgrounds/
│   ├── registry.ts           # 패키지 목록과 URL 라우팅
│   └── datagrid/
│       ├── catalog.ts        # 메뉴·설명·API·소스·기존 링크 별칭
│       ├── examples/         # 실제 실행하는 TSX 예제
│       ├── guides/           # 설치 안내 화면과 첫 그리드 원본
│       ├── model/            # 예제 등록·데이터·타입·모의 서버
│       ├── runtime/          # DataGrid 실행·설정·이벤트·상태
│       ├── locales/
│       └── styles.css
└── shared/
    ├── i18n/                 # 공통 번역과 독립된 번역 함수
    ├── theme/                # 화면 토큰과 테마 생성
    ├── types/                # 패키지와 무관한 UI 메타데이터
    └── ui/                   # 공통 제목과 Workspace 스타일
```

`app`이 패키지와 공통 기능을 연결합니다. `shared`는 `app`, `features`, `playgrounds`를 import하지 않습니다. 공통 제목·메뉴·코드 보기는 메타데이터를 받아 표시하고, 예제의 DataGrid props·컬럼·Ref 처리는 `playgrounds/datagrid`에 둡니다. 코드 보기와 테마 편집은 서로 필요한 공통 기능을 사용할 수 있습니다.

새 패키지는 `playgrounds/<package>`에 실제 예제·카탈로그·런타임을 추가하고 `registry.ts`와 `app/App.tsx`에서 연결합니다. 등록된 ready 라우트의 타입과 패키지별 샘플 조회도 함께 확장합니다. 패키지 번역은 해당 `locales`에 두고 `app/i18n.ts`에 등록합니다. 현재 준비 화면인 패키지는 실제 구현 전까지 그대로 유지합니다.

새 소스 파일은 재귀 탐색으로 코드 보기와 빌드 리소스에 자동 포함됩니다. 파일 이름이 중복되면 코드 선택 메뉴에 경로를 표시합니다. `features/code/source-paths.ts`는 패키지별 소스 경로와 기존 공개 주소의 호환 매핑만 관리합니다. 재사용할 소스를 받을 때는 새 디렉토리 구조의 `/snippets/<src 상대 경로>`를 기준으로 상대 import를 함께 유지합니다.

공통 컴포넌트와 상태 관리 코드는 역할에 따라 이름을 짓습니다. `WorkspaceHeading`은 제목과 경로, `ChartCanvas`는 차트 렌더링과 높이·이벤트 연결, `useGridController`는 그리드 상태와 동작을 담당합니다. 카탈로그 항목은 `ExampleMetadata`, `GridCatalogEntry`, `ChartCatalogEntry`로 구분하며 내부 탐색에서는 `example`을 사용합니다. 기존 URL의 `sample`, 공개 카탈로그의 `samples` 필드와 소스 주소는 유지합니다.

DataGrid 실행부는 `GridWorkspace`, `GridToolbar`, `GridSettingsDrawer`, `GridStatusBar`로 역할을 구분합니다. 각 실행 파일은 `FixedRowsGrid`, `EditableCellsGrid`, `SelectEditorsGrid`처럼 기능을 나타내는 컴포넌트와 초기 `gridConfiguration`을 내보냅니다. `model/gridTypes.ts`는 `GridConfiguration`·`GridViewProps` 계약을, `model/gridRegistry.ts`는 51개 컴포넌트와 설정의 연결을 관리합니다. `getGridConfiguration`은 등록된 설정에 현재 언어를 적용합니다.

CSS는 화면의 소유권에 맞춰 관리합니다. 앱의 배치는 `app/styles/shell.css`, 공통 제목·탭·툴바·이벤트·프레임은 `shared/ui/workspace.css`, 공통 가이드는 `shared/ui/guide.css`에 둡니다. DataGrid의 `styles.css`는 import 진입점이며, 실행 화면은 `runtime/workspace.css`, 패키지 스타일 보정은 `runtime/grid-overrides.css`, 예제별 표현은 `examples/styles.css`로 나눕니다. 예제 CSS 진입점은 `controls.css`, `cell-renderers.css`, `detail-panel.css`를 불러오며 선택자는 `.grid-preview` 안에 적용합니다. Drawer와 Dialog는 Portal에 표시되므로 각각 `grid-settings-*`, `grid-row-dialog` 클래스로 범위를 지정합니다. Charts·코드 보기·테마 편집은 각 기능의 CSS를 사용하고, 실행 중 바뀌는 테마 값은 CSS 변수로 전달합니다.

## 샘플 구성

공통 변경 내역 패널은 표시하지 않습니다. 변경 건수와 이벤트, ‘변경 관리’의 확정·되돌리기 기능은 사용할 수 있습니다. ‘숫자·날짜 서식’은 상단의 ‘금액 소수 자릿수’에서 금액 표시·입력과 Excel 숫자 서식을 소수점 아래 1~6자리로 조정합니다.

첫 메뉴 ‘시작’은 프로젝트 `.npmrc`의 OWP 레지스트리 설정, 패키지 설치, 타입이 포함된 첫 그리드 예제를 안내합니다. `/?sample=getting-started`로 바로 열 수 있습니다. 레지스트리 URL과 접근 권한은 Impix SmartBiz 팀에 문의합니다.

설치·사용 안내와 51개 실행 샘플을 연관된 기능에 따라 12개 예제 그룹으로 분류합니다. Grid API 메뉴에서 Hook 연결·Ref 연결을 같은 데이터와 동작으로 비교하고, 기능별 예제는 Hook을 기본으로 사용합니다. Charts와 같은 탐색 메뉴를 사용하며 한국어 화면에서는 그룹명 아래에 영어 이름을 작은 부제로 표시하고, 영어 화면에는 영어 그룹명만 표시합니다. ‘표시 행 수 고정’은 10행 표시 영역에 선택·합계를 함께 보여줍니다. ‘외부 버튼 제어’는 행 선택·선택 해제·삭제를 실행합니다. 행 선택 방식·모서리 둥글기·필터 표시는 ‘설정’에서 조정합니다. 기존 `minimal`, `visible-rows`, `radius` 링크는 ‘표시 행 수 고정’으로 연결합니다.

- 기본: 시작, 표시 행 수 고정.
- 셀·컬럼: 셀 타입, 행별 셀 타입, 셀렉트, 숫자·날짜 서식, 셀 컴포넌트, 긴 내용 보기, 고정 컬럼, 다단 헤더.
- 스타일: 조건부 스타일, 커스텀 스타일.
- 셀 병합: 지정·자동 행 병합, 열 병합, 행·열 병합, 병합·가상 스크롤.
- 선택·이벤트: 외부 버튼 제어, 새 행 선택, 클릭 이벤트, 컨텍스트 메뉴.
- 정렬·필터: 다중 정렬, 컬럼 필터.
- 편집·검증: 셀 편집, 서버 저장, 입력 검증, 검증 메시지.
- 행 관리: 행 편집 툴바, 행 추가 위치, 삭제·복구, 드래그 이동.
- Grid API: Hook 연결, Ref 연결, 행 조회·일괄 처리, 셀 값·포커스, 행 이동, 변경 관리. Hook과 Ref는 같은 API를 제공하며 연결 방식이 다릅니다. 두 연결 예제에서 행 조회·포커스를 비교하고 공통 기능 예제는 Hook으로 제어합니다. 기존 ref-* URL과 catalog ID는 유지합니다.
- 집계·계산: 집계·고정 행, 계산·셀 연동.
- 트리·상세: 트리, 다단계 트리, 트리·병합, 상세 패널, 상세 그리드.
- 데이터·로딩: 데이터 없음, 오류·재시도, 서버 조회, 대용량 데이터.
- 내보내기: Excel 내보내기, Excel 내보내기 API, 병합·Excel.

셀 배경색·행 배경색·조건부 스타일은 ‘조건부 스타일’에서 적용 범위와 완료 행 편집 제한을 선택합니다. 다단 헤더·하위 헤더 정렬은 ‘다단 헤더’에서 정렬 버튼을 켜고 끕니다. 일괄 변경·조회·일괄 처리는 ‘행 조회·일괄 처리’에서 전체 행·필터 결과·선택 행을 처리합니다. 기존 `cell-background`, `row-background`, `header-sort`, `transactions` 샘플 주소도 통합된 예제로 연결되며, `row-background`로 열면 행 배경색이 선택됩니다. 변경 확정·되돌리기는 ‘변경 관리’에서 제공합니다.

‘데이터 없음’은 빈 그리드로 시작하며 상단 버튼으로 로딩을 시작·종료합니다. 종료하면 빈 화면으로 돌아갑니다. 기존 `loading` 링크도 이 샘플로 연결합니다. ‘셀렉트’는 검색 없는 셀렉트와 검색 가능한 자동완성에서 단일·다중 선택을 지원합니다. 일반 다중 선택은 `selectOptions.multiple`, 자동완성 다중 선택은 `autocompleteOptions.multiple`을 사용합니다. 기존 `autocomplete` 링크는 자동완성 모드로 연결합니다.

‘커스텀 스타일’은 2단·3단 헤더, 기본·줄무늬·강조 프리셋과 12–18px 글자 크기를 즉시 적용합니다. 그룹 헤더와 하위 헤더의 색상·크기를 함께 바꾸며 입력한 값은 유지됩니다. `@owp/datagrid` 3.0.0의 `sx` 객체·테마 콜백·조건부 배열과 공개 클래스 선택자를 사용합니다. 행 높이는 `virtualization.rowHeight`, 헤더 높이는 `OwpThemeProvider.dataGrid.header.height`로 설정합니다. 프리셋과 크기를 바꿔도 편집값과 테마는 유지됩니다. Portal에 표시되는 편집기 목록은 루트 `sx`의 적용 범위 밖입니다.

필터·enum 메뉴의 hover와 선택 배경은 예제 테마의 `enumMenu` 색상을 사용합니다. 다크 모드에서는 Grid 경계색의 밝기를 높여 편집 가능 셀 배경과 구분하며, 화면 전체 경계색과 사용자가 지정한 테마 override는 유지합니다.

숫자·날짜 서식 한 화면에서 YYYY-MM-DD, YYYY, YYYY-MM, 초 단위 시간·일시를 비교합니다. 날짜와 시간은 가운데 정렬합니다.

대용량 데이터는 생성 시작 시 기존 행·선택·변경·필터를 비우고 새로 채웁니다. 취소하면 빈 상태를 유지합니다. 행 수 선택을 변경하면 데이터 생성 버튼이 강조됩니다. 데이터 생성 시간을 제외한 ‘그리드 반영 시간’을 ms 단위로 보여주며, 측정값은 테스트 환경에 따라 다를 수 있습니다. 상세 그리드는 별도 Excel 버튼으로 하위 작업과 합계를 내보냅니다. 서버 조회는 정렬·필터 조건을 외부 함수에 넘기는 방식이며, 이 프로젝트의 조회·저장 함수는 지연 시간을 둔 모의 구현입니다.

데이터는 가상의 프로젝트·작업·담당자를 사용합니다. 한금 소비앱 A20000–A60000에서는 기능과 상호작용 패턴을 참고했으며 업무 코드, 고객 이름, API 응답을 사용하지 않습니다. `@owp/treegrid`는 설치하지 않습니다. OwpDataGrid 자체의 트리 기능은 포함합니다.

## Charts

`@owp/charts` 5.0.1의 시작 가이드와 70개 예제 메뉴에서 97개 구성을 제공합니다. 패키지 메뉴에서 OwpCharts를 선택하거나 `/?package=charts`로 엽니다. 탐색 메뉴의 DataGrid·Charts 버전과 두 시작 가이드의 설치 명령은 설치된 패키지의 버전을 사용합니다. Excel은 2.x, Core는 7.x 기준으로 안내합니다.

Semi circle은 공정별 처리 수량의 비중을 반원으로 보여줍니다. Radar는 생산 라인 A·B의 생산성, 품질, 가동 안정성, 납기 준수, 에너지 효율, 예방 정비를 같은 0–100점 척도로 비교합니다. Semi circle은 `OwpRadialChart`, Radar는 `OwpRadarChart`를 사용하며 패키지가 native geometry·hit test·OWP HTML 툴팁·범례를 처리합니다. 두 예제 모두 OWP API 문자열 데이터를 `chartFromApi`로 변환합니다.

| 분류 | 예제 수 | 포함 내용 |
| --- | ---: | --- |
| 차트 유형 (Chart types) | 22 | 막대·선·영역·복합·원형·분포·구성 차트 |
| 축·시간 (Axes·Time) | 14 | 다중 축, 범위·간격·눈금·제목, 시간 간격·누락 구간·다운샘플링 |
| 범례·Tooltip (Legend·Tooltip) | 5 | 범례 설정, Tooltip 설정, HTML tooltip, hover 영역, 외부 버튼 제어 |
| 확대·동기화 (Zoom·Sync) | 5 | 드래그·휠·pinch zoom, X·Y slider, Crosshair·tooltip 동기화 |
| 라벨·주석 (Labels·Annotations) | 6 | 데이터 라벨·추세선·목표선·기준 범위, 영역 테두리·사분면 |
| 스타일 (Style) | 5 | 제목·부제목, 막대 radius·조건색, 선 패턴·보간·Point, Stepped·segments |
| 데이터·연동·내보내기 (Data·Export) | 5 | Live chart, 셀 sparkline, 상세 패널, 상태, PNG 내보내기 |
| 활용 (Use cases) | 8 | 순위·Top N, 계획·실적, 입고, 이행률, OEE, Pareto, 예측, Small multiples |

차트 종류와 기능 설정을 8개 메뉴로 나눕니다. 비슷한 예제 27개는 공통 예제의 옵션으로 통합했습니다. Column·Bar의 그룹·방향, 누적·100% 누적, 단일·다중 Line, Area·누적 영역, Pie·Doughnut·반원·다중 고리를 각각 한 화면에서 비교합니다. 범례·Tooltip·축·제목·막대·선 설정, PNG 내보내기와 순위 표시도 관련 옵션을 함께 제공합니다. 좌우 축의 데이터 연결 방식, Grouped stacks와 다단 축처럼 목적이 다른 예제는 유지합니다.

기존 97개 URL은 해당 구성을 선택한 상태로 열립니다. 구성을 바꾸면 제목·코드·데이터·이벤트·관련 API가 함께 바뀌고 URL에도 반영됩니다. 구성별 실행 소스는 별도 파일로 유지하며, 코드 탭에는 선택한 구성의 완전한 소스를 표시합니다. 탭 이동 중에는 설정과 이벤트를 유지하고, 초기화하면 현재 구성의 기본 설정으로 돌아갑니다. Box plot·Treemap·Heatmap의 예제 탭은 전용 컴포넌트를 실행합니다. 코드 탭의 **구성 방식**에서 **전용 컴포넌트 / 직접 구성**을 선택하면 각 방식의 완전한 실행 소스를 확인할 수 있습니다.

한금 소비앱에서 검토한 15개 차트 렌더링 구현을 모두 대응 예제에 포함했습니다. `src/playgrounds/charts/model/coverage.ts`에서 대응 관계를 확인할 수 있습니다. 데이터는 가상 생산량·설비 측정값이며 소비앱의 고객 데이터나 API 응답을 포함하지 않습니다.

예제·코드·데이터·이벤트 탭과 초기화 버튼을 제공합니다. 코드 탭은 실제 실행하는 TSX와 공통 모델을 표시하며 복사·다운로드할 수 있습니다. 데이터 탭은 DataGrid와 같은 뷰어에서 현재 예제의 API response 행 배열을 표시합니다. 100개씩 범위를 이동해 전체 데이터를 확인하며, 현재 페이지를 JSONC 또는 JSON으로 복사·다운로드할 수 있습니다. 복합 차트의 series와 연결 차트의 겹치지 않는 구간도 함께 표시합니다. 이벤트는 데이터 갱신·상태 변경·내보내기·차트 클릭을 최근 50개까지 기록합니다. 범례와 초기화 버튼은 키보드로 접근할 수 있으며, 네이티브 축 slider는 포인터·터치로 조작합니다.

월별 생산 계획·실적·라인 A/B/C의 생산량, 설비 가동률·성능·품질은 스마트 팩토리 기준의 가상 데이터로 통일했습니다. 라인 생산량의 합은 전체 실적과 일치하며, 달성률과 OEE도 원본 값에서 계산합니다. Stacked Column·Line의 목표는 월별 생산 계획에 따라 달라집니다. Area·Stacked area·센서 시계열에는 부하 전환과 재현 가능한 측정 편차를 반영합니다. Small multiples·Scatter·Bubble·sparkline도 설비별로 다른 추이를 사용합니다.

Layered column은 `Column 겹치기`와 `값 표시`를 각각 켜고 끌 수 있습니다. 두 연도의 값이 가까워도 라벨이 겹치지 않게 좌우로 나눕니다. Grouped stacks by line은 라인별 연도 구역 안에서 주간조·야간조를 누적하고, Divergent forecast는 관측 생산량 이후 세 운영 시나리오를 점선으로 비교합니다. Stepped line은 53일의 치수 편차를 계단으로 표시하며 하단 slider로 확대합니다. Heatmap은 요일·시간별 생산량, Treemap은 설비 생산량에 비례하는 불투명 사각형을 빈틈없이 배치하고 중앙에 설비 코드와 값을 표시합니다. 라인별 색상과 범례·HTML tooltip은 유지합니다.

차트와 zoom·범례·tooltip·PNG 내보내기는 패키지의 public API를 사용합니다. 히스토그램 구간 집계와 min/max 시계열 다운샘플링은 예제 코드에서 처리합니다. Area·Box plot·Treemap·Radar·원형·Heatmap·Live chart는 전용 `Owp` 컴포넌트를 사용합니다. 패키지가 유형별 geometry·hit test·범례 상태·Live 이동을 담당하고, 앱은 API 응답 변환·가상 데이터 생성·polling·샘플 조작·카드 높이를 담당합니다. Bar·Line·복합 차트는 `ChartFrame preset="owp"`로 공통 스타일과 HTML 툴팁을 적용합니다. 날짜·시간 예제는 별도 날짜 adapter 없이 category 축의 label을 서식화합니다. Column·Bar·Line 생성은 `createChartData`, 원형 차트는 ID가 있는 `rings`·`items`, Gauge는 전용 생성 함수를 사용합니다. 시작 가이드는 레지스트리·peer dependency·최소 실행 코드와 Tailwind가 없는 환경의 레이아웃 CSS를 안내합니다. Playground에서는 해당 CSS를 차트 영역으로 제한해 적용합니다. 기본 메뉴의 SVG sprite는 `public/assets/icons`에서 제공하며, 자체 프로젝트에 적용할 때는 OWP Core 아이콘 리소스를 배포하거나 `exportRef` 외부 버튼을 사용할 수 있습니다.

한금의 일반 차트와 같은 top 16px·right 8px plot padding, 4px Column radius, 2px Line과 3px point를 기본으로 적용합니다. 카드 padding과 설정·차트 사이 gap은 16px이며 작은 화면의 padding은 12px입니다. Gauge와 Doughnut은 카드 너비와 화면의 남은 높이에 맞춰 크기를 조절하며, 눈금·범례와 카드 하단 정보의 공간을 함께 확보합니다. 두 차트의 높이는 최대 420px이며, 아주 낮은 화면에서는 조작 요소를 자르지 않고 본문 스크롤을 허용합니다. 범례는 기본 하단 중앙이며, 범례 예제에서는 상단 중앙으로 바꿀 수 있습니다.

`/?package=charts&sample=linked`의 **Crosshair·tooltip 동기화** 예제는 서로 다른 월 범위의 두 차트를 `syncBy: 'label'`로 연결합니다. 3~10월에 포인터를 올리면 같은 월의 crosshair와 tooltip을 확인할 수 있고, crosshair·tooltip·zoom 동기화를 각각 켜고 끌 수 있습니다. 동기화 옵션은 같은 차트 인스턴스에 반영합니다. `hover-layer`는 단일 차트의 hover 영역과 crosshair 표시를 다룹니다.

`/?package=charts&sample=live`의 **Live chart** 예제는 앱에서 1초마다 가상 측정값을 추가하며, 왼쪽 경계 연결용 한 건을 포함해 최근 61개를 보관합니다. 표시 구간은 10–60개로 바꿀 수 있습니다. X축은 초 단위 눈금을 만들고 화면 폭에 맞춰 최대 16개 라벨을 분:초로 표시합니다. Tooltip과 데이터 탭에서는 전체 시각을 확인할 수 있습니다. 일시정지·다시 시작·한 건 추가를 지원하며, 브라우저 탭이 가려지면 타이머를 멈추고 예제에서 나가면 정리합니다. `OwpLiveChart`가 데이터와 X축의 시간 눈금·격자선을 같은 표시 구간으로 1000ms 동안 함께 이동합니다. 새 값은 오른쪽에서 들어옵니다. 움직임 줄이기 설정에서는 즉시 갱신합니다. 실제 서버에 연결하지 않는 데이터 스트림 예제입니다.

Gauge는 `motion.animateOnMount: true`로 최솟값(-40)에서 초기값(76)까지 500ms 동안 이동합니다. 이후 1.5초마다 가상 값을 갱신하며, 바늘과 숫자는 같은 500ms 동안 이동합니다. 일시정지·다시 시작을 지원하고 값을 직접 조절하면 자동 갱신을 멈춥니다. 브라우저 탭이 가려지거나 예제에서 나가면 타이머를 정리하며, 움직임 줄이기 설정에서는 값을 즉시 갱신합니다.

Box plot은 실제 관측값에서 Q1·중앙값·Q3와 1.5 IQR 수염·이상치를 계산합니다. Pareto는 발생 건수를 내림차순으로 정렬하고 누적 비율과 80% 기준선을 겹쳐 표시하며, 누적 비율 Line을 Bar 위에 그립니다. 누적 축의 0–100% 범위를 유지하면서 상단 padding과 Line의 clip 여유를 확보해 100% 지점의 점도 온전히 표시합니다. Grouped stacks는 그룹별 누적을 켜면 범례에 그룹 번호를 표시하고, 끄면 series 이름만 표시합니다. 모드를 전환해도 series의 표시·숨김 상태는 유지합니다. `@owp/charts` 4.0.3이 누적 series의 범례 표시 상태에 맞춰 남은 series의 좌표를 다시 계산하며, 샘플은 패키지의 기본 전환을 사용합니다. 군집 Scatter는 네 군집의 반투명 점을 최대 20,000개까지 표시하며 하단 X·오른쪽 Y slider로 범위를 조절합니다.

한국어 화면에서는 그룹명 아래에 영어 이름을 작은 부제로 표시하고, 영어 화면에서는 영어 그룹명만 표시합니다. 범례와 툴팁은 별도 그룹입니다. 표시되는 모든 차트 툴팁은 `ChartFrame`의 `externalTooltip`을 사용하며, Box plot 통계값·날짜 서식·point 표시와 연결 차트의 동기화를 유지합니다. HTML tooltip 예제에서는 화면 경계 여백을 조절할 수 있습니다. 그리드 셀 sparkline은 기존처럼 툴팁을 표시하지 않습니다.

활용 그룹의 Small multiples는 기본 6개를 3열 × 2행으로 배치하고, 좁은 영역에서는 2열·1열로 전환합니다. Histogram은 동일한 폭의 구간에 포함된 관측값 수를 집계하며, 막대를 붙여 연속 구간을 표현합니다. Top N·순위·Pareto의 항목, Box plot의 그룹, Small multiples의 설비는 테마에 맞는 색상으로 구분합니다.

모든 차트는 `ChartFrame`의 OWP 범례를 사용합니다. 일반 차트의 범례는 패키지의 160ms show/hide 전환을 사용합니다. `범례로 표시·숨김` 예제에서 `범례 애니메이션`을 끄면 즉시 전환하며, 데이터 갱신 애니메이션은 유지합니다. 단일 Pie·Doughnut은 항목별 geometry를 전환합니다. Multi-series pie는 기본적으로 두 ring의 범례를 표시하며, `항목별 범례`를 켜면 각 ring과 그 안의 항목을 독립적으로 전환합니다. Live chart는 이동과 범례 opacity 전환을 패키지의 공용 frame driver에서 처리하며, 일시정지 중에도 범례를 조작할 수 있습니다. `window.axisLayout`으로 시간 라벨 폭과 축 높이를 예약해 이동 중 plot 영역을 고정합니다. 움직임 줄이기·숨겨진 탭에서는 범례 효과를 생략합니다. 시계열 Tooltip은 원본 ISO 데이터를 유지하면서 축과 같은 UTC 기준의 날짜·시간으로 표시합니다.

차트 예제의 번역 hook은 현재 공개 경로인 `@owp/components/hooks`의 `useOwpTranslation`을 사용합니다. `owp` namespace에 차트 번역을 등록합니다. 설치된 `@owp/core` 7.0.0은 이 hook을 export하지 않습니다.

정수 축·소수 축·긴 label 처리는 별도 예제에서 제외했습니다. 기존 URL은 각각 눈금 간격·눈금 서식·Bar 예제로 연결합니다. Pie는 9개 공정의 생산 비중을 촘촘한 조각과 항목·비율 라벨로 표시합니다. Multi-series pie는 중앙이 빈 두 고리로 2026·2025년을 비교하며 얇은 경계와 명도로 구분합니다. Doughnut은 같은 단색 팔레트와 둥근 조각을 사용합니다. 넓은 화면에서는 바깥 라벨과 연결선을 표시하고 작은 화면에서는 범례·툴팁에서 항목과 비율을 확인합니다. 그라데이션 로직과 전용 메뉴는 제거했습니다.

애니메이션 그룹과 전용 예제 6개는 사용자 요청으로 제외했습니다. 일반 차트에는 `createChartOptions()`의 애니메이션과 전환 기본값을 적용합니다. `preset="owp"`는 일반 애니메이션을 기본으로 끄므로, 예제의 움직임을 유지하는 `chartMotion` 설정은 명시적으로 전달합니다. `@owp/charts`는 4.0.2부터 일반 차트의 최초 반응형 레이아웃 조정 중에도 진입 보간을 유지하므로 샘플에서 재생용 timer나 reset을 추가하지 않습니다. Live chart는 패키지 계약에 따라 첫 snapshot을 실제 timestamp 범위에 즉시 표시하고, 후속 데이터부터 기존 시간 창 이동을 적용합니다. Gauge의 최초 바늘 움직임은 전용 driver의 공개 옵션으로 연결합니다. 대량 시계열·군집 Scatter·그리드 셀 sparkline은 성능을 위해 일반 애니메이션을 끕니다. 기존 애니메이션 예제 URL은 관련 Column·Line 예제로 연결합니다.

`@owp/charts` 4.0.1이 slider의 접근성 속성과 키보드 조작, 범례의 키보드 포커스, zoom 초기화 버튼의 Tab 순서와 포커스 복귀를 처리합니다. 샘플에서 내부 DOM을 수정하지 않으며, 여러 Y축 예제는 `ariaLabel`과 `valueTextFormatter`로 축의 의미와 백분율 서식을 전달합니다. 로딩·빈 데이터·오류 예제는 `ChartFrame`의 `loading`·`noData`·`noDataMessage`·`errorOverlay`를 사용합니다. 패키지가 상태 안내와 오류 Alert·재시도 버튼을 표시하고, 샘플은 상태 선택과 재시도 callback을 담당합니다. 상태 표시 우선순위는 로딩 → 오류 → 빈 데이터이며, `noData`는 호출자가 명시적으로 지정합니다.

Chart.js 공식 실행 샘플 75개 중 신규 40개, 기존 9개, 대체·연관 예제 13개를 제공합니다. 애니메이션 전용 6개와 그라데이션 2개는 제외했습니다. 시간축 3개·로그축·Subtitle은 전용 실행 예제로 제공하며, PolarArea 3개와 custom scale·controller 2개는 패키지 지원이 필요한 `unavailable` 5개입니다. Area·Radar는 패키지가 등록한 native Filler·Radar·RadialLinearScale을 사용합니다. 예제는 설치된 정식 `@owp/charts` 5.0.1의 공개 API를 사용합니다. 정확한 대응 범위와 제약은 [Chart.js 샘플 대응표](src/playgrounds/charts/CHARTJS-SAMPLES.md)를 확인합니다.

Native 시간축의 Luxon 경로는 optional peer인 `luxon` 3.x·`chartjs-adapter-luxon` 1.3.1 이상을 준비한 뒤 첫 chart mount 전에 `@owp/charts/chartjs/time`의 `registerChartTime()`을 await합니다. 현재 Playground에는 두 peer를 설치했으며 `time-line`·`time-combo`·`time-max-span`은 초기화가 끝난 뒤 표시합니다. 기존 `date-time`·`time-series` 예제는 category 축을 유지합니다. 다른 날짜 adapter를 이미 사용하는 앱은 기존 초기화를 유지하고 이 helper를 호출하지 않습니다. 로그축은 native wheel·pan·drag zoom·reset을 지원하지만 로그축의 OWP `zoomSlider`를 활성화하면 `RangeError`가 발생합니다. Subtitle은 `options.plugins.subtitle`로 설정하며 canvas·PNG export에 반영됩니다. `log-scale`은 선형·로그 Y축 비교, `subtitle`은 부제목 표시·여러 줄·정렬과 PNG 저장을 제공합니다. Scatter·Multi-axis scatter·Quadrants는 native `scatter`, Bubble은 native `bubble`과 point의 `r`을 사용합니다.

패키지 메뉴는 구현된 DataGrid·Charts를 위에 표시하고 나머지는 `준비 중`으로 비활성화합니다. 기존 준비 화면의 직접 URL은 유지합니다.

## 코드와 리소스

본문 액션 버튼은 아웃라인을 기본으로 사용합니다. 단일·다중 선택이나 드래그 대상처럼 선택 상태를 유지하는 버튼은 선택된 값만 채움으로 표시합니다.

부모 높이가 정해진 예제와 중첩 그리드는 공개 `height="100%"` 속성을 사용합니다. `package.json`에 지정한 `@owp/datagrid` 3.5.0의 기본 동작에 따라 데스크톱에서는 부모 높이를 채우고, 태블릿에서는 500px, 모바일에서는 420px로 표시합니다. 공통 미리보기도 같은 속성을 전달합니다. 태블릿·모바일에서는 미리보기 영역이 컨트롤과 그리드 높이에 맞춰 늘어나며, 상세 그리드는 상세 패널 안에서 스크롤할 수 있습니다. ‘표시 행 수 고정’ 예제는 지정한 행 수에 따른 자동 높이를 유지합니다. 독립된 그리드에 고정 높이가 필요하면 `height={420}`처럼 숫자를 지정할 수 있습니다.

코드 탭은 각 샘플의 실제 TSX 컴포넌트를 기본으로 보여줍니다. 이 파일은 `<OwpDataGrid ... />`를 반환하며 미리보기에서도 같은 컴포넌트를 사용합니다. 모든 DataGrid 예제는 한금 소비앱처럼 정적 컬럼·레이아웃·서식을 `examples/configs`에, 공용 row 타입과 예제 콜백 계약을 `types/index.ts`에 둡니다. 상세 패널·차트처럼 별도 렌더링이 필요한 구현은 `examples/components`에서 관리합니다. 실행 파일은 native props·Ref 연결, 상태와 이름 있는 이벤트 핸들러를 보여줍니다. 부모와 연결할 때는 선택적인 `callbacks`를 전달하며, `runtime/taskGridPreview.tsx`가 미리보기의 이벤트·데이터·로딩 관찰용 props를 이 계약에 연결합니다. 기존 예제 URL과 source export, props 우선순위와 동작을 유지합니다. 데이터·타입·번역·테마는 공유하며 파일 선택에서 원본을 확인할 수 있습니다. 코드 표시·복사·다운로드와 `/snippets` 리소스는 같은 포맷된 원본을 사용합니다. 공통 실행부는 선택·편집·이벤트 기록용 props를 전달합니다. 데이터 탭은 현재 작업 데이터를 OWP API response 형식으로 표시하며, 100개씩 범위를 이동할 수 있습니다. 이벤트는 최근 40개로 제한합니다.

### API response 데이터와 transform

Charts와 DataGrid의 데이터 탭은 테이블 대신 API response의 행 배열을 표시합니다. 한금 API처럼 점을 포함한 문자열을 하나의 키로 사용합니다. 샘플 필드명은 업무 테이블에 종속되지 않는 `OWP_DATA.DATA1`, `OWP_DATA.DATA2` 형식으로 통일합니다. 실제 서버 연결을 수행하는 예제가 아니라, 현재 샘플 값을 담은 가상 response입니다.

```jsonc
[
  {
    "OWP_DATA.DATA1": "task-1", // 행 식별자
    "OWP_DATA.DATA2": "라인 A", // 프로젝트
    "OWP_DATA.DATA3": "설비 점검", // 작업명
    "OWP_DATA.DATA17": null // DataGrid 부모 참조: 부모 행의 DATA1, 루트는 null
  }
]
```

필드 의미는 각 샘플의 주석을 기준으로 확인합니다. Charts는 DATA1에 분류·시각 또는 X 좌표를, DATA2 이후에는 각 series의 값을 배치합니다. 숫자는 문자열로 전달하고 데이터가 없는 위치는 `null`로 유지합니다. DataGrid는 공통 필드 순서를 유지하며, DATA17은 부모 ID, DATA19는 같은 구조를 반복하는 자식 행 배열입니다. nested 데이터는 부모의 DATA19 안에 자식을 한 번만 포함합니다.

- Charts: `model/data.ts`의 `monthlyApiRows`를 `model/apiData.ts`의 `chartFromApi`로 변환합니다. 공통 월별 예제는 변환한 숫자 데이터를 사용합니다. 각 데이터 탭은 현재 예제의 series와 표시 범위에 맞춘 response를 제공합니다.
- DataGrid: `model/data.ts`의 `createTaskApi`가 response 행을 만들고, `model/apiData.ts`의 `taskFromApi`가 숫자·boolean·부모·자식을 화면 모델로 변환합니다. 편집 후 데이터 탭에는 현재 값을 response 형식으로 반영합니다.
- 시작 가이드는 OWP API 필드를 직접 연결하거나 transform을 거쳐 연결하는 코드를 제공합니다. 실제 응답의 필드명으로 교체할 때도 점을 분리하지 않고 `row['테이블명.컬럼명']`으로 접근합니다.

대량 데이터는 현재 페이지의 최대 100개만 변환·문자열화·구문 강조합니다. 전체 범위를 순서대로 이동할 수 있으며 복사·다운로드 대상도 현재 페이지입니다. 기본 JSONC에는 필드 설명과 참조 관계 주석이 포함됩니다. **필드 설명 주석**을 끄면 주석 없는 JSON을 복사하거나 다운로드합니다. 코드 탭·복사·다운로드·배포 snippet은 모두 Biome의 동일한 들여쓰기·줄바꿈이 적용된 원본 파일을 사용합니다.

모든 샘플 컬럼은 `relWidth`로 남는 너비를 나눠 쓰며, `minWidth`로 작은 화면의 읽기 가능한 너비를 유지합니다. 셀 타입 예제는 일반 Select와 Autocomplete를 함께 보여주며, ‘셀렉트’ 예제에서 검색 여부와 단일·다중 선택을 비교합니다. ‘설정 → 모서리 둥글기’에서 각진 형태와 작은·중간·큰 모서리를 선택할 수 있습니다.

빌드 시 다음 정적 리소스도 생성합니다.

- `/catalog.json`: 패키지, 샘플 ID, 분류, 설명, 사용 API와 소스 이름.
- `/catalogs/datagrid.sources.json`: 같은 카탈로그의 설명·API와 실제 설치된 패키지 버전, 예제별 진입 소스·타입·스타일 의존 파일, 각 파일의 SHA-256 및 직접 import 관계. 파일 경로는 `/snippets/` 원본을 가리킵니다.
- `/packages.json`: 패키지 선택 값, 이름과 샘플 준비 상태.
- `/catalog.en.json`: 같은 DataGrid 샘플의 영어 설명.
- `/catalogs/charts.json`, `/catalogs/charts.en.json`: Charts 가이드와 70개 예제의 한국어·영어 카탈로그.
- `/snippets/playgrounds/{package}/{source}`: 패키지별 실행 예제와 모델·데이터·타입.
- `/snippets/features/{feature}/{file}`: 코드 보기·테마 편집 기능의 원본.
- `/snippets/shared/{area}/{file}`: 공통 UI·테마·번역 함수.
- 기존 `/snippets/samples/{source}`, `/snippets/app/{file}`, `/snippets/theme/{file}` 등은 현재 원본을 제공하는 호환 주소로 유지합니다.

기본 표시(`overview`), 행 선택(`selection`), 셀 편집(`editing`), 변경 관리(`ref-changes`), 서버 저장(`save-changes`)은 같은 작업 데이터와 작성 기준을 사용합니다. 서버 저장은 모의 응답을 사용하며, 편집 확정·검증 후 요청 당시 행을 `submittedRow`로 전달해 저장 대기 중 추가 편집을 보존합니다. 취소·초기화·예제 이동 시 대기 요청을 중단합니다. 기존 `server-save` URL은 변경 관리로 연결되는 호환 동작을 유지합니다.

입력 검증(`validation`) 예제는 `validationMode`의 `onCommit`·`manual`과 `clearErrorOnInput`의 `false`·`true`를 각각 선택해 비교합니다. 초기값은 기존 동작인 `onCommit`·`false`입니다. 작업명을 비우거나 완료 수량을 계획 수량보다 크게 입력하면, `onCommit`에서는 확정을 시도할 때 자동 검증합니다. `manual`에서는 입력·편집 확정·자동 값 갱신으로 required·custom 검증을 실행하지 않습니다. '입력 검증' 버튼은 `commitEditing()`이 성공한 뒤 `validate()`를 호출하며, 확정에 실패하면 검증을 계속하지 않습니다. 날짜·숫자 파싱과 선택값 변환·확정 규칙은 유지됩니다. 설정 전환도 편집 확정 성공 시에만 적용하며 기존 데이터와 미저장 상태를 초기화하지 않습니다.

'외부 오류 표시'는 작업명·완료 수량·상태·마감일 네 셀의 외부 오류 집합을 주입합니다. `manual`·`true`로 설정한 뒤 오류 셀을 실제로 변경하면 해당 셀의 intrinsic·external 오류만 해제되고 다른 셀의 오류는 유지됩니다. 포커스·편집 시작·같은 값·변경 없는 확정으로는 오류가 해제되지 않습니다. '외부 오류 모두 해제'는 `clearCellErrors()`로 external 오류만 제거하며 intrinsic 오류는 유지합니다. `clearCellError()`도 지정한 셀의 external 오류만 제거합니다.

직전 명시적 검증 결과는 검증 당시의 기록이며 현재 셀 오류 표시와 다를 수 있습니다. 오류 해제는 검증 통과나 저장 가능을 뜻하지 않습니다. 재입력 뒤에도 잘못된 값이 남아 있으면 다음 '입력 검증'에서 오류가 다시 표시됩니다. `manual`에서 Escape로 취소해도 자동 재검증하지 않으며 기존 working value 복원 규칙을 따릅니다. autocomplete 검색어나 picker 내부 미확정 입력은 저장할 draft 변경으로 취급하지 않습니다.

DataGrid의 기본 연결은 `@owp/datagrid/hooks`의 `useDataGridApi<Task>()`입니다. 같은 Grid의 실행 예제·toolbar·Excel 버튼에 API 객체를 전달하고 상세 Grid에는 별도 객체를 사용합니다. 기존 `ref-*` URL과 대표 ref 호환 예제를 유지합니다. API 메서드는 호출 시 연결된 Grid의 최신 값을 읽으며 자동 상태 구독을 제공하지 않습니다. `hasUnsavedChanges()`는 미확정 draft까지 감지하고 `getChanges()`는 working-copy에 반영된 변경만 반환합니다. 저장은 `commitEditing()` 성공 후 `validate()`와 변경 조회를 차례로 실행합니다. 연결 전·해제 후 필수 메서드는 호출할 수 없습니다.

Box plot·Treemap·Heatmap 예제는 기존 전용 컴포넌트와 `ChartFrame` 직접 사용을 전환할 수 있습니다. 설치된 `@owp/charts 5.0.1`에서는 `boxPlot`·`treemap`·`heatmap`이 native 타입명이며 전용 컴포넌트도 같은 타입을 사용합니다. 이전 `owpBoxPlot`·`owpTreemap`·`owpHeatmap` 타입명은 지원하지 않습니다. `CoreChart`·`ChartFrame`은 controller를 자동 등록하며, Chart.js instance를 직접 생성할 때는 공개 `@owp/charts/chartjs/register`의 `registerChartCore()`를 사용합니다.

MCP는 카탈로그에서 예제를 찾고 소스 매니페스트의 진입 파일과 의존 파일을 `/snippets/`에서 읽습니다. RAG도 같은 매니페스트를 기준으로 예제 ID·API·패키지 버전·파일 관계를 연결하고, SHA-256으로 원본 변경 여부를 판별할 수 있습니다. 코드 메뉴의 주요 구현에는 현재 예제에서 실제로 사용하는 설정·컴포넌트·타입·데이터만 표시합니다. 소스 매니페스트는 스타일과 번역 등 직접·간접 의존 파일도 함께 제공합니다. 코드 표시를 위한 `?raw` 문자열 import는 실행 의존성에서 제외합니다. 별도의 설명용 샘플 사본은 만들지 않습니다. DataGrid·Charts MCP와 버전별 Playground의 실행·보존·연결 방법은 [버전별 Playground와 MCP](./docs/versioned-mcp.md)를 따릅니다. 다른 패키지는 해당 Playground를 완성한 시점에 추가합니다.

## API 문서와 지식 데이터

DataGrid와 Charts는 사이드바의 `문서`에서 `시작하기`와 `API`를 제공하고, 실행 샘플은 별도 `예제` 그룹에서 탐색합니다. API는 기본 필터로 Props를 선택하며 공개 컴포넌트·props·이벤트·Ref 메서드·타입·유틸리티와 사용 가이드를 제공합니다. 예제 하단의 `관련 API`는 소속 타입과 경로를 포함한 ID로 정확한 설명에 연결됩니다. API의 `실행 예제`는 코드 탭을 열고 관련 파일의 사용 위치를 강조합니다. 직접 호출·설정 위치를 확인하지 못한 항목은 예제 진입 파일과 안내를 표시합니다. 선택한 API ID와 코드 위치를 주소에 포함하므로 직접 열기·새로고침·브라우저 뒤로 가기를 지원합니다.

이 구분은 [TanStack의 Get Started·API·Examples 탐색 구조](https://tanstack.com/table/latest/docs/framework/react), [MUI의 API reference](https://mui.com/x/api/data-grid/data-grid), [AG Grid의 Reference](https://www.ag-grid.com/javascript-data-grid/reference/)를 참고했습니다. 항목 필터는 `항목 유형`으로 표시합니다. 출처·버전·해시·원본 선언은 JSON·JSONL과 원본 대응표에 보존하며 API 본문에는 별도 출처 영역을 표시하지 않습니다. API 문서 JSON은 아래 정적 리소스 경로에서 받을 수 있으며, Playground의 지식 데이터 형식으로 OpenAPI 명세와는 구분됩니다.

prop 이름·Type token·Required/Optional은 한 행에서 구분하며 긴 타입은 줄을 바꿉니다. 한글 모드에서 외부 라이브러리의 영문 설명은 실제 상속 출처를 확인해 원문 배지를 표시합니다. OWP가 설명을 다시 작성한 경우 외부 원문으로 표시하지 않습니다. 관련 가이드·타입은 검색과 접기 기능으로 탐색하며, 주요 가이드의 긴 본문은 제목이 있는 항목으로 나눕니다. prop의 Type은 원본 타입 이름과 관련 정의 링크를 보존합니다. 닫힌 literal union과 별칭, generic의 `extends` 제약, 설치된 registry의 module augmentation에서 확인한 값은 상세 화면과 속성 목록에 함께 표시합니다. 상세 화면의 값 목록은 `|`로 구분한 TypeScript 스니펫으로 표시하며 복사를 지원합니다. `Type constraint values`는 generic의 상위 범위이며 구체적인 타입 인자에 따라 좁아질 수 있습니다. registry의 선언이 존재해도 실행에 필요한 controller·plugin 등록까지 보장하지는 않습니다. 열린 `string`·callback을 포함한 union이나 평가하지 못한 타입은 유한한 허용 값으로 단정하지 않습니다.

generic의 Constraint·Type parameter default와 prop의 Default를 구분합니다. JSDoc의 `@default`는 `Default` 값으로, `@see`·`@param`·`@returns` 등은 별도 설명으로 표시합니다. 원문은 `documentation`, 태그는 `docTags`, 기본값의 부연 설명은 `defaultNote`, 허용 값과 근거는 `typeDetails`에 유지하여 JSON·JSONL에서도 같은 정보를 사용할 수 있습니다.

한국어 API·사용 가이드·예제 소개는 짧은 참조 문체를 사용하고, 두 시작하기 문서는 니다·요로 끝나는 완전한 문장을 사용합니다. 시작하기 소개는 각 패키지의 역할을 설명합니다. 가능·필수·부정 조건과 코드·직접 인용·기본 메시지는 보존합니다. 실행 예제의 `codeUrl`·`location`은 AST 또는 소스 대조로 확인한 사용 위치와 파일 SHA-256을 제공합니다. 공용 함수·JSX spread를 통한 전달은 실제 설정 위치에 연결하고 `codeReview`에 전달 근거를 남깁니다. 명시 호출 없이 기본 동작이나 패키지 내부 구현에 의존하는 항목은 `location: null`과 그 이유를 기록합니다. 예제에서 사용하지 않는 API 연결은 제외하며, 제외 이유도 검토 자료에 보존합니다.

`knowledge/example-code-reviews/`는 자동 탐색으로 확정하지 못했거나 API 소속을 바로잡은 연결의 검토본입니다. 파일명·고유 코드 구간·전달 경로·소스 지문을 함께 관리하며, 소스 변경·코드 중복·의존 범위 이탈·API 삭제 시 문서 생성이 실패합니다. `baseline.json`은 이번 전체 검수의 시작 목록이며 미확정 항목에 대한 검토 누락도 검사합니다. 배포 카탈로그와 화면의 관련 API는 같은 검토 결과를 사용합니다. 화면 하단에서는 aria-* 공통 속성을 생략하고 boolean·값 설정·이벤트 및 메서드 순으로 표시합니다. 전체 API 선언과 원본 코드 연결은 유지합니다.

`knowledge/source-map.mjs`는 Framework와 소비 앱의 관련 스킬·패키지 문서 원본 목록입니다. `knowledge/source-audit.json`은 원본 파일·섹션의 해시와 가이드 대응, 개발 절차·업무 전용 정책·과거 검증 기록의 구분, 확인한 불일치를 기록합니다. 스킬 원문을 제품 지침으로 그대로 복제하지 않습니다. 현재 공개 타입·실행 예제와 맞지 않는 설명은 수정한 사용 계약으로 제공하며 원본과 차이를 기록합니다.

`pnpm knowledge:generate`는 설치된 패키지의 공개 export와 declaration을 따라 타입·JSDoc·상속 관계를 읽습니다. `Omit`·`Pick`·`Partial`·`Required`의 속성 범위와 조건부 필수 여부를 보존하고 generic 인자를 상속 속성에 적용합니다. 치환 전 타입은 JSON·JSONL의 `declarationSignature`에서 확인할 수 있습니다. Chart.js·react-chartjs-2·annotation·datalabels의 관련 타입도 설치된 버전에서 읽습니다. 기본값은 선언에 기록된 설명만 표시합니다. Chart.js의 원본 타입과 OWP의 실제 옵션 전달 경로·scriptable/array 확장은 구분해 읽어야 합니다. 실행 예제는 별도 설명용 사본 없이 기존 소스에 연결합니다.

예제별 명시 대상과 컴포넌트의 직접 props를 우선하고, 중첩 경로는 해당 속성의 타입을 따라갑니다. 일반 라벨은 해당 OWP 패키지를 기본 범위로 사용하고 native·plugin 설정은 명시한 대상으로 연결합니다. 같은 범위에서 동명 후보가 여럿이면 생성이 실패합니다. 원본 문서가 설치본보다 앞선 기능을 설명하면 해당 섹션의 버전 차이를 대응표와 가이드에 기록합니다.

검토한 패키지 버전·declaration·실행 코드 해시는 `knowledge/reviewed-packages.json`에 고정합니다. 패키지가 바뀌거나 검토한 API·예제·가이드 연결이 사라지면 문서 생성이 실패합니다. 관련 원본 저장소가 함께 있는 로컬 환경에서는 스킬·문서의 변경·삭제도 검사합니다. 다른 배치는 `OWP_KNOWLEDGE_AGENTS_ROOT`와 `OWP_KNOWLEDGE_FRAMEWORK_ROOT`로 지정합니다. 원본이 없는 CI에서는 기록된 검토본과 설치 패키지를 대조하며 원본의 최신 상태를 확인했다고 간주하지 않습니다.

원본 검사는 다음 명령으로 별도 실행할 수 있습니다. 경로는 현재 작업 환경에 맞게 지정합니다.

```bash
pnpm knowledge:audit --agents=/path/to/agents --framework=/path/to/owp-framework
pnpm knowledge:check
```

검사가 실패하면 삭제·개명·공개 타입·실제 동작을 먼저 대조하고 관련 가이드·예제·대응표를 수정합니다. 검토 후에만 `knowledge:audit`에 `--write`를 추가해 원본 지문을 갱신하고, 패키지 계약 검토 결과에 맞춰 `reviewed-packages.json`을 갱신합니다. 생성한 `src/features/api/data/*.generated.json`은 직접 수정하지 않습니다.

빌드는 같은 문서 데이터에서 다음 정적 리소스를 생성합니다. MCP의 HTTP·stdio 조회는 이 자료를 포함한 불변 스냅샷을 사용합니다. 로컬 스킬 경로 없이 API 설명과 실행 소스를 조회할 수 있습니다. 벡터 DB는 사용하지 않습니다.

- `/api/datagrid.json`, `/api/charts.json`: 타입 원문·기본 동작·관련 설명·실행 예제·출처·버전·내용 해시.
- `/knowledge/index.json`: 전체 ID·버전·언어·문서 URL·내용 해시와 원본 대응표. RAG 동기화 시 현재 ID 집합을 기준으로 삭제된 항목도 제거합니다.
- `/knowledge/records.jsonl`: API 항목 또는 가이드 하나를 한 줄로 내보낸 검색 입력 자료. 검색 단위가 길면 소속 타입·버전·제약·문서 URL을 유지하며 추가 분할합니다.
- `/knowledge/example-links.json`: 예제별 API ID·코드 URL·파일·줄·SHA-256, 전달 근거, API 소속 수정·연결 제외 이유와 검수 집계. MCP·RAG에서 코드 위치를 확인할 때 함께 사용합니다.
- `/knowledge/guides/{package}/{topic}.md`: 사용 가이드와 관련 API·실행 소스 링크, record ID·내용 해시·원본 경로·섹션·SHA-256.
- `/catalogs/charts.sources.json`: DataGrid와 같은 형식의 Charts 실행 파일·의존 파일·실제 설치 버전·해시.
- `/llms.txt`: 위 리소스의 진입 색인.

버전별 Playground와 MCP를 로컬에서 확인하려면 다음 명령을 사용합니다. `draft`는 커밋되지 않은 작업을 확인할 때 사용하며, 팀 정식 제공에는 clean Git tree의 `snapshot:create --stable`을 사용합니다.

```sh
corepack pnpm snapshot:create --draft
corepack pnpm mcp:http --allow-drafts
# 별도 터미널 또는 AI 클라이언트에서 실행
corepack pnpm mcp:stdio --allow-drafts
```

화면은 `http://127.0.0.1:30011/`, HTTP MCP는 `http://127.0.0.1:30011/mcp`입니다. `.playground-versions/`는 Git에서 제외하며 기존 운영 릴리스 정리와 별도로 보존합니다. [팀 HTTP·로컬 stdio 설정과 패키지 등록 조건](./docs/versioned-mcp.md)을 확인하세요.

## 디자인과 접근성

`DESIGN.md`와 `src/shared/theme`이 색상, 글꼴, 밀도와 상태 표현을 관리합니다. 밝은·어두운 테마, 모바일 탐색 Drawer, 그리드 내부 스크롤, 키보드 접근과 reduced motion을 지원합니다. Geist, Geist Mono와 Pretendard를 로컬 제공합니다. 각 폰트의 저작권 표시와 OFL 라이선스 전문은 다음 파일에 보존합니다.

- Geist: `public/fonts/Geist-OFL.txt`
- Geist Mono: `public/fonts/Geist-Mono-OFL.txt`
- Pretendard: `public/fonts/OFL.txt`

이 파일들은 빌드 시 `dist/fonts/`에 자동으로 복사되며, 서버에 `dist/` 전체를 배포하면 `/fonts/Geist-OFL.txt`, `/fonts/Geist-Mono-OFL.txt`, `/fonts/OFL.txt`에서 확인할 수 있습니다. Geist와 Geist Mono 패키지 버전을 변경할 때는 각 패키지의 `LICENSE` 파일로 해당 라이선스 사본도 갱신합니다.

OWP 심볼은 한금 소비앱의 공통 패키지에 있는 `owp-core/assets/images/logo/owp/owp_sb.svg` 원본을 `public/brand/owp-symbol.svg`로 가져왔습니다.

헤더의 팔레트 아이콘 또는 ‘설정 → 상세 테마 편집’에서 공통 테마를 편집합니다. 일반 테마는 Carbon·Industrial·Navy·Teal·Plum·Olive·Bronze·Sand·Solarized·High Contrast, 프로젝트 테마는 한금으로 구분하며 기본값은 ‘화면과 같게’입니다. 테마는 DataGrid 샘플 이동과 데이터 초기화 이후에도 유지됩니다. 글자 크기·모서리·컴포넌트 색상과 DataGrid의 헤더·셀·선택·필터·행 패널·스크롤바 등 지원하는 항목을 조정하며 현재 샘플에 바로 적용합니다. DataGrid 테마 편집 패널에는 별도 미리보기 그리드를 두지 않습니다. 편집 메뉴는 한국어·영어를 지원하며, MUI 팔레트의 색상명은 `red`, `deepPurple`, `blueGrey` 등 원래 영문으로 표시합니다. 기본 색상 선택기에 더해 MUI 색상·단계를 선택하는 다이얼로그를 제공합니다. DataGrid와 Components 패키지에서만 편집 아이콘을 표시하며, Components에서는 Material UI 컴포넌트 미리보기와 공통 설정을 제공합니다. ‘테마 초기화’는 데이터와 편집을 유지하고 공통 테마만 되돌립니다.

‘파일 저장’은 `owp-theme.json`을 다운로드합니다. JSON에는 버전, 프리셋, Material UI 옵션(`mui`), 네이티브 DataGrid 테마(`dataGrid`), 모서리 적용용 `dataGridProps`가 들어갑니다. 한금/OWP Core 프로젝트에서는 `configs/theme/grid.ts`에 `defaultDataGridTheme`을 정의하고, 기존 `settingsConfig`의 `theme.main.palette`와 `theme.main.dataGrid`에 저장값을 병합합니다. 한금에서 기존 이름을 유지하려면 `defaultGridTheme`으로 별칭을 내보냅니다. 병합한 설정을 `OwpCoreProvider`의 `configs.settingsConfig`에 전달하면 기존 `OwpStyleProvider`가 네이티브 그리드 테마로 연결합니다. `radius`는 테마 계약에 포함되지 않는 컴포넌트 속성이므로 `<OwpDataGrid {...config.dataGridProps}>`로 적용합니다. Components의 MUI 설정은 기존 `OwpStyleProvider`의 `theme`에 확장해 전달합니다. 패널의 ‘프로젝트에 적용’은 설정 아코디언과 분리하며, 연결 코드를 파일별 구문 강조·복사 기능이 있는 스니펫으로 제공합니다. ‘파일 불러오기’는 지원 버전·필드·값을 검증한 후 전체 테마를 적용하며, 잘못된 파일은 현재 설정을 유지합니다. 최대 파일 크기는 256KiB입니다. 세션의 테마는 페이지 새로고침 시 기본값으로 돌아오며, 지속해서 사용할 설정은 파일로 저장합니다.

‘한금’의 밝은 모드는 소비앱의 `configs/theme/settings.ts`에 정의한 Main 팔레트와 `defaultGridTheme`을 그대로 사용합니다. 편집 가능한 셀, 변경한 값, 행·셀 선택, 셀렉트 메뉴, 추가·삭제·드래그·필터 상태도 같은 설정을 따릅니다. 필터 하단 선은 소비앱과 같은 1px이며 일반 프리셋은 2px를 유지합니다. 컴포넌트 색상에서는 입력 포커스, 버튼별 색상, 기본색의 밝은 색·어두운 색과 비활성 글자색도 편집할 수 있으며, 이 값들은 테마 파일 저장·불러오기에 포함됩니다. 소비앱의 기본 Main 테마는 밝은 모드이므로 한금의 어두운 모드는 Playground에서 별도로 구성한 색상을 사용합니다. 이 테마는 그리드와 샘플 컴포넌트에 적용하며 앱 탐색 메뉴와 코드 탭은 화면 테마를 따릅니다.

`@owp/datagrid` 3.0.0은 데이터 영역의 `grid`·`treegrid` 역할과 행 정보, 외부 rowgroup 연결을 직접 구성합니다. 스크롤바·행 편집 툴바·테두리와 오류 Alert·재시도 버튼도 패키지의 기본 구현을 사용하며, 샘플에서 DOM을 수정하거나 해당 레이아웃을 보정하지 않습니다. 샘플은 업무별 계산, 데이터 조회와 재시도 callback, 화면 구성과 이벤트 기록을 담당합니다.

전역 ‘초기화’는 샘플 데이터·설정·이벤트를 원래 상태로 복구합니다. 그리드 내부 ‘변경 초기화’와 ‘변경 되돌리기’는 마지막 확정 상태로 복구합니다. ‘변경 확정’은 현재 값을 새 기준으로 삼으며 업무 서버에 전송하지 않습니다.


설정의 테마 목록과 선택된 값 앞에는 대표 헤더 색상을 표시합니다. 각 일반 테마는 헤더와 본문·테두리·호버·선택 색상을 함께 적용합니다. ‘한금’은 대표 색상 다음에 소비앱의 원본 심볼과 이름을 표시합니다.

## 검증

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm test:sources
```

`pnpm check`는 Vite+의 Oxlint·Oxfmt 검사와 `pnpm check:assets`의 JSON·HTML·CSS lint를 함께 실행합니다. 타입 검사는 기존 `pnpm typecheck`와 `pnpm build`가 TypeScript 7로 수행합니다.

JS/TS lint와 소스·테스트·루트 JSON 설정·`index.html` 포맷은 `vite.config.ts`에서 관리합니다. `pnpm lint`는 포맷 없이 lint만, `pnpm format`은 Oxfmt 포맷 적용을, `pnpm format:check`는 포맷 차이 검사만 실행합니다. import 순서와 `package.json` 키 순서는 재정렬하지 않으며, CSS는 기존 double quote를 유지합니다. 검증 스크립트·문서·공개 에셋·pnpm YAML 파일은 포맷 범위에서 제외합니다.

Biome은 `biome.json`에 지정한 기존 JSON·HTML·CSS 범위의 lint만 담당하며 formatter와 assist는 사용하지 않습니다. JSON 중복 키, HTML 중복 속성·접근성, CSS 속성 검증을 유지하기 위한 범위입니다. 현재 Oxlint는 이 파일들의 lint를 지원하지 않으므로 Biome을 제거하면 검증이 빠집니다. HTML 포맷은 Oxfmt에 번들된 Prettier가 처리하며 별도 Prettier 설치는 필요하지 않습니다.

Oxlint의 Hook 호출·의존성 검사는 유지합니다. 기존의 사용하지 않는 함수 매개변수 허용과 키보드로 코드 영역을 스크롤하기 위한 두 예외를 보존하며, React Compiler 최적화에 맞추기 위한 동작 변경은 이번 전환에 포함하지 않습니다. 두 도구의 추천 규칙은 같지 않으므로 Biome JS/TS 규칙 전체와의 일대일 대응을 보장하지 않습니다.

`pnpm test:sources`는 빌드된 snippet과 원본의 일치, 기존 URL alias, Oxc를 이용한 TypeScript 구문과 상대 import 경계를 브라우저 없이 검사합니다. API 데이터 검증 스크립트의 JSONC 파싱 회귀 검사는 `pnpm test`에 포함됩니다.

브라우저 검증은 [공통 브라우저 실행과 검증](/Users/hwayoungyang/Documents/codes/github/agents/common/browser-validation.md)에 따라 이미 연결된 브라우저나 앱이 관리하는 브라우저 제어 도구를 우선 사용합니다. 검증 스크립트는 Chrome·Chromium을 직접 실행하지 않습니다.

CLI 검증을 실행하려면 프로덕션 미리보기와 기존 브라우저 연결이 준비되어 있어야 합니다. `PLAYGROUND_BROWSER_CDP_URL`에는 그 브라우저가 이미 제공하는 HTTP 또는 WebSocket CDP endpoint를 지정합니다. 스크립트 실행을 위해 새 브라우저·프로필·디버깅 포트를 만들지 않습니다.

```sh
export PLAYGROUND_BROWSER_CDP_URL='<기존 브라우저가 제공한 CDP endpoint>'
pnpm test:browser
pnpm test:locales
pnpm test:navigation
pnpm test:charts
pnpm test:chartjs
pnpm test:api
node scripts/verify-2.0.10.mjs
pnpm audit:browser
```

다른 Playground 주소는 `PLAYGROUND_URL`로 지정합니다. 연결 정보가 없거나 연결에 실패하면 검증은 실패로 종료하며, 브라우저 자동 실행이나 다른 프로필로 재시도하지 않습니다. 검증에서는 별도 context를 만들고 종료 시 해당 context와 CDP 연결만 정리합니다. 기존 브라우저와 사용자 탭은 종료하지 않습니다. 연결을 사용할 수 없으면 `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:sources`로 가능한 범위를 확인하고 실제 화면에서 확인하지 못한 항목을 따로 보고합니다.

브라우저 검증 시나리오는 편집·검증·행 관리·병합 선택·상세 로딩·실제 XLSX 파일·100만 행 데이터와 취소를 검사합니다. 성능 감사는 기존 브라우저의 포트가 명시된 HTTP CDP endpoint를 사용해 공식 Lighthouse 모바일·데스크톱 프로필로 각각 3회 측정하고 중앙값을 기록합니다. 사용자 설정이나 실행 옵션을 바꾸지 않으며 storage reset을 비활성화합니다. 증거는 Git에서 제외한 `.omo/evidence`에 보관합니다. 브라우저 직접 실행 방지와 검증용 context 정리의 회귀 검사는 `pnpm test`에 포함됩니다.

개발 환경의 react-grab 요소 선택 도구는 `import.meta.env.DEV`에서만 로드합니다. `VITE_DISABLE_REACT_DEVTOOLS=1`로 개발 중에도 끌 수 있으며 프로덕션 빌드에는 포함하지 않습니다. 이벤트 탭의 샘플 로그는 제품 기능이므로 빌드 후에도 표시합니다.

계산·셀 연동은 프로젝트별 기본 적용률, 작업 간·프로젝트 간 적용률 연동과 비용·합계 계산을 함께 보여줍니다. 행 드래그 이동은 한 행/선택한 행 모드를 전환할 수 있습니다. 본문 제목은 선택한 샘플만 표시하며, 패키지·분류·샘플 경로는 헤더 breadcrumb에서 확인합니다.
