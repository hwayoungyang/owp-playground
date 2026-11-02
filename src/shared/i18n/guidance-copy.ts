export function formatKoreanGuidance(value: string): string {
  return value.replace(
    /(확인|선택|입력|설정|요청|사용|참고|비교|연결|설치|등록|추가|변경|실행|적용|저장|지정|대조)하세요/g,
    '$1해 주세요',
  );
}
