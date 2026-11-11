# 한금 전용 로컬 Playground와 stdio MCP

이 파이프라인은 실제 고객 package와 검토된 자료가 준비된 뒤, 해당 고객에게 제공된 API·타입·가이드·예제·source만 별도 root에 구성합니다. `plan`으로 포함 범위를 확인하고 `prepare`로 Knowledge를 고정한 다음, `build`로 전용 viewer를 만들고 `assemble`로 이식 가능한 디렉터리를 조립합니다. 내부 Playground 앱과 전체 Knowledge archive를 입력으로 열지 않습니다. 기존 snapshot·MCP 등록·연결 설정을 갱신하지 않으며 package 설치·게시·배포·납품·설치 확인을 수행하지 않습니다.

현재 실제 고객 runtime은 준비되지 않았습니다. 구현 검증에 사용한 작은 임시 package와 실행 예제는 fixture이며, 고객의 build·delivery·install 증거가 아닙니다. `executionReady`는 검토된 adapter가 실제 package 선언으로 타입 검사를 통과하고 격리 build에 포함됐는지를 나타냅니다. 브라우저 실행 여부는 별도의 `browserVerified`이며, 이 생성기는 항상 `false`로 기록합니다.

## 입력과 고정 범위

기반 파이프라인의 `company-prepared-material` 디렉터리가 필요합니다. 다음 파일만 정확한 inventory로 허용합니다.

- `material.json`: `executionReady: false`, 고객·build·manifest digest, 파일별 byte 수·SHA-256, `materialDigest`
- `provided-manifest.json`: 검증된 `audience: company` manifest
- `api/<package-id>.json`: 실제 검증된 projected package의 `readDeclarations` 결과
- `materials/<검토된 상대 경로>`: 명시적으로 포함된 자료와 실행 source

`prepare`는 실제 runtime의 companyId·build·package/version·artifact digest를 기반 검증기로 다시 확인하고, projected declaration을 다시 읽어 준비 자료와 비교합니다. 전체 API record를 읽어 허용 목록으로 filtering하는 방식은 지원하지 않습니다. 전체 archive·다른 고객 자료·혼합 bundle·중복/추가/누락/변경 파일·symlink·상위 경로를 거부합니다.

별도의 검토 spec은 다음 형식을 사용합니다. 아래 표기에서 `SHA256_*`는 설명용 자리 표시자이며 실제 검증된 64자리 digest로 입력해야 합니다. 예제 경로와 package도 실제 제공 입력에 맞춰 검토해야 합니다.

```json
{
  "schemaVersion": 1,
  "kind": "company-bundle-spec",
  "companyId": "example",
  "buildId": "example-build-1",
  "manifestDigest": "SHA256_MANIFEST",
  "releaseId": "example-release-1",
  "materialDigest": "SHA256_PREPARED_MATERIAL",
  "items": [],
  "requestedItems": [],
  "knownCapabilities": [],
  "modules": [],
  "externalPackages": [],
  "executionAdapters": []
}
```

`knownCapabilities`는 해당 고객의 `provided-manifest.json`에 있는 `features`의 부분집합이어야 합니다. 선택한 항목의 `requires`와 같을 필요는 없으며, 같은 manifest에서 제공한 다른 개별 capability도 포함할 수 있습니다. 전체 catalog나 전역 registry snapshot의 capability 목록을 복사하지 마세요. manifest에 없는 값은 상위 grant로 확대하거나 자동으로 제거하지 않고, `prepare`의 저장 전과 번들 시작 시 거부합니다.

실제 `items`와 `requestedItems`는 비어 있을 수 없습니다. `items`는 제공할 자료만 명시하며 `kind`는 `api`, `type`, `guide`, `example`, `source` 중 하나입니다. 항목은 다음 필드를 가집니다.

| 필드 | 의미 |
| --- | --- |
| `id` | 영문·숫자로 시작하는 고유 ID. 이후 영문·숫자·`_`·`.`·`-`를 사용하며 최대 128자입니다. |
| `packageId` | manifest에 포함된 package ID |
| `classification` | 반드시 `reviewed` |
| `requires` | 필요한 모든 정확한 capability. 상위 capability를 leaf 허용으로 확대하지 않습니다. |
| `dependencies` | 필요한 모든 포함 item ID |
| `files` | `materials/` 아래의 정확한 파일 목록. 빈 목록을 허용하지 않습니다. |
| `title`, `description` | 고객 viewer와 MCP의 자료 설명 |
| `references` | `dependencies`에도 등록된 item 참조 ID |
| `recordId` | `api`·`type`에서 실제 projected declaration의 정확한 ID |
| `entrypoint` | `guide`·`example`의 필수 진입 파일. `source`에서는 생략할 수 있고, 지정한 값은 항목 자신의 `files` 안에 있어야 합니다. |

모든 projected API record와 member는 각각 명시적인 item과 capability가 필요합니다. public import subpath가 있는 API는 `<package>:<subpath>:<owner>.<member>` capability까지 일치해야 합니다. 실제 declaration source의 SHA-256과 일치하는 파일을 `source` 항목으로 포함하고 API item의 의존성으로 지정합니다. API의 related/type/base 참조, 파일 import, 문서 링크도 포함된 항목과 의존성에 대응해야 합니다. 새 항목을 전체 catalog에서 자동으로 발견하거나 추가하지 않습니다.

`modules`는 포함 파일마다 하나씩 기반 `ReviewedModule` 계약을 사용합니다. `path`, `sha256`, 정확한 import specifier별 `dependencies`, 상대 자료 링크의 `links`를 지정합니다. 실제 import/link와 검토 목록이 다르거나 동적 import·glob·동적 loader·외부 링크가 있으면 준비를 중단합니다. Markdown 참조형·자동 링크와 JSDoc 링크는 자동 해석하지 않으며 명시적인 포함 상대 inline 링크와 item 참조로 검토해야 합니다. 항목의 파일 합집합과 준비 자료의 파일 목록이 정확히 일치해야 하며, 요청되지 않은 항목을 spec에 덧붙여도 거부합니다.

## 명시적 plan·prepare·build·assemble

명령은 요청 JSON 파일의 디렉터리를 기준으로 상대 경로를 해석합니다. 새 파일을 만드는 `prepare`·`build`·`assemble`은 별도 요청으로만 실행합니다. `plan`은 파일 검증과 포함 목록 확인만 수행하며 runtime 확인·산출물 생성·준비 완료 표시를 하지 않습니다.

```sh
node --experimental-strip-types scripts/company-playground/cli.ts plan --request /path/to/plan-request.json
node --experimental-strip-types scripts/company-playground/cli.ts prepare --request /path/to/prepare-request.json
node --experimental-strip-types scripts/company-playground/cli.ts build --request /path/to/build-request.json
node --experimental-strip-types scripts/company-playground/cli.ts assemble --request /path/to/assemble-request.json
```

plan/prepare 요청 필드는 다음과 같습니다.

```json
{
  "schemaVersion": 1,
  "materialRoot": "prepared",
  "specFile": "reviewed-company-spec.json",
  "output": "company-bundle",
  "protectedRoots": ["full-archive", "original-source"],
  "runtime": {
    "descriptor": {
      "schemaVersion": 1,
      "companyId": "example",
      "buildId": "example-build-1",
      "manifestDigest": "SHA256_MANIFEST",
      "root": "company-runtime",
      "packages": { "utils": "packages/utils" }
    }
  }
}
```

`plan`에서는 `output`과 `runtime`을 생략할 수 있습니다. `prepare`는 둘 다 필요합니다. runtime 검증에는 기반 구현의 공식 `packageArtifactDigest`와 package metadata 계약을 사용합니다. 추가 검증이 필요한 경우 `runtime.digestAdapter`에 `{ "path": "reviewed-adapter.mjs", "sha256": "SHA256_ADAPTER" }`를 명시할 수 있습니다. 이는 검토된 로컬 코드의 실행이므로 해당 코드 자체의 검토가 필요합니다. 추가 adapter의 `verifyPackageDigest`가 실패하면 중단하며, 기반 검증을 대체하거나 약화하지 않습니다.

projected package의 `owpDistribution.selectedEntries`는 export key별 객체입니다. symbol entry는 `{ "kind": "symbol-entry", "runtimeSymbols": ["Allowed"], "typeSymbols": [] }`, asset entry는 `{ "kind": "asset-entry" }` 형식입니다. asset entry의 두 symbol 배열은 생략하거나 빈 배열로만 지정합니다. 문자열 배열로 export 목록을 대신하지 않습니다.

준비 결과는 새 디렉터리에 원래 준비 자료와 `company-bundle.json`을 기록합니다. `bundleDigest`는 spec·고정 identity·파일 fingerprint를 묶습니다. 준비 결과의 `executionReady`는 항상 `false`입니다.

build 요청은 `bundleRoot`, 고정 `pin`, 새 `output`, `protectedRoots`, 실행 시 필요한 `runtime`을 사용합니다.

```json
{
  "schemaVersion": 1,
  "bundleRoot": "company-bundle",
  "pin": {
    "companyId": "example",
    "buildId": "example-build-1",
    "manifestDigest": "SHA256_MANIFEST",
    "releaseId": "example-release-1",
    "bundleDigest": "SHA256_BUNDLE"
  },
  "output": "company-viewer",
  "protectedRoots": ["full-archive", "original-source"],
  "runtime": { "descriptor": {} }
}
```

위 `runtime.descriptor`에는 prepare와 동일한 실제 descriptor 전체를 넣습니다. 실행 adapter가 없는 자료 viewer build에서는 `runtime`을 생략할 수 있습니다. source·전체 archive·runtime/package root와 출력이 겹치거나 출력/staging이 이미 있으면 실패합니다. 전체 archive와 source의 실제 root를 `protectedRoots`에 빠짐없이 지정해야 합니다.

실행 예제는 spec의 다음 경계만 지원합니다.

```json
{
  "itemId": "allowed-example",
  "entry": "examples/allowed.tsx",
  "exportName": "AllowedExample",
  "kind": "react-component",
  "props": { "label": "예제" }
}
```

adapter는 포함된 `example`의 정확한 entry와 named export를 지정합니다. 함수 component는 전달받을 JSON props를 명시하며 generated TypeScript 호출과 전체 포함 module이 실제 projected package declaration으로 타입 검사를 통과해야 합니다. 현재 adapter는 provider/theme 등의 환경을 자동 주입하지 않습니다. 필요한 환경은 검토된 포함 entry에서 구성하고 import·capability·dependency graph에 등록합니다.

빌드는 설치된 React·React DOM·Vite를 도구로 재사용하고 의존성을 설치하지 않습니다. `configFile: false`, `publicDir: false`로 별도 entry를 빌드하며 원래 Vite config·`src/app/App`·전체 catalog·CodeViewer glob·Knowledge 생성 index·public 디렉터리를 로드하지 않습니다. 모든 `@owp/*` import는 transitive import까지 명시적인 한금 package root의 exact export로만 resolve합니다. 미제공 package, wildcard/미등록 export, 설치된 전체 OWP 선언 fallback, package 밖 상대 import, 동적 runtime target, unresolved output을 거부합니다. Vite alias가 검토 specifier를 먼저 바꾸지 않도록 한금 전용 resolver 안에서 검토 후 도구 경로를 결정합니다.

출력에는 `index.html`·실제 build assets·제공 manifest·포함 materials·정규화한 API JSON·검색 index·실제 module inventory·`playground-build.json`만 들어갑니다. viewer는 package/version/build, 검색, 포함 계약과 source, 검증된 adapter가 있을 때 실행 영역을 보여 줍니다. 배포 대상 선택기·다른 고객·공급자·이력 자료는 포함하지 않습니다. 출력의 `deliveryStatus`와 `installStatus`는 항상 `pending`입니다.

module 경계는 실제 build graph의 각 module에서 검사합니다. 고객에게 기록하는 inventory는 `viewer-entry`, `reviewed-material`, `company-runtime`, `public-tooling`, `bundler-runtime` origin class만 사용합니다. 원래 runtime 구현의 디렉터리나 절대 경로를 inventory에 넣지 않으며 sourcemap과 원본 경로 주석도 출력하지 않습니다.

## 이식 가능한 assemble 결과

assemble 요청은 검증된 bundle pin과 viewer의 `buildDigest`를 함께 고정합니다.

```json
{
  "schemaVersion": 1,
  "bundleRoot": "company-bundle",
  "pin": {
    "companyId": "example",
    "buildId": "example-build-1",
    "manifestDigest": "SHA256_MANIFEST",
    "releaseId": "example-release-1",
    "bundleDigest": "SHA256_BUNDLE"
  },
  "viewerRoot": "company-viewer",
  "buildDigest": "SHA256_VIEWER_BUILD",
  "output": "company-assembly",
  "protectedRoots": ["full-archive", "original-source", "company-runtime"]
}
```

`playground-build.json`을 한 번 읽은 bytes로 digest·pin을 파싱하고 descriptor의 inventory hash와 복사 bytes를 고정합니다. 실제 inventory를 다시 읽었을 때도 그 hash와 같아야 합니다. 파일별 bytes/SHA-256과 선언된 module origin을 검사하며, viewer의 manifest·materials도 Knowledge와 일치해야 합니다. 다른 pin, 변경·추가·누락 파일, 혼합 root, 기존 output/staging, 원본·runtime·보호 root와 겹치는 출력은 실패합니다. 새 staging에서 검증한 디렉터리만 최종 경로로 이동하며 입력 디렉터리를 덮어쓰지 않습니다.

결과에는 다음 파일만 들어갑니다.

- `playground/`: 고정 digest와 일치하는 전용 browser build
- `knowledge/`: 같은 pin으로 다시 검증한 정확한 company bundle
- `mcp/runtime.mjs`: 한금 서버와 공개 SDK·검증 dependency를 포함한 Node용 번들
- `mcp/stdio.mjs`: bundle pin을 내장한 고정 launcher
- `mcp/module-inventory.json`: origin별 module 수와 공개 dependency의 실제 버전
- `README.md`, `assembly-manifest.json`: 실행 안내, 고정 identity, 파일별 bytes/SHA-256, `assemblyDigest`

assembly manifest는 자신을 제외한 모든 파일을 inventory에 담고 나머지 payload의 digest로 조립 identity를 구분합니다. 실제 고객 프로젝트의 `projectId`나 납품 `deliveryId`를 만들지 않습니다. `browserVerified`는 `false`, 납품·설치 상태는 `pending`입니다. 전체 저장소·원래 source tree·전체 `.playground-versions`·OWP runtime package·원본 full MCP는 복사하지 않습니다.

stdio 번들은 설치된 Vite의 programmatic SSR API를 `configFile: false`, `publicDir: false`, `ssr.noExternal: true`로 사용합니다. Node builtin만 외부 import로 남기고 공개 SDK·Zod·TypeScript AST 검증 코드는 로컬에서 번들링합니다. 실제 graph에 명시한 한금 서버 6개와 공용 순수 검증 6개 외의 비공개 module 또는 `@owp/*` runtime이 들어오면 실패합니다. 현재 구현은 unresolved dependency를 허용하거나 설치용 package manifest를 생성하지 않으며 새 dependency를 설치하지 않습니다. SDK stdio 진입점은 assembler 모듈 위치에서 해석한 실제 공개 entry를 사용하므로, 출력 디렉터리가 저장소 밖에 있어도 staging 위치의 `node_modules`를 찾지 않습니다.

지원되는 Node 실행 파일을 별도로 제공한 뒤 어느 작업 디렉터리에서든 다음과 같이 시작합니다.

```sh
node /path/to/company-assembly/mcp/stdio.mjs
```

원래 저장소·`node_modules`·`NODE_PATH`와 package 설치가 필요하지 않습니다. launcher는 `import.meta.url`을 기준으로 `../knowledge/`만 읽고 pin을 내장합니다. CLI 인자를 받지 않고 환경 변수나 MCP 요청으로 companyId·profile·전체 archive·다른 자료 root를 선택하지 않습니다. 시작할 때 파일·identity 검증이 실패하면 종료하고, 시작 후에는 `readCompanyBundle`이 검증해 보관한 bytes만 반환합니다.

설치 대상 프로젝트의 파일을 수정하는 install patch는 이 단계 밖입니다. 실제 프로젝트 경로, 현재 의존성, 제공 package의 exact version·digest와 충돌을 확인한 별도 입력·승인·검증이 필요합니다. assemble만으로 install patch 적용, package pack/install, 납품·설치 기록을 만들지 않습니다.

## 고정된 한금 전용 stdio MCP

다음 명령은 저장소 안에서 준비된 bundle을 검사하는 개발용 stdio 프로세스입니다. 고객 전달용 실행 진입점은 위 assemble 결과의 `mcp/stdio.mjs`입니다. 개발 CLI의 `--bundle-root`와 identity·digest 여섯 값은 모두 필수입니다. HTTP 전송, 전체 archive root, 다른 고객나 profile을 고르는 옵션은 없습니다.

```sh
node --experimental-strip-types mcp/company/cli.ts \
  --bundle-root /path/to/company-bundle \
  --company-id example \
  --build-id example-build-1 \
  --manifest-digest SHA256_MANIFEST \
  --release-id example-release-1 \
  --bundle-digest SHA256_BUNDLE
```

이 문서는 MCP 연결 설정을 자동으로 바꾸지 않습니다. 실제 고객 자료가 준비되고 연결을 명시적으로 요청받았을 때 검증한 pin을 설정에 고정해야 합니다. 파일이 시작 전 변경되면 프로세스가 실패하고, 시작 후에는 검증하여 메모리에 고정한 bytes만 읽습니다. 요청 본문에 scope를 확대하는 `audience`, `profile`, `companyId` 등의 필드를 추가하면 거부합니다.

다섯 도구는 기존 이름·기본 pagination·metadata 규칙을 유지합니다.

| 도구 | 조회 |
| --- | --- |
| `list_packages` | 포함된 API/type·가이드·예제 또는 명시적으로 요청한 source가 있는 package, 정확한 버전과 해당 버전 하나의 `availableVersions` |
| `search_knowledge` | package에 포함된 API/type·가이드·예제. `offset`, `limit` 사용 |
| `get_api` | 정확한 record ID 또는 고유 이름, 포함 member 페이지 |
| `get_example` | 예제 또는 같은 Knowledge package에 포함된 source ID의 명시적 source manifest·파일 hash·줄과 column을 보존하는 continuation |
| `get_guide` | 가이드와 `contentHash`, `offset`·`maxChars` continuation |

후속 조회에는 응답의 `releaseId`와 `packageVersion`을 사용합니다. 다른 release·package·버전·ID·파일은 조회할 수 없습니다. source URL은 실제 포함 파일의 `./materials/...` 또는 `./api/...` 상대 경로입니다. 절대 로컬 경로, 전체 archive/source URL을 반환하지 않습니다.

응답 metadata의 `package`는 `@owp/utils` 같은 전체 package 이름입니다. 한금 projected record의 `record.package`·`record.packageVersion`과 일치합니다. `requestedItems`에 명시한 source는 다른 종류의 Knowledge가 같은 package에 없어도 목록·직접 조회·resource로 읽을 수 있습니다. manifest에 dependency로만 존재하거나 다른 항목의 의존성 source만 포함한 package는 독립 Knowledge package로 노출하지 않으며 조회도 거부합니다. 포함된 parent 예제는 자신의 명시적 파일 목록에 있는 그 dependency source를 계속 읽을 수 있습니다.

resource는 `owp://<release>/<package>/<api|guide|source>/<encodeURIComponent(key)>` 형식을 사용합니다. API key는 record ID, guide key는 item ID, source key는 example/source item ID입니다. resource 목록은 페이지당 최대 50개이며 다음 `nextCursor`에는 해당 bundle digest가 포함됩니다. 다른 번들의 cursor를 사용할 수 없습니다. 직접 URI 읽기는 동일한 고정 store·hash·기본 응답 한도를 적용합니다. 원문 URI를 URL 정규화 전에 검사하므로 encoded traversal, 중복 encoding, foreign release, 미포함 ID도 거부합니다. source 항목도 자신의 정확한 파일 목록만 읽으며 의존성으로만 포함된 package를 독립 조회하는 권한은 생기지 않습니다.

source 후속 조회는 응답의 `id`, `package`, `packageVersion`, `releaseId`를 `get_example`의 `exampleId`, `package`, `version`, `releaseId`에 고정합니다. `includeDependencies: true`에서 파일 순서는 entrypoint와 `item.files`의 중복을 제거한 고정 순서입니다. `file`·`startLine`·`startColumn`은 지정 파일의 시작 위치만 정하며 파일 순서나 `offset` 기준을 바꾸지 않습니다. 줄 번호와 UTF-16 column은 1부터 시작하고 기본값도 1입니다. 보통은 줄 경계에서 나누며, 한 줄이 `maxChars`를 넘으면 같은 줄 안에서 이어 읽습니다. newline도 반환 content에 포함하므로 chunk를 이어 붙이면 원문을 복원할 수 있습니다. 응답의 `continuation`이 있으면 동일한 pin과 `includeDependencies`를 유지하고 객체 전체를 다음 요청에 전달합니다. 기본 필드는 `file`·`startLine`·`startColumn`·`offset`이며, 아직 읽지 않은 지정 파일이 있으면 그 위치를 담은 `pendingStart`도 함께 전달합니다. 끝까지 읽으면 `continuation`은 `null`입니다. 단일 파일을 읽을 때는 `includeDependencies: false`, 정확한 `file`, `offset: 0`을 사용하며 같은 파일의 `nextLine`·`nextColumn`을 `startLine`·`startColumn`으로 전달할 수도 있습니다. 모든 반환 cursor의 위치·offset·줄·column 번호는 안전한 정수이며, guide의 `offset`은 문서 길이 이하의 음이 아닌 안전한 정수입니다. `limit`은 1~50, `maxChars`는 100~32000으로 제한합니다.

앞 파일이 여러 응답으로 나뉘더라도 아직 읽지 않은 지정 파일의 위치는 `pendingStart: { file, startLine, startColumn }`으로 보존합니다. 그 파일이 현재 continuation의 `file`이 되면 대기 위치를 시작 위치로 옮기고 `pendingStart`를 제거합니다. 이미 일부를 반환한 파일은 `nextLine`·`nextColumn`으로 이어집니다. 대기 위치는 같은 항목의 뒤쪽 파일과 유효한 줄·column만 허용하며, 이미 지난 파일·다른 파일·범위 밖 위치와 서로 모순되는 cursor는 거부합니다.

자료 링크는 제한된 문법만 검증합니다. Markdown inline 링크는 공백 없는 상대 destination 또는 `<destination>`과 선택적인 큰따옴표·작은따옴표 title을 지원합니다. destination의 `..`, 외부 URL·protocol·query·percent encoding과 미포함 파일, 참조형·자동 링크, 괄호 title·괄호 destination 등 지원하지 않는 inline 문법은 거부합니다. 이 검증기는 전체 Markdown parser가 아닙니다. CSS는 정적 `url()`과 조건 없는 `@import`만 지원하며 같은 package 또는 검토된 자료 graph에 포함된 상대 asset을 가리켜야 합니다. 외부·data·protocol URL, 동적 함수, CSS escape·comment와 조건부 import는 실패 처리합니다. build 출력 CSS도 같은 build의 실제 emitted asset만 참조할 수 있습니다.

HTML과 Markdown 안의 HTML은 정적 quoted 속성과 resource가 아닌 boolean 속성으로 제한합니다. 예를 들어 `<a href='included.md'>포함 자료</a>`는 해당 파일을 module graph의 `links`와 항목 의존성에 모두 선언했을 때 허용합니다. 정상 닫는 태그는 자동 링크로 취급하지 않습니다. `href`·`src`의 unquoted·동적·entity·template 값, 미포함·외부 대상과 `base`, `srcset`·`poster`·`style`·`srcdoc` 등 별도 해석이 필요한 resource 속성은 거부합니다. JSX에서도 직접 인용한 resource 값만 허용하며 spread 속성은 거부합니다. 전체 HTML parser나 임의 코드 실행의 보안 검증을 제공하지 않습니다.

내부 Playground의 실행 preview·한금 버전 선택지는 실제 `playground-build.json`의 `executionReady: true`와 `viewer-entry`·`company-runtime`·`reviewed-material` origin, 고정 pin·파일 검증을 모두 통과해야 합니다. 자료 viewer는 유효한 고객 artifact여도 이 조건 없이 실행 선택지로 노출하지 않습니다. `browserVerified`는 producer 계약인 `false`를 유지하며 고객 실행·납품·설치를 확인한 것으로 해석하지 않습니다.

bundle과 준비 자료는 각 파일을 한 번 읽은 snapshot의 bytes로 inventory hash·길이, manifest, module graph와 API record를 검증합니다. 후속 조회와 prepare 복사도 그 snapshot을 사용합니다. 실행 build는 projected declaration의 전체 record 비교와 타입 검사에 앞서 각 company package를 한 번 읽고 snapshot의 artifact digest를 제공 manifest와 비교합니다. exact export의 `package.json`, TypeScript host의 company 파일·해석 metadata, runtime JS·CSS는 같은 snapshot에서 읽습니다. 출력 asset도 그 bytes와 일치해야 합니다. 기존 disk 기반 projected declaration reader의 전체 결과와 bundle 비교는 유지하며, reader 결과가 달라지면 build를 거부합니다. 원래 package 파일이 이후 변경되어도 선언이나 export를 바꿔 실행 범위를 넓힐 수 없습니다.

실행·타입 검사에서 공개 dependency는 folder나 npm alias가 아니라 설치 metadata의 실제 package 이름과 검토된 공개 dependency closure로 판별합니다. 비공개 OWP package는 정확한 company root만 허용하며 alias·transitive import·type reference를 통한 전체판 fallback을 거부합니다.

타입 검사의 검토 material은 bundle에 고정된 bytes를 사용하며, 생성 진입점도 고정 spec의 adapter와 props에서 직접 만듭니다. 상대 import는 검토 목록의 가상 파일·디렉터리로 해석하므로 스테이징 복사본의 변경·삭제나 진입점 교체로 검사할 코드와 props를 바꿀 수 없습니다. 스테이징 source root의 미등록 파일도 타입 검사에 포함하지 않습니다.

타입 검사와 Vite는 모두 `modules[].dependencies`에 지정한 상대 파일을 사용합니다. `helper.ts`와 `helper.tsx`가 함께 있어도 TypeScript의 기본 확장자 탐색으로 다른 대상을 선택하지 않습니다. Vite의 생성 `index.html`·`entry.js`와 stdio의 생성 `runtime-source.mjs`는 메모리에 고정한 동일한 문자열로 로드하므로, 스테이징 파일의 props·HTML·실행 코드 교체가 출력에 섞이지 않습니다. 검증에서는 파일을 쓴 직후 내용을 바꾸는 반례를 먼저 재현하고, 수정 후 실제 Vite 출력에 그 변경이 들어가지 않는지 확인했습니다. 저장소 밖 조립 결과도 원래 bundle·viewer를 삭제한 뒤 실제 stdio SDK로 조회했습니다.

설치된 MCP client SDK 2.4.0의 `listResources()`는 cursor를 생략하면 여러 서버 페이지를 자동으로 합칩니다. 서버의 50개 한도를 검사할 때는 `<bundleDigest>:0`부터 명시적 cursor로 한 페이지씩 요청합니다. 합쳐진 결과 수를 서버의 한 페이지 크기로 해석하지 않습니다.

고객 MCP 실행에 필요한 소스는 `mcp/company/*.ts`와 다음 공용 순수 검증 모듈뿐입니다. 원래 full MCP·CLI·HTTP server·전체 package registry는 전달하지 않습니다.

- `scripts/distribution/integrity.ts`, `files.ts`, `graph.ts`
- `src/distribution/schema.ts`, `history-schema.ts`, `content.ts`
- 검증된 고객 bundle의 고정 파일 목록

생성 단계의 의존성은 Node의 기존 지원 버전, `@modelcontextprotocol/server` **2.4.0**, 설치된 Zod와 graph AST 검증용 `typescript-compiler-api`입니다. stdio는 server 패키지의 `serveStdio`를 사용합니다. 설치된 `@modelcontextprotocol/node` **2.1.2**는 HTTP adapter용이며 이 stdio entry에서 import하지 않습니다. assemble 결과에는 공개 dependency 코드를 번들링하고 실제 package 이름·버전을 inventory에 기록합니다. 별도 manifest/lock 설치가 필요한 개발용 source CLI와 고객용 bundled launcher를 구분합니다.

## 검증 범위와 남은 입력

합성 alpha fixture에서는 실제 선언과 JS가 있는 작은 테스트 package, 허용 React 예제와 Knowledge가 없는 asset dependency를 사용했습니다. prepare→격리 Vite build→assemble 후 원래 fixture의 source·runtime·bundle·viewer 디렉터리를 삭제하고, 다른 cwd에서 실제 SDK stdio client로 다섯 도구와 resource를 조회했습니다. `NODE_PATH`·`NODE_OPTIONS`를 비우고 ESM bare import와 CommonJS의 외부 파일 module 해석을 차단한 상태에서도 성공했습니다. 실제 파일이 시작 후 바뀌어도 메모리에 고정한 bytes를 반환했습니다. 다른 release·version·package·ID·source·profile·URI, 변경·추가·누락 viewer, foreign pin/build digest, 기존 output·보호/혼합 root는 거부했습니다. 올바르게 다시 계산한 bundle digest가 있어도 제외 member의 TypeScript 사용과 미제공 OWP runtime import는 build에 실패했습니다. 임시 데이터·테스트·cache는 검증 후 삭제합니다.

읽기·쓰기 경로가 제한된 검증 환경에서는 기존 MCP 회귀 테스트의 `TMPDIR`를 workspace 안의 새 임시 디렉터리로 지정합니다. OS 기본 임시 경로에서 발생한 `EPERM`은 테스트 동작의 실패와 구분하며, 검증 후 지정한 임시 디렉터리와 cache를 삭제합니다.

실제 고객 사용에는 검증 가능한 한금 package 전체, 정확한 provided manifest, package artifact metadata·digest, 제공 범위의 projected 선언, source 파일, 개별 capability·의존성·링크를 검토한 spec, 필요한 실행 adapter가 남아 있습니다. 그 입력이 준비된 후 명시적인 생성 요청에 따라 prepare/build/assemble을 수행하고, 허용된 브라우저 경로로 package 실행·반응형·접근성·상호작용을 검증해야 합니다. fixture 빌드나 정적 metadata만으로 실제 고객 준비·브라우저 실행·납품·설치를 완료 처리하지 않습니다.
