import { useOwpTranslation } from '@owp/components/hooks';
import { Button, MenuItem, Select } from '@mui/material';
import { OwpDataGridExportExcelButton } from '@owp/datagrid';
import { DownloadSimpleIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { z } from 'zod';
import { DataStateButtons } from '../../../shared/ui/DataStateButtons';
import { PreviewToolbar } from '../../../shared/ui/PreviewToolbar';
import type { GridExample } from '../catalog';
import type { GridController } from './useGridController';

const counts = [10000, 50000, 100000, 300000, 500000, 1000000] as const;
const countSchema = z.coerce.number().refine((value) => counts.some((count) => count === value));

export function GridToolbar({
  example,
  controller,
  onSettings,
  onReset,
}: {
  readonly example: GridExample;
  readonly controller: GridController;
  readonly onSettings: () => void;
  readonly onReset: () => void;
}) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(10000);
  const generating = controller.busy || controller.pendingBinding !== null;
  const countChanged = count !== (controller.bindingTime?.count ?? controller.rows.length);

  return (
    <PreviewToolbar
      onReset={() => {
        onReset();
        setCount(10000);
      }}
      status={
        (generating || (example.id === 'large-data' && controller.bindingTime)) && (
          <>
            {generating && (
              <span className="grid-busy-label" role="status">
                {t('처리 중')}
              </span>
            )}
            {example.id === 'large-data' && controller.bindingTime && (
              <output className="grid-binding-time" aria-live="polite">
                <span>
                  {t('데이터 반영 시간: {{ms}} ms', {
                    ms: controller.bindingTime.milliseconds,
                  })}
                </span>
                <span>{t('측정 시간은 테스트 환경에 따라 달라질 수 있습니다.')}</span>
              </output>
            )}
          </>
        )
      }
      startActions={
        <>
          {example.id === 'states' && (
            <DataStateButtons state={controller.state} onChange={controller.changeState} />
          )}
          {example.id === 'large-data' && (
            <>
              <Select
                value={count}
                disabled={generating}
                onChange={(event) => {
                  const parsed = countSchema.safeParse(event.target.value);
                  if (parsed.success) setCount(parsed.data);
                }}
                inputProps={{ 'aria-label': t('생성할 데이터 건수') }}
              >
                {counts.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.toLocaleString()}
                    {t('행')}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant={countChanged ? 'contained' : 'outlined'}
                disabled={generating}
                onClick={() => void controller.generate(count)}
              >
                {t('데이터 생성')}
              </Button>
              {generating && (
                <Button variant="outlined" onClick={controller.cancel}>
                  {t('취소')}
                </Button>
              )}
            </>
          )}
        </>
      }
    >
      {example.id !== 'excel' && (
        <OwpDataGridExportExcelButton
          dataGridRef={controller.gridRef}
          scope="visible"
          exportName={`OWP_${example.id}`}
          saveMode="download"
          disabled={controller.busy || controller.loading || controller.error}
          startIcon={<DownloadSimpleIcon size={15} />}
          variant="outlined"
        >
          Excel
        </OwpDataGridExportExcelButton>
      )}
      <Button
        variant="outlined"
        onClick={onSettings}
        aria-label={t('설정 열기')}
        startIcon={<SlidersHorizontalIcon size={15} />}
      >
        {t('설정')}
      </Button>
    </PreviewToolbar>
  );
}
