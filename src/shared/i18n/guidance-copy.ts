import { protectedText } from './reference-copy-patterns';

const protectedGuidanceText = new RegExp(
  `${protectedText.source}|\\{\\{[^{}]*\\}\\}`,
  protectedText.flags,
);

export function formatKoreanGuidance(value: string): string {
  const soften = (text: string) =>
    text
      .replace(
        /(확인|선택|입력|설정|요청|사용|참고|비교|연결|설치|등록|추가|변경|실행|적용|저장|지정|대조|조회|전달|확정)하세요/g,
        '$1해 주세요',
      )
      .replaceAll('누르세요', '눌러 주세요');
  let result = '';
  let offset = 0;
  for (const match of value.matchAll(protectedGuidanceText)) {
    result += soften(value.slice(offset, match.index)) + match[0];
    offset = match.index + match[0].length;
  }
  return result + soften(value.slice(offset));
}
