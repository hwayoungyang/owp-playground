# 설치된 Provider API 적용 TRD

상태: 설치본 조사 완료, 구현 승인 대기

## 목적과 범위

OWP Playground의 앱 번역 초기화를 설치된 `OwpI18nProvider`로 이전하고, Provider의 역할·선택적 구성·언어 상태를 예제와 한영 문서에 일치시킨다. 패키지 설치·버전 수정·lockfile 갱신 없이 실제 설치본을 사용한다.

- 수정 저장소: `owp-playground`만 해당한다.
- `owp-framework`와 한금 소비앱은 수정하지 않는다. 계약 확인에 필요한 원문은 읽기 전용으로 참조한다.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`과 기존 사용자 변경을 보존한다.
- snapshot 생성·등록·정리, MCP 설정·서버 갱신, 배포는 제외한다.
- 설치본에 없는 API를 앱의 임시 구현이나 패키지 재설치로 대체하지 않는다.

## 설치본 확인 결과

| 패키지 | 기존 검토 버전 | 설치 버전 | 선언·runtime 대조 |
| --- | --- | --- | --- |
| `@owp/core` | 10.3.0 | 10.4.0 | 두 해시 모두 변경 |
| `@owp/datagrid` | 3.5.4 | 3.5.5 | 두 해시 동일, 버전 변경 |
| `@owp/charts` | 6.1.0 | 6.1.1 | 두 해시 동일, 버전 변경 |
| `@owp/components` | 4.0.1 | 4.0.2 | 두 해시 동일, 버전 변경 |
| `@owp/date-picker` | 2.1.1 | 2.1.2 | 두 해시 동일, 버전 변경 |
| `@owp/theme` | 3.0.0 | 3.0.0 | 버전·두 해시 동일 |
| `@owp/utils` | 1.1.0 | 1.1.0 | 버전·두 해시 동일 |
| `@owp/excel` | 3.0.0 | 3.0.0 | 버전·두 해시 동일 |
| `@owp/pdf` | 3.1.0 | 3.1.0 | 버전·두 해시 동일 |

확인한 계약의 원본은 `node_modules/@owp/core/package.json`의 exports, `dist/declarations/i18n.d.ts`, `dist/declarations/contexts.d.ts`, 관련 declaration chunk와 runtime이다. `OwpI18nProvider`는 `@owp/core/i18n`에서 export한다. 요청한 Provider 선택 props도 모두 설치본에 있다.

현재 MCP release `20261104-021807-99b0cbf55942`는 Core 10.3.0, DataGrid 3.5.4, Charts 6.1.0, Components 4.0.1, Date Picker 2.1.1까지만 제공한다. 다른 버전으로 대체 조회하지 않고 설치본을 근거로 사용한다.

기존 API 데이터에 있던 `OwpDialogsProviderProps`와 `OwpSnackbarProviderProps`는 공개 import 경로가 없는 추론용 내부 타입이다. 새 선언은 관련 props를 직접 표현하므로 이 이름을 유지하기 위한 임시 export나 대체 타입을 추가하지 않는다.

## 1. 앱 번역 초기화

`src/app/i18n.ts`를 부작용 없는 번역 리소스·설정 모듈로 바꾼다. 현재 English/Korean 조합, override·용어 정규화·안내 문구 처리와 `app`·`owp` namespace를 보존한다.

- 앱에서 사용하는 언어는 `ko`·`en`으로 한정하고 `supportedLngs: ['ko', 'en']`을 명시한다.
- `fallbackLng: 'ko'`, `defaultNS: 'app'`, `ns: ['app', 'owp']`, `keySeparator: false`, `nsSeparator: false`, `interpolation.escapeValue: false`, `initAsync: false`를 보존한다.
- Core metadata는 `kr`·`en`이며 `languageMap={{ kr: 'ko' }}`로 연결한다. 기존 `kr` 리소스 별칭이 남더라도 앱의 지원 언어나 선택 가능한 언어로 사용하지 않는다.
- 초기 `lng`는 URL의 `lang`이 정확히 `en`일 때 `en`, 그 외에는 `ko`다. 이전 storage 값보다 URL 정책을 우선한다.
- 앱 리소스는 로컬로 제공한다. 원격 리소스 설정 `remote`를 추가하지 않는다.
- `src/main.tsx`에서 초기화용 side-effect import를 제거하고, `<App />`을 app scope `OwpI18nProvider` 하나로 감싼다. 기존 스타일 `Provider`는 유지한다.
- 초기화 대기 화면은 아직 번역 Context가 없다는 점을 고려해 번역 Hook에 의존하지 않도록 구성한다. 문구는 기존 locale·리소스 체계에서 관리한다.
- 오류는 기존 가이드·예제의 `OwpErrorBoundary`, 오류 보고, chunk 복구 패턴에 맞춰 연결한다. Provider의 초기화 오류는 `onError` 이후 render에서 throw한다는 설치본 동작을 반영한다. 오류를 무시하거나 무한 로딩으로 숨기지 않는다.

## 2. 언어 상태와 URL의 책임

`src/playgrounds/core/runtime/CoreProviders.tsx`의 `CoreLanguageBridge`를 제거한다. Provider가 담당하는 metadata, `CURRENT_LANGUAGE` 저장, API 언어와 i18next 코드 동기화를 앱에서 반복하지 않는다. synthetic `StorageEvent`도 제거한다.

URL 갱신은 이미 `src/app/App.tsx`의 `languageChanged` 구독이 담당한다. 이 위치를 앱의 단일 URL 갱신 지점으로 유지하며 기존 query·hash·화면 상태를 보존한다. URL과 document 언어를 package metadata 코드 `kr`로 바꾸지 않는다.

`src/playgrounds/core/examples/language-switcher.tsx`에서는 `kr`·`lc`를 받은 뒤 다시 `changeLanguage('ko')`를 호출하는 보정을 제거한다. Provider가 노출하는 두 언어로 선택 목록과 관측 결과를 맞추고 `reloadOnChange={false}`를 유지한다. Header와 Core 선택기를 번갈아 조작해도 같은 Provider instance를 읽어야 한다.

기존 `useEffectEvent`는 `languageChanged`에서 최신 `onRecord`를 읽는 용도로 유지한다. `i18n`은 실제 구독 대상이므로 Effect 의존성에 남기며 cleanup을 검증한다. React 19.3.1 설치본과 [React 공식 문서](https://react.dev/reference/react/useEffectEvent)를 기준으로 판단한다.

## 3. singleton 의존과 테스트 초기화

실행 소스의 raw singleton 사용은 앱 초기화와 `src/playgrounds/datagrid/model/localize.ts`에서 확인했다. DataGrid는 호출 시점에 `getI18n().getFixedT(language, 'app')`를 읽는 최소 변경을 우선한다. 모듈 최상위에서 `getI18n()`의 결과나 미초기화 instance를 저장하지 않는다.

현재 `getGridConfiguration`은 번역이 준비된 앱에서 호출되며, 순수 모델 테스트도 앱 i18n의 초기화 부작용을 import하고 있다. 테스트에서는 명시적으로 초기화한 전용 instance와 앱의 리소스·설정을 사용하는 helper를 두고, 기존 테스트의 side-effect import와 raw singleton 참조를 이 helper로 옮긴다. 테스트용 초기화를 제품 진입점에 되살리지 않는다.

기존 테스트 중 관련 import가 있는 약 30개 파일을 다시 검색해 누락 없이 반영한다. SSR 테스트는 Effect를 실행하지 않으므로 `OwpI18nProvider`를 서버 렌더링하는 것만으로 테스트 초기화가 된다고 가정하지 않는다. 새로 만드는 검증 전용 테스트·스크립트는 최종 완료 전에 정리하고 기존 테스트는 유지한다.

## 4. Provider 역할과 선택적 구성

기존 Provider 이름과 import 경로는 유지한다.

| API | 역할·선택 항목 |
| --- | --- |
| `I18nextProvider` | 외부에서 초기화한 instance를 하위 React 트리에 전달하는 upstream Provider |
| `OwpI18nProvider` | 설정으로 별도 instance를 초기화하고 언어를 동기화하는 OWP Provider |
| `OwpCoreProvider.providers` | `app`, `store`, `query`, `styledEngine` |
| `OwpStyleProvider.providers` | `cache`, `muiTheme`, `owpTheme`, `scrollbars` |
| `OwpUiProvider.providers` | `snackbar`, `dialogs`, `pageLeaveGuard` |
| `OwpUiProvider.features` | `accessTokenGuard`, `commonCodes`, `queryCancellation`, `dialogRouteSync`, `pageLockLoading`, `autoLogout` |

`false`는 해당 내부 Provider 또는 runtime의 생성을 실제로 제외한다. 옵션 생략 시 기존 기본 동작과 env·실행 조건을 따른다. `cache`는 기본 경로에서도 `cacheProviderProps.value`가 있어야 연결된다.

내부 Provider를 제외하면 descendant가 요구하는 Context를 상위에서 별도로 제공해야 한다. 예제는 상위 `OwpCoreProvider`가 제공하는 store·query·app Context를 재사용하며 중첩 구성의 해당 내부 Provider만 제외하는 형태로 설명한다. Style 제외 예제도 상위 MUI·OWP 테마가 있는 위치에서 보여 준다. 사용하지 않는 prop에 `false`를 나열하는 예제는 추가하지 않는다.

수정 대상은 `src/features/public-api/roles/core.ts`, `core-types.ts`, `descriptions.ts`, Provider 분류, Core `catalog.ts`, `guides/providers.tsx`, `guides/getting-started.tsx`, `guides/GettingStarted.tsx`, `guides/foundation-content.ts`, `model/featureCoverage.ts`, 관련 한영 locale과 README의 해당 설명이다. Components의 `hook-use-owp-translation.tsx`와 해당 locale도 수동 초기화 중심 설명을 새 Provider 예제로 바꾼다.

## 5. policy·standalone·독립 번역 화면

- policy 대상 `page-carded`, `loading`, `error-boundary`, `api-query`와 기존 Data Router 구성을 유지한다.
- policy에서 사용하지 않는 인증 guard와 자동 로그아웃은 기존 env의 `false`를 근거로 `features.accessTokenGuard: false`, `features.autoLogout: false`를 검토·적용한다. 공통코드·query 취소·페이지 잠금·dialog route 동기화·이탈 보호는 기존 실행 계약을 확인해 필요한 항목을 보존한다.
- standalone의 `MemoryRouter`와 직접 `OwpDialogsProvider` 구성을 유지한다. 번역 Provider 도입을 이유로 Core·Style·UI 구성을 일괄 제거하지 않는다.
- `page-skeleton`의 기존 독립 구성과 우회 정책을 유지한다.
- `src/features/releases/standalone.tsx`는 외부 화면에 별도 root로 붙는 버전 메뉴이며 자체 `createInstance`와 `I18nextProvider`를 유지한다. 앱 전역 instance·storage·API 언어를 바꿀 이유가 없으므로 이번 변경에서 local scope로 일괄 이전하지 않는다.
- local scope의 설명·예제에서는 앱의 언어·저장소·API 코드를 변경하지 않는다는 계약을 명시한다.

## 6. 모든 설치 패키지의 검토 자료

해시를 최신 값으로 덮어써 검사를 우회하지 않고, 선언·runtime·직접/소유자별 해석과 API 연결을 검토한 뒤 다음 자료를 갱신한다.

1. `knowledge/reviewed-packages.json`: 실제 설치된 모든 등록 패키지와 외부 참조 패키지를 대조한다. 변경 없는 해시도 사실에 맞게 보존한다.
2. `knowledge/reviewed-package-resolutions.json`: 각 owner의 버전, Components·Date Picker 등 실제 전이 설치본의 버전·해시를 직접 설치 계약과 구분해 반영한다.
3. `knowledge/example-code-reviews/sources.json`과 관련 검토 자료: 수정한 예제의 실제 API 전달·고유 anchor·소스 지문을 다시 검토한다. 이전 검토·제외 결론을 보존한다.
4. `knowledge/source-audit.json`: 현재 불일치한 `agents/consumer/datagrid/references/editing.md`의 변경을 읽고 기존 가이드 계약과 대조한 뒤 공식 audit 경로로 기록한다. 소비앱 지침 원본은 수정하지 않는다.
5. `knowledge/core-guides.mjs` 등 가이드 원본: re-export와 OWP 초기화 Provider의 역할, 설치 버전, 관련 API 연결을 정리한다.

### 로컬 생성 범위 확인 필요

`pnpm knowledge:generate`는 `src/features/api/data/knowledge.generated.json`과 `links.generated.json`을 생성한다. 이 파일들은 앱의 API 화면과 공식 검토 검사에도 사용한다. `pnpm build`는 이 생성 명령을 먼저 실행하고, Vite build는 `dist`에 API·Knowledge 정적 리소스도 출력한다.

따라서 API 화면에 새 Provider를 표시하고 `knowledge:check`까지 통과시키려면 **Playground 로컬 생성 데이터와 build 산출물의 갱신**이 필요하다. 이는 snapshot 생성·등록, MCP 자료 배포·서버 반영과는 별개다. 이번 TRD 승인 시 이 로컬 생성 범위의 포함 여부를 확인한다. 생성 파일은 수동 편집하지 않는다. 로컬 생성이 제외되면 검토 원본과 제품 코드는 정리하되 생성 데이터의 미반영과 검사 한계를 명시한다.

## 7. 검증과 완료 기준

정적 검증은 `pnpm typecheck`, `pnpm lint`, 관련 기존 Vitest·Node test, `pnpm test:sources`를 사용한다. 생성 범위가 승인되면 원본 검토 후 공식 생성·audit 명령을 실행하고 `pnpm knowledge:check`, 전체 관련 테스트, `pnpm build`를 확인한다. 패키지 설치를 유발하는 명령이나 snapshot·배포 명령은 실행하지 않는다.

실제 화면은 앱이 관리하는 브라우저 또는 기존 연결을 사용한다. `pnpm dev`에는 `--open`이 있으므로 브라우저 직접 실행을 피할 수 있도록 설치된 CLI의 옵션을 확인하고 자동 열기를 제외한 localhost 서버 실행 경로를 사용한다. 기존 `test:browser` 등이 직접 Chromium을 시작하면 그대로 실행하지 않는다.

| 시나리오 | 기대 결과 |
| --- | --- |
| URL에 `lang` 없음·`ko`·지원하지 않는 값, 저장 언어 `en` | 한국어로 시작하고 Core metadata는 `kr` |
| URL `lang=en`, 저장 언어 `kr` | 영어로 시작하고 Core metadata는 `en` |
| Header 전환 후 Core 선택기 전환, 역순 반복 | 화면·Core 선택값·storage·API 코드가 일치하고 중복 언어 변경·reload가 없음 |
| 언어 전환 후 URL 확인·새로고침 | `lang=ko/en`, 다른 query·hash 보존, 해당 언어로 다시 시작 |
| DataGrid 언어 전환 | column·valueOptions·summary·빈 상태·pinned row·detail 번역이 앱 instance를 사용 |
| policy 예제 | loader/error·query 취소·화면 잠금·dialog·이탈 보호 계약 유지 |
| standalone·page skeleton | 기존 실행 모드와 자체 Context 구성 유지 |
| 별도 버전 메뉴·local scope | 앱 언어·storage·API 코드 불변 |
| 초기화 실패·unmount·언어 이벤트 재구독 | 오류 전달, 대기 종료, 구독 cleanup, 최신 callback 반영 |
| 전체 코드 검색 | 앱 수동 init·raw singleton·중복 언어 보정·synthetic storage event 의존 제거 |

초기 조사 기준선:

- `pnpm typecheck`: 통과.
- `pnpm lint`: 통과.
- 기존 `core-policy`, `knowledge-package-contracts`, `package-export-contracts`, `catalog`: 4개 파일·22개 테스트 통과.
- `pnpm knowledge:check`: 설치된 DataGrid 3.5.5와 검토본 3.5.4 차이로 실패. 나머지 불일치도 별도 읽기 전용 대조로 확인했다.
- `pnpm knowledge:audit`: 편집 가이드 원본 한 파일의 지문 변경으로 실패.
- build·실제 화면 검증은 아직 실행하지 않았다.

## 8. 실행과 독립 검토

설치된 역할 매핑 검사 46개는 변경 없이 통과했다. 탐색 선택기는 `orchestrator-quota-unavailable / native-account-query-failed`로 호출 전에 차단됐다. 모델 호출이나 실제 워커 실행은 없었다.

구현 승인 후 과제별 선택기를 다시 확인해 허용되는 구현 워커를 배정한다. 실행이 계속 불가능하면 공통 기준의 직접 처리 예외와 독립 검토 미실행을 밝히고, 가능한 실제 검증을 수행한다. 완료 판단은 diff와 실제 검사 근거로 한다.

삼천포는 현재 세션의 receipt를 찾지 못했으며 doctor는 데몬 응답 없음을 보고했다. 감시 확인을 검사 통과의 근거로 사용하지 않는다. 한국어 기준의 upstream 최신 조회도 도구 접근 실패로 마지막 검증본을 유지했다.

완료 보고는 변경 파일, 제거한 중복 처리, 보존한 앱 정책, 전체 패키지 검토 결과, 실행한 검사·화면 시나리오와 미검증 항목, 생성·MCP 미반영 범위, 실제 워커 사용 여부를 포함한다.
