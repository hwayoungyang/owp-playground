# OWP Framework 소비 API 이관 TRD와 검증 기록

2026-11-06에 시작해 2026-11-07까지 확인한 결과입니다. 소비 코드 이관과 추가 보완 코드 정리는 반영했습니다. 생성 Knowledge의 동기화와 아래에 명시한 광범위 회귀 검증은 완료하지 않았습니다.

## 승인과 변경 경계

- 첫 번째 요청의 전체 소비 API 이관을 기본 범위로 삼고, 두 번째 요청의 TimeWheel·번역·QR 점검을 추가했습니다. 대화에서 수정 전 TRD를 제시했으며, 첫 번째 요청의 명시적 승인에 따라 재승인 없이 진행했습니다.
- TreeGrid 패키지 관련 작업은 사용자의 후속 요청에 따라 제외했습니다. DataGrid와 Charts의 기존 연동은 유지했습니다.
- 작업 시작 전부터 변경돼 있던 `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`과 README의 버전 변경을 보존했습니다. 패키지 설치·버전 변경·pack, Framework·node_modules 수정, Knowledge 생성·MCP·snapshot 갱신, 배포·커밋·푸시는 실행하지 않았습니다.
- `knowledge/reviewed-packages.json`과 `reviewed-package-resolutions.json`은 사용자가 요청한 설치 계약 검토표로 갱신했습니다. `readDeclarations`로 설치본의 선언·runtime 지문을 산출했으며 생성 Knowledge 파일은 수정하지 않았습니다.

## 수정 전 TRD

1. 실제 설치본의 exports·선언·runtime을 기준으로 사용 중인 구 API를 이관합니다. 다른 라이브러리의 동명 API, 업무 데이터 key, i18n key와 DataGrid의 포맷 옵션은 일괄 치환하지 않습니다.
2. TimePicker의 `format`을 `valueFormat="HH:mm:ss"`로 이관합니다. 상위 스크롤 복원 코드만 제거한 후보에서 컬럼 정렬과 외부 `main` 스크롤을 측정합니다. 모드별 값, 탭, `onData`·`onRecord`는 보존합니다.
3. QR의 제거된 함수를 현재 공개 함수로 바꾸되 두 Effect Event와 실제 생성 조건의 의존성을 유지합니다. 번역 hook의 최소 재현은 실제 QR의 의존성을 바꾸지 않고 별도로 수행합니다.
4. 실행 예제·코드 탭·가이드 원본·API 연결 검사·설치 검토표를 함께 대조합니다. 생성 자료의 지연을 테스트 조건 완화나 호환 wrapper로 숨기지 않습니다.

## 설치본과 공개 계약

| 패키지 | 실제 설치 버전 | 반영한 변경과 대표 사용처 |
| --- | --- | --- |
| `@owp/core` | 11.0.0 | `useCommonCodesByGroup`·`useSetCommonCodesByGroup`, 공통코드 예제와 기능 목록 |
| `@owp/components` | 5.0.0 | MoreActions의 고정 `id`·`buttonSx`·`menuSx`, `UseConfirmOptions`, 타입·역할 설명 |
| `@owp/date-picker` | 3.0.0 | `VALUE_*_FORMAT`·`formatDate`·`formatToday`, `valueFormat`, 스크롤 복원 제거 |
| `@owp/excel` | 4.0.0 | `createExcelExport`·`downloadExcelBuffer`·열 주소 함수·`ExcelColumnMapping`·`columnMappings`·`address` |
| `@owp/pdf` | 4.0.0 | 두 PDF 예제의 OWP wrapper를 `OwpPdfPage`로 이관 |
| `@owp/theme` | 4.0.0 | `useTableThemeConfig`·`useDatePickerThemeConfig`, resolved 타입 설명 |
| `@owp/utils` | 2.0.0 | `generateQrCodeDataUrl(text, { width })`, `generateBarcodeObjectUrl` 역할 설명 |
| `@owp/charts` | 7.0.0 | `ChartCanvas`·`ChartCanvasProps`, `tileStyle`, native `itemSort`·`groupSort`, Sparkline 연동 |
| `@owp/datagrid` | 4.0.0 | Charts lazy import와 문서 기본값의 검토 지문을 현재 runtime에 맞춤 |
| `@owp/tailwind-config` | 4.0.0 | 기존 CSS import와 가이드 유지. 해당 이관 대상 API 없음 |

`owp-local`은 조회 당시 release `20261105-003913-ddc3337bcf64`의 이전 버전만 제공했습니다. 이를 새 버전으로 간주하지 않고 현재 설치본을 기준으로 판단했습니다.

요청한 두 수정은 버전 번호와 별개로 구현에서 확인했습니다.

- Components의 `dist/chunks/nOOsk5MD.js`는 `useCallback`을 import하고, 원래 번역 함수만 의존성으로 사용해 `t` wrapper를 반환합니다. 이는 `6d9f7802`에서 설명한 수정과 일치합니다.
- Date Picker의 `dist/index.js`는 선택 항목의 위치를 컬럼 기준으로 계산하고 `scrollHeight - clientHeight` 범위로 제한한 뒤 해당 컬럼의 `scrollTo`를 호출합니다. 정렬 Effect의 의존성에 옵션 목록도 포함돼 있습니다. 설치 runtime에서 `scrollIntoView` 경로는 발견되지 않았습니다. 이는 `dcc35d6e`에서 설명한 수정과 일치합니다.

## 사용처 전수 대조

정적 수집기는 `src`·`tests`·`scripts`·`mcp`의 857개 소스에서 import·re-export·namespace 접근·동적 import 선택을 대조했습니다. **915개 OWP import의 공개 선언·runtime export·소유권 검사에서 오류가 없었습니다.** 전체 항목은 로컬 검증 근거의 `owp-import-inventory.json`에 파일·줄·entry·이름·종류별로 기록했습니다.

| 패키지 | import 수 | 사용 파일 수 |
| --- | ---: | ---: |
| Core | 98 | 57 |
| Components | 381 | 302 |
| Theme | 20 | 17 |
| Charts | 136 | 84 |
| DataGrid | 249 | 139 |
| Date Picker | 11 | 5 |
| Excel | 10 | 10 |
| PDF | 3 | 3 |
| Utils | 7 | 7 |

현재 실행 소스와 수동 관리 안내의 구 이름은 이관했습니다. 변경하지 않은 항목도 구분했습니다.

- Selector의 구 입력 props·`resolvedOptions`, QuerySelector에 대한 금지 입력 props 주입은 현재 실행 사용처에서 발견되지 않았습니다. 이관을 위해 새 예제를 추가하지 않았습니다.
- QuerySelector 예제는 내부 전체 query key를 재조립하지 않고 요청 경로 포함 여부로 캐시 이벤트를 관찰합니다. 공유 캐시 row를 새 `{ value, label, raw }` 구조로 쓰는 보완 코드는 추가하지 않았습니다.
- Excel의 `mapping.key`는 데이터 property이므로 유지했습니다. 셀 주소만 `address`로 바꿨습니다. merge range와 `{ buffer, exportName }` 흐름도 유지했습니다.
- `chart.js:CoreChartOptions`와 저수준 `layoutTreemap.options.sort`, DOM·ChartFrame의 CSS `style`, DataGrid의 `timeOptions.format` 등은 별도 계약이므로 유지했습니다.
- `knowledge/source-audit.json`·생성 Knowledge·기존 example review archive의 구 이름은 생성 당시 자료입니다. 이번 이관에서 재작성하지 않았습니다. 감사 스크립트의 `original`에 남은 구 이름도 과거 근거를 설명합니다.

## TimeWheel과 번역 검증

스크롤 검증은 복원 코드가 제거된 실제 TimePicker 예제를 임시 검증 페이지에서 import해 수행했습니다. 높이 600px의 자체 세로 스크롤 `main`에 위·아래 여백을 두고 `scrollTop=500`을 기준으로 사용했습니다. document capture 단계의 `pointerdown`·`click`·`keydown`에서 진입값을 기록하고 두 번의 animation frame 후 결과를 대조했습니다.

| 시나리오 | 확인 결과 |
| --- | --- |
| 24h 시·분·초 좌표 선택 | `14:15:00 → 15:20:15`, 각 이벤트 `500 → 500` |
| 키보드 아래 화살표 | `15:20:15 → 15:20:30`, `500 → 500` |
| 12h 전환과 오전·시·분·초 선택 | 별도 12h 값 `03:20:15`, `500 → 500` |
| 시간·날짜시간·휠 재진입과 모드 복귀 | 모드별 값 유지, `500 → 500` |
| 실제 TimePicker 팝업 | 시·분·초 선택으로 `04:25:30` 확정·닫기, 재진입 후 Escape 닫기와 값 보존 |
| 별도 controlled TimeWheel의 외부 value | `14:15:00 → 23:50:45`, `500 → 500` |
| minuteStep 5→10·외부 12h 전환 | 선택 항목 표시·재정렬과 값 유지, `500 → 500` |

선택에는 이미 화면에 보이는 항목의 좌표를 사용해 클릭 전 화면 맞춤 스크롤과 구분했습니다. 테스트를 위해 기준 위치를 옮긴 이벤트 `0 → 500`은 component 검증 결과에 포함하지 않았습니다.

이에 따라 `scope`·`scrollPosition` ref, `saveScrollPosition`, 관련 호출과 `useLayoutEffect`를 제거했습니다. 두 ref와 해당 import는 복원 용도에서만 사용됐습니다. `OwpDatePickerStyleScope`와 값·탭·모드 상태, 데이터·이벤트 callback은 유지했습니다.

번역 최소 재현은 실제 `generateQrCodeDataUrl`을 호출하는 `[input, t]` Effect에서 결과 객체를 state에 저장했습니다. 최초 생성 1회 뒤 무관한 state 변경에서도 `t` 참조와 생성 1회를 유지했습니다. 실제 입력 변경은 2회째 생성을 일으켰습니다. 언어·구독 중인 리소스·Provider 변경에서는 각각 최신 번역을 반영했습니다. 언어 전환 전에 대기시킨 비동기 오류는 완료 시 최신 영어 번역과 변경된 callback 값을 읽었습니다.

실제 QR 예제에서는 최초 생성 이벤트 1회, 언어 전환 후 1회 유지, 크기 200→240 변경 후 2회, 언어 복귀 후 2회 유지, 실제 입력 변경 후 3회를 확인했습니다. `recordEvent`·`reportGenerationError`의 `useEffectEvent`와 입력·크기·여백·오류 정정 수준·색상·재시도 의존성을 유지했습니다. README는 이전 설치본의 관측과 현재 설치본을 구분합니다. Effect Event의 최신 committed state·callback 사용 목적은 [React 공식 문서](https://react.dev/reference/react/useEffectEvent)와 대조했습니다.

## 검사 결과와 실제 화면 확인

| 검사 | 결과 |
| --- | --- |
| `tsc --noEmit` | 통과 |
| `vp lint`, `biome lint .`, `git diff --check` | 통과 |
| `scripts/owp-import-contracts.mjs` | 857개 소스·915개 import 통과 |
| 직접 설치 계약과 소유 패키지 의존성 지문 | 버전·declarationHash·runtimeHash 대조 통과 |
| `vp build` 직접 실행 | 통과. 큰 chunk 경고 유지. `pnpm build`의 Knowledge 생성 단계는 실행하지 않음 |
| `verify-source-structure.mjs --static` | 645개 원본·116개 기존 경로의 구문·import·snippet 일치 |
| 통합 `vp test run` | 101개 파일 통과·5개 파일 실패, 905개 테스트 통과·6개 실패 |
| 독립 최종 검토 | 제공 snapshot에서 새 구체적 결함 없음. 전체 인수 완료 판정은 보류 |

코드 탭의 DOM 본문을 원본 파일과 직접 비교한 17개 구성은 모두 일치했습니다. TimePicker·DateRange, Excel 2개, PDF 2개, Theme, QR, Core 공통코드·Excel·페이지 콘텐츠, MoreActions·파일 작업·Confirm, Sparkline, 전용/native Treemap입니다. native Treemap은 화면의 ‘직접 구성’을 선택한 뒤 해당 원본과 대조했습니다.

실제 화면에서는 위 변경 예제를 로드했고 다음 동작도 확인했습니다.

- MoreActions의 기본 선택·닫기와 제어형 메뉴의 키보드 선택을 확인했습니다. 데이터 탭에서 `basic="detail"`, `controlledAction="selected"`, `controlledOpen=false`였습니다.
- Confirm의 확인·취소에서 callback은 한 번 실행되고 callback 종료 후 결과 Promise가 완료됐습니다. 실제 공개 `OwpDialogsProvider.closeAllSignal` 경로에서는 callback이 `false`, 결과 Promise는 `undefined`였습니다.
- Excel 생성 버튼은 `production-lines.xlsx`·6,923 bytes를 표시했습니다. 별도 runtime 검사에서는 생성한 XLSX를 다시 읽어 주소·mapping·merge와 `703↔AAA`, `16384↔XFD`를 확인했습니다.
- PDF 벡터 예제는 2,212-byte PDF를 생성했습니다. 별도 runtime 검사에서 PDF MIME과 `%PDF-` 서명도 확인했습니다.
- Treemap의 그룹을 숨기면 남은 그룹의 영역이 재배치됐습니다. Sparkline도 실제 canvas가 표시됐습니다.
- DataGrid 대용량 예제의 1만 행 렌더링을 확인했습니다. 화면의 반영 시간은 447.5ms였으며 FPS나 일반적인 성능 보장으로 해석하지 않습니다.

## 미반영 자료와 남은 제한

실패한 6개 테스트를 통과로 처리하지 않았습니다.

1. 생성 자료 미갱신에 따른 5개 실패: `api-code-sources` 1개, `api-korean-copy` 1개, `api-references` 2개, `core-feature-coverage` 1개입니다. 현재 예제·가이드·공개 API와 이전 생성 자료의 소스 지문·이름·버전이 다릅니다. 생성 자료를 쓰는 관련 API 표시에도 이전 이름이 남을 수 있습니다. 사용자가 이후 Knowledge·snapshot·MCP 갱신을 요청할 때 다시 대조해야 합니다.
2. `components-render` 1개는 설치된 MUI Popover의 서버 렌더링에서 `document is not defined`로 실패합니다. 브라우저 동작 확인과 SSR 통과는 별개이며, 이를 가리는 소비 코드 보완은 추가하지 않았습니다.

다음 범위도 확인을 마치지 못했습니다.

- 실제 다운로드 파일 저장 완료와 클립보드 복사 결과: UI 생성·코드 표시 일치는 확인했지만 다운로드 이벤트 추적은 시간 초과, 클립보드 읽기는 빈 값이었습니다.
- DataGrid의 5만·10만 행 및 일반/커스텀/고정·가변 높이·스크롤·전환 조합 전체: 5만 행 전환 시도 중 브라우저 도구가 시간 초과로 초기화됐습니다. 1만 행 렌더링 확인을 이 전체 범위로 확대하지 않습니다.
- Charts 전체의 type/redraw/ref 교체·tooltip·Live 대량 append·PNG 조합과 Selector 원격 A→B·observer 조합 전체.
- 터치 에뮬레이션과 실기기: 연결 도구에 실제 터치 입력 기능이 없어 수행하지 않았습니다. 마우스·키보드 결과와 구분합니다.

재검증은 해당 Playground 예제의 조작·데이터·이벤트 탭에서 수행할 수 있습니다. DataGrid는 `large-data`에서 50,000·100,000행을 생성한 뒤 정방향·역방향·큰 위치·가로 이동과 설정 전환을 확인해야 합니다. Charts는 `live`·`programmatic-events`·`png-export` 및 각 native 구성, Core는 `query-selector`의 검색·선택 보존을 확인해야 합니다. 대기·취소·Provider 교체의 전체 조합은 이 기록의 통과 범위에 포함하지 않습니다.

## 근거와 워커 사용

로컬 실행 로그·화면·측정 기록·전체 import 목록은 `.omo/evidence/owp-migration-20261106/`에 보관합니다. 이 디렉터리는 기존 저장소 규칙에 따라 Git 추적 대상이 아닙니다. 새로 만든 임시 검증 페이지·테스트와 실행 cache는 정리했습니다. 현재 native 세션의 삼천포 receipt는 원장에서 찾지 못했고, doctor에서도 데몬 응답이 없어 감시 미확인으로 남겼습니다. 기존 공통 검증 지침이 이미 다루는 브라우저·권한·임시 파일 문제에 중복 규칙은 추가하지 않았습니다.

dev server 종료 로그에서는 저장소를 `TMPDIR`로 사용한 통합 테스트가 임시 HTML을 만들 때마다 Vite가 페이지를 재로드한 사실을 확인했습니다. 이를 모든 브라우저 시간 초과의 원인으로 단정하지는 않습니다. 다만 다음 화면 검증이 fixture 생성으로 초기화되지 않도록, 서버가 감시하지 않는 허용된 임시 경로를 사용한다는 재발 방지 기준을 README의 검증 절차에 반영했습니다.

- OpenAI Codex가 조율·TRD·최종 판단과 실제 브라우저 검증을 담당했습니다.
- Google Antigravity Gemini 3.8 Flash `medium`은 읽기 전용 사용처 탐색을 완료했습니다.
- OpenAI Codex Sol 6.1 `high` 구현 워커 두 명이 Charts와 나머지 소비 예제를 나눠 병렬 처리했습니다. 이후 별도 Sol `high`가 설치 지문 기반 기본값·버전 검사를 이관했습니다.
- 독립 OpenAI Codex Sol 6.1 `high` 최종 검토는 정적 변경 검토를 통과시키고 전체 인수 검증은 보류했습니다. Sonnet·Argon은 선택기의 한도 제한으로 실행하지 않았습니다. 외부 공급자 독립 리뷰가 완료됐다고 주장하지 않습니다.
