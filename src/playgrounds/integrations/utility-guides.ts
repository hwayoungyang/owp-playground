/** 화면 가이드와 Knowledge가 같은 설치본의 유틸 계약을 설명합니다. */
export const utilityGuides = {
  utils: {
    id: 'value-presence',
    title: 'hasValue와 빈 값 판정',
    description: '원본 값의 타입을 보존하며 빈 값을 판정하고 배열을 필터링합니다.',
    sample: 'value-format',
    api: ['hasValue', 'isNilOrEmptyString', 'getTrimmedValue'],
    sections: [
      {
        title: '원본 값과 타입',
        body: "@owp/utils의 hasValue는 null, undefined, 빈 문자열('')에만 false를 반환합니다. 숫자 0, boolean false, 공백 문자열과 NaN에는 true를 반환하며, isNilOrEmptyString과 반대 결과입니다. 문자열 '0'과 'false'는 숫자·boolean과 다른 값입니다.",
      },
      {
        title: '배열 필터와 공백 처리',
        body: "array.filter(hasValue)는 null, undefined, 빈 문자열을 제외하고 0과 false를 유지합니다. type guard는 Exclude<T, null | undefined | ''>로 타입을 좁힙니다. 공백 문자열도 제외하려면 먼저 getTrimmedValue로 문자열을 변환한 뒤 판정해야 합니다. 원본 판정과 trim 후 판정은 서로 다른 연산입니다.",
      },
    ],
  },
  'date-picker': {
    id: 'kst-date-time',
    title: 'KST 날짜·시간 유틸',
    description: 'Unix 밀리초를 KST로 표시하고 날짜 조정·자정·엄격한 파싱을 확인합니다.',
    sample: 'kst-date-time',
    api: [
      'formatKstDateTime',
      'getKstToday',
      'getKstCurrentTime',
      'getKstCurrentDateTime',
      'getKstDate',
      'getKstDayStart',
      'parseKstDateTime',
      'KstDateOptions',
    ],
    sections: [
      {
        title: '공개 import와 밀리초 단위',
        body: '@owp/date-picker/utils에서 KST 함수와 type-only KstDateOptions를 import합니다. timestamp는 Unix 밀리초입니다. formatKstDateTime의 기본 포맷은 YYYY-MM-DD HH:mm:ss이며 Z는 +09:00, ZZ는 +0900을 표시합니다. 기존 formatDate·formatToday의 로컬 날짜 처리와 picker의 기본 동작은 유지됩니다.',
      },
      {
        title: '같은 시각의 날짜·시간과 자정',
        body: 'getKstToday(format, timestamp)의 기본 포맷은 YYYY-MM-DD, getKstCurrentTime(format, timestamp)은 HH:mm:ss입니다. getKstCurrentDateTime(timeFormat, timestamp)은 같은 timestamp의 { date, time }을 반환하며 date는 YYYY-MM-DD입니다. timestamp를 생략하면 현재 시각을 사용합니다. getKstDayStart(timestamp)는 해당 KST 날짜의 자정을 실제 epoch 밀리초로 반환합니다. 2026-01-31의 KST 자정은 1769785200000이며 UTC로는 2026-01-30T15:00:00.000Z입니다.',
      },
      {
        title: '월말 보정과 날짜 이동 순서',
        body: 'getKstDate(options, timestamp)는 KST에서 months → days → startOfMonth 순서로 적용하고 YYYY-MM-DD를 반환합니다. KstDateOptions의 기본값은 months=0, days=0, startOfMonth=false입니다. 월 이동 시 없는 날짜는 대상 월의 말일로 보정하고 days는 Math.round로 반올림합니다. 2026-01-31에서 months=1이면 2026-02-28, 이어 days=1이면 2026-03-01이며 startOfMonth는 마지막으로 적용됩니다. 호스트 시간대와 DST에 영향을 받지 않도록 UTC 달력으로 계산합니다.',
      },
      {
        title: '엄격한 파싱과 null',
        body: 'parseKstDateTime은 앞뒤 공백을 제거한 YYYY-MM-DD 또는 YYYY-MM-DD[단일 공백/대문자 T]HH:mm[:ss[.S~SSS]]를 받습니다. 날짜만 있으면 KST 자정, 시간대가 없는 날짜·시간은 KST로 해석합니다. 시간이 있으면 대문자 Z 또는 ±HH:mm/±HHmm을 붙일 수 있으며 offset은 시 00~23, 분 00~59입니다. 밀리초 1~3자리는 초가 있을 때만 허용합니다. 잘못된 날짜·시간·offset, 소문자 t/z, 여러 공백, 4자리 이상 밀리초, 빈 입력과 지원하지 않는 형식은 null을 반환합니다. 실패를 0이나 현재 시각으로 바꾸지 않습니다.',
      },
    ],
  },
} as const;

export function getUtilityGuide(packageId: string) {
  switch (packageId) {
    case 'utils':
      return utilityGuides.utils;
    case 'date-picker':
      return utilityGuides['date-picker'];
    default:
      return undefined;
  }
}
