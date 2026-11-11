# hasValue와 KST 날짜·시간 API 검토

검토일: 2026-11-11. 기준은 Playground에 실제 설치된 `@owp/utils` 2.1.0과 `@owp/date-picker` 3.1.0의 `package.json`, exports, 공개 선언, 배포 runtime이다. 패키지를 설치하거나 업데이트하지 않았다.

## 공개 계약

- `hasValue`는 `@owp/utils`에서 import한다. `null`, `undefined`, `''`만 제외하며 `0`, `false`, 공백 문자열, `NaN`은 유지한다. runtime은 `!isNilOrEmptyString(value)`이며 type guard는 `Exclude<T, null | undefined | ''>`이다. 문자열 입력을 숫자나 boolean으로 설명하지 않으며 trim 후 판정과 원본 판정을 구분한다.
- KST 7개 함수와 type-only `KstDateOptions`는 `@owp/date-picker/utils`에서 공개된다. `formatKstDateTime`의 timestamp는 Unix 밀리초, 기본 포맷은 `YYYY-MM-DD HH:mm:ss`다. `Z`와 `ZZ`는 각각 `+09:00`, `+0900`이다.
- `getKstToday(format?, timestamp?)`는 기본 `YYYY-MM-DD`, `getKstCurrentTime(format?, timestamp?)`은 기본 `HH:mm:ss`, `getKstCurrentDateTime(timeFormat?, timestamp?)`은 같은 timestamp의 `{ date, time }`을 반환한다. timestamp 생략 시 현재 시각을 읽는다. 예제는 고정 timestamp를 전달하고 현재 시각 버튼에서만 `Date.now()`를 한 번 호출한다.
- `getKstDate(options?, timestamp?)`는 월 이동 → 일 이동 → 월초 지정 순서다. 기본값은 `months: 0`, `days: 0`, `startOfMonth: false`다. 월 이동은 말일로 보정하고 days는 `Math.round`로 반올림한다. UTC 달력을 사용해 호스트 시간대와 DST 영향을 피한다.
- `getKstDayStart(timestamp?)`는 KST 자정의 실제 epoch 밀리초다. `2026-01-31` KST 자정은 `1769785200000`, UTC로 `2026-01-30T15:00:00.000Z`다.
- `parseKstDateTime`은 앞뒤 공백을 제거한다. 날짜는 `YYYY-MM-DD`, 날짜·시간은 단일 공백 또는 대문자 `T` 뒤 `HH:mm[:ss[.S~SSS]]`다. 소수 초는 초가 있을 때만 1~3자리까지 허용한다. 시간 뒤 대문자 `Z` 또는 `±HH:mm`/`±HHmm`을 허용하며 offset의 시는 00~23, 분은 00~59다. 날짜만 있거나 시간대가 없으면 KST로 해석한다. 실제 달력 날짜·시간·offset과 형식을 검사하며 실패는 `null`이다. `0`이나 현재 시각으로 대체하지 않는다.

## 실행 예제와 Knowledge 구분

`value-format`과 `kst-date-time`은 integration catalog와 loader로 실행한다. 코드 탭은 같은 TSX 원본을 수집한다. 화면 가이드와 Knowledge 가이드는 `src/playgrounds/integrations/utility-guides.ts`의 계약 설명을 공유한다.

`knowledge/package-adapters.mjs`의 utils/date-picker catalog는 기존처럼 비어 있다. 이번 가이드의 Knowledge `examples`도 비어 있으며 화면 예제를 MCP 실행 예제로 등록하지 않는다. 공개 선언을 기존 생성기가 읽어 API·타입·기본값과 검색 자료를 생성한다. 생성 JSON을 직접 편집하거나 계약 검사를 완화하지 않는다.

조회한 `owp-local`의 현재 release는 `20261107-043108-6d92ccf85a4a`이며, utils 2.1.0과 date-picker 3.1.0은 제공되지 않았다. 다른 버전으로 대체 조회하지 않았다. 로컬 Knowledge 재생성은 archive snapshot 생성·등록이나 MCP 설정·서버 반영과 별개다.

## 변경 파일과 진입점

화면 진입점은 `?package=utils&sample=value-format`의 값 존재 여부 탭과 `?package=date-picker&sample=kst-date-time`이다. 각 패키지의 시작하기 화면에도 가이드와 예제 링크가 있다. 기존 picker와 숫자·문자열·폼 기본값 탭은 유지한다.

```text
src/playgrounds/utils/examples/value-format.tsx
src/playgrounds/utils/examples/value-presence-panel.tsx
src/playgrounds/utils/examples/form-default-values-panel.tsx
src/playgrounds/date-picker/examples/kst-date-time.tsx
src/playgrounds/date-picker/examples/kst-adjustment-panel.tsx
src/playgrounds/date-picker/examples/kst-parsing-panel.tsx
src/playgrounds/integrations/catalog.ts
src/playgrounds/integrations/Workspace.tsx
src/playgrounds/integrations/utility-guides.ts
src/playgrounds/integrations/locales.en.ts
src/playgrounds/integrations/locales.ko.ts
src/playgrounds/utils/focused.en.ts
src/playgrounds/date-picker/focused.en.ts
src/playgrounds/PackageGettingStarted.tsx
src/features/public-api/roles/integrations.ts
src/shared/i18n/package-guides.en.ts
src/shared/i18n/reference-copy-patterns.ts
knowledge/package-guides.mjs
knowledge/reviewed-packages.json
knowledge/reviewed-package-resolutions.json
knowledge/source-audit.json
src/features/api/data/knowledge.generated.json
scripts/verify-source-structure.mjs
tests/installed-package-compatibility.test.tsx
tests/knowledge-metadata.test.ts
tests/package-export-contracts.test.ts
tests/api-korean-copy.test.mjs
tests/source-paths.test.ts
tests/source-resources.test.ts
tests/components-feedback-locales.test.ts
docs/value-kst-api-review.md
```

`knowledge/package-adapters.mjs`와 `scripts/generate-knowledge.mjs`는 기존 등록·검증·생성 계약을 확인한 뒤 변경하지 않았다. 기존 작업자의 배포·패키지 설정 변경은 보존했다.

## 기존 설치 변경과 생성 전제 검토

작업 시작 시 설치본과 검토 기록이 이미 달랐으며 생성기는 모든 adapter의 계약을 검사했다. 아래 갱신은 생성 검사를 무시하기 위한 일괄 hash 교체가 아니라 이전 설치본과 현재 설치본을 대조한 뒤 반영한 검토 기록이다.

| 패키지 | 이전 검토본 → 설치본 | 공개 선언 검토 |
| --- | --- | --- |
| utils | 2.0.0 → 2.1.0 | hasValue 1개 추가, 기존 API 변경·삭제 없음 |
| date-picker | 3.0.1 → 3.1.0 | KST 함수·타입·옵션 member 11개 record 추가, 기존 API 변경·삭제 없음 |
| core | 11.0.1 → 11.0.2 | 공개 선언과 API 계약 record 동일 |
| datagrid | 4.0.1 → 4.0.2 | 공개 선언과 API 계약 record 동일 |
| charts | 7.0.1 → 7.0.2 | 공개 선언과 API 계약 record 동일 |
| components | 5.0.1 → 5.0.2 | 공개 선언과 API 계약 record 동일 |
| theme | 4.0.0 → 4.0.1 | 공개 선언·runtime 동일 |
| excel | 4.0.0 → 4.0.1 | 공개 선언·runtime 동일 |

위 패치 설치본은 OWP 의존성 버전과 es-toolkit·빌드 도구 등의 의존성이 변경되어 있다. Components의 동일 chunk에 대한 import 순서·로컬 alias 변경, Charts·Core·DataGrid의 runtime 재빌드 차이를 확인했다. hash 차이만으로 runtime 동작이 동일하다고 가정하지 않으며 실제 회귀 검사 결과를 함께 확인한다. 기존 로컬 날짜 유틸과 picker 기본값을 KST로 바꾸지 않는다.

Charts 소유자가 실제 resolve하는 Chart.js 4.6.1도 이전 4.5.1과 대조했다. ArcSpacingMode와 spacingMode, PolarArea spacing, 축 제목 strokeColor/strokeWidth 등 8개 record가 추가되고 GridLineOptions.tickWidth가 `number`에서 `ScriptableAndArray<number, ScriptableScaleContext>`로 확장됐다. 다른 변경 record에는 소유 타입의 signature·참조 변경이 포함된다. react-chartjs-2와 annotation/datalabels의 공개 계약은 동일하다. 기존 소유자별 의존성 검사를 유지하며 실제 resolve한 설치 경로를 기준으로 기록한다. 관련 없는 차트 예제·가이드는 수정하지 않는다.

source-audit는 기존 DataGrid 편집 원본의 추가 안내로 바뀐 지문과 뒤쪽 두 heading의 1줄 이동을 검토한 후 기존 감사 생성기로 갱신했다. heading·guide ID·분류·correction 계약은 유지한다. Framework·소비앱 원본은 수정하지 않는다.

## 검증과 재발 방지

- 서울·UTC·뉴욕의 호스트 시간대에서 각각 93개 runtime assertion을 실행했다. 결과 지문은 세 환경에서 동일했다. 자정·월말·연말·윤일·offset·초와 밀리초·잘못된 형식·epoch 0·기본값을 포함했다.
- 최종 소스 기준 전체 Vitest 106개 파일의 1,072개 테스트가 통과했다. 렌더 panel 분리 직후에는 관련 테스트 257개를 먼저 재실행했고, 새 Knowledge 계약·기본값은 기존 metadata 테스트 파일의 10개 테스트에서도 확인했다.
- `pnpm build`, `pnpm knowledge:check`, `node scripts/verify-source-structure.mjs --static`을 통과했다. build에는 기존 큰 chunk 경고가 남지만 snapshot 생성·서버 배포는 수행하지 않았다.
- 연결된 Chrome에서 프리셋·문자열 직접 입력·월/일/월초·파싱·사용자 포맷·현재 시각 버튼·코드 탭과 panel 소스·검색·API Signature·한영 가이드를 확인했다. 390px 화면은 페이지 가로 overflow가 없고 표의 반환값 열은 내부 가로 스크롤로 접근할 수 있었다. 콘솔 error는 없었다.
- 공유 번역 계층은 Playground 구현을 import하지 않는다. 한국어 문자열 key를 유지해 소스 계층 검사를 통과시킨다. 화면 가이드와 Knowledge 계약 원본만 공유하고 번역 사전은 기존 위치에서 관리한다.
- 설치 metadata는 snippet 소스와 구분한다. 소스 구조 검사도 기존 소스 수집기가 package 이름·version을 검증한 metadata만 재사용한다. 실제 build가 생성한 snippet과 원본을 비교하며, 소스 변경 후에는 build를 먼저 갱신한 뒤 정적 snippet 검사를 실행한다.
- React 19.3.1과 MUI 9.5.0의 설치 선언 및 [React Effect 문서](https://react.dev/reference/react/useEffect), [useEffectEvent 문서](https://react.dev/reference/react/useEffectEvent), [MUI Select 문서](https://mui.com/material-ui/react-select/)를 대조했다. 이 예제에는 외부 구독·timer가 없으므로 기존 반응형 데이터 동기화 의존성을 유지하고 Effect Event를 추가하지 않았다.
- 독립 OpenAI Codex Sol 6 1 high 검토자는 고정된 소스·diff·설치 API 계약·생성 record 발췌·QA 요약을 정적으로 검토해 APPROVE를 반환했으며 P1/P2 지적은 없었다. 전체 생성 JSON·모든 registry hash·브라우저 캡처와 실행 원시 로그를 독립적으로 재검증한 결과는 아니다. 실제 실행 검증과 최종 완료 판단은 메인 Codex가 담당했다. Argon 검토는 현재 한도 소진으로 미실행이므로 교차 공급자 검증으로 보고하지 않는다.
