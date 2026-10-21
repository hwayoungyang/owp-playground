import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid, OwpDataGridExportExcelButton } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { z } from 'zod';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskExcelConfiguration } from './configs/taskExcel';

export { taskExcelConfiguration as gridConfiguration } from './configs/taskExcel';

const scopeSchema = z.enum(['visible', 'all', 'selected']);
export function ExcelExportGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const [scope, setScope] = useState<z.infer<typeof scopeSchema>>('visible');
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskExcelConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Select
            value={scope}
            onChange={(event) => {
              const parsed = scopeSchema.safeParse(event.target.value);
              if (parsed.success) setScope(parsed.data);
            }}
            inputProps={{ 'aria-label': t('Excel 내보내기 범위') }}
          >
            <MenuItem value="visible">{t('현재 표시된 행')}</MenuItem>
            <MenuItem value="all">{t('전체 행')}</MenuItem>
            <MenuItem value="selected">{t('선택 행')}</MenuItem>
          </Select>
        </div>
      </PreviewActions>
      <PreviewActions position="end">
        <div className="example-controls">
          <OwpDataGridExportExcelButton
            api={gridApi}
            scope={scope}
            exportName="OWP_excel"
            saveMode="download"
            variant="outlined"
            startIcon={<DownloadSimpleIcon size={15} />}
          >
            Excel
          </OwpDataGridExportExcelButton>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskExcelConfiguration.rows}
          columns={taskExcelConfiguration.columns}
          getRowId={taskExcelConfiguration.getRowId}
          rowSelectionMode={taskExcelConfiguration.rowSelectionMode}
          headerRows={taskExcelConfiguration.headerRows}
          summaryRows={taskExcelConfiguration.summaryRows}
          {...gridProps}
          height="100%"
        />
      </div>
    </div>
  );
}
