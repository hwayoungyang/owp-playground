import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridCellParams, OwpDataGridRef } from '@owp/datagrid/types';
import { FileTextIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { type RefObject, useRef, useState } from 'react';
import { z } from 'zod';
import { translate } from '../../../shared/i18n/translate';
import type { Task, TaskGridProps } from '../types';
import { taskContextMenuConfiguration } from './configs/taskContextMenu';

import {
  Button,
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
  gridRef,
  onClose,
}: {
  readonly row: Task;
  readonly editable: boolean;
  readonly gridRef: RefObject<OwpDataGridRef<Task> | null>;
  readonly onClose: () => void;
}) {
  const [task, setTask] = useState(row.task);
  const [owner, setOwner] = useState(row.owner);
  const [error, setError] = useState('');
  const apply = () => {
    const parsed = rowEditSchema.safeParse({ task, owner });
    if (!parsed.success) {
      setError('작업명과 담당자는 필수 입력 항목입니다.');
      return;
    }
    const result = gridRef.current?.applyTransaction([
      { type: 'setCellValue', rowId: row.id, columnId: 'task', value: parsed.data.task },
      { type: 'setCellValue', rowId: row.id, columnId: 'owner', value: parsed.data.owner },
    ]);
    if (result?.success) onClose();
    else setError('셀 편집 중에는 이 작업을 실행할 수 없습니다.');
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{translate(editable ? '작업 수정' : '작업 상세')}</DialogTitle>
      <DialogContent className="grid-row-dialog">
        <span className="eyebrow">{row.project}</span>
        <TextField
          label={translate('작업명')}
          value={task}
          onChange={(event) => setTask(event.target.value)}
          slotProps={{ input: { readOnly: !editable } }}
          fullWidth
          autoFocus
        />
        <TextField
          label={translate('담당자')}
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          slotProps={{ input: { readOnly: !editable } }}
          fullWidth
        />
        <p>
          {translate('계획 {{quantity}} · 완료 {{completed}} · 마감 {{date}}', {
            quantity: row.quantity,
            completed: row.completed,
            date: row.date,
          })}
        </p>
        {error && (
          <p role="alert" className="grid-error-text">
            {translate(error)}
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{translate('닫기')}</Button>
        {editable && (
          <Button variant="contained" onClick={apply}>
            {translate('변경 적용')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
export function ContextMenuGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [editor, setEditor] = useState<{ readonly row: Task; readonly editable: boolean } | null>(
    null,
  );
  const columns = (gridProps.columns ?? taskContextMenuConfiguration.columns).map((column) => ({
    ...column,
    getContextMenuItems: ({ row, rowId }: OwpDataGridCellParams<Task>) => [
      {
        id: 'view',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FileTextIcon size={18} aria-hidden />
            {translate('상세 보기')}
          </span>
        ),
        onClick: () => setEditor({ row, editable: false }),
      },
      {
        id: 'edit',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PencilSimpleIcon size={18} aria-hidden />
            {translate('작업 수정')}
          </span>
        ),
        onClick: () => setEditor({ row, editable: true }),
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
            {translate('행 삭제')}
          </span>
        ),
        onClick: () => {
          const ids = gridRef.current?.deleteRows([rowId]);
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
        ref={gridRef}
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
          gridRef={gridRef}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
