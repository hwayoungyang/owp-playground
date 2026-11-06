import {
  actionEnding,
  actionObjectEnding,
  nounEnding,
  identifierEnding,
  endingPatterns,
  protectedText,
} from './reference-copy-patterns.ts';

const protectedAppText = new RegExp(
  `${protectedText.source}|\\{\\{[^{}]*\\}\\}`,
  protectedText.flags,
);

/** 코드·인용과 문장 종결을 유지하며 화면 설명의 기술 용어를 통일합니다. */
export function normalizeAppTerminology(text: string): string {
  const normalize = (prose: string) =>
    prose
      .replaceAll('소비앱', '앱')
      .replaceAll('소비 앱', '앱')
      .replace(/(?<![가-힣A-Za-z0-9_])공개(?=\s)/g, 'public')
      .replaceAll('훅', 'Hook')
      .replaceAll('프로바이더', 'Provider')
      .replaceAll('재수출', 're-export')
      .replaceAll('콜백', 'callback')
      .replaceAll('래퍼', 'wrapper')
      .replaceAll('캐시', 'cache')
      .replaceAll('툴팁', 'Tooltip')
      .replaceAll('시리즈', 'series')
      .replaceAll('접두사', 'prefix')
      .replaceAll('접미사', 'suffix')
      .replace(/(?<![가-힣A-Za-z0-9_])배열(?!\s*\(Array\))/g, '배열 (Array)');
  let result = '';
  let offset = 0;
  for (const match of text.matchAll(protectedAppText)) {
    result += normalize(text.slice(offset, match.index)) + match[0];
    offset = match.index + match[0].length;
  }
  return result + normalize(text.slice(offset));
}

function rewriteProse(text: string): string {
  if (!/[가-힣]/.test(text)) return text;
  let result = text
    .replaceAll('소비앱', '앱')
    .replaceAll('소비 앱', '앱')
    .replaceAll('기본 입력은 id/value를 가져야 합니다.', '기본 입력에 id/value 필요.')
    .replaceAll('기본 tooltip에 표시할 번역된 항목 이름입니다.', '기본 tooltip의 번역된 항목 이름.')
    .replaceAll('wrapper의 번역된 기본 tooltip입니다.', 'wrapper가 제공하는 번역된 기본 tooltip.')
    .replaceAll('빈 정상 데이터의 domain은', '유효한 데이터가 없을 때 domain은')
    .replaceAll(
      '불가능한 대비는 가장 대비가 높은 같은 계열 색상을',
      '대비를 충족할 수 없으면 같은 계열에서 대비가 가장 높은 색상을',
    )
    .replaceAll('renderer는 cell 안에서 clip됩니다.', 'renderer는 cell 안에서 clip 처리.')
    .replaceAll(
      'renderer 출력은 사각형 안에서 clip됩니다.',
      'renderer 출력은 사각형 안에서 clip 처리.',
    )
    .replace(/(?<![가-힣])정합니다(?=[.!?](?:\s|$)|$)/g, '지정');
  for (const [pattern, replacement] of endingPatterns)
    result = result.replace(pattern, replacement);
  return result
    .replace(actionEnding, '$1')
    .replace(nounEnding, '$1')
    .replace(identifierEnding, '$1')
    .replace(actionObjectEnding, '$1 $2');
}

/** API 설명의 의미와 인용 원문을 보존하며 짧은 참조 문체로 변환함. */
export function toReferenceStyle(text: string): string {
  let result = '';
  let offset = 0;
  for (const match of text.matchAll(protectedText)) {
    result += rewriteProse(text.slice(offset, match.index)) + match[0];
    offset = match.index + match[0].length;
  }
  result += rewriteProse(text.slice(offset));
  if (!/[가-힣]/.test(result) || /[.!?:;,]\s*$/.test(result)) return result;
  const lastProtected = [...result.matchAll(protectedText)].at(-1);
  if (lastProtected && lastProtected.index + lastProtected[0].length === result.trimEnd().length)
    return result;
  return result.replace(/(\S)(\s*)$/, '$1.$2');
}

/** API 설명의 문장·조건·인용을 유지하며 화면에 표시할 기술 용어를 통일합니다. */
export function formatApiDescription(text: string): string {
  return normalizeAppTerminology(text);
}
