# OWP Playground

MUI 기반의 OWP 컴포넌트 실행·코드 Playground. 첫 구성은 `@owp/datagrid`입니다.

## 실행

Node.js 22.12 이상, pnpm 10, 기존 OWP 사내 레지스트리 접근이 필요합니다. `.npmrc`의 `@owp:registry`를 환경에 맞게 설정하세요. 인증 정보는 저장소에 넣지 않습니다.

```sh
pnpm install
pnpm dev
```

프로덕션 미리보기:

```sh
pnpm build
pnpm preview
```

기본 미리보기 주소는 `http://127.0.0.1:4173`입니다. GET 파라미터 `package`로 패키지를, `sample`로 예제를 바로 선택합니다.

| 주소 | 표시 |
| --- | --- |
| `/?package=datagrid` | OwpDataGrid 시작 안내 |
| `/?package=datagrid&sample=auto-span` | OwpDataGrid 자동 행 병합 |
| `/?package=components` | OwpComponents 준비 상태 |
| `/?package=date-picker` | OwpDatePicker 준비 상태 |
| `/?package=pdf` | OwpPdf 준비 상태 |

패키지 값은 `datagrid`, `components`, `date-picker`, `core`, `charts`, `excel`, `pdf`, `theme`, `tailwind-config`입니다. `@owp/datagrid` 같은 전체 패키지 이름도 받으며 주소는 짧은 값으로 정리합니다. 현재 OwpDataGrid 샘플을 실행할 수 있고 나머지는 해당 패키지의 준비 화면을 표시합니다. TreeGrid는 포함하지 않습니다.

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

## 샘플 구성

공통 변경 내역 패널은 표시하지 않습니다. 변경 건수와 이벤트, ‘변경 관리’의 확정·되돌리기 기능은 사용할 수 있습니다. ‘숫자·날짜 서식’은 상단의 소수점 선택으로 금액 표시·입력과 Excel 숫자 서식을 1~6자리로 조정합니다.

첫 메뉴 ‘시작’은 프로젝트 `.npmrc`의 OWP 레지스트리 설정, 패키지 설치, 타입이 포함된 첫 그리드 예제를 안내합니다. `/?sample=getting-started`로 바로 열 수 있습니다. 레지스트리 URL과 접근 권한은 Impix SmartBiz 팀에 문의합니다.

설치·사용 안내와 47개 실행 샘플을 일반, 셀·컬럼, 헤더·병합, 동작, API, 고급으로 분류합니다. ‘고정 행’은 10행 표시 영역에 선택·합계를 함께 보여줍니다. ‘외부 버튼 제어’는 행 선택·선택 해제·삭제를 실행합니다. 행 선택 방식·모서리 둥글기·필터 표시는 ‘설정’에서 조정합니다. 기존 `minimal`, `visible-rows`, `selection`, `radius` 링크는 ‘고정 행’으로 연결합니다.

- 일반: 시작, 고정 행, 외부 버튼 제어, 데이터 없음, 오류·재시도.
- 셀·컬럼: 셀 타입, 셀렉트, 숫자·날짜 서식, 행별 셀 타입, 셀 컴포넌트, 조건부 스타일, 커스텀 스타일, 긴 내용 보기, 고정 컬럼.
- 헤더·병합: 다단 헤더와 하위 컬럼 정렬, 지정·자동 행 병합, 열 병합, 행·열 병합, 가상 스크롤, Excel.
- 동작: 새 행 선택, 다중 정렬, 컬럼 필터, 셀 편집, 입력 검증, 행 편집 툴바, 드래그 이동, 컨텍스트 메뉴.
- API: 행 조회·일괄 처리, 셀 값·포커스, 행 추가 위치, 삭제·복구, 버튼 이동, 변경 확정·되돌리기, 검증 메시지, 클릭 이벤트, Excel 내보내기 API.
- 고급: 트리, 다단계 트리, 트리·병합, 계산·셀 연동, 상세 그리드·패널, 집계·고정 행, Excel, 모의 서버 조회.

셀 배경색·행 배경색·조건부 스타일은 ‘조건부 스타일’에서 적용 범위와 완료 행 편집 제한을 선택합니다. 다단 헤더·하위 헤더 정렬은 ‘다단 헤더’에서 정렬 버튼을 켜고 끕니다. 일괄 변경·조회·일괄 처리는 ‘행 조회·일괄 처리’에서 전체 행·필터 결과·선택 행을 처리합니다. 기존 `cell-background`, `row-background`, `header-sort`, `transactions` 샘플 주소도 통합된 예제로 연결되며, `row-background`로 열면 행 배경색이 선택됩니다. 변경 확정·되돌리기는 ‘변경 관리’에서 제공합니다.

‘데이터 없음’은 빈 그리드로 시작하며 상단 버튼으로 로딩을 시작·종료합니다. 종료하면 빈 화면으로 돌아갑니다. 기존 `loading` 링크도 이 샘플로 연결합니다. ‘셀렉트’는 검색 없는 셀렉트와 검색 가능한 자동완성에서 단일·다중 선택을 지원합니다. 일반 다중 선택은 `selectOptions.multiple`, 자동완성 다중 선택은 `autocompleteOptions.multiple`을 사용합니다. 기존 `autocomplete` 링크는 자동완성 모드로 연결합니다.

‘커스텀 스타일’은 2단·3단 헤더, 기본·줄무늬·강조 프리셋과 12–18px 글자 크기를 즉시 적용합니다. 그룹 헤더와 하위 헤더의 색상·크기를 함께 바꾸며 입력한 값은 유지됩니다. 2.0.10의 `sx` 객체·테마 콜백·조건부 배열과 공개 클래스 선택자를 사용합니다. 행 높이는 `virtualization.rowHeight`, 헤더 높이는 `OwpThemeProvider.dataGrid.header.height`로 설정합니다. 프리셋과 크기를 바꿔도 편집값과 테마는 유지됩니다. Portal에 표시되는 편집기 목록은 루트 `sx`의 적용 범위 밖입니다.

숫자·날짜 서식 한 화면에서 YYYY-MM-DD, YYYY, YYYY-MM, 초 단위 시간·일시를 비교합니다. 날짜와 시간은 가운데 정렬합니다.

대용량 데이터는 생성 시작 시 기존 행·선택·변경·필터를 비우고 새로 채웁니다. 취소하면 빈 상태를 유지합니다. 행 수 선택을 변경하면 데이터 생성 버튼이 강조됩니다. 데이터 생성 시간을 제외한 ‘그리드 반영 시간’을 ms 단위로 보여주며, 측정값은 테스트 환경에 따라 다를 수 있습니다. 상세 그리드는 별도 Excel 버튼으로 하위 작업과 합계를 내보냅니다. 서버 조회는 정렬·필터 조건을 외부 함수에 넘기는 방식이며, 이 프로젝트의 조회·저장 함수는 지연 시간을 둔 모의 구현입니다.

데이터는 가상의 프로젝트·작업·담당자를 사용합니다. 한금 소비앱 A20000–A60000에서는 기능과 상호작용 패턴을 참고했으며 업무 코드, 고객 이름, API 응답을 사용하지 않습니다. `@owp/treegrid`는 설치하지 않습니다. OwpDataGrid 자체의 트리 기능은 포함합니다.

## 코드와 리소스

본문 액션 버튼은 아웃라인을 기본으로 사용합니다. 단일·다중 선택이나 드래그 대상처럼 선택 상태를 유지하는 버튼은 선택된 값만 채움으로 표시합니다.

부모 높이가 정해진 예제의 그리드는 `style={{ height: '100%' }}`로 남은 영역을 채웁니다. 현재 OwpDataGrid는 `height="100%"`를 태블릿 이하에서 별도 높이로 바꾸므로, 공개 `style` 속성으로 실제 높이를 지정합니다. ‘고정 행’ 예제는 지정한 행 수에 따른 자동 높이를 유지합니다. 독립된 그리드에 고정 높이가 필요하면 `height={420}`처럼 숫자를 지정할 수 있습니다.

코드 탭은 각 샘플의 실제 TSX 컴포넌트를 기본으로 보여줍니다. 이 파일은 `<OwpDataGrid ... />`를 반환하며 미리보기에서도 같은 컴포넌트를 사용합니다. 컬럼 정의, 필요한 native props와 Ref 핸들러는 각 실행 파일에 직접 선언합니다. 데이터·타입·번역·테마는 공유하며 파일 선택에서 원본을 확인할 수 있습니다. 코드 표시·복사·다운로드와 `/snippets` 리소스는 같은 포맷된 원본을 사용합니다. 공통 실행부는 선택·편집·이벤트 기록용 props를 전달합니다. 데이터 탭은 현재 작업 데이터의 앞 100행을 표시하고 전체 행 수도 제공합니다. 이벤트는 최근 40개로 제한합니다.

모든 샘플 컬럼은 `relWidth`로 남는 너비를 나눠 쓰며, `minWidth`로 작은 화면의 읽기 가능한 너비를 유지합니다. 셀 타입 예제는 일반 Select와 Autocomplete를 함께 보여주며, ‘셀렉트’ 예제에서 검색 여부와 단일·다중 선택을 비교합니다. ‘설정 → 모서리 둥글기’에서 각진 형태와 작은·중간·큰 모서리를 선택할 수 있습니다.

빌드 시 다음 정적 리소스도 생성합니다.

- `/catalog.json`: 패키지, 샘플 ID, 분류, 설명, 사용 API와 소스 이름.
- `/packages.json`: 패키지 선택 값, 이름과 샘플 준비 상태.
- `/catalog.en.json`: 같은 샘플의 영어 설명.
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

헤더의 팔레트 아이콘 또는 ‘설정 → 상세 테마 편집’에서 공통 테마를 편집합니다. 일반 테마는 Neutral·Quartz·Alpine·Balham·Material·Slate·Blue·Mint, 프로젝트 테마는 한금으로 구분하며 기본값은 ‘화면과 같게’입니다. 테마는 DataGrid 샘플 이동과 데이터 초기화 이후에도 유지됩니다. 글자 크기·모서리·컴포넌트 색상과 DataGrid의 헤더·셀·선택·필터·행 패널·스크롤바 등 지원하는 항목을 조정하며 현재 샘플에 바로 적용합니다. DataGrid 테마 편집 패널에는 별도 미리보기 그리드를 두지 않습니다. 편집 메뉴는 한글·영문을 지원하며, MUI 팔레트의 색상명은 `red`, `deepPurple`, `blueGrey` 등 원래 영문으로 표시합니다. 기본 색상 선택기에 더해 MUI 색상·단계를 선택하는 다이얼로그를 제공합니다. DataGrid와 Components 패키지에서만 편집 아이콘을 표시하며, Components에서는 Material UI 컴포넌트 미리보기와 공통 설정을 제공합니다. ‘테마 초기화’는 데이터와 편집을 유지하고 공통 테마만 되돌립니다.

‘파일 저장’은 `owp-theme.json`을 다운로드합니다. JSON에는 버전, 프리셋, Material UI 옵션(`mui`), 네이티브 DataGrid 테마(`dataGrid`), 모서리 적용용 `dataGridProps`가 들어갑니다. 한금/OWP Core 프로젝트에서는 `configs/theme/grid.ts`에 `defaultDataGridTheme`을 정의하고, 기존 `settingsConfig`의 `theme.main.palette`와 `theme.main.dataGrid`에 저장값을 병합합니다. 한금에서 기존 이름을 유지하려면 `defaultGridTheme`으로 별칭을 내보냅니다. 병합한 설정을 `OwpCoreProvider`의 `configs.settingsConfig`에 전달하면 기존 `OwpStyleProvider`가 네이티브 그리드 테마로 연결합니다. `radius`는 테마 계약에 포함되지 않는 컴포넌트 속성이므로 `<OwpDataGrid {...config.dataGridProps}>`로 적용합니다. Components의 MUI 설정은 기존 `OwpStyleProvider`의 `theme`에 확장해 전달합니다. 패널의 ‘프로젝트에 적용’은 설정 아코디언과 분리하며, 연결 코드를 파일별 구문 강조·복사 기능이 있는 스니펫으로 제공합니다. ‘파일 불러오기’는 지원 버전·필드·값을 검증한 후 전체 테마를 적용하며, 잘못된 파일은 현재 설정을 유지합니다. 최대 파일 크기는256KiB입니다. 세션의 테마는 페이지 새로고침 시 기본값으로 돌아오며, 지속해서 사용할 설정은 파일로 저장합니다.

‘한금’의 밝은 모드는 소비앱에서 사용하는 `defaultGridTheme`을 바탕으로 비활성 필터 아이콘 대비를 보완합니다. 2.0.10의 빈 드래그 칸은 필터 행 배경을 상속하므로 기본 프리셋의 필터와 행 패널 배경을 맞춥니다. 이 테마는 그리드와 샘플 컴포넌트에 적용하며 앱 탐색 메뉴와 코드 탭은 화면 테마를 따릅니다.

OWP 2.0.10의 데이터 영역과 스크롤·툴바를 접근성 트리에서도 구분하기 위해 `useGridAccessibility`가 데이터 영역에 그리드 역할과 행 정보를 연결합니다. 컨트롤을 숨기지 않으며 정렬·선택·편집의 native 동작은 OWP가 담당합니다.

전역 ‘초기화’는 샘플 데이터·설정·이벤트를 원래 상태로 복구합니다. 그리드 내부 ‘변경 초기화’와 ‘변경 되돌리기’는 마지막 확정 상태로 복구합니다. ‘변경 확정’은 현재 값을 새 기준으로 삼으며 업무 서버에 전송하지 않습니다.


설정의 테마 목록과 선택된 값 앞에는 대표 헤더 색상을 표시합니다. Quartz는 보라, Alpine은 올리브, Balham은 앰버, Material은 청록 계열로 구성하고 테두리·호버·선택 색상도 맞춥니다. ‘한금’은 대표 색상 다음에 소비앱의 원본 심볼과 이름을 표시합니다.

## 검증

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
```

프로덕션 미리보기를 실행한 상태에서 Chrome을 사용하는 실제 브라우저 검증:

```sh
pnpm test:browser
pnpm test:locales
pnpm test:navigation
pnpm test:api
node scripts/verify-2.0.10.mjs
pnpm audit:browser
```

다른 주소는 `PLAYGROUND_URL`로 지정합니다. 브라우저 검증은 편집·검증·행 관리·병합 선택·상세 로딩·실제 XLSX 파일·100만 행 데이터와 취소를 검사합니다. 성능 감사는 공식 Lighthouse 모바일·데스크톱 프로필로 각각 3회 측정하고 중앙값을 기록합니다. 증거는 Git에서 제외한 `.omo/evidence`에 보관합니다.

개발 환경의 react-grab/react-scan 렌더링·스타일 표시는 `import.meta.env.DEV`에서만 로드합니다. `VITE_DISABLE_REACT_DEVTOOLS=1`로 개발 중에도 끌 수 있으며 프로덕션 빌드에는 포함하지 않습니다. 이벤트 탭의 샘플 로그는 제품 기능이므로 빌드 후에도 표시합니다. `pnpm run doctor`로 React 정적 검사를 실행할 수 있습니다.

계산·셀 연동은 프로젝트별 기본 적용률, 작업 간·프로젝트 간 적용률 연동과 비용·합계 계산을 함께 보여줍니다. 행 드래그 이동은 한 행/선택한 행 모드를 전환할 수 있습니다. 본문 제목은 선택한 샘플만 표시하며, 패키지·분류·샘플 경로는 헤더 breadcrumb에서 확인합니다.
