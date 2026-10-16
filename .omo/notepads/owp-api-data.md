# OWP API 데이터 샘플 변경

- 새 dependency 없이 기존 Biome을 사용한다. 표시/복사/다운로드/snippets는 원본 그대로 공유한다.
- `src/features/code/api-data.ts`: OWP 키, JSON/JSONC, 페이지 단위 데이터 접근 계약.
- `ApiDataViewer`: 필드 설명 토글, 100개 페이지, 정확한 표시 범위. 데이터 패널 이탈 시 DataGrid snapshot 참조를 해제한다.
- `charts/model/apiData.ts`: chartFromApi. 공통 월별 fixture와 시작 가이드에 API → 화면 변환을 연결했다.
- `datagrid/model/apiData.ts`: taskFromApi/taskToApi. 필드17 parentId, 필드19 recursive children. 펼친 nested 목록은 API로 내보낼 때 중복 제거한다.
- API data는 현재 샘플의 값으로 만드는 가상 응답이다. 한금 업무 테이블명이나 실제 서버 연결을 만들어 넣지 않는다.
- 조건별 색상은 생산량 ≥ 기준값 / 생산량 < 기준값으로 설명하고 양쪽 색상을 초기값40에서 모두 표시한다. Column dataset 범례의 모순을 없애고 좌/우 위치를 설명했다.
- QA 증거: `.omo/evidence/owp-api-data/QA.md`. 139개 실행 예제의 데이터/소스 탭, 62개 unit tests, 1m rows, responsive/English/dark, 실제 다운로드/clipboard sink 확인.
