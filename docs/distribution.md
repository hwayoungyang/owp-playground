# 한금 배포 자료의 계획과 준비

현재 구현은 재사용할 배포 기반입니다. 고객 패키지를 설치하거나 실행하지 않으며, 실제 전달·설치·운영 상태를 만들지 않습니다. 기존 full Playground와 Knowledge archive 생성·hash 검증 경로는 계속 별도로 유지합니다.

## 현재 상태 확인

저장소 루트에서 다음 명령을 실행하면 파일을 쓰지 않고 고객 프로필과 자료 계획의 blocker를 확인합니다.

```sh
node --experimental-strip-types scripts/distribution/cli.ts plan hankum
```

세 번째 인자로 저장소 내부의 다른 설정 파일을 지정할 수 있습니다. 알 수 없는 프로필·설정은 오류이며 full 프로필로 대체하지 않습니다. 이 명령은 패키지 설치, build, 자료 생성, 이력 기록, Knowledge·snapshot·MCP 갱신을 수행하지 않습니다.

기존 한금(`hankum`) 제공 manifest의 digest는 현재 payload와 일치합니다. 현재 설정에는 runtime descriptor가 없으므로 `runtimeStatus`는 `unconfigured`, `previewUrl`은 `null`입니다. `hasValue`와 KST API는 해당 manifest에 개별 capability가 없으므로 고객 계획에서 제외됩니다. 이 결과는 과거 manifest를 수정하거나 현재 개발 범위를 확정하는 근거가 아닙니다.

## 프로필과 full entry

`src/distribution/schema.ts`가 브라우저와 Node의 공유 계약입니다. `DistributionContext`에는 mode, 기본 프로필 ID, 검증 결과를 정리한 프로필·빌드와 내부용 이력 요약만 포함됩니다. manifest 원본 경로, runtime root, 원본 배포 evidence와 history 원문은 이 context에 포함하지 않습니다. `history-schema.ts`는 Node 이력 reader를 import하지 않는 browser DTO 계약입니다.

`scripts/distribution/context.ts`의 `readDistributionContext(root)`가 설정을 읽습니다. 기존 설정의 `defaultAudience`는 프로필 ID이며 context에서는 `defaultProfileId`가 됩니다. 한금의 표시 이름은 설정의 `label: "한금"`으로 지정하고, 프로필 ID와 `companyId`는 `hankum`을 유지합니다. 상단 선택기에는 “배포 대상: 한금”으로 표시합니다. full 프로필의 버전은 실제 설치된 package metadata에서 읽습니다. 고객 프로필의 버전·feature는 digest와 고객 ID를 확인한 제공 manifest에서 읽습니다.

Vite는 이 context를 `__OWP_DISTRIBUTION__`에 주입합니다. 현재 full 앱 entry는 `mode: internal`, 기본 full 프로필, `runtimeSource: installed` 조합만 허용합니다. 고객 mode 또는 고객 기본 프로필이면 full catalog와 resource plugin을 불러오기 전에 거부합니다.

브라우저 query의 `profile`은 내부 상태 화면의 프로필을 선택하며, 선택적인 `buildId`는 해당 프로필에 등록된 정확한 빌드를 선택합니다. 미등록·다른 고객·중복 build ID는 선택 오류이며 기본 빌드나 full로 대체하지 않습니다. 동일한 module graph에 고객 package alias를 주입하지 않습니다. 한금 버전 메뉴는 검증된 별도 preview URL이 있는 빌드만 제공합니다. 선택 시 문서 전체를 새로 열며 `lang`·`colorMode`만 전달하고, 기존 package·예제·선택·hash·query를 재사용하지 않습니다. 기존 full 버전 메뉴와 archive 선택 경로는 그대로 유지합니다.

한금 프로필의 선택적인 `builds`는 `{ "manifest": "manifests/build-two.json", "runtime": <runtime descriptor>, "label": "두 번째 빌드" }` 항목의 배열입니다. `runtime`은 각 항목에 필수이며 label은 선택적입니다. primary manifest·runtime은 기본 빌드로 유지하고, 모든 추가 빌드도 같은 companyId와 각자의 manifest·package bytes·preview를 독립 검증합니다. 재귀 프로필을 입력하지 않습니다. manifest나 runtime을 확인하지 못한 추가 빌드는 준비 상태 표에 표시하되 실행 선택지에는 넣지 않습니다.

## Manifest와 runtime 검증

`parseProvidedManifest(value, companyId)`는 strict schema, 고객 ID, package ID·이름과 `manifestDigest`를 확인합니다. digest payload에서 `manifestDigest`를 제외하고, object key를 `localeCompare` 순서로 정렬한 JSON을 SHA-256으로 계산합니다. array 순서는 유지합니다. digest 일치는 payload의 무결성 검사이며 승인 주체·진위·최신 승인을 인증하지 않습니다.

고객 프로필에는 향후 다음 모양의 선택적 `runtime`을 명시할 수 있습니다. 경로는 해당 설정 파일의 디렉터리를 기준으로 하며, root와 package 경로에는 symlink·절대 경로·상위 경로를 허용하지 않습니다.

```json
{
  "schemaVersion": 1,
  "companyId": "example",
  "buildId": "build_example_1",
  "manifestDigest": "<제공 manifest의 64자리 digest>",
  "root": "runtime",
  "packages": {
    "utils": "packages/owp-utils"
  }
}
```

`verifyCompanyRuntime`은 descriptor의 고객·build·manifest 식별자와 정확한 package 집합을 확인합니다. 실제 package 이름·버전과 `owpDistribution`의 `schemaVersion`, 고객·build·package ID, `baseVersion`, `companyVersion`, `policyHash`, `sourceDigest`, `contractDigest`를 제공 manifest와 대조합니다. `projectionHash`는 digest 형식을 확인하고 package artifact digest에 포함해 바이트 계약으로 고정합니다. 실제 Framework package metadata에는 `audience`와 `manifestDigest`가 없으므로 요구하지 않습니다. lifecycle scripts는 거부하고, package metadata의 capability가 manifest 범위를 벗어나거나 전체 package metadata의 grant 합집합이 manifest 기능을 충족하지 못하면 실패합니다. OWP dependency는 제공 package 집합 안에서 exact 한금 버전으로 닫혀 있어야 합니다. 누락 파일은 `missing`, 식별자·metadata·digest 불일치는 `mismatch`입니다.

Framework `scripts/distribution/artifacts.mjs`의 `hashFiles`·`objectDigest`와 같은 기본 검증을 제공합니다. package root의 모든 일반 파일을 읽어 `{상대 경로: SHA-256(파일 bytes)}` 객체를 만든 뒤, key를 정렬한 stable JSON의 SHA-256을 계산합니다. package artifact에는 제외 목록을 적용하지 않습니다. `fileInventoryDigest`의 배열·bytes 필드 계약과 구분합니다. 선택적인 `PackageDigestVerifier`는 `{packageRoot, files, expectedDigest}`를 받는 추가 검사이며, `true`를 반환해도 기본 바이트·metadata 검증을 우회할 수 없습니다.

선택적인 `runtime.preview`는 다음 필드를 모두 요구합니다.

| 필드                                       | 입력 계약                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `root`, `entry`                            | runtime root 내부의 안전한 상대 디렉터리와 고정 `index.html`                                                                 |
| `files`, `digest`                          | `playground-build.json`을 포함한 전체 파일 inventory와 그 정렬된 배열의 object digest. 파일별 `path`, `bytes`, `sha256` 필수 |
| `releaseId`, `bundleDigest`, `buildDigest` | 실제 producer가 만든 `playground-build.json`의 고정 pin                                                                      |
| `executionBuilt`                           | `true` 필수. 이 값만으로 preview를 승인하지 않음                                                                             |

검증기는 실제 `playground-build.json`을 `viewerBuildSchema`로 읽고 companyId·build·manifest identity, release·bundle pin, descriptor payload의 build digest를 대조합니다. descriptor의 파일 목록에 descriptor 자체를 추가한 목록이 실제 전체 파일과 일치해야 합니다. `provided-manifest.json`도 등록한 manifest와 같아야 합니다. 내부 실행 preview에는 실제 descriptor의 `executionReady: true`와 `viewer-entry`·`company-runtime`·`reviewed-material` origin이 모두 필수입니다. `module-inventory.json`과 descriptor의 정렬·중복 없는 module origin 목록도 일치해야 합니다. 자료 viewer의 `executionReady: false`는 고객 자료 artifact로 유효하더라도 내부 실행 preview나 한금 버전 선택지의 근거가 되지 않습니다. readiness가 없거나 false이면 검증에 실패하며 URL·release pin을 노출하지 않습니다. source map과 producer 계약 밖의 파일을 거부합니다. `browserVerified: false`, delivery·install의 `pending` 값은 producer schema 그대로 유지하며, 브라우저 검증 완료를 요구하거나 추론하지 않습니다.

package와 preview의 정적 검사를 모두 통과한 경우에만 실제 `releaseId`, build·bundle·preview digest와 `/company-previews/<companyId>/<digest>/index.html` 형태의 예약된 URL을 context에 전달합니다. preview가 없거나 검증에 실패하면 release·preview pin은 `null`입니다. preview가 없는 기존 package 검증은 계속 사용할 수 있습니다. 임의 외부 URL이나 host·mount 경로를 context에 넣지 않습니다. 이 저장소는 해당 경로를 자동 게시하거나 연결하지 않습니다. 별도 hosting에서 검증된 immutable preview root를 같은 경로에 연결해야 합니다.

`runtimeStatus: verified`는 지정한 package 바이트와 metadata에 대한 정적 검증 결과입니다. 브라우저 실행, 화면 동작, 네트워크 안전성, delivery·install이나 고객 환경의 성공을 뜻하지 않습니다.

## 항목과 의존성 계획

`planDistribution`은 `api`, `type`, `guide`, `example`, `source`, `asset`, `execution` 항목을 받습니다. 각 항목에는 package ID, 검토 분류, 개별 capability 목록, 다른 항목의 ID 목록과 포함 파일 목록이 필요합니다.

허용은 정확한 capability ID에만 적용합니다. 상위 feature나 package 허용만으로 prop·type member·chart registration을 허용하지 않습니다. 알려지지 않은 capability, 미분류 항목, 빈 요구 목록, 누락 의존성, 순환, 중복 항목은 미해결로 처리합니다. 제외된 항목을 의존하는 상위 항목도 제외하며, 실패한 root에만 연결된 보조 파일은 출력 목록에서 제거합니다.

결과에는 `includedItems`, `includedFiles`, machine code를 포함한 `excluded`·`unresolved`, `ready`가 있습니다. `ready`는 해당 요청의 자료 의존성이 해결되었다는 뜻이며 실행 준비 완료를 뜻하지 않습니다.

`reviewed-content.ts`는 실제 `auth-input`, `radius`, `grouped-bar` 예제의 명시적 요구와 신규 API의 초기 매핑을 제공합니다. KST 함수 일곱 개(`formatKstDateTime`, `getKstToday`, `getKstCurrentTime`, `getKstCurrentDateTime`, `getKstDate`, `getKstDayStart`, `parseKstDateTime`)를 모두 개별 매핑하며, 기존 한금 manifest에 grant를 추가하지 않습니다. 각 예제의 공통 UI·Provider·번역·chart registration graph는 아직 격리 entry로 검토하지 않았으므로 의도적으로 미분류 support 항목을 의존합니다. 이 상태에서 예제 전체를 고객 출력에 승인하지 않습니다. 새 항목은 필요한 member·등록·보조 파일을 검토한 뒤 개별 매핑으로 추가합니다.

## 포함 자료 준비

계획과 별개로, 검토한 준비 요청을 명시하여 실행합니다.

```sh
node --experimental-strip-types scripts/distribution/prepare.ts <request.json>
```

`preparationRequestSchema`의 필수 입력은 다음과 같습니다.

| 필드                                           | 의미                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`, `configFile`, `profileId`     | 사용할 고객 프로필과 schema version                                                                                               |
| `sourceRoot`, `output`, `protectedRoots`       | 원본 root, 신규 별도 출력, full archive 등 추가 보호 경로. `sourceRoot: "."`는 저장소 root이며 output은 명시적인 절대 경로도 허용 |
| `items`, `requestedItems`, `knownCapabilities` | 검토한 항목과 요청 범위                                                                                                           |
| `modules`                                      | 포함 파일마다 `path`, 검토 당시 `sha256`, 정확한 `dependencies`, 상대 파일 `links`                                                |
| `externalPackages`                             | 검토한 외부 package import 이름. 기본값은 빈 배열                                                                                 |
| `digestAdapter`                                | 선택적인 추가 검사 module의 `path`와 고정 `sha256`. Framework 기본 바이트 검증은 항상 실행                                        |

이 명령은 개발자가 검토한 로컬 입력용입니다. 선택적인 digest adapter를 지정하면 해당 module을 실행하므로 브라우저·외부 사용자·MCP 요청에서 임의 경로를 받아 호출하면 안 됩니다. adapter 파일 hash는 검토 후 바이트 변경을 검사하며 코드의 신뢰나 승인 자체를 증명하지 않습니다. 입력 경로의 상위 경로·symlink와 source/runtime/full archive에 겹치는 출력은 거부합니다. 저장소 root를 입력으로 사용할 때는 `sourceRoot: "."`, 포함 파일의 `src/...` 경로, 저장소 밖의 신규 절대 output을 명시합니다. 출력 부모 디렉터리는 미리 존재해야 하며 기존 파일·디렉터리를 덮어쓰지 않습니다.

`validateIncludedGraph`는 복사할 파일을 glob으로 확대하지 않습니다. 계획의 포함 파일과 module graph 목록이 정확히 일치해야 하며, 파일 hash와 실제 정적 import를 대조합니다. 정적 `../` import는 정규화한 실제 대상이 source root 안의 포함된 검토 파일과 일치할 때만 허용합니다. root 이탈·symlink·제외 파일은 거부합니다. package import는 명시적인 package 및 개별 capability 승인이 필요합니다. 동적 import·loader·network 요청과 미검토 module을 거부합니다. Markdown·HTML·CSS·정적 JSX의 링크도 검토된 포함 상대 파일만 가리켜야 합니다. 명시 graph 검토는 임의 프로그램의 모든 동작을 분석하는 보안 증명이 아니므로 실행 전용 build 검증은 별도로 필요합니다.

HTML과 Markdown 안의 HTML은 정적 quoted 속성과 resource가 아닌 boolean 속성만 지원합니다. `href`·`src`는 대소문자와 관계없이 검토하며 unquoted·동적·잘못된 할당, entity와 template 표현이 있는 값은 거부합니다. JSX의 `href`·`src`도 직접 인용한 문자열만 지원하며 spread 속성은 거부합니다. `srcset`·`poster`·`style`·`srcdoc` 등 별도 해석이 필요한 resource 속성은 명시적으로 거부합니다. 이 제한된 처리는 전체 HTML·Markdown parser나 임의 실행 코드의 보안 검증을 대신하지 않습니다.

API·type 자료는 기존 전체 API JSON을 filtering하여 만들지 않습니다. `readProjectedDeclarations(manifest, packageRoots)`는 직접 호출돼도 manifest·package metadata·artifact bytes를 확인하고 실제 projected root에서 기존 `readDeclarations`를 호출합니다. `record.id`에는 subpath가 없으므로 export별 선언 view를 읽어 같은 ID의 병합으로 누락될 수 있는 실제 공개 `imports`까지 capability로 검증합니다. 공개 entry는 검증된 `selectedEntries`에 있어야 하며 현재 adapter는 `selectedEntries`의 export별 객체를 읽으며 `.`와 `./`로 시작하는 명시적인 subpath를 지원합니다. `symbol-entry`의 runtime/type symbol 목록과 `asset-entry`를 구분하고, 문자열 배열이나 알 수 없는 entry 종류는 거부합니다. 개별 grant가 있는 공개 API와 그 API가 참조하는 일반 타입·속성의 폐포를 보존합니다. 알려진 제한 member는 owner·path로 분류하되 실제로 공개된 각 import 경로의 정확한 개별 capability를 모두 요구합니다. 다른 subpath의 같은 이름에 대한 grant로 허용하지 않으며 일반 속성마다 grant를 새로 요구하지 않습니다. 미분류 공개 API는 준비를 보류합니다.

현재 선언 adapter는 명시적 package 내부 exports, `.d.ts` 상대 파일 참조와 일반 React 타입 참조를 지원합니다. React 선언을 외부에서 읽거나 전체 타입으로 확장하지 않고 기존 signature에 보존합니다. wildcard package export 경로, React 외 외부 declaration 의존성, 직접·간접 외부 re-export, default declaration export, 문서 링크, reference directive, module augmentation·namespace는 별도 검토가 필요한 미지원 계약으로 거부합니다. 공개 export의 이름 변경과 package 내부 import의 별칭·namespace binding도 reader가 public identity를 정확히 보존하지 못하므로 거부합니다. 서로 다른 선언이 같은 ID를 사용해 타입 의존 대상을 구분할 수 없는 경우도 보류합니다. 이 제약을 피하기 위해 full 설치본으로 대체하지 않습니다.

준비 결과는 `company-prepared-material` artifact입니다. 포함 파일은 다음에 한정됩니다.

- 안전한 `provided-manifest.json`
- `materials/` 아래의 명시적으로 포함한 source·guide·asset
- 실제 projected declarations에서 읽은 `api/<packageId>.json`
- target identity, 파일 inventory·hash, `materialDigest`, `executionReady: false`가 있는 `material.json`

다른 고객 프로필, 내부 distribution manifest·evidence, history, 절대 source 경로, 전체 archive를 출력하지 않습니다. runtime package를 자동으로 복사하거나 설치하지 않습니다. 이 artifact는 실행 entry가 아니며 실제 package 준비·설치, 격리 workspace/entry build, 별도 preview hosting, 브라우저 QA는 후속 작업입니다. 이번 작업에서는 실제 고객 output을 생성하지 않았습니다.

## 명시적인 이력 입력

한금 프로필에서 이력을 연결하려면 선택적인 `history`를 명시합니다.

```json
{
  "history": {
    "path": "history/example.jsonl",
    "sha256": "<명시한 JSONL 파일 bytes의 64자리 SHA-256>"
  }
}
```

이 경로는 설정 파일의 디렉터리를 기준으로 한 `.jsonl` 상대 경로입니다. 절대·상위 경로와 symlink를 거부하며, 운영 ledger를 검색하거나 기본 경로를 탐색하지 않습니다. 파일은 UTF-8로 읽고, 각 줄에 완결된 이벤트 하나와 마지막 newline이 있어야 합니다. 빈 줄·빈 파일·잘린 마지막 줄·digest 불일치·다른 고객·잘못된 chain을 거부합니다. 파일 없음은 `missing`, 유효하지 않은 입력은 `invalid`이며 두 경우 모두 event·현재 installation 목록을 비우고 delivery·install을 `unknown`으로 처리합니다. 이전 확인 사실로 대체하지 않습니다. 이력 설정이 없으면 `unknown`입니다.

`scripts/distribution/history-context.ts`가 명시된 파일을 `readSafeFile`로 읽고 `readDistributionHistory`에 연결합니다. `mode: internal`에서만 읽고 context에 요약을 넣습니다. browser에는 event의 sequence·type·status·build ID·timestamp·delivery ID·project ID와 현재 installation 목록만 전달합니다. 원본 packages·details·notes·경로·chain hash·파일 digest는 전달하지 않습니다. 고객 viewer·자료 생성기는 이 context나 내부 이력을 복사하지 않습니다.

내부 `[제공업체]` dialog는 exact Manifest feature 포함, 현재 정책 승인, 빌드 단위 delivery·install 기록과 기능 사용을 구분합니다. 현재 정책의 별도 검증 입력이 없으므로 최신 승인은 계속 미확인입니다. 이력 build의 `policyHash`, 정확한 package ID 집합과 ID별 `packageName`·`version`·`artifactDigest`가 등록 manifest와 일치하는지를 `manifestMatched`로 요약합니다. raw build 요약과 소비용 manifest 전체 객체를 비교하지 않으며, `baseVersion`은 검증된 제공 manifest에서 읽습니다. raw 요약에 `baseVersion`이 없거나 추가 감사 metadata가 있어도 공통 identity가 같으면 일치합니다. 원본 packages나 추가 metadata를 browser로 보내지 않으며, raw 이벤트의 hash chain 검증에는 기존 원문 core 바이트 계약을 그대로 적용합니다.

현재 설치 확인 표는 `history.status: verified`, `installStatus: confirmed`, 항목의 `manifestMatched: true`를 모두 요구합니다. 같은 companyId·build ID와 유효한 manifest digest를 가진 검증된 등록 target이 정확히 하나이고, 그 target에 소유 패키지의 버전이 하나만 있을 때만 해당 프로젝트·납품·build·버전을 현재 설치로 표시합니다. 미등록·중복·불일치 build나 소유 패키지가 없는 항목은 이 표에서 제외하며, 일치하는 항목이 없으면 상단 설치 상태도 미확인입니다. nonempty DTO에 invalid·missing·unknown 상태가 함께 있어도 설치 확인으로 표시하지 않습니다. 원시 설치 이벤트는 빌드 단위 기록 표에 남을 수 있으며 현재 설치 확인과 구분합니다. 설치 기록으로 기능 사용을 추론하지 않습니다. 결함·대체·롤백 이벤트는 일반 빌드·검증·납품·설치 기록과 별도 표에 표시합니다.

현재 실제 설정에는 history와 preview가 연결되지 않았습니다. 현재 UI는 한금 미리보기 준비 상태를 보여 주며 실제 이력·실행·납품·설치는 미확인입니다. 선택적 입력은 검증된 별도 fixture/config로 준비해야 하며, 이번 작업에서 실제 설정·기존 manifest를 갱신하거나 고객 산출물을 생성하지 않았습니다.

`readDistributionHistory(source, companyId, adapter?)`는 호출자가 제공한 이벤트만 검증합니다. 운영 ledger를 검색·조회·추가 기록하지 않습니다. 입력이 없으면 event 목록은 비어 있고 delivery·install은 `unknown`입니다. pending-pack이나 audit의 존재에서 delivery·install을 추론하지 않습니다.

입력은 Framework `scripts/distribution/history.mjs`의 실제 `eventType`, 1부터 연속하는 `sequence`, `companyId`, ISO `timestamp`, `policyHash`, nullable `buildId`, `packages`, `details`, `prevEventHash`, `eventHash` 계약입니다. `eventType`은 build, validation, archive-validation, delivery, install, defect, replacement, rollback입니다. 첫 이벤트의 predecessor는 `null`이며 뒤 이벤트는 직전 hash와 일치해야 합니다. `computeEventHash`는 이 core 필드만 선택하고, `buildId`·`prevEventHash`의 기본값은 `null`, `packages`·`details`의 기본값은 `{}`로 계산합니다. notes나 경로 등 `details` 원문도 hash에는 반영하되 결과에는 원문을 반환하지 않습니다. top-level 추가 필드를 전체 payload hash에 임의로 포함하지 않습니다.

등록된 build와 동일한 policy·package identity의 validation → archive-validation을 확인하며 성공 여부는 `details.passed`로 읽습니다. delivery는 `details.deliveryId`와 같은 build의 최신 성공 아카이브 검증·digest를 요구하고 project ID는 요구하지 않습니다. `deliveryId`는 최초 성공 delivery의 build·delivery manifest digest·archive digest에 고정합니다. 같은 묶음의 재전달은 허용하지만 어느 식별자라도 바꿔 재사용하면 이력 입력을 거부합니다. install은 `details.deliveryId`·`details.projectId`와 같은 build·delivery의 유효한 선행 delivery와 정확한 두 digest를 요구합니다. 한 delivery를 여러 project가 설치할 수 있으며 `installations`에 각각 표시합니다. `install.details.passed: false`는 실패 이벤트로 보존하고 해당 project의 현재 설치 확인을 해제합니다. 실패가 기존 설치를 그대로 보존했다는 증거도 없으므로 이전 성공 이벤트는 유지하되 현재 상태는 `unknown`으로 처리합니다. 다른 project의 유효한 설치는 유지합니다. 기존 입력과의 호환성을 위해 install의 `passed` 생략은 성공으로 처리합니다. 최신 아카이브 실패·validation 실패나 defect는 해당 delivery의 현재 확인 상태를 무효화합니다. replacement·rollback은 설치 사실을 자동 생성하지 않으며 새 install 없이 설치 성공을 추론하지 않습니다.

반환 `events`는 기존 소비 코드에 맞춘 `type`·파생 `status`·안전한 delivery/project ID와 chain 식별자만 포함합니다. 원본 packages, notes, host, source 경로, 감사 계약은 제거합니다. adapter가 필요한 별도 입력 형식을 연결할 때도 원본 core hash와 의미를 보존해야 합니다. 이 함수는 아카이브 디스크 상태나 실제 고객 환경을 검사하지 않습니다.

hash chain 검증은 제공된 연속 입력의 무결성 검사입니다. 원본 이력의 완전성, 작성자 진위나 실제 외부 install 성공을 독립적으로 증명하지 않습니다. history 결과는 내부 확인용이며 고객 자료에 포함하지 않습니다.

## 검증과 후속 작업

임시 fixture에서 manifest 변조·고객 불일치, 정확한 leaf capability, 의존성 폐쇄·순환, metadata 누락·버전·바이트 drift, 위험한 파일·링크·module, 포함 파일 inventory, 실제 projected type member 제거, 이력 chain 변조와 delivery 없는 install 거부를 확인했습니다. fixture와 새 검증 파일은 작업 완료 전에 제거합니다.

내부 UI의 SSR 검증은 context reader가 만든 합성 이력·버전 데이터를 실제 `OwpTable`에 전달하고 해당 표의 데이터 행을 확인합니다. 셀에는 패키지의 content wrapper가 있으므로 `<td>` 바로 아래에 값이 있다고 가정하지 않습니다. 기본 Vite formatter·lint 설정이 `scripts/`를 제외하므로 script 검증에는 설치된 도구와 명시적 임시 설정으로 소유 파일을 지정하고, 해당 임시 설정도 정리합니다.

로컬 화면 검증에서 `OwpTable`의 기본 밝은 header가 어두운 화면의 밝은 글자색을 상속해 읽기 어려운 것을 확인했습니다. 내부 distribution 표의 MUI header selector에 기존 `--pg-subtle`·`--pg-ink` 토큰을 적용한 뒤 실제 computed style은 배경 `rgb(35, 35, 35)`, 글자 `rgb(237, 237, 237)`이었습니다. 이 보정은 해당 표의 CSS 범위에 한정하며 전역 Provider나 Framework를 바꾸지 않습니다.

Node의 strip-only 실행에서는 TypeScript parameter property를 사용할 수 없습니다. 오류 class의 필드는 명시적으로 선언하고 constructor 안에서 할당합니다. 설치된 TypeScript 7에서 파일 목록으로 범위를 좁혀 검사할 때는 `--ignoreConfig`를 사용하며 필요한 strict·module 옵션과 `--types node`를 함께 지정합니다. 이 저장소의 sandbox에서 테스트가 OS 임시 디렉터리에 쓸 수 없으면 `TMPDIR`을 허용된 저장소 내부 임시 위치로 지정하고 테스트 종료 후 임시 파일·Node compile cache를 정리합니다.

Framework artifact·history 원본 계약은 승인된 source 파일과 합성 fixture로 상호 대조했습니다. 메인 세션에서는 기존 업체 개발 빌드 10개 패키지의 metadata·파일 바이트와 제공 manifest가 일치하는 것도 읽기 전용으로 확인했습니다. 이는 이전 빌드의 정적 검증이며 새 전체판 기준의 업체 빌드·설치·실행을 확인한 결과는 아닙니다. 후속 단계는 새 고객 package bytes의 정적 검증, 미지원 선언 계약과 support graph의 개별 검토, 실제 격리 entry build·hosting·브라우저 검증입니다. 실제 전달·설치는 각각 확정 이력으로 별도 확인해야 합니다. 기존 full snapshot·Knowledge·MCP 자료 갱신은 명시 요청이 있을 때만 수행합니다.
