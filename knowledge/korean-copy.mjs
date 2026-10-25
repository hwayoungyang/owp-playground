const actions = [
  '거부',
  '검사',
  '결정',
  '계산',
  '고려',
  '관리',
  '교체',
  '구분',
  '구성',
  '다운로드',
  '등록',
  '명시',
  '반영',
  '반환',
  '배치',
  '변경',
  '변환',
  '보존',
  '복사',
  '복원',
  '분리',
  '분할',
  '비교',
  '사용',
  '생략',
  '생성',
  '설명',
  '설정',
  '설치',
  '선택',
  '소유',
  '수정',
  '시도',
  '승인',
  '실행',
  '안정화',
  '연결',
  '예약',
  '우선',
  '유지',
  '이동',
  '적용',
  '재배치',
  '재사용',
  '재정의',
  '재시도',
  '전달',
  '정규화',
  '정리',
  '제거',
  '제공',
  '제어',
  '제외',
  '제한',
  '조정',
  '조합',
  '조회',
  '준비',
  '중단',
  '지정',
  '지원',
  '진행',
  '집계',
  '처리',
  '추가',
  '취소',
  '포함',
  '표시',
  '합성',
  '허용',
  '호출',
  '확보',
  '확인',
  '확정',
  '해제',
  'fallback',
  'await',
  'mount',
  'import',
];
const sentenceEnd = '(?=[.!?](?:\\s|$)|$)';
const actionEnding = new RegExp(
  `(?<![가-힣A-Za-z_])(${actions.join('|')})(?:합니다|한다|하세요)${sentenceEnd}`,
  'g',
);
const nouns = [
  '색상',
  '설정',
  '수염',
  '통계',
  '위치',
  '이름',
  '관측값',
  '범주',
  '비율',
  '범위',
  '순서',
  '좌표',
  '값',
  '팔레트',
  '구간',
  '스타일',
  '계약',
  '사각형',
  '형식',
  '항목',
  '선언',
  '정책',
  '문자열',
  '상태',
  '표현',
  '표시',
  '별개',
  '시간제',
  '집계행',
  '타입',
  '배열',
];
const nounEnding = new RegExp(`(${nouns.join('|')})(?:입니다|이다|다)${sentenceEnd}`, 'g');
const identifierEnding = new RegExp(`([A-Za-z0-9_\\]])(?:입니다|이다|다)${sentenceEnd}`, 'g');
const endings = [
  ['영향을 주지 않는다', '영향을 주지 않음'],
  ['실패한다', '실패함'],
  ['reject된다', 'reject됨'],
  ['일치시킨다', '일치시킴'],
  ['하지 않습니다', '하지 않음'],
  ['하지 않는다', '하지 않음'],
  ['되지 않습니다', '되지 않음'],
  ['되지 않는다', '되지 않음'],
  ['지는 않습니다', '지는 않음'],
  ['지는 않는다', '지는 않음'],
  ['그리지 않습니다', '그리지 않음'],
  ['할 수 있습니다', ' 가능'],
  ['할 수 있다', ' 가능'],
  ['할 수 있음', ' 가능'],
  ['볼 수 있음', '확인 가능'],
  ['바꿀 수 있습니다', '변경 가능'],
  ['바꿀 수 있다', '변경 가능'],
  ['해야 합니다', '해야 함'],
  ['해야 한다', '해야 함'],
  ['필요합니다', '필요'],
  ['필수입니다', '필수'],
  ['없습니다', '없음'],
  ['없다', '없음'],
  ['있습니다', '있음'],
  ['있다', '있음'],
  ['아닙니다', '아님'],
  ['아니다', '아님'],
  ['따릅니다', '따름'],
  ['따른다', '따름'],
  ['보냅니다', '보냄'],
  ['보낸다', '보냄'],
  ['숨깁니다', '숨김'],
  ['숨긴다', '숨김'],
  ['읽습니다', '읽음'],
  ['읽는다', '읽음'],
  ['만듭니다', '생성'],
  ['만든다', '생성'],
  ['그립니다', '그림'],
  ['그린다', '그림'],
  ['맞춘다', '맞춤'],
  ['쓴다', '씀'],
  ['맡는다', '담당'],
  ['넘는다', '넘음'],
  ['나눕니다', '나눔'],
  ['덮어씁니다', '덮어씀'],
  ['다릅니다', '다름'],
  ['돌아옵니다', '돌아옴'],
  ['이어집니다', '이어짐'],
  ['줄입니다', '줄임'],
  ['일치시킵니다', '일치시킴'],
  ['발생시킵니다', '발생시킴'],
  ['발생시킨다', '발생시킴'],
  ['수 있게 한다', '수 있게 함'],
  ['설치했다', '설치됨'],
  ['교체된다', '교체됨'],
  ['포함된다', '포함됨'],
  ['반영된다', '반영됨'],
  ['켠다', '켬'],
  ['}이다', '}'],
  ['비례합니다', '비례'],
  ['안정적이다', '안정적'],
  ['적용됩니다', '적용됨'],
  ['적용된다', '적용됨'],
  ['배치됩니다', '배치됨'],
  ['비활성화됩니다', '비활성화됨'],
  ['clip됩니다', 'clip됨'],
  ['gate다', 'gate'],
  ['표시다', '표시'],
  ['RangeError다', 'RangeError'],
  ['millisecond다', 'millisecond'],
].map(([from, to]) => [new RegExp(`${from}${sentenceEnd}`, 'g'), to]);

// 코드 블록·inline code·문자열 literal·직접 인용은 원문을 유지함.
const protectedText =
  /(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\1[\t ]*(?=\n|$)|(?![\s\S]))|(`+)(?!`)[\s\S]*?\2(?!`)|<(pre|code)\b[^>]*>[\s\S]*?<\/\3>|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n])*'|“[^”]*”|‘[^’]*’|^[\t ]*>[^\n]*|^(?: {4}|\t)[^\n]*/gim;

function rewriteProse(text) {
  if (!/[가-힣]/.test(text)) return text;
  let result = text
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
  for (const [pattern, replacement] of endings) result = result.replace(pattern, replacement);
  return result
    .replace(actionEnding, '$1')
    .replace(nounEnding, '$1')
    .replace(identifierEnding, '$1')
    .replace(
      new RegExp(`([가-힣A-Za-z0-9_)\\]])(?:을|를) (${actions.join('|')})${sentenceEnd}`, 'g'),
      '$1 $2',
    );
}

/** API 설명의 의미와 인용 원문을 보존하며 짧은 참조 문체로 변환함. */
export function toReferenceStyle(text) {
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
