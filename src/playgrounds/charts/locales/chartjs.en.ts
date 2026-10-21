export const chartjsEnglish: Readonly<Record<string, string>> = {
  '그룹별 누적 Column': 'Grouped stacked column',
  '시간축 간격': 'Time scale spacing',
  '불규칙한 관측 시각을 실제 시간 간격과 동일한 관측 간격으로 비교.':
    'Compare irregular observations using elapsed time spacing and equal observation spacing.',
  '시간축 Column·Line': 'Time scale Column and Line',
  '같은 UTC 시간축에서 시간당 생산 실적과 계획을 비교.':
    'Compare hourly production actuals and plans on the same UTC time axis.',
  '시간축 누락 구간': 'Time scale gaps',
  '관측 사이의 최대 연결 시간을 바꿔 누락 구간의 선 연결을 비교.':
    'Change the maximum interval between observations to compare connections across gaps.',
  로그축: 'Logarithmic scale',
  '크기 차이가 큰 양수 측정값을 선형축과 로그축으로 비교.':
    'Compare positive measurements spanning several orders of magnitude on linear and logarithmic scales.',
  '차트 부제목': 'Chart subtitle',
  'Canvas 부제목의 표시·줄 수·정렬을 변경하고 PNG 내보내기 실행.':
    'Change canvas subtitle display, lines and alignment, and export as PNG.',
  '시간축을 불러오지 못했습니다. 다시 시도해 주세요.':
    'Unable to load the time axis. Please try again.',
  '시간축을 불러오는 중입니다.': 'Loading the time axis.',
  '실제 시간 간격': 'Elapsed time spacing',
  '동일한 관측 간격': 'Equal observation spacing',
  '설비 부하 (%)': 'Equipment load (%)',
  '불규칙한 설비 관측 시각을 time의 실제 간격과 timeseries의 동일 간격으로 비교합니다. 모든 시각은 UTC입니다.':
    'Compare irregular equipment observations using elapsed spacing with time and equal spacing with timeseries. All times are UTC.',
  '시간당 생산량': 'Hourly production',
  '시간당 생산 계획': 'Hourly production plan',
  '생산 계획 표시': 'Show production plan',
  '계획 관측점 표시': 'Show plan points',
  '같은 UTC 시간축에서 생산 실적 Column과 생산 계획 Line을 비교합니다.':
    'Compare production actual columns and production plan lines on the same UTC time axis.',
  '최대 연결 시간': 'Maximum connection interval',
  '1시간': '1 hour',
  '4시간': '4 hours',
  '8시간': '8 hours',
  '센서 온도 (°C)': 'Sensor temperature (°C)',
  'spanGaps에 밀리초 단위의 최대 연결 시간을 전달합니다. null 구간은 연결하지 않고, 인접 관측 시각의 간격이 임계값보다 크면 선을 추가로 끊습니다. UTC 시각과 누락값은 데이터 탭에 그대로 남습니다.':
    'Pass the maximum connection interval in milliseconds to spanGaps. Explicit null gaps remain disconnected, and adjacent observations farther apart than the threshold create additional breaks. All timestamps and missing readings remain in the Data tab in UTC.',
  '공정별 배치 전력 사용량': 'Electricity use per process batch',
  '{{series}}: {{value}} kWh': '{{series}}: {{value}} kWh',
  검사: 'Inspection',
  세척: 'Cleaning',
  가공: 'Machining',
  건조: 'Drying',
  열처리: 'Heat treatment',
  용해: 'Melting',
  '배치 전력 사용량 (kWh)': 'Electricity per batch (kWh)',
  공정: 'Process',
  'Y축 척도': 'Y-axis scale',
  '로그 축': 'Logarithmic',
  '선형 축': 'Linear',
  '상반기 생산량': 'First-half production',
  '라인 A와 라인 B의 월별 생산 실적': 'Monthly production by Line A and Line B',
  '단위: 개 · 집계: 월별': 'Unit: pieces · Aggregation: monthly',
  '생산량 (개)': 'Production (pieces)',
  '부제목 표시': 'Show subtitle',
  '여러 줄 부제목': 'Multiline subtitle',
  '부제목 정렬': 'Subtitle alignment',
  '{{title}}. {{subtitle}}. {{detail}}. 데이터 탭에서 값을 확인할 수 있습니다.':
    '{{title}}. {{subtitle}}. {{detail}}. Values are available in the Data tab.',
  '{{title}}. {{subtitle}}. 데이터 탭에서 값을 확인할 수 있습니다.':
    '{{title}}. {{subtitle}}. Values are available in the Data tab.',
  '{{title}}. 데이터 탭에서 값을 확인할 수 있습니다.':
    '{{title}}. Values are available in the Data tab.',
  'Column radius': 'Column radius',
  'Column 모서리의 radius를 조절.': 'Adjust the corner radius of each column.',
  'Floating bars': 'Floating bars',
  '시작값과 종료값 사이의 구간을 Column으로 표시.':
    'Show intervals between start and end values as floating columns.',
  'Grouped stacks': 'Grouped stacks',
  '서로 다른 stack 그룹을 나란히 비교.': 'Compare separate stacks side by side.',
  'Line interpolation': 'Line interpolation',
  '직선·곡선·monotone 보간을 비교.': 'Compare straight, cubic and monotone interpolation.',
  'Stepped line': 'Stepped line',
  '값이 바뀌는 위치에 따라 계단형 선을 표시.': 'Change where each stepped line changes value.',
  'Point style': 'Point style',
  '데이터 point의 모양을 변경.': 'Change the shape of data points.',
  'Line style': 'Line style',
  '선의 dash와 point 표시를 변경.': 'Change line dashes and point visibility.',
  'Line segments': 'Line segments',
  '하락 구간과 누락된 데이터 구간을 구분.': 'Distinguish falling segments from gaps in the data.',
  'Multi-axis line': 'Multi-axis line',
  '두 Line series를 서로 다른 Y축에 연결.': 'Bind two line series to separate Y axes.',
  Pie: 'Pie',
  'Pie의 회전 각도를 조절하고 기준값에 따라 색상을 구분.':
    'Adjust pie rotation and optionally color slices by an output threshold.',
  '기준값으로 색상 구분': 'Color by threshold',
  'Multi-series pie': 'Multi-series pie',
  '두 고리에 생산 비중을 표시하고, 간격과 색상 밝기로 고리를 구분.':
    'Compare production shares with separated rings and distinct color intensity.',
  '바깥쪽 · {{outer}} / 안쪽 · {{inner}}': 'Outer · {{outer}} / Inner · {{inner}}',
  '{{series}}: {{value}}': '{{series}}: {{value}}',
  'Stacked Column·Line': 'Stacked Column and Line',
  '누적 Column과 Line series를 같은 차트에 표시.': 'Show stacked columns and a line in one chart.',
  '축 범위': 'Axis range',
  '축 범위를 고정하는 방식과 권장 범위를 지정하는 방식을 비교.':
    'Compare fixed scale bounds with suggested bounds.',
  '눈금 간격': 'Tick step size',
  'Y축의 눈금 간격을 변경.': 'Change the distance between Y axis ticks.',
  '축 영역 분할': 'Stacked axes',
  '한쪽에 배치한 Y축 영역을 위아래로 나눔.':
    'Split axes on the same side into vertically stacked regions.',
  '축 중앙 배치': 'Centered axes',
  '양수와 음수를 원점 기준으로 비교.': 'Compare positive and negative values around the origin.',
  '격자 스타일': 'Grid styling',
  '격자의 표시 여부와 색상을 설정 가능.': 'Toggle grid lines and change their colors.',
  '눈금 서식': 'Tick styling',
  '눈금의 표시 간격과 값 서식을 조절.': 'Change tick filtering and value formatting.',
  '축 제목': 'Axis titles',
  'X축과 Y축의 제목을 표시하며, 제목 정렬을 변경 가능.':
    'Display and align titles for the X and Y axes.',
  '범례 point style': 'Legend point style',
  '범례를 데이터 point 모양으로 표시합니다.': 'Use point shapes in the legend.',
  '범례 제목': 'Legend title',
  '범례의 제목과 위치를 조절합니다.': 'Toggle a legend title and change its position.',
  '범례 이벤트': 'Legend events',
  '범례에 마우스를 올리거나 클릭할 때 발생하는 이벤트를 기록.':
    'Record legend hover and click events.',
  'Tooltip 내용': 'Tooltip content',
  'Tooltip의 제목·본문·footer를 구성.': 'Customize the tooltip title, body and footer.',
  'Tooltip 탐색 방식': 'Tooltip interaction modes',
  '포인터 위치에 따른 Tooltip 선택 방식을 비교.':
    'Compare tooltip selection modes for pointer movement.',
  'Tooltip 위치': 'Tooltip position',
  'Tooltip 위치 계산 방식을 비교.': 'Compare average and nearest tooltip positioning.',
  'Tooltip point style': 'Tooltip point style',
  'Tooltip의 색상 상자를 point 모양으로 변경.': 'Use point shapes as tooltip color indicators.',
  '차트 제목 정렬': 'Chart title alignment',
  '차트 제목의 정렬을 바꾸거나 여러 줄로 표시 가능.':
    'Align chart titles and display multiple title lines.',
  '조건별 Column 색상': 'Scriptable column colors',
  '데이터 값에 따라 색상과 point 표시를 계산합니다.':
    'Compute colors and point styling from each data value.',
  '조건별 Line point': 'Scriptable line points',
  '조건별 Pie 색상': 'Scriptable pie colors',
  '외부 버튼으로 Hover·Tooltip 제어': 'Button-controlled hover and tooltip',
  '외부 버튼으로 지정한 point 강조 및 Tooltip 표시 실행.':
    'Highlight a specific point and display its tooltip using external buttons.',
  '차트 영역 테두리': 'Chart area border',
  'Plugin으로 plot 영역 테두리 표시 가능.': 'Display a border around the plot area using a plugin.',
  '사분면 배경': 'Quadrant backgrounds',
  '원점을 기준으로 네 영역의 배경색을 구분.': 'Color the four quadrants around the origin.',
  '빈 Doughnut 표시': 'Empty doughnut',
  '합계가 0인 경우 중립색 ring을 표시합니다.': 'Display a neutral ring when the total is zero.',
  Scatter: 'Scatter',
  'X·Y 좌표의 분포를 point로 표시.': 'Plot the distribution of X and Y coordinates.',
  'Multi-axis scatter': 'Multi-axis scatter',
  '두 Y축에 서로 다른 범위를 적용해 point 분포를 비교.':
    'Compare point distributions on separate Y axes.',
  Bubble: 'Bubble',
  'X·Y 좌표와 크기로 세 가지 값을 비교.': 'Compare three values using X, Y and point radius.',
  범례·Tooltip: 'Legend and tooltips',
  Zoom·동기화: 'Zoom and synchronization',
  라벨·기준선: 'Labels and reference lines',
  스타일·색상: 'Styles and colors',
  데이터·연동: 'Data and integration',
  내보내기: 'Export',
  '구간 이동': 'Interval offset',
  '그룹별 누적': 'Stack by group',
  '표시 방식': 'Display mode',
  '누락 구간 연결': 'Connect gaps',
  '오른쪽 축 표시': 'Show right axis',
  '회전 각도': 'Rotation',
  '도넛 내부 크기': 'Inner cutout',
  'Column 누적': 'Stack columns',
  '고정 범위': 'Fixed bounds',
  '위쪽 영역 높이 비율': 'Upper axis weight',
  '원점에 축 배치': 'Center axes at zero',
  '격자 표시': 'Show grid',
  '일부 눈금 숨김': 'Hide alternate ticks',
  월: 'Month',
  생산량: 'Output',
  '제목 정렬': 'Title alignment',
  'Point 모양 범례': 'Point-style legend',
  '생산 라인': 'Production lines',
  '범례 제목 표시': 'Show legend title',
  'Hover 이벤트': 'Hover events',
  합계: 'Total',
  '합계 표시': 'Show total',
  '탐색 방식': 'Interaction mode',
  '위치 계산': 'Position calculation',
  'Tooltip에 Point 모양 사용': 'Point-style tooltip',
  '월별 생산량': 'Monthly output',
  '라인별 비교': 'Compare lines',
  '색상 기준값': 'Color threshold',
  '색상 반전': 'Reverse colors',
  '선택할 point': 'Point index',
  'Point 선택': 'Select point',
  '선택 해제': 'Clear selection',
  '점선 테두리': 'Dashed border',
  '사분면 배경 표시': 'Show quadrant backgrounds',
  '합계 0으로 표시': 'Set total to zero',
  'Point 크기': 'Point size',
  '크기 배율': 'Radius multiplier',
  '생산량 기준값 (개)': 'Output threshold (units)',
  '각 항목의 생산량이 {{value}}개 이상인지에 따라 색상을 구분합니다.':
    'Compare each output value with {{value}} units. The threshold is an example setting used to classify output.',
  '기준값 이상 (≥ {{value}}개)': 'At or above threshold (≥ {{value}} units)',
  '기준값 미만 (< {{value}}개)': 'Below threshold (< {{value}} units)',
  'Line 색상으로 생산 라인을 구분합니다. Point 반지름은 기준값 이상이면 7px, 미만이면 3px입니다.':
    'Line colors identify production lines. Points have a 7px radius at or above the threshold and 3px below it.',
  '생산량이 기준값 이상인 월과 미만인 월을 Column 색상으로 구분.':
    'Color monthly output by whether it reaches the threshold.',
  '월별 생산량이 기준값 이상인지에 따라 Point의 색상과 크기를 변경.':
    'Color and size monthly output points by whether they reach the threshold.',
  '각 조각의 생산량이 기준값 이상인지 비교해 색상을 구분합니다.':
    'Color each slice by whether its output reaches the threshold.',
  '왼쪽 Column은 라인 A, 오른쪽은 라인 B를 나타냅니다. 같은 색이어도 툴팁에서 같은 월의 두 값을 구분할 수 있습니다.':
    'Even with the same color, the left column is Line A and the right is Line B. The tooltip shows both values for that month.',
  '조각의 크기는 생산 비중을, 색상은 기준값 이상인지 여부를 나타냅니다. 같은 색의 조각도 툴팁에서 공정을 구분할 수 있습니다.':
    'Slice size shows production share, while color indicates whether the threshold is met. Each process retains its slice and tooltip even when colors match.',
  '서로 다른 stack 그룹을 나란히 비교 가능.': 'Compare separate stack groups side by side.',
  '시작값과 종료값 사이의 구간을 Column으로 표시 가능.':
    'Display intervals between start and end values using columns.',
  '누적 Column과 Line series를 같은 차트에 표시 가능.':
    'Display stacked column and line series together on the same chart.',
  'Pie의 회전 각도 조절과 기준값에 따른 색상 구분 가능.':
    'Adjust pie rotation angle and distinguish colors based on reference values.',
  '두 고리에 생산 비중을 표시하고 간격과 색상 밝기 구분 가능.':
    'Display production shares in two concentric rings with custom spacing and brightness.',
  'X·Y 좌표의 데이터 분포를 point로 표시 가능.':
    'Display data distribution of X and Y coordinates with points.',
  'X·Y 좌표와 크기로 세 가지 측정값 비교 가능.':
    'Compare three measurement values using X, Y coordinates and bubble sizes.',
  '축 범위 고정 방식과 권장 범위 지정 방식 비교 가능.':
    'Compare fixed axis domains against suggested domain boundaries.',
  '크기 차이가 큰 양수 측정값을 선형축과 로그축으로 비교 가능.':
    'Compare positive measurements spanning several orders of magnitude on linear and logarithmic scales.',
  'X축과 Y축의 제목 표시와 정렬 변경 가능.':
    'Display titles on X and Y axes and adjust their alignment.',
  '양수와 음수를 원점 기준으로 비교 가능.':
    'Compare positive and negative values centered at the origin.',
  '한쪽 Y축 영역을 위아래로 분할 가능.':
    'Divide a shared Y-axis side into stacked vertical regions.',
  '두 Line series를 서로 다른 Y축에 연결해 비교 가능.':
    'Connect two line series to independent Y axes for comparison.',
  '두 Y축에 서로 다른 범위를 적용해 point 분포 비교 가능.':
    'Apply different ranges to two Y axes to compare point distributions.',
  '불규칙한 관측 시각을 실제 시간 간격과 동일 관측 간격으로 비교 가능.':
    'Compare irregular observations using elapsed time spacing and equal observation spacing.',
  '같은 UTC 시간축에서 시간당 생산 실적과 계획 비교 가능.':
    'Compare hourly production actuals and plans on the same UTC time axis.',
  '관측 사이의 최대 연결 시간 조절로 누락 구간 선 연결 비교 가능.':
    'Adjust maximum connection interval to compare line bridging across missing data points.',
  'Y축 눈금 간격 설정 및 변경 가능.': 'Configure and adjust step size for Y-axis ticks.',
  '눈금의 표시 간격과 값 서식 조절 가능.':
    'Adjust tick display intervals and numeric label formats.',
  '격자의 표시 여부와 색상 설정 가능.': 'Configure grid line visibility and colors.',
  '범례 위에 제목 표시 여부 설정 가능.': 'Configure whether to display a title above the legend.',
  'Point 표시 설정을 차트와 범례에 함께 적용 가능.':
    'Apply point visibility settings consistently across both chart and legend.',
  '범례 마우스 호버와 클릭 이벤트 기록 확인 가능.':
    'Inspect recorded events when hovering or clicking legend items.',
  'Tooltip 제목·본문·footer 변경 가능.': 'Customize title, body, and footer content in tooltips.',
  '포인터 위치에 따른 Tooltip 탐색 모드 비교 가능.':
    'Compare tooltip interaction and detection modes based on pointer position.',
  'Tooltip 위치 계산 방식 비교 가능.':
    'Compare different positioning calculation modes for tooltips.',
  'Tooltip 색상 상자를 point 모양으로 변경 가능.':
    'Change tooltip color boxes to match dataset point styles.',
  '원점을 기준으로 네 사분면 배경색 구분 가능.':
    'Distinguish background colors across four quadrants centered at the origin.',
  '차트 제목 정렬 변경과 여러 줄 표시 가능.':
    'Adjust chart title alignment and display multiple title lines.',
  'Column 모서리의 radius 크기 조절 가능.': 'Adjust the border radius of column corners.',
  '생산량 기준값 충족 여부에 따른 Column 색상 구분 가능.':
    'Differentiate column colors dynamically based on threshold criteria.',
  '선의 dash 패턴 변경 가능.': 'Change border dash patterns and point display styles on lines.',
  '직선·곡선·monotone 보간 알고리즘 비교 가능.':
    'Compare linear, bezier curve, and monotone interpolation modes.',
  '값이 바뀌는 위치에 따른 계단형 선 표시 가능.':
    'Display stepped lines with step transitions at varied positions.',
  '하락 구간과 누락 데이터 구간의 선 스타일 구분 가능.':
    'Segment line styles dynamically for downward trends and missing intervals.',
  '데이터 point의 모양 변경 가능.': 'Change shapes and radius sizes of data points.',
  '월별 생산량 기준값에 따른 Point 색상과 크기 변경 가능.':
    'Customize point colors and radius dynamically based on monthly criteria.',
  'Line 좌우 축·표시': 'Line dual axes and visibility',
  '두 Line을 좌우 Y축에 연결하고 오른쪽 축 표시·숨김 가능.':
    'Connect two lines to left and right Y axes and toggle the right axis visibility.',
  'Scatter 좌우 축': 'Scatter on dual axes',
  '두 Scatter를 서로 다른 Y축 범위에 연결하고 Point 크기 조절 가능.':
    'Connect two scatter series to different Y-axis ranges and adjust point size.',
  'series를 여러 stack으로 나누어 나란히 누적하고 그룹별 범례 표시 가능.':
    'Split series into multiple stacks, display the stacks side by side, and show a legend for each group.',
};
