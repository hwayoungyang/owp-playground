import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { toReferenceStyle } from '../knowledge/korean-copy.mjs';
import { guides } from '../knowledge/guides.mjs';

const { records } = JSON.parse(
  await readFile(
    new URL('../src/features/api/data/knowledge.generated.json', import.meta.url),
    'utf8',
  ),
);
const koreanRecords = records.filter((record) => /[가-힣]/.test(record.description));
const identifiers = (text) => text.match(/[A-Za-z_$][\w$]*(?:[.-][A-Za-z_$][\w$]*)*/g) ?? [];
const numbers = (text) => text.match(/-?\d+(?:\.\d+)?/g) ?? [];
const proseEnding = /(?:니다|세요|한다|된다|는다|이다)(?=[.!?](?:\s|$)|$)/;

describe('한국어 API 참조 문체', () => {
  it.each([
    ['외부 오류를 제거합니다.', '외부 오류 제거.'],
    ['현재 row를 반환합니다.', '현재 row 반환.'],
    ['기본값을 사용한다. 설정을 유지한다.', '기본값 사용. 설정 유지.'],
    ['ID는 고유해야 합니다.', 'ID는 고유해야 함.'],
    ['서버 검증이 필요합니다. id는 필수입니다.', '서버 검증이 필요. id는 필수.'],
    ['같은 dataset에서 사용할 수 있습니다.', '같은 dataset에서 사용 가능.'],
    ['labels는 formatter로 바꿀 수 있습니다.', 'labels는 formatter로 변경 가능.'],
    ['결과를 읽을 수 있습니다.', '결과를 읽을 수 있음.'],
    ['모든 대비를 보장할 수 없습니다.', '모든 대비를 보장할 수 없음.'],
    ['빈 값은 자동 반영되지 않는다.', '빈 값은 자동 반영되지 않음.'],
    ['입력을 수정하지 않습니다.', '입력을 수정하지 않음.'],
    ['기본 입력은 id/value를 가져야 합니다.', '기본 입력에 id/value 필요.'],
    ['renderer 출력은 사각형 안에서 clip됩니다.', 'renderer 출력은 사각형 안에서 clip 처리.'],
    [
      '이 항목은 Chart.js의 원본 선언입니다. 실행 예제를 확인하세요.',
      '이 항목은 Chart.js의 원본 선언. 실행 예제 확인.',
    ],
  ])('설명 종결 변환: %s', (input, expected) => {
    expect(toReferenceStyle(input)).toBe(expected);
  });

  it('마침표 없는 설명과 식별자 종결을 통일하고 조건을 보존한다', () => {
    expect(toReferenceStyle('현재 active row를 반환')).toBe('현재 active row 반환.');
    expect(toReferenceStyle('우선순위는 loading → errorOverlay → noData다.')).toBe(
      '우선순위는 loading → errorOverlay → noData.',
    );
    expect(toReferenceStyle('단일 Grid에만 연결 가능')).toBe('단일 Grid에만 연결 가능.');
    expect(toReferenceStyle('ID는 고유해야 함')).toBe('ID는 고유해야 함.');
    expect(toReferenceStyle('값이 0이면 자동 갱신하지 않음')).toBe(
      '값이 0이면 자동 갱신하지 않음.',
    );
    expect(toReferenceStyle('조회 후 볼 수 있음.')).toBe('조회 후 확인 가능.');
  });

  it('가능·의무·금지·조건을 서로 바꾸지 않는다', () => {
    const input =
      '선택 시 사용할 수 있습니다. ID는 고유해야 합니다. 입력을 변경하지 않습니다. 자동 저장은 금지. 실패할 수도 있음.';
    expect(toReferenceStyle(input)).toBe(
      '선택 시 사용 가능. ID는 고유해야 함. 입력을 변경하지 않음. 자동 저장은 금지. 실패할 수도 있음.',
    );
  });

  it('알려진 명사 서술어만 줄여 일반 동사를 훼손하지 않는다', () => {
    expect(toReferenceStyle('계산된 통계입니다. 기본값은 0이다.')).toBe('계산된 통계. 기본값은 0.');
    expect(toReferenceStyle('화면에 보입니다. 값이 모입니다. 원본은 쓰이다.')).toBe(
      '화면에 보입니다. 값이 모입니다. 원본은 쓰이다.',
    );
  });

  it.each([
    '`현재 row를 반환합니다.`',
    '```ts\nconst message = "삭제합니다.";\n// row를 반환합니다.\n```',
    '````md\n```ts\nconst message = "반환합니다.";\n```\n````',
    '~~~ts\nconst message = "반환합니다.";\n~~~',
    '```ts\nconst message = "반환합니다.";',
    '``문자열에 `가 포함됩니다.``',
    '<code>현재 값을 반환합니다.</code>',
    '<PRE class="example">현재 값을 반환합니다.</PRE>',
    '"조회 결과가 없습니다."',
    "'변경할 수 있습니다.'",
    String.raw`"먼저 \"확인합니다.\"를 반환합니다."`,
    '“데이터를 불러오지 못했습니다.”',
    '‘원본을 변경하지 않습니다.’',
    '> 외부 인용은 그대로 반환합니다.',
    '    return "오류가 발생합니다.";',
  ])('코드·문자열·직접 인용 원문 보존: %s', (protectedText) => {
    const input = `현재 값을 반환합니다.\n${protectedText}\n기본 설정을 사용합니다.`;
    const expectedEnding =
      protectedText.startsWith('```ts\n') && !protectedText.endsWith('```')
        ? '기본 설정을 사용합니다.'
        : '기본 설정 사용.';
    expect(toReferenceStyle(input)).toBe(`현재 값 반환.\n${protectedText}\n${expectedEnding}`);
  });

  it('영어·URL·기술 식별자·수치와 인용된 기본값을 보존한다', () => {
    const input =
      'Use getRows(), https://example.com/v1.5 and datasetIdKey="id".\n0–100, 160ms, -90과 1.5 IQR을 사용합니다. 기본값: “조회 결과가 없습니다.”';
    const result = toReferenceStyle(input);
    expect(result).toBe(
      'Use getRows(), https://example.com/v1.5 and datasetIdKey="id".\n0–100, 160ms, -90과 1.5 IQR 사용. 기본값: “조회 결과가 없습니다.”',
    );
    expect(toReferenceStyle('It may return null. It must preserve input.')).toBe(
      'It may return null. It must preserve input.',
    );
  });

  it('현재 한국어 description 전체에 미처리 종결이 없고 식별자·수치가 유지된다', () => {
    expect(koreanRecords.length).toBeGreaterThanOrEqual(730);
    const remaining = [];
    for (const record of koreanRecords) {
      const result = toReferenceStyle(record.description);
      const prose = result.replace(/“[^”]*”/g, '');
      if (proseEnding.test(prose)) remaining.push({ id: record.id, prose });
      expect(identifiers(result), record.id).toEqual(identifiers(record.description));
      expect(numbers(result), record.id).toEqual(numbers(record.description));
      expect(toReferenceStyle(result), record.id).toBe(result);
    }
    expect(remaining).toEqual([]);
  });

  it('가이드 22개의 description·body 문체와 API·예제 참조를 유지한다', () => {
    expect(guides).toHaveLength(22);
    for (const guide of guides) {
      expect(proseEnding.test(guide.description), guide.id).toBe(false);
      expect(proseEnding.test(guide.body), guide.id).toBe(false);
      expect(toReferenceStyle(guide.description), guide.id).toBe(guide.description);
      expect(toReferenceStyle(guide.body), guide.id).toBe(guide.body);
      const generated = records.find((record) => record.id === guide.id);
      expect(generated.related, guide.id).toEqual(
        guide.api.map((id) => `@owp/${guide.packageId}:${id}`),
      );
      expect(
        generated.examples.map((example) => example.id),
        guide.id,
      ).toEqual(guide.examples);
      expect(identifiers(guide.body), guide.id).toEqual(identifiers(generated.body));
      expect(numbers(guide.body), guide.id).toEqual(numbers(generated.body));
    }
  });
});
