import assert from 'node:assert/strict';
import ts from 'typescript';

export const apiDataCode = (page) => page.locator('[role="tabpanel"]:not([hidden]) pre code');
export async function readApiPage(page) {
  await apiDataCode(page).waitFor();
  const text = await apiDataCode(page).textContent();
  const parsed = ts.parseConfigFileTextToJson('data.jsonc', '{"rows":' + text + '}');
  assert.equal(parsed.error, undefined, 'Data must be valid JSON or JSONC');
  assert.ok(Array.isArray(parsed.config.rows), 'OWP API data must be a row array');
  for (const row of parsed.config.rows) for (const [key, value] of Object.entries(row)) {
    assert.match(key, /^OWP_DATA\.DATA[1-9]\d*$/);
    assert.ok(value === null || typeof value === 'string' || Array.isArray(value), key);
  }
  return { rows: parsed.config.rows, text };
}

const taskFields = ['id', 'project', 'task', 'owner', 'status', 'quantity', 'completed', 'cost', 'date', 'year', 'month', 'time', 'datetime', 'active', 'tags', 'note', 'parentId', 'mixed', 'children', 'worksheetKind', 'reserved', 'rate'];
const decodeTask = (row) => Object.fromEntries(taskFields.flatMap((field, index) => {
  const value = row[`OWP_DATA.DATA${index + 1}`];
  if (value === undefined) return [];
  const decoded = ['quantity', 'completed', 'cost', 'reserved', 'rate'].includes(field) ? Number(value)
    : field === 'active' ? value === '1' : field === 'children' ? value.map(decodeTask)
    : field === 'mixed' && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : value;
  return [[field, decoded]];
}));

// 기존 편집·Ref 검증은 wire 필드에서 화면 모델로 복원한 뒤 같은 동작을 검증합니다.
export async function readGridData(page) {
  const { rows } = await readApiPage(page);
  const range = await page.locator('.api-data-pagination > span').textContent();
  const numbers = range.match(/\d+/g).map(Number);
  const totalRows = range.includes('Records') ? numbers.at(-1) : numbers[0];
  return { totalRows, displayedRows: rows.length, rows: rows.map(decodeTask) };
}
