import assert from 'node:assert/strict';
import { test } from 'vitest';
import { guides } from '../knowledge/guides.mjs';
import { guideSections } from '../knowledge/guide-sections.mjs';

test('가이드 탐색 구성이 모든 문단의 내용과 순서를 보존한다', () => {
  for (const guide of guides) {
    const sections = guideSections(guide);
    if (!sections) continue;
    assert.equal(sections.map((section) => section.body).join('\n\n'), guide.body);
    assert.equal(new Set(sections.map((section) => section.title)).size, sections.length);
  }
});

test('문단 구성이 바뀌면 이전 제목을 잘못 연결하지 않는다', () => {
  assert.throws(
    () =>
      guideSections({ id: '@owp/charts:guide.composition', body: '추가 검토가 필요한 새 문단.' }),
    RangeError,
  );
});

test('별도 탐색 구성이 없는 가이드는 본문 표시로 유지한다', () => {
  assert.equal(guideSections({ id: 'other', body: '기존 본문.' }), undefined);
});
