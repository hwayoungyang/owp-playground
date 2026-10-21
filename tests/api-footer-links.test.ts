import { expect, it } from 'vitest';
import { recordsById } from '../src/features/api/model/knowledge';
import { exampleApiLinks } from '../src/features/api/model/links';

it('접근성 prop은 API에서 유지하고 예제 하단에서만 생략한다', () => {
  expect(recordsById.has('@owp/datagrid:OwpDataGridProps.aria-label')).toBe(true);
  const links = exampleApiLinks('datagrid', 'overview');
  expect(links.some((link) => link.id === '@owp/datagrid:OwpDataGridProps.rows')).toBe(true);
  expect(links.some((link) => link.id.endsWith('.aria-label'))).toBe(false);
});
