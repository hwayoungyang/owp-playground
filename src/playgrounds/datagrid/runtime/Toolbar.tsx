import { Button, MenuItem, Select } from '@mui/material';
import { OwpDataGridExportExcelButton } from '@owp/datagrid';
import {
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { GridSample } from '../catalog';
import type { Demo } from './useDemo';

const counts = [10000, 50000, 100000, 300000, 500000, 1000000] as const;
const countSchema = z.coerce.number().refine((value) => counts.some((count) => count === value));

export function Toolbar({
  sample,
  demo,
  onSettings,
  onReset,
}: {
  readonly sample: GridSample;
  readonly demo: Demo;
  readonly onSettings: () => void;
  readonly onReset: () => void;
}) {
  const { t } = useTranslation('app');
  const [count, setCount] = useState(10000);
  const generating = demo.busy || demo.pendingBinding !== null;
  const countChanged = count !== (demo.bindingTime?.count ?? demo.rows.length);

  return (
    <div className="preview-toolbar">
      {generating && (
        <span className="busy-label" role="status">
          {t('처리 중')}
        </span>
      )}
      {sample.id === 'large-data' && demo.bindingTime && (
        <output className="binding-time" aria-live="polite">
          <span>{t('그리드 반영 시간 {{ms}} ms', { ms: demo.bindingTime.milliseconds })}</span>
          <span>{t('측정 시간은 테스트 환경에 따라 달라질 수 있습니다.')}</span>
        </output>
      )}
      <div className="preview-actions">
        {sample.id === 'large-data' && (
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
              onClick={() => void demo.generate(count)}
            >
              {t('데이터 생성')}
            </Button>
            {generating && (
              <Button variant="outlined" onClick={demo.cancel}>
                {t('취소')}
              </Button>
            )}
          </>
        )}
        {sample.id === 'empty' && (
          <Button
            variant="outlined"
            aria-pressed={demo.loading}
            onClick={() => {
              demo.setLoading(!demo.loading);
              demo.record('loading', !demo.loading);
            }}
          >
            {t(demo.loading ? '로딩 종료' : '로딩 시작')}
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={() => {
            onReset();

            setCount(10000);
          }}
          startIcon={<ArrowsClockwiseIcon size={15} />}
        >
          {t('초기화')}
        </Button>
        {sample.id !== 'excel' && (
          <OwpDataGridExportExcelButton
            dataGridRef={demo.gridRef}
            scope="visible"
            exportName={`OWP_${sample.id}`}
            saveMode="download"
            disabled={demo.busy || demo.loading || demo.error}
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
      </div>
    </div>
  );
}
