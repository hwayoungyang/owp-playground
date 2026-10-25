# API와 예제 코드 연결 검수

Core·Charts·DataGrid의 예제 진입 파일, 공용 설정, JSX spread와 실제 수신 API를 대조한 검토본.
패키지 버전과 선언·runtime 지문은 `reviewed-packages.json`의 실제 설치본을 기준으로 한다. 코드 위치 검토는 공개 API와 소스의 연결 근거이며 브라우저 실행 검증을 대신하지 않는다.

2026-10-26 Core 8.1.0 연동: Components 3.1.1의 Dialog·PageCarded에 Core policy hook의 props와 styles를 함께 연결하고 ErrorBoundary callback·PageContent 스타일 slot을 공개 경로로 사용한다. 기존 Core adapter의 정책은 중복 적용하지 않는다. 실제 설치본의 Core·Components·Theme 선언/runtime 변경을 대조하며 소유자별 중첩 의존 계약을 별도 검토본으로 관리한다. Theme 공개 runtime export와 기존 기본 토큰을 대조한 뒤 번들에서 Theme Context를 공유한다. 테스트 실행과 브라우저 동작 확인은 사용자 검증 범위이며 자료 생성·타입·빌드 검사와 구분한다.

2026-10-25 Core 역할별 정리: Provider·앱 초기화는 시작하기에서 설명하고 실행 예제는 API·데이터 연결, 앱 상태·설정, 전역 상태·복구, UI Adapter로 분류한다. 기존 예제 ID·URL·조작·이벤트는 유지한다. API 결과·권한·Excel·페이지·검색의 표와 dialog의 저장 결과 표는 Components 공개 API를 직접 사용한다. 앱 설정 Table·FieldTable과 정책을 시연하는 Core adapter는 Core import를 유지한다. Core 고유 API와 dialog manager 타입은 이전 대상이 아니며, 검사기·Knowledge 생성은 메뉴 대신 symbol별 역할과 설치본 공개 API를 검사한다.

2026-10-25 Core 8.0.0 연동: Loading은 Components 3.1.0의 공개 API로 연결하고 Core 정책 adapter의 소유권은 유지한다. Core의 15개 진입점·5개 예제 카테고리를 보존하며 Data Router·loading lock·오류 복구의 정책용 runtime과 코드 위치를 함께 수집한다. Components 참조 선언은 전체 Playground 지원과 구분한다. Charts 5.0.2·DataGrid 3.5.1은 기존 검토본과 선언·runtime 지문이 같으며, Theme·Date Picker 등 변경된 의존성도 별도 지문으로 확인한다. 아래의 과거 검토 기록과 기존 제외 결정은 이력으로 보존한다.

2026-10-24 Core 7.1.0 추가: 시작 가이드와 14개 실행 예제의 직접 import·JSX prop·provider를 설치본 declaration과 대조. Components 이관 대상인 Table·FieldTable의 독립 예제는 제외하고 Dialog는 Core 상태 관리에 집중. `core.json`은 예외 없는 빈 검토 목록이며 연결은 AST의 실제 코드 위치에서 생성. 기존 Charts·DataGrid 검토 결론은 유지. source audit의 외부 원본 변경도 현재 계약과 대조하고 지문을 갱신. 작업 중 추가 갱신된 12개 원본은 공개 예제·옵션 설명을 Knowledge 조회로 축약한 내용이며, 기존 가이드와 계약 충돌이 없음을 독립 검토로 확인.

2026-10-22 구성별 코드 검토: Charts의 메뉴는 70개로 유지하고 97개 실행 구성을 별도 소스로 연결. 통합된 13개 메뉴의 40개 구성은 선택한 코드·데이터·이벤트·관련 API를 함께 표시. Box plot·Heatmap·Treemap의 native 비교 소스는 `examples/native/`로 유지.

`baseline.json`의 Charts 항목은 구성별 예제 ID와 원본 검토 의무에 맞춰 복원. 통합 시점의 검토·baseline·소스 지문은 `archive/charts-2026-10-22-consolidated.json`에 보존. 기존 제외 결론·DataGrid 검토 의무와 소스 지문·고유 anchor 검증은 유지.

최상위 prop은 실제 public 컴포넌트 JSX와 연결된 객체·hook 반환값을 AST로 확인해 추가. 직접 prop·literal spread·확인된 반환 객체만 연결하고 broad 타입이나 알 수 없는 rest로 prop을 추정하지 않음. 같은 API ID는 수동 검토 위치를 우선해 한 번만 발행. source 위치가 없는 기존 암시적 사용 3개는 아래의 검토 결론을 유지. 최신 연결 수와 수집 제외 항목은 생성된 `exampleLinkAudit`·`propDiagnostics`에서 확인.

2026-10-21 검수 기준:

| 대상 | 검수 전 연결 | 검수 후 연결 | 코드 위치 확인 | 명시 위치 없음 |
| --- | ---: | ---: | ---: | ---: |
| Charts | 216 | 212 | 212 | 0 |
| DataGrid | 134 | 132 | 129 | 3 |
| 전체 | 350 | 344 | 341 | 3 |

기존 미확정 120개는 위치 연결 97개, API 대상 수정 후 연결 14개, 잘못된 연관 제외 6개, 명시 위치 없이 유지 3개로 정리.
기존 위치가 있던 230개도 검토했으며, Charts의 `scales.type` 2개는 선언 대상까지 수정.

- `baseline.json`: 현재 예제 구조에 대응하는 검토 기준 연결과 위치 확인 여부. 통합 전 Charts 기준은 archive에 보존.
- `charts.json`, `datagrid.json`: 원래 API ID·label과 검토 결론, 고유 코드 구간, 전달 근거. `replace`는 실제 수신 API로 수정하고 `remove`는 관련 API 목록에서 제외.
- `sources.json`: 검토한 코드·전달 근거 파일의 SHA-256. 파일 변경 시 재검토 필요.

명시 위치 없이 유지한 3개:

| 예제 | API | 이유 |
| --- | --- | --- |
| row-actions | `OwpDataGridApi.resetChanges` | 내장 행 편집 툴바의 되돌리기 기능을 사용하며 예제에서 직접 호출하지 않음 |
| row-deletion | `OwpDataGridProps.confirmDeletedRowRemoval` | 해당 prop을 명시하지 않고 설치본 기본 동작에 의존 |
| span-export | `OwpDataGridApi.getExcelSnapshot` | 공통 Excel 버튼을 사용하며 예제에서 직접 호출하지 않음 |

사용하지 않는 연관 6개는 `custom-style/style`, `ref-changes/hasUnsavedChanges`, `grouped-bar/order`, `area/baseline`, `radar/labelOptions`, `png-export/downloadPng`.
실제 기능이 없는 것으로 해석하지 않도록, 제외 이유와 대체 사용 경로는 검토 JSON에 보존.

`pnpm knowledge:generate`는 AST 탐색 결과에 검토 결론을 적용하고 코드 위치와 해시를 계산.
검토 소스 변경, 발췌 중복·삭제, 예제 의존 범위를 벗어난 강조 대상, API 삭제, 미확정 항목의 검토 누락 시 생성 실패.
전달 근거는 같은 패키지의 runtime·registry도 참조할 수 있으며, 강조 위치는 해당 예제에서 접근 가능한 코드로 제한.
소스 지문을 자동 갱신해 검사를 통과시키지 않고 실제 전달 경로와 API 계약부터 다시 검토.

화면·API JSON·JSONL은 같은 `codeUrl`·`location`·`codeReview`를 사용.
배포 카탈로그의 API label도 검토 결과와 일치하도록 생성.
`/knowledge/example-links.json`에 전체 연결, 소속 수정·제외 이유, 전달 근거·버전·검수 집계를 제공하며 Playground 본문에는 이 메타데이터를 출력하지 않음.
