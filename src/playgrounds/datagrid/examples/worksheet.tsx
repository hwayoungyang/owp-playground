import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Alert, useMediaQuery } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import {
  taskWorksheetConfiguration,
  isItem,
  worksheetCompactLayout,
  worksheetSummarySx,
} from './configs/taskWorksheet';

export { taskWorksheetConfiguration as gridConfiguration } from './configs/taskWorksheet';

export function CalculatedCellsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const compact = useMediaQuery('(max-width:599px)');
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [update, setUpdate] = useState({
    message: '',
    project: '',
    task: '',
  });
  const [error, setError] = useState(false);
  const handleCellValueCommit: NonNullable<TaskGridProps['onCellValueCommit']> = (params) => {
    const grid = gridApi;
    if (!['completed', 'cost', 'rate'].includes(params.column.id)) {
      gridProps.onCellValueCommit?.(params);
      return;
    }
    const allRows = grid.getRows();
    const upperTask4 = allRows.find((row) => row.id === 'task-4');
    const upperChanged = params.rowId === 'task-4' && params.column.id === 'completed';
    for (const project of ['웹 서비스', '모바일 앱']) {
      const group = allRows.filter((row) => row.project === project);
      const control = group.find((row) => row.worksheetKind === 'rate');
      const source = group.find((row) => ['task-3', 'task-7'].includes(row.id));
      if (!control || !source) continue;
      const sameProject = params.row.project === project;
      const rateChanged =
        sameProject && params.row.worksheetKind === 'rate' && params.column.id === 'rate';
      const sourceChanged =
        sameProject && params.rowId === source.id && params.column.id === 'completed';
      if (!rateChanged && !sourceChanged && !(upperChanged && project === '모바일 앱')) continue;
      const baseRate = control.rate ?? 0;
      const upstream = project === '모바일 앱' ? (upperTask4?.completed ?? 40) : 40;
      const adjustment = (source.completed - 60 + upstream - 40) * 0.1;
      const linkedRate = Math.round(Math.max(0, Math.min(100, baseRate - adjustment)) * 100) / 100;
      for (const target of group.filter(isItem)) {
        const linked = ['task-4', 'task-8'].includes(target.id);
        if (!rateChanged && !linked) continue;
        const rate = linked ? linkedRate : baseRate;
        if (target.rate !== rate && !grid.setCellValue(target.id, 'rate', rate)) {
          setError(true);
          gridProps.onCellValueCommit?.(params);
          return;
        }
      }
    }
    setError(false);
    setUpdate({
      project: params.row.project,
      task: params.row.task,
      message:
        params.row.worksheetKind === 'rate'
          ? '{{project}}의 기본 적용률을 변경해 프로젝트 전체의 적용 금액을 다시 계산했습니다.'
          : ['task-3', 'task-7'].includes(String(params.rowId)) && params.column.id === 'completed'
            ? '{{project}} 작업 3의 완료 수량을 변경해 작업 4의 적용률과 적용 금액을 갱신했습니다.'
            : upperChanged
              ? '웹 서비스 작업 4의 완료 수량을 변경해 모바일 앱 작업 4의 적용률과 적용 금액을 갱신했습니다.'
              : '{{project}}의 {{task}} 값을 변경해 계산 결과와 프로젝트 합계를 갱신했습니다.',
    });
    onAction?.('worksheet.link', { rowId: params.rowId, columnId: params.column.id });
    gridProps.onCellValueCommit?.(params);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-guidance">
        <div className="worksheet-legend">
          {(['입력', '계산', '연동', '합계'] as const).map((label, index) => (
            <span key={label} className="worksheet-legend-item">
              <span
                className="worksheet-legend-swatch"
                style={{
                  backgroundColor: [
                    'var(--pg-warning-wash)',
                    'var(--pg-blue-wash)',
                    'var(--pg-purple-wash)',
                    'var(--pg-success-wash)',
                  ][index],
                }}
                aria-hidden="true"
              />
              {t(label)}
            </span>
          ))}
        </div>
        <p>
          <span>{t('기본 적용률 → 프로젝트 전체')}</span>
          {' · '}
          <span>{t('작업 3 → 작업 4 → 다음 프로젝트')}</span>
        </p>
      </div>
      {(error || update.message) && (
        <Alert
          severity={error ? 'error' : 'info'}
          role={error ? 'alert' : 'status'}
          variant="outlined"
          sx={{ mx: 2, mb: 2, fontSize: 14, lineHeight: 1.6 }}
        >
          {error
            ? t('연동 값을 반영하지 못했습니다. 예제를 초기화한 뒤 다시 입력해 주세요.')
            : t(update.message, {
                project: t(update.project),
                task: t(update.task),
              })}
        </Alert>
      )}
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskWorksheetConfiguration.rows}
          columns={taskWorksheetConfiguration.columns}
          getRowId={taskWorksheetConfiguration.getRowId}
          rowSelectionMode="none"
          height="100%"
          getCellRowSpanKey={taskWorksheetConfiguration.getCellRowSpanKey}
          summaryRows={taskWorksheetConfiguration.summaryRows}
          {...gridProps}
          sx={worksheetSummarySx}
          headerRows={
            compact ? undefined : (gridProps.headerRows ?? taskWorksheetConfiguration.headerRows)
          }
          layout={
            compact
              ? {
                  ...gridProps.layout,
                  columnRegions: worksheetCompactLayout.columnRegions,
                }
              : (gridProps.layout ?? taskWorksheetConfiguration.layout)
          }
          onCellValueCommit={handleCellValueCommit}
        />
      </div>
    </div>
  );
}
