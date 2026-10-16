# Gauge·범례·통계 차트 자체 검토

- 사용자 선택: 번역 hook의 공개 경로는 `@owp/components/hooks`를 사용한다. 동일한 확인을 다시 요청하지 않는다.
- 구현 범위: Gauge 자동 갱신, ISO Tooltip 표시, OWP 범례 통일, 차트 hook 전환, Box plot·Pareto·군집 Scatter 추가. 예제 82개와 시작 가이드 1개.
- 공개 API 확인: `ChartLegend`, `ChartSeriesIndicator`, `ChartFrame`, `CoreChart`, Gauge utility, Tooltip callback, Canvas plugin을 사용한다. 새 dependency·framework 수정은 없다.
- 소스 검토: Gauge timer의 visibility·pause·unmount 정리, category legend의 실제 색상과 항목 전환, Box plugin의 최신 관측값·테마 참조, Pareto 누적 및 yAxisId, Scatter domain anchor와 X/Y slider 위치를 다시 확인했다.
- 검증: build·check, 51개 단위 검사, 83개 경로, 15개 회귀 시나리오, 24개 변경 기능 시나리오 통과. 최종 시계열 축 변경 후 한국어·영어 6개 경우와 246개 화면을 다시 확인했다.
- 시각 검토: 최종 contact sheet 17개와 하단 sheet 4개를 모두 열어 확인했다. 주요 6개 영어 모바일 및 다크 테마, Gauge 값 전환, Box의 실제 Canvas 이상치·테마 색상도 확인했다.
- 가로 넘침·카드 내부 스크롤·plot 경계 넘침은 246개 화면에서 모두 0개다. 작은 화면의 다중 차트와 도움말은 자연스러운 본문 세로 스크롤을 유지한다.
- 캡처 도구 수정: fullPage가 Gauge geometry를 바꾸므로 최종 결과는 viewport 캡처를 사용한다. PNG 246개의 signature와 크기를 별도로 검증했다.
- 이번에 추가한 각 제품 파일은 200줄 미만이다. 기존 긴 Workspace·Live는 hook 전환 외 구조를 확대하지 않았다.
- 남은 차단 항목 없음. 자체 검토이며 독립 에이전트 승인으로 표현하지 않는다.
- 상세 근거: `.omo/evidence/charts-gauge-legends/QA.md`.
