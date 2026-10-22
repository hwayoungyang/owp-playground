import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridCellParams } from '@owp/datagrid/types';
import { FileTextIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { z } from 'zod';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import { taskContextMenuConfiguration } from './configs/taskContextMenu';

import {
  Button,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  getContrastRatio,
  TextField,
} from '@mui/material';

export { taskContextMenuConfiguration as gridConfiguration } from './configs/taskContextMenu';

const rowEditSchema = z.object({ task: z.string().trim().min(1), owner: z.string().trim().min(1) });
function RowEditor({
  row,
  editable,
  gridApi,
  onAction,
  onClose,
}: {
  readonly row: Task;
  readonly editable: boolean;
  readonly gridApi: NonNullable<TaskGridProps['api']>;
  readonly onAction: NonNullable<TaskGridProps['callbacks']>['onAction'];
  readonly onClose: () => void;
}) {
  const { t } = useOwpTranslation();
  const [task, setTask] = useState(row.task);
  const [owner, setOwner] = useState(row.owner);
  const [error, setError] = useState('');
  const { notify, feedback } = useExampleFeedback({ disablePortal: true });
  const readMainGrid = () => {
    const rows = gridApi.getRows();
    const selectedRows = gridApi.getSelectedRows();
    notify(
      t('조회 결과: 전체 {{rows}}건 · 선택 {{selected}}건', {
        rows: rows.length,
        selected: selectedRows.length,
      }),
    );
    onAction?.('dialog.getRows', { rows, selectedRows });
  };
  const apply = () => {
    const parsed = rowEditSchema.safeParse({ task, owner });
    if (!parsed.success) {
      setError('작업명과 담당자는 필수 입력 항목입니다.');
      return;
    }
    const result = gridApi.applyTransaction([
      { type: 'setCellValue', rowId: row.id, columnId: 'task', value: parsed.data.task },
      { type: 'setCellValue', rowId: row.id, columnId: 'owner', value: parsed.data.owner },
    ]);
    if (result.success) onClose();
    else setError('셀 편집 중에는 이 작업을 실행할 수 없습니다.');
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t(editable ? '작업 수정' : '작업 상세')}</DialogTitle>
      <DialogContent className="grid-row-dialog">
        <span className="eyebrow">{row.project}</span>
        <TextField
          label={t('작업명')}
          value={task}
          onChange={(event) => setTask(event.target.value)}
          slotProps={{ input: { readOnly: !editable } }}
          fullWidth
          autoFocus
        />
        <TextField
          label={t('담당자')}
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          slotProps={{ input: { readOnly: !editable } }}
          fullWidth
        />
        <p>
          {t('계획 {{quantity}} · 완료 {{completed}} · 마감 {{date}}', {
            quantity: row.quantity,
            completed: row.completed,
            date: row.date,
          })}
        </p>
        <p>
          {t(
            '입력값은 다이얼로그를 연 시점의 행. 전달받은 API로 버튼을 누른 시점의 메인 Grid 조회 가능.',
          )}
        </p>
        <Button onClick={readMainGrid}>{t('메인 Grid 현재 값 조회')}</Button>
        {error && (
          <Alert severity="error" sx={{ fontSize: 14, lineHeight: 1.6 }}>
            {t(error)}
          </Alert>
        )}
        {feedback}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('닫기')}</Button>
        {editable && (
          <Button variant="contained" onClick={apply}>
            {t('변경 적용')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
export function ContextMenuGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [editor, setEditor] = useState<{
    readonly row: Task;
    readonly editable: boolean;
    readonly gridApi: NonNullable<TaskGridProps['api']>;
  } | null>(null);
  const columns = (gridProps.columns ?? taskContextMenuConfiguration.columns).map((column) => ({
    ...column,
    getContextMenuItems: ({ row, rowId }: OwpDataGridCellParams<Task>) => [
      {
        id: 'view',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FileTextIcon size={18} aria-hidden />
            {t('상세 보기')}
          </span>
        ),
        onClick: () => setEditor({ row, editable: false, gridApi }),
      },
      {
        id: 'edit',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PencilSimpleIcon size={18} aria-hidden />
            {t('작업 수정')}
          </span>
        ),
        onClick: () => setEditor({ row, editable: true, gridApi }),
      },
      {
        id: 'delete',
        label: (
          <span
            className="datagrid-delete-action"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrashIcon size={18} aria-hidden />
            {t('행 삭제')}
          </span>
        ),
        onClick: () => {
          const ids = gridApi.deleteRows([rowId]);
          onAction?.('deleteRows', ids);
        },
      },
    ],
  }));
  return (
    <>
      <GlobalStyles
        styles={(theme) => {
          const background = theme.palette.error.dark;
          const foreground =
            getContrastRatio(background, theme.palette.common.white) >= 4.5
              ? theme.palette.common.white
              : theme.palette.common.black;
          return {
            '.MuiMenuItem-root:has(.datagrid-delete-action)': {
              color: theme.palette.error.main,
              '&:hover, &:focus, &.Mui-focusVisible': {
                backgroundColor: background,
                color: foreground,
              },
            },
          };
        }}
      />
      <OwpDataGrid
        api={gridApi}
        rows={taskContextMenuConfiguration.rows}
        getRowId={taskContextMenuConfiguration.getRowId}
        rowSelectionMode={taskContextMenuConfiguration.rowSelectionMode}
        rowReordering={taskContextMenuConfiguration.rowReordering}
        rowDeletion={taskContextMenuConfiguration.rowDeletion}
        height={taskContextMenuConfiguration.height}
        {...gridProps}
        columns={columns}
      />
      {editor && (
        <RowEditor
          key={editor.row.id}
          row={editor.row}
          editable={editor.editable}
          gridApi={editor.gridApi}
          onAction={onAction}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
