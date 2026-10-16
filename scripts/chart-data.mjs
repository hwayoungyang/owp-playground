import { apiDataCode, readApiPage } from './read-api-data.mjs';
export const chartDataText = (page) => apiDataCode(page).textContent();
export async function readChartData(page) {
  const { rows, text } = await readApiPage(page);
  const names = new Map();
  for (const match of text.matchAll(/"OWP_DATA\.DATA(\d+)":.*?\/\/ (?:값: |Value: )(.+?)\.(?: 숫자 문자열| A numeric string)/g)) {
    names.set(Number(match[1]), match[2]);
  }
  return {
    labels: rows.map(row => row['OWP_DATA.DATA1']),
    series: [...names].sort(([left], [right]) => left - right).map(([index, label]) => ({
      label,
      values: rows.map(row => row[`OWP_DATA.DATA${index}`] === null ? null : Number(row[`OWP_DATA.DATA${index}`])),
    })),
  };
}
