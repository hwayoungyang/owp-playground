# 차트 HTML 툴팁 작업 메모

- 사용자 요청: 그룹명을 한국어 (영어)로 병기하고, 이미 패키지에 있는 커스텀 HTML 툴팁으로 전체 전환한다. 영어 화면은 영어만 표시한다.
- 구조: `useCartesian`이 공통 externalTooltip 기본값을 반환한다. `NativeCanvas`는 ChartFrame과 패키지 옵션 factory를 사용해 기존 callback과 HTML 스타일을 보존한다. 자체 HTML tooltip을 복제하지 않는다.
- 독립 Scatter/Gauge/시작 가이드에도 externalTooltip을 명시한다. Sparkline은 tooltip 비활성화 계약을 유지한다.
- 자체 코드 검토: 공개 타입/props 사용, 기존 event/ref 전달, callback, custom legend, viewport 경계 처리 및 정리 동작을 확인했다. 새 unsafe assertion이나 외부 입력 처리를 추가하지 않았다.
- 가로 Bar는 parsed.x가 실제 수치다. 공통 formatTooltipLabel에 이 값을 전달해 순위 및 일반 Bar의 수치 오류를 수정했다.
- 다음 확장 시 참고: useCartesian은 pure LOC 약 203, verify-charts는 약 242로 경고 구간이다. 추가 확장 시 palette 또는 검증 시나리오를 별도 책임으로 분리한다. 현재 범위에서는 기존 책임 안에서 수정했다.
- 증거와 제한: `.omo/evidence/charts-tooltips/QA.md`. 독립 리뷰가 아닌 실제 화면 자체 검증이다. 기존의 다른 작업 변경은 보존했다.
