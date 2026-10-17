import { initialTasks, type Task } from './data';

export const worksheetRows: readonly Task[] = [0, 1].flatMap((group) => {
  const items = initialTasks.slice(group * 4, group * 4 + 4).map((row, index): Task => ({
    ...row,
    task: `작업 ${index + 1}`,
    worksheetKind: 'item',
    quantity: 100,
    reserved: 10,
    completed: index === 2 ? 60 : index === 3 ? 40 : row.completed,
    rate: 90 + group * 5,
  }));
  const first = items[0];
  if (!first) return [];
  return [
    {
      ...first,
      id: `rate-${group}`,
      task: '기본 적용률',
      worksheetKind: 'rate' as const,
      quantity: 0,
      reserved: 0,
      completed: 0,
      cost: 0,
    },
    ...items,
  ];
});
