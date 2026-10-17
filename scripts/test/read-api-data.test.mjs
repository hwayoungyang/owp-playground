import assert from 'node:assert/strict';
import test from 'node:test';
import { readApiPage } from '../read-api-data.mjs';

const pageWithData = (text) => ({
  locator: () => ({ waitFor: async () => {}, textContent: async () => text }),
});

test('reads JSONC comments and trailing commas without changing wire values', async () => {
  // Given
  const text = '[/* header */ {"OWP_DATA.DATA1":"https://example.test/a//b", "OWP_DATA.DATA19":[{"OWP_DATA.DATA1":"child"}],}, // row\n]';
  // When
  const result = await readApiPage(pageWithData(text));
  // Then
  assert.deepEqual(result.rows, [{ 'OWP_DATA.DATA1': 'https://example.test/a//b', 'OWP_DATA.DATA19': [{ 'OWP_DATA.DATA1': 'child' }] }]);
  assert.equal(result.text, text);
});

test('preserves escaped quotes, line breaks and null wire values', async () => {
  // Given
  const rows = [{ 'OWP_DATA.DATA1': 'line\n"quoted" // value', 'OWP_DATA.DATA2': null }];
  // When
  const result = await readApiPage(pageWithData(JSON.stringify(rows)));
  // Then
  assert.deepEqual(result.rows, rows);
});

for (const [name, text] of [
  ['malformed JSONC', '[{"OWP_DATA.DATA1":}]'],
  ['unterminated comments', '[{"OWP_DATA.DATA1":"row"}] /* unfinished'],
  ['non-array data', '{"OWP_DATA.DATA1":"row"}'],
  ['invalid wire keys', '[{"id":"row"}]'],
  ['invalid wire values', '[{"OWP_DATA.DATA1":42}]'],
]) {
  test(`rejects ${name}`, async () => {
    // Given
    const page = pageWithData(text);
    // When / Then
    await assert.rejects(readApiPage(page), assert.AssertionError);
  });
}
