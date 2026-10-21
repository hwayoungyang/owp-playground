import type { ApiDataSource, ApiRow, ApiValue } from '../../../features/code/api-data';
import type { useOwpTranslation } from '@owp/components/hooks';
import type { Task } from './data';

export const taskApiFields = [
  ['id', '고유 행 ID (id)'],
  ['project', '프로젝트 (project)'],
  ['task', '작업명 (task)'],
  ['owner', '담당자 (owner)'],
  ['status', '상태 (status)'],
  ['quantity', '계획 수량 (quantity)', '숫자 문자열은 Number로 변환'],
  ['completed', '완료 수량 (completed)', '숫자 문자열은 Number로 변환'],
  ['cost', '비용 (cost)', '숫자 문자열은 Number로 변환'],
  ['date', '날짜 (date): YYYY-MM-DD'],
  ['year', '연도 (year): YYYY'],
  ['month', '월 (month): YYYY-MM'],
  ['time', '시간 (time): HH:mm'],
  ['datetime', '일시 (datetime): YYYY-MM-DD HH:mm'],
  ['active', '활성 여부 (active): "1"=true, "0"=false'],
  ['tags', '태그 (tags): 쉼표로 구분'],
  ['note', '비고 (note): 빈 문자열 허용'],
  ['parentId', '부모 참조 (parentId): 부모 행의 DATA1, 루트는 null'],
  ['mixed', '숫자·문자 혼합 (mixed)', '숫자 문자열은 Number로 변환'],
  ['children', '자식 행 (children): 같은 DATA 구조, nested 모드의 getChildren에 연결'],
  ['worksheetKind', '워크시트 행 유형 (worksheetKind): item 또는 rate'],
  ['reserved', '예약 수량 (reserved)', '숫자 문자열은 Number로 변환'],
  ['rate', '비율 (rate)', '숫자 문자열은 Number로 변환'],
] as const;

export function taskToApi(task: Task, currentRows?: ReadonlyMap<string, Task>): ApiRow {
  return Object.fromEntries(
    taskApiFields.flatMap(([field], index) => {
      const value = task[field];
      if (value === undefined) return [];
      const encoded: ApiValue =
        field === 'children'
          ? (task.children ?? []).map((child) =>
              taskToApi(currentRows?.get(child.id) ?? child, currentRows),
            )
          : typeof value === 'boolean'
            ? value
              ? '1'
              : '0'
            : value === null
              ? null
              : String(value);
      return [[`OWP_DATA.DATA${index + 1}`, encoded]];
    }),
  );
}

export function taskFromApi(row: ApiRow): Task {
  const text = (index: number) => {
    const value = row[`OWP_DATA.DATA${index}`];
    if (typeof value !== 'string') throw new TypeError(`Expected OWP_DATA.DATA${index} string`);
    return value;
  };
  const number = (index: number) => {
    const value = text(index);
    if (value.trim() === '' || !Number.isFinite(Number(value)))
      throw new TypeError(`Invalid OWP_DATA.DATA${index} number`);
    return Number(value);
  };
  const active = text(14);
  if (active !== '0' && active !== '1')
    throw new TypeError('Expected OWP_DATA.DATA14 to be 0 or 1');
  const parent = row['OWP_DATA.DATA17'];
  if (parent !== null && typeof parent !== 'string')
    throw new TypeError('Invalid parent reference');
  const children = row['OWP_DATA.DATA19'];
  if (children !== undefined && !Array.isArray(children))
    throw new TypeError('Expected children array');
  const kind = row['OWP_DATA.DATA20'];
  if (kind !== undefined && kind !== 'item' && kind !== 'rate')
    throw new TypeError('Invalid worksheet kind');
  const mixed = text(18);
  return {
    id: text(1),
    project: text(2),
    task: text(3),
    owner: text(4),
    status: text(5),
    quantity: number(6),
    completed: number(7),
    cost: number(8),
    date: text(9),
    year: text(10),
    month: text(11),
    time: text(12),
    datetime: text(13),
    active: active === '1',
    tags: text(15),
    note: text(16),
    parentId: parent,
    mixed: mixed.trim() !== '' && Number.isFinite(Number(mixed)) ? Number(mixed) : mixed,
    ...(Array.isArray(children) ? { children: children.map(taskFromApi) } : {}),
    ...(kind === 'item' || kind === 'rate' ? { worksheetKind: kind } : {}),
    ...(row['OWP_DATA.DATA21'] !== undefined ? { reserved: number(21) } : {}),
    ...(row['OWP_DATA.DATA22'] !== undefined ? { rate: number(22) } : {}),
  };
}

export function gridApiDocument(
  rows: readonly Task[],
  t: ReturnType<typeof useOwpTranslation>['t'],
): ApiDataSource {
  // getRows()가 nested 행을 펼친 배열로 반환해도 API에는 각 자식을 한 번만 포함합니다.
  const nested = rows.some((row) => row.children !== undefined);
  const currentRows = nested ? new Map(rows.map((row) => [row.id, row])) : undefined;
  const childIds = new Set<string>();
  const collectChildren = (row: Task) => {
    for (const child of row.children ?? []) {
      if (childIds.has(child.id)) continue;
      childIds.add(child.id);
      collectChildren(child);
    }
  };
  if (nested) rows.forEach(collectChildren);
  const roots = nested ? rows.filter((row) => !childIds.has(row.id)) : rows;
  return {
    totalRows: roots.length,
    getRows: (start, end) => roots.slice(start, end).map((row) => taskToApi(row, currentRows)),
    fields: taskApiFields.map(([, description, note], index) => ({
      key: `OWP_DATA.DATA${index + 1}`,
      description: t(description),
      notes: note ? [t(note)] : [],
    })),
  };
}
