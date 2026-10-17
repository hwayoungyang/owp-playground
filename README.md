# OWP Playground

MUI 기반의 OWP 컴포넌트 실행·코드 Playground입니다. `@owp/datagrid`와 `@owp/charts`의 실행 예제와 시작 가이드를 제공합니다. 현재 OWP 의존성은 DataGrid 3.0.0, Charts 4.0.0, Core 6.0.0과 Components·DatePicker·Excel·PDF·Theme 2.0.0입니다.

## 실행

Node.js 24 LTS(24.11 이상)와 pnpm 10을 권장하며, 지원하는 Node.js 범위는 `package.json`의 `engines.node`를 따릅니다. 기존 OWP 사내 레지스트리 접근이 필요합니다. `.npmrc`의 `@owp:registry`를 환경에 맞게 설정하세요. 인증 정보는 저장소에 넣지 않습니다.

```sh
pnpm install
pnpm dev
```

`pnpm dev`는 개발 서버를 실행하고 브라우저를 자동으로 엽니다. TypeScript 7로 타입을 검사하고, Vite+로 개발·빌드·테스트를 실행합니다. 설치와 스크립트 실행에는 기존 pnpm CLI를 사용합니다. `.npmrc`가 `packageManager`에 고정된 pnpm 버전을 자동으로 선택합니다.

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
| `/?package=charts&sample=plan-actual` | OwpCharts 계획·실적·달성률 |
| `/?package=components` | OwpComponents 준비 상태 |
| `/?package=date-picker` | OwpDatePicker 준비 상태 |
| `/?package=pdf` | OwpPdf 준비 상태 |

패키지 값은 `datagrid`, `components`, `date-picker`, `core`, `charts`, `excel`, `pdf`, `theme`, `tailwind-config`입니다. `@owp/datagrid` 같은 전체 패키지 이름도 받으며 주소는 짧은 값으로 정리합니다. 현재 OwpDataGrid와 OwpCharts 예제를 실행할 수 있고 나머지는 해당 패키지의 준비 화면을 표시합니다. TreeGrid는 포함하지 않습니다.

기존 `?sample=auto-span` 링크도 OwpDataGrid 예제로 열립니다. 패키지를 생략하거나 알 수 없는 값을 넣으면 OwpDataGrid로, 알 수 없는 샘플은 시작 안내로 열립니다. 메뉴와 샘플 링크는 URL에 선택을 반영하며 새로고침·브라우저 앞/뒤 이동도 지원합니다. 패키지를 바꾸면 이전 패키지의 샘플 값은 지우고, 다른 GET 파라미터와 URL 해시는 유지합니다. Cmd/Ctrl+K로 샘플을 검색할 수 있습니다.

기본 언어는 한국어입니다. 상단 `EN` / `한` 버튼으로 영어와 한국어를 전환합니다. 메뉴·설명·컬럼·OWP 기본 컨트롤의 번역은 `shared/i18n`과 각 Playground의 `locales`에 정의하고 `app/i18n.ts`에서 등록하며 외부 번역 API를 사용하지 않습니다. 언어를 바꿔도 편집한 값과 행 선택을 유지합니다. 가상의 담당자 이름과 작업 데이터, 소스 코드는 원래 값으로 표시합니다. 새로고침하면 한국어로 시작합니다.

## 소스 구조

패키지별 코드와 공통 기능을 분리합니다. 실제 샘플이 있는 패키지만 디렉토리를 만듭니다.

```text
src/
├── app/                      # 앱 구성·번역 등록·레이아웃·Provider
│   ├── layout/
│   ├── providers/
│   └── styles/
├── features/                 # 여러 Playground에서 사용하는 기능
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

DataGrid 실행부는 `GridWorkspace`, `GridToolbar`, `GridSettingsDrawer`, `GridStatusBar`로 역할을 구분합니다. 각 실행 파일은 `FixedRowsGrid`, `EditableCellsGrid`, `SelectEditorsGrid`처럼 기능을 나타내는 컴포넌트와 초기 `gridConfiguration`을 내보냅니다. `model/gridTypes.ts`는 `GridConfiguration`·`GridViewProps` 계약을, `model/gridRegistry.ts`는 47개 컴포넌트와 설정의 연결을 관리합니다. `getGridConfiguration`은 등록된 설정에 현재 언어를 적용합니다.

CSS는 화면의 소유권에 맞춰 관리합니다. 앱의 배치는 `app/styles/shell.css`, 공통 제목·탭·툴바·이벤트·프레임은 `shared/ui/workspace.css`, 공통 가이드는 `shared/ui/guide.css`에 둡니다. DataGrid의 `styles.css`는 import 진입점이며, 실행 화면은 `runtime/workspace.css`, 패키지 스타일 보정은 `runtime/grid-overrides.css`, 예제별 표현은 `examples/styles.css`로 나눕니다. 예제 CSS 진입점은 `controls.css`, `cell-renderers.css`, `detail-panel.css`를 불러오며 선택자는 `.grid-preview` 안에 적용합니다. Drawer와 Dialog는 Portal에 표시되므로 각각 `grid-settings-*`, `grid-row-dialog` 클래스로 범위를 지정합니다. Charts·코드 보기·테마 편집은 각 기능의 CSS를 사용하고, 실행 중 바뀌는 테마 값은 CSS 변수로 전달합니다.

## 샘플 구성

공통 변경 내역 패널은 표시하지 않습니다. 변경 건수와 이벤트, ‘변경 관리’의 확정·되돌리기 기능은 사용할 수 있습니다. ‘숫자·날짜 서식’은 상단의 ‘금액 소수 자릿수’에서 금액 표시·입력과 Excel 숫자 서식을 소수점 아래 1~6자리로 조정합니다.

첫 메뉴 ‘시작’은 프로젝트 `.npmrc`의 OWP 레지스트리 설정, 패키지 설치, 타입이 포함된 첫 그리드 예제를 안내합니다. `/?sample=getting-started`로 바로 열 수 있습니다. 레지스트리 URL과 접근 권한은 Impix SmartBiz 팀에 문의합니다.

설치·사용 안내와 47개 실행 샘플을 연관된 기능에 따라 12개 그룹으로 분류합니다. Charts와 같은 탐색 메뉴를 사용하며 한국어 화면에서는 그룹명 아래에 영어 이름을 작은 부제로 표시하고, 영어 화면에는 영어 그룹명만 표시합니다. ‘표시 행 수 고정’은 10행 표시 영역에 선택·합계를 함께 보여줍니다. ‘외부 버튼 제어’는 행 선택·선택 해제·삭제를 실행합니다. 행 선택 방식·모서리 둥글기·필터 표시는 ‘설정’에서 조정합니다. 기존 `minimal`, `visible-rows`, `selection`, `radius` 링크는 ‘표시 행 수 고정’으로 연결합니다.

- 기본: 시작, 표시 행 수 고정.
- 셀·컬럼: 셀 타입, 행별 셀 타입, 셀렉트, 숫자·날짜 서식, 셀 컴포넌트, 긴 내용 보기, 고정 컬럼, 다단 헤더.
- 스타일: 조건부 스타일, 커스텀 스타일.
- 셀 병합: 지정·자동 행 병합, 열 병합, 행·열 병합, 병합·가상 스크롤.
- 선택·이벤트: 외부 버튼 제어, 새 행 선택, 클릭 이벤트, 컨텍스트 메뉴.
- 정렬·필터: 다중 정렬, 컬럼 필터.
- 편집·검증: 셀 편집, 셀 값·포커스, 입력 검증, 검증 메시지.
- 행 관리: 행 편집 툴바, 행 추가 위치, 삭제·복구, 드래그 이동, 버튼 이동, 행 조회·일괄 처리, 변경 관리.
- 집계·계산: 집계·고정 행, 계산·셀 연동.
- 트리·상세: 트리, 다단계 트리, 트리·병합, 상세 패널, 상세 그리드.
- 데이터·로딩: 데이터 없음, 오류·재시도, 서버 조회, 대용량 데이터.
- 내보내기: Excel 내보내기, Excel 내보내기 API, 병합·Excel.

셀 배경색·행 배경색·조건부 스타일은 ‘조건부 스타일’에서 적용 범위와 완료 행 편집 제한을 선택합니다. 다단 헤더·하위 헤더 정렬은 ‘다단 헤더’에서 정렬 버튼을 켜고 끕니다. 일괄 변경·조회·일괄 처리는 ‘행 조회·일괄 처리’에서 전체 행·필터 결과·선택 행을 처리합니다. 기존 `cell-background`, `row-background`, `header-sort`, `transactions` 샘플 주소도 통합된 예제로 연결되며, `row-background`로 열면 행 배경색이 선택됩니다. 변경 확정·되돌리기는 ‘변경 관리’에서 제공합니다.

‘데이터 없음’은 빈 그리드로 시작하며 상단 버튼으로 로딩을 시작·종료합니다. 종료하면 빈 화면으로 돌아갑니다. 기존 `loading` 링크도 이 샘플로 연결합니다. ‘셀렉트’는 검색 없는 셀렉트와 검색 가능한 자동완성에서 단일·다중 선택을 지원합니다. 일반 다중 선택은 `selectOptions.multiple`, 자동완성 다중 선택은 `autocompleteOptions.multiple`을 사용합니다. 기존 `autocomplete` 링크는 자동완성 모드로 연결합니다.

‘커스텀 스타일’은 2단·3단 헤더, 기본·줄무늬·강조 프리셋과 12–18px 글자 크기를 즉시 적용합니다. 그룹 헤더와 하위 헤더의 색상·크기를 함께 바꾸며 입력한 값은 유지됩니다. `@owp/datagrid` 3.0.0의 `sx` 객체·테마 콜백·조건부 배열과 공개 클래스 선택자를 사용합니다. 행 높이는 `virtualization.rowHeight`, 헤더 높이는 `OwpThemeProvider.dataGrid.header.height`로 설정합니다. 프리셋과 크기를 바꿔도 편집값과 테마는 유지됩니다. Portal에 표시되는 편집기 목록은 루트 `sx`의 적용 범위 밖입니다.

숫자·날짜 서식 한 화면에서 YYYY-MM-DD, YYYY, YYYY-MM, 초 단위 시간·일시를 비교합니다. 날짜와 시간은 가운데 정렬합니다.

대용량 데이터는 생성 시작 시 기존 행·선택·변경·필터를 비우고 새로 채웁니다. 취소하면 빈 상태를 유지합니다. 행 수 선택을 변경하면 데이터 생성 버튼이 강조됩니다. 데이터 생성 시간을 제외한 ‘그리드 반영 시간’을 ms 단위로 보여주며, 측정값은 테스트 환경에 따라 다를 수 있습니다. 상세 그리드는 별도 Excel 버튼으로 하위 작업과 합계를 내보냅니다. 서버 조회는 정렬·필터 조건을 외부 함수에 넘기는 방식이며, 이 프로젝트의 조회·저장 함수는 지연 시간을 둔 모의 구현입니다.

데이터는 가상의 프로젝트·작업·담당자를 사용합니다. 한금 소비앱 A20000–A60000에서는 기능과 상호작용 패턴을 참고했으며 업무 코드, 고객 이름, API 응답을 사용하지 않습니다. `@owp/treegrid`는 설치하지 않습니다. OwpDataGrid 자체의 트리 기능은 포함합니다.

## Charts

`@owp/charts` 4.0.0의 시작 가이드와 실행 예제 94개를 제공합니다. 패키지 메뉴에서 OwpCharts를 선택하거나 `/?package=charts`로 엽니다. 탐색 메뉴의 DataGrid·Charts 버전과 두 시작 가이드의 설치 명령은 설치된 패키지의 버전을 사용합니다. Excel은 2.x, Core는 6.x 기준으로 안내합니다.

Semi circle은 공정별 처리 수량의 비중을 반원으로 보여줍니다. Radar는 생산 라인 A·B의 생산성, 품질, 가동 안정성, 납기 준수, 에너지 효율, 예방 정비를 같은 0–100점 척도로 비교합니다. Semi circle은 `OwpRadialChart`, Radar는 `OwpRadarChart`를 사용하며 패키지가 native geometry·hit test·OWP HTML 툴팁·범례를 처리합니다. 두 예제 모두 OWP API 문자열 데이터를 `chartFromApi`로 변환합니다.

| 분류 | 예제 수 | 포함 내용 |
| --- | ---: | --- |
| 기본 차트 (Basic charts) | 20 | Column·Bar·Line과 그룹·누적·겹치기·예측 변형, Floating bars, Area·Stacked area, Mixed·Daily Column/Line |
| 확장 차트 (Extended charts) | 12 | Pie·Multi-series pie·Doughnut·Semi circle·Gauge, Scatter·군집 Scatter·Bubble·Box plot, Radar·Heatmap·Treemap |
| 축 (Axis) | 13 | 백분율, 다중 축, 범위·간격·중앙 배치, 격자·눈금·제목 |
| 범례 (Legend) | 4 | 범례 위치·point·제목·이벤트 |
| 툴팁 (Tooltip) | 7 | HTML·내용·탐색·위치·point 표시, hover 영역, 외부 버튼 제어 |
| 확대·동기화 (Zoom·Sync) | 5 | 드래그·휠·pinch zoom, X·Y slider, Crosshair·tooltip 동기화 |
| 라벨·기준선 (Annotations) | 7 | 데이터 라벨·추세선·목표선·기준 범위, 영역 테두리·사분면·빈 Doughnut |
| 스타일 (Style) | 10 | Radius, 보간·Stepped·point·dash·segments, 제목, 조건별 색상 |
| 데이터·연동 (Data) | 5 | Live chart, 셀 sparkline, 상세 패널, 대량 시계열, 로딩·빈 데이터·오류 |
| 내보내기 (Export) | 2 | PNG 메뉴, exportRef |
| 활용 (Use cases) | 9 | 순위, 계획·실적, 입고, 이행률, OEE, TOP N, Small multiples, Histogram, Pareto |

한금 소비앱에서 검토한 15개 차트 렌더링 구현을 모두 대응 예제에 포함했습니다. `src/playgrounds/charts/model/coverage.ts`에서 대응 관계를 확인할 수 있습니다. 데이터는 가상 생산량·설비 측정값이며 소비앱의 고객 데이터나 API 응답을 포함하지 않습니다.

예제·코드·데이터·이벤트 탭과 초기화 버튼을 제공합니다. 코드 탭은 실제 실행하는 TSX와 공통 모델을 표시하며 복사·다운로드할 수 있습니다. 데이터 탭은 DataGrid와 같은 뷰어에서 현재 예제의 API response 행 배열을 표시합니다. 100개씩 범위를 이동해 전체 데이터를 확인하며, 현재 페이지를 JSONC 또는 JSON으로 복사·다운로드할 수 있습니다. 복합 차트의 series와 연결 차트의 겹치지 않는 구간도 함께 표시합니다. 이벤트는 데이터 갱신·상태 변경·내보내기·차트 클릭을 최근 50개까지 기록합니다. 범례와 초기화 버튼은 키보드로 접근할 수 있으며, 네이티브 축 slider는 포인터·터치로 조작합니다.

월별 생산 계획·실적·라인 A/B/C의 생산량, 설비 가동률·성능·품질은 스마트 팩토리 기준의 가상 데이터로 통일했습니다. 라인 생산량의 합은 전체 실적과 일치하며, 달성률과 OEE도 원본 값에서 계산합니다. Stacked Column·Line의 목표는 월별 생산 계획에 따라 달라집니다. Area·Stacked area·센서 시계열에는 부하 전환과 재현 가능한 측정 편차를 반영합니다. Small multiples·Scatter·Bubble·sparkline도 설비별로 다른 추이를 사용합니다.

Layered column은 `Column 겹치기`와 `값 표시`를 각각 켜고 끌 수 있습니다. 두 연도의 값이 가까워도 라벨이 겹치지 않게 좌우로 나눕니다. Grouped stacks by line은 라인별 연도 구역 안에서 주간조·야간조를 누적하고, Divergent forecast는 관측 생산량 이후 세 운영 시나리오를 점선으로 비교합니다. Stepped line은 53일의 치수 편차를 계단으로 표시하며 하단 slider로 확대합니다. Heatmap은 요일·시간별 생산량, Treemap은 설비 생산량에 비례하는 불투명 사각형을 빈틈없이 배치하고 중앙에 설비 코드와 값을 표시합니다. 라인별 색상과 범례·HTML tooltip은 유지합니다.

차트와 zoom·범례·tooltip·PNG 내보내기는 패키지의 public API를 사용합니다. 히스토그램 구간 집계와 min/max 시계열 다운샘플링은 예제 코드에서 처리합니다. Area·Box plot·Treemap·Radar·원형·Heatmap·Live chart는 전용 `Owp` 컴포넌트를 사용합니다. 패키지가 유형별 geometry·hit test·범례 상태·Live 이동을 담당하고, 앱은 API 응답 변환·가상 데이터 생성·polling·샘플 조작·카드 높이를 담당합니다. Bar·Line·복합 차트는 `ChartFrame preset="owp"`로 공통 스타일과 HTML 툴팁을 적용합니다. 날짜·시간 예제는 별도 날짜 adapter 없이 category 축의 label을 서식화합니다. Column·Bar·Line 생성은 `createChartData`, 원형 차트는 ID가 있는 `rings`·`items`, Gauge는 전용 생성 함수를 사용합니다. 시작 가이드는 레지스트리·peer dependency·최소 실행 코드와 Tailwind가 없는 환경의 레이아웃 CSS를 안내합니다. Playground에서는 해당 CSS를 차트 영역으로 제한해 적용합니다. 기본 메뉴의 SVG sprite는 `public/assets/icons`에서 제공하며, 자체 프로젝트에 적용할 때는 OWP Core 아이콘 리소스를 배포하거나 `exportRef` 외부 버튼을 사용할 수 있습니다.

한금의 일반 차트와 같은 top 16px·right 8px plot padding, 4px Column radius, 2px Line과 3px point를 기본으로 적용합니다. 카드 padding과 설정·차트 사이 gap은 16px이며 작은 화면의 padding은 12px입니다. Gauge와 Doughnut은 카드 너비와 화면의 남은 높이에 맞춰 크기를 조절하며, 눈금·범례와 카드 하단 정보의 공간을 함께 확보합니다. 두 차트의 높이는 최대 420px이며, 아주 낮은 화면에서는 조작 요소를 자르지 않고 본문 스크롤을 허용합니다. 범례는 기본 하단 중앙이며, 범례 예제에서는 상단 중앙으로 바꿀 수 있습니다.

`/?package=charts&sample=linked`의 **Crosshair·tooltip 동기화** 예제는 서로 다른 월 범위의 두 차트를 `syncBy: 'label'`로 연결합니다. 3~10월에 포인터를 올리면 같은 월의 crosshair와 tooltip을 확인할 수 있고, crosshair·tooltip·zoom 동기화를 각각 켜고 끌 수 있습니다. 동기화 옵션은 같은 차트 인스턴스에 반영합니다. `hover-layer`는 단일 차트의 hover 영역과 crosshair 표시를 다룹니다.

`/?package=charts&sample=live`의 **Live chart** 예제는 앱에서 1초마다 가상 측정값을 추가하며, 왼쪽 경계 연결용 한 건을 포함해 최근 61개를 보관합니다. 표시 구간은 10–60개로 바꿀 수 있습니다. X축은 초 단위 눈금을 만들고 화면 폭에 맞춰 최대 16개 라벨을 분:초로 표시합니다. Tooltip과 데이터 탭에서는 전체 시각을 확인할 수 있습니다. 일시정지·다시 시작·한 건 추가를 지원하며, 브라우저 탭이 가려지면 타이머를 멈추고 예제에서 나가면 정리합니다. `OwpLiveChart`가 데이터와 X축의 시간 눈금·격자선을 같은 표시 구간으로 1000ms 동안 함께 이동합니다. 새 값은 오른쪽에서 들어옵니다. 움직임 줄이기 설정에서는 즉시 갱신합니다. 실제 서버에 연결하지 않는 데이터 스트림 예제입니다.

Gauge도 1.5초마다 가상 값을 갱신하며, 바늘과 숫자는 500ms 동안 이동합니다. 일시정지·다시 시작을 지원하고 값을 직접 조절하면 자동 갱신을 멈춥니다. 브라우저 탭이 가려지거나 예제에서 나가면 타이머를 정리하며, 움직임 줄이기 설정에서는 값을 즉시 갱신합니다.

Box plot은 실제 관측값에서 Q1·중앙값·Q3와 1.5 IQR 수염·이상치를 계산합니다. Pareto는 발생 건수를 내림차순으로 정렬하고 누적 비율과 80% 기준선을 겹쳐 표시합니다. 군집 Scatter는 네 군집의 반투명 점을 최대 20,000개까지 표시하며 하단 X·오른쪽 Y slider로 범위를 조절합니다.

한국어 화면에서는 그룹명 아래에 영어 이름을 작은 부제로 표시하고, 영어 화면에서는 영어 그룹명만 표시합니다. 범례와 툴팁은 별도 그룹입니다. 표시되는 모든 차트 툴팁은 `ChartFrame`의 `externalTooltip`을 사용하며, Box plot 통계값·날짜 서식·point 표시와 연결 차트의 동기화를 유지합니다. HTML tooltip 예제에서는 화면 경계 여백을 조절할 수 있습니다. 그리드 셀 sparkline은 기존처럼 툴팁을 표시하지 않습니다.

활용 그룹의 Small multiples는 기본 6개를 3열 × 2행으로 배치하고, 좁은 영역에서는 2열·1열로 전환합니다. Histogram은 동일한 폭의 구간에 포함된 관측값 수를 집계하며, 막대를 붙여 연속 구간을 표현합니다. Top N·순위·Pareto의 항목, Box plot의 그룹, Small multiples의 설비는 테마에 맞는 색상으로 구분합니다.

모든 차트는 `ChartFrame`의 OWP 범례를 사용합니다. 일반 차트의 범례는 패키지의 160ms show/hide 전환을 사용합니다. `범례로 표시·숨김` 예제에서 `범례 애니메이션`을 끄면 즉시 전환하며, 데이터 갱신 애니메이션은 유지합니다. 단일 Pie·Doughnut은 항목별 geometry를 전환합니다. Multi-series pie는 기본적으로 두 ring의 범례를 표시하며, `항목별 범례`를 켜면 각 ring과 그 안의 항목을 독립적으로 전환합니다. Live chart는 이동과 범례 opacity 전환을 패키지의 공용 frame driver에서 처리하며, 일시정지 중에도 범례를 조작할 수 있습니다. `window.axisLayout`으로 시간 라벨 폭과 축 높이를 예약해 이동 중 plot 영역을 고정합니다. 움직임 줄이기·숨겨진 탭에서는 범례 효과를 생략합니다. 시계열 Tooltip은 원본 ISO 데이터를 유지하면서 축과 같은 UTC 기준의 날짜·시간으로 표시합니다.

차트 예제의 번역 hook은 현재 공개 경로인 `@owp/components/hooks`의 `useOwpTranslation`을 사용합니다. `owp` namespace에 차트 번역을 등록합니다. 설치된 `@owp/core` 6.0.0은 이 hook을 export하지 않습니다.

정수 축·소수 축·긴 label 처리는 별도 예제에서 제외했습니다. 기존 URL은 각각 눈금 간격·눈금 서식·Bar 예제로 연결합니다. Pie는 9개 공정의 생산 비중을 촘촘한 조각과 항목·비율 라벨로 표시합니다. Multi-series pie는 중앙이 빈 두 고리로 2026·2025년을 비교하며 얇은 경계와 명도로 구분합니다. Doughnut은 같은 단색 팔레트와 둥근 조각을 사용합니다. 넓은 화면에서는 바깥 라벨과 연결선을 표시하고 작은 화면에서는 범례·툴팁에서 항목과 비율을 확인합니다. 그라데이션 로직과 전용 메뉴는 제거했습니다.

애니메이션 그룹과 전용 예제 6개는 사용자 요청으로 제외했습니다. 일반 차트에는 `createChartOptions()`의 애니메이션과 전환 기본값을 적용합니다. Live chart의 데이터 이동과 Gauge의 바늘 움직임도 유지합니다. 대량 시계열·군집 Scatter·그리드 셀 sparkline은 성능을 위해 일반 애니메이션을 끕니다. 기존 애니메이션 예제 URL은 관련 Column·Line 예제로 연결합니다.

Chart.js 공식 실행 샘플 75개 중 신규 37개, 기존 9개, 대체·연관 예제 11개를 제공합니다. 애니메이션 전용 6개와 그라데이션 2개는 제외했고, 나머지 10개는 Polar·Log·Time·Subtitle 또는 custom scale/controller 기반 클래스의 공개 지원이 필요합니다. Area·Radar는 패키지가 등록한 native Filler·Radar·RadialLinearScale을 사용합니다. 예제는 설치된 `@owp/charts` 4.0.0의 공개 API를 사용합니다. 정확한 대응 범위는 [Chart.js 샘플 대응표](src/playgrounds/charts/CHARTJS-SAMPLES.md)를 확인합니다.

패키지 메뉴는 구현된 DataGrid·Charts를 위에 표시하고 나머지는 `준비 중`으로 비활성화합니다. 기존 준비 화면의 직접 URL은 유지합니다.

## 코드와 리소스

본문 액션 버튼은 아웃라인을 기본으로 사용합니다. 단일·다중 선택이나 드래그 대상처럼 선택 상태를 유지하는 버튼은 선택된 값만 채움으로 표시합니다.

부모 높이가 정해진 예제의 그리드는 `style={{ height: '100%' }}`로 남은 영역을 채웁니다. 현재 OwpDataGrid는 `height="100%"`를 태블릿 이하에서 별도 높이로 바꾸므로, 공개 `style` 속성으로 실제 높이를 지정합니다. ‘표시 행 수 고정’ 예제는 지정한 행 수에 따른 자동 높이를 유지합니다. 독립된 그리드에 고정 높이가 필요하면 `height={420}`처럼 숫자를 지정할 수 있습니다.

코드 탭은 각 샘플의 실제 TSX 컴포넌트를 기본으로 보여줍니다. 이 파일은 `<OwpDataGrid ... />`를 반환하며 미리보기에서도 같은 컴포넌트를 사용합니다. 컬럼 정의, 필요한 native props와 Ref 핸들러는 각 실행 파일에 직접 선언합니다. 데이터·타입·번역·테마는 공유하며 파일 선택에서 원본을 확인할 수 있습니다. 코드 표시·복사·다운로드와 `/snippets` 리소스는 같은 포맷된 원본을 사용합니다. 공통 실행부는 선택·편집·이벤트 기록용 props를 전달합니다. 데이터 탭은 현재 작업 데이터를 OWP API response 형식으로 표시하며, 100개씩 범위를 이동할 수 있습니다. 이벤트는 최근 40개로 제한합니다.

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
- `/packages.json`: 패키지 선택 값, 이름과 샘플 준비 상태.
- `/catalog.en.json`: 같은 DataGrid 샘플의 영어 설명.
- `/catalogs/charts.json`, `/catalogs/charts.en.json`: Charts 가이드와 94개 예제의 한국어·영어 카탈로그.
- `/snippets/playgrounds/{package}/{source}`: 패키지별 실행 예제와 모델·데이터·타입.
- `/snippets/features/{feature}/{file}`: 코드 보기·테마 편집 기능의 원본.
- `/snippets/shared/{area}/{file}`: 공통 UI·테마·번역 함수.
- 기존 `/snippets/samples/{source}`, `/snippets/app/{file}`, `/snippets/theme/{file}` 등은 현재 원본을 제공하는 호환 주소로 유지합니다.

이 메타데이터와 소스는 이후 MCP의 검색·예제 조회 리소스로 공유할 수 있습니다. MCP 서버와 다른 패키지의 독립 샘플은 후속 범위입니다.

## 디자인과 접근성

`DESIGN.md`와 `src/shared/theme`이 색상, 글꼴, 밀도와 상태 표현을 관리합니다. 밝은·어두운 테마, 모바일 탐색 Drawer, 그리드 내부 스크롤, 키보드 접근과 reduced motion을 지원합니다. Geist, Geist Mono와 Pretendard를 로컬 제공합니다. 각 폰트의 저작권 표시와 OFL 라이선스 전문은 다음 파일에 보존합니다.

- Geist: `public/fonts/Geist-OFL.txt`
- Geist Mono: `public/fonts/Geist-Mono-OFL.txt`
- Pretendard: `public/fonts/OFL.txt`

이 파일들은 빌드 시 `dist/fonts/`에 자동으로 복사되며, 서버에 `dist/` 전체를 배포하면 `/fonts/Geist-OFL.txt`, `/fonts/Geist-Mono-OFL.txt`, `/fonts/OFL.txt`에서 확인할 수 있습니다. Geist와 Geist Mono 패키지 버전을 변경할 때는 각 패키지의 `LICENSE` 파일로 해당 라이선스 사본도 갱신합니다.

OWP 심볼은 한금 소비앱의 공통 패키지에 있는 `owp-core/assets/images/logo/owp/owp_sb.svg` 원본을 `public/brand/owp-symbol.svg`로 가져왔습니다.

헤더의 팔레트 아이콘 또는 ‘설정 → 상세 테마 편집’에서 공통 테마를 편집합니다. 일반 테마는 Neutral·Quartz·Alpine·Balham·Material·Slate·Blue·Mint, 프로젝트 테마는 한금으로 구분하며 기본값은 ‘화면과 같게’입니다. 테마는 DataGrid 샘플 이동과 데이터 초기화 이후에도 유지됩니다. 글자 크기·모서리·컴포넌트 색상과 DataGrid의 헤더·셀·선택·필터·행 패널·스크롤바 등 지원하는 항목을 조정하며 현재 샘플에 바로 적용합니다. DataGrid 테마 편집 패널에는 별도 미리보기 그리드를 두지 않습니다. 편집 메뉴는 한국어·영어를 지원하며, MUI 팔레트의 색상명은 `red`, `deepPurple`, `blueGrey` 등 원래 영문으로 표시합니다. 기본 색상 선택기에 더해 MUI 색상·단계를 선택하는 다이얼로그를 제공합니다. DataGrid와 Components 패키지에서만 편집 아이콘을 표시하며, Components에서는 Material UI 컴포넌트 미리보기와 공통 설정을 제공합니다. ‘테마 초기화’는 데이터와 편집을 유지하고 공통 테마만 되돌립니다.

‘파일 저장’은 `owp-theme.json`을 다운로드합니다. JSON에는 버전, 프리셋, Material UI 옵션(`mui`), 네이티브 DataGrid 테마(`dataGrid`), 모서리 적용용 `dataGridProps`가 들어갑니다. 한금/OWP Core 프로젝트에서는 `configs/theme/grid.ts`에 `defaultDataGridTheme`을 정의하고, 기존 `settingsConfig`의 `theme.main.palette`와 `theme.main.dataGrid`에 저장값을 병합합니다. 한금에서 기존 이름을 유지하려면 `defaultGridTheme`으로 별칭을 내보냅니다. 병합한 설정을 `OwpCoreProvider`의 `configs.settingsConfig`에 전달하면 기존 `OwpStyleProvider`가 네이티브 그리드 테마로 연결합니다. `radius`는 테마 계약에 포함되지 않는 컴포넌트 속성이므로 `<OwpDataGrid {...config.dataGridProps}>`로 적용합니다. Components의 MUI 설정은 기존 `OwpStyleProvider`의 `theme`에 확장해 전달합니다. 패널의 ‘프로젝트에 적용’은 설정 아코디언과 분리하며, 연결 코드를 파일별 구문 강조·복사 기능이 있는 스니펫으로 제공합니다. ‘파일 불러오기’는 지원 버전·필드·값을 검증한 후 전체 테마를 적용하며, 잘못된 파일은 현재 설정을 유지합니다. 최대 파일 크기는 256KiB입니다. 세션의 테마는 페이지 새로고침 시 기본값으로 돌아오며, 지속해서 사용할 설정은 파일로 저장합니다.

‘한금’의 밝은 모드는 소비앱에서 사용하는 `defaultGridTheme`을 바탕으로 비활성 필터 아이콘 대비를 보완합니다. 빈 드래그 칸은 필터 행 배경을 상속하므로 기본 프리셋의 필터와 행 패널 배경을 맞춥니다. 이 테마는 그리드와 샘플 컴포넌트에 적용하며 앱 탐색 메뉴와 코드 탭은 화면 테마를 따릅니다.

`@owp/datagrid` 3.0.0은 데이터 영역의 `grid`·`treegrid` 역할과 행 정보, 외부 rowgroup 연결을 직접 구성합니다. 스크롤바·행 편집 툴바·테두리와 오류 Alert·재시도 버튼도 패키지의 기본 구현을 사용하며, 샘플에서 DOM을 수정하거나 해당 레이아웃을 보정하지 않습니다. 샘플은 업무별 계산, 데이터 조회와 재시도 callback, 화면 구성과 이벤트 기록을 담당합니다.

전역 ‘초기화’는 샘플 데이터·설정·이벤트를 원래 상태로 복구합니다. 그리드 내부 ‘변경 초기화’와 ‘변경 되돌리기’는 마지막 확정 상태로 복구합니다. ‘변경 확정’은 현재 값을 새 기준으로 삼으며 업무 서버에 전송하지 않습니다.


설정의 테마 목록과 선택된 값 앞에는 대표 헤더 색상을 표시합니다. Quartz는 보라, Alpine은 올리브, Balham은 앰버, Material은 청록 계열로 구성하고 테두리·호버·선택 색상도 맞춥니다. ‘한금’은 대표 색상 다음에 소비앱의 원본 심볼과 이름을 표시합니다.

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

프로덕션 미리보기를 실행한 상태에서 Chrome을 사용하는 실제 브라우저 검증:

```sh
pnpm test:browser
pnpm test:locales
pnpm test:navigation
pnpm test:charts
pnpm test:chartjs
pnpm test:api
node scripts/verify-2.0.10.mjs
pnpm audit:browser
```

다른 주소는 `PLAYGROUND_URL`로 지정합니다. 브라우저 검증은 편집·검증·행 관리·병합 선택·상세 로딩·실제 XLSX 파일·100만 행 데이터와 취소를 검사합니다. 성능 감사는 공식 Lighthouse 모바일·데스크톱 프로필로 각각 3회 측정하고 중앙값을 기록합니다. 증거는 Git에서 제외한 `.omo/evidence`에 보관합니다.

개발 환경의 react-grab 요소 선택 도구는 `import.meta.env.DEV`에서만 로드합니다. `VITE_DISABLE_REACT_DEVTOOLS=1`로 개발 중에도 끌 수 있으며 프로덕션 빌드에는 포함하지 않습니다. 이벤트 탭의 샘플 로그는 제품 기능이므로 빌드 후에도 표시합니다.

계산·셀 연동은 프로젝트별 기본 적용률, 작업 간·프로젝트 간 적용률 연동과 비용·합계 계산을 함께 보여줍니다. 행 드래그 이동은 한 행/선택한 행 모드를 전환할 수 있습니다. 본문 제목은 선택한 샘플만 표시하며, 패키지·분류·샘플 경로는 헤더 breadcrumb에서 확인합니다.
