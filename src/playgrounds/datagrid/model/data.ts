import type { ApiRow } from '../../../features/code/api-data';
import { taskFromApi } from './apiData';
import type { Task } from '../types';

export type { Task } from '../types';

const projects = ['웹 서비스', '모바일 앱', '업무 시스템'] as const;
const tasks = ['요구사항 분석', '화면 설계', '컴포넌트 개발', '검증 및 배포'] as const;
export const owners = ['김서윤', '박민재', '이지우', '정윤호'] as const;
export const statuses = ['진행 중', '완료', '검토 중', '대기'] as const;

export function createTaskApi(index: number): ApiRow {
  const quantity = 40 + (index % 5) * 12;
  const completed = index % 4 === 1 ? quantity : 8 + ((index * 7) % 32);
  const date = `2026-10-${String(14 + (index % 14)).padStart(2, '0')}`;
  return {
    'OWP_DATA.DATA1': `task-${index + 1}`, // 행 식별자 (id)
    'OWP_DATA.DATA2': projects[Math.floor(index / 4) % 3] ?? projects[0],
    'OWP_DATA.DATA3': tasks[index % 4] ?? tasks[0],
    'OWP_DATA.DATA4': owners[index % 4] ?? owners[0],
    'OWP_DATA.DATA5': statuses[index % 4] ?? statuses[0],
    'OWP_DATA.DATA6': String(quantity),
    'OWP_DATA.DATA7': String(completed),
    'OWP_DATA.DATA8': String(12000 + (index % 4) * 3000),
    'OWP_DATA.DATA9': date,
    'OWP_DATA.DATA10': String(2024 + (index % 4)),
    'OWP_DATA.DATA11': `2026-${String((index % 12) + 1).padStart(2, '0')}`,
    'OWP_DATA.DATA12': '09:30',
    'OWP_DATA.DATA13': `${date} 09:30`,
    'OWP_DATA.DATA14': index % 5 !== 0 ? '1' : '0',
    'OWP_DATA.DATA15': index % 2 === 0 ? 'design,web' : 'web',
    'OWP_DATA.DATA16': index % 3 === 0 ? '주간 검토 후 다음 단계로 진행' : '',
    'OWP_DATA.DATA17': null, // 부모 행의 DATA1을 참조합니다. 일반 행은 부모가 없습니다.
    'OWP_DATA.DATA18': index % 2 === 0 ? String(quantity) : '검토 필요',
  };
}

/** 가상 API response를 숫자·boolean·트리 속성이 있는 화면 모델로 변환합니다. */
export function createTask(index: number): Task {
  return taskFromApi(createTaskApi(index));
}

export function createTasks(count = 12): Task[] {
  return Array.from({ length: count }, (_, index) => createTask(index));
}

export const initialTasks = createTasks();
export const seedTask = createTask(0);
export const getRowId = (row: Task) => row.id;

export function createTree(): Task[] {
  return projects.flatMap((project, index) => {
    const groupId = `project-${index}`;
    const base = initialTasks[index * 4];
    if (!base) return [];
    return [
      { ...base, id: groupId, project, task: project, status: '프로젝트', parentId: null },
      ...initialTasks.slice(index * 4, index * 4 + 4).map((row) => ({ ...row, parentId: groupId })),
    ];
  });
}

export function createNestedTree(): Task[] {
  return projects.flatMap((project, index) => {
    const base = initialTasks[index * 4];
    if (!base) return [];
    const phases = ['설계', '개발'].map((phase, phaseIndex) => ({
      ...base,
      id: `phase-${index}-${phaseIndex}`,
      project: phase,
      task: `${phase} 단계`,
      children: ['화면', '기능'].map((work, workIndex) => ({
        ...base,
        id: `work-${index}-${phaseIndex}-${workIndex}`,
        project: `${work} ${phase}`,
        task: `${work} 작업`,
        children: ['초안 작성', '검토 반영'].map((task, taskIndex) => ({
          ...createTask(index * 4 + phaseIndex * 2 + workIndex),
          id: `step-${index}-${phaseIndex}-${workIndex}-${taskIndex}`,
          project: task,
          task,
        })),
      })),
    }));
    return [
      {
        ...base,
        id: `project-${index}`,
        project,
        task: project,
        children: phases,
      },
    ];
  });
}

export async function generateTasks(count: number, signal: AbortSignal): Promise<Task[] | null> {
  const rows: Task[] = [];
  for (let offset = 0; offset < count; offset += 5000) {
    if (signal.aborted) return null;
    rows.push(
      ...createTasks(Math.min(5000, count - offset)).map((row, index) => ({
        ...row,
        id: `task-${offset + index + 1}`,
      })),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return signal.aborted ? null : rows;
}
