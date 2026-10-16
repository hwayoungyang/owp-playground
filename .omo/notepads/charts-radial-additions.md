# Semi circle·Radar 자체 점검

- 사용자 범위: 반원과 능력치 비교형 Radar 두 예제를 현재 설치 구성으로 추가합니다. 스마트 팩토리 가상 데이터를 사용하며 패키지를 설치·갱신하거나 패키지 소스를 수정하지 않습니다.
- 기존 public API 확인: @owp/charts 3.0.1은 Bar/Line/Doughnut을 등록하고 RadarController·RadialLinearScale은 등록하지 않습니다. 반원은 Doughnut 옵션으로, Radar는 기존 public plugin API와 Line Point 좌표 재배치로 구현했습니다. registry나 transitive runtime 경로를 가져오지 않습니다.
- 데이터: 두 예제의 원본은 OWP_DATA.DATA* 평면 문자열 response이며 chartFromApi로 숫자 view model을 만듭니다. Radar는 단위가 다른 실제 KPI를 혼합하지 않고 같은 0–100점으로 환산한 가상 평가임을 주석과 화면에 명시합니다.
- 디자인: 기존 palette·12px 텍스트·중앙 OWP 범례·OWP HTML tooltip을 유지합니다. 두 profile은 실선/점선과 원형/사각형 점으로 구분합니다. 모바일 영문 축명은 단어 단위로 줄바꿈합니다. 반원은 전체 원형보다 낮은 높이를 사용합니다.
- 실제 표면 검증에서 찾은 문제: Chart.js에 초기 등록된 plugin closure가 다크 전환 후 이전 색상을 사용했습니다. 두 샘플에 theme surface key를 적용해 현재 palette로 캔버스를 재생성합니다. 기존 차트의 테마/범례 state를 바꾸지 않습니다.
- QA 도구 수정: full navigation은 locale/theme을 초기화하므로 해당 상태를 새 route에서 명시적으로 다시 설정했습니다. 이 실패는 번역 누락이 아니었습니다.
- 한국어 점검: 모바일 Radar 설명에서 '있습니다.'가 단독 줄로 떨어져 범례 설명 중복을 덜고 점수 범위와 해석을 한 문장으로 줄였습니다.
- 결과 근거는 .omo/evidence/charts-radial-additions/QA.md와 results.json·compact-results.json·screenshots에 기록합니다. 검증 범위를 94개 전체 route 검사로 과장하지 않습니다.
