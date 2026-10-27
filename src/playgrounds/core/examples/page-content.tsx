import { Button } from '@mui/material';
import { createExportDataToExcelBuffer, exportExcelByBuffer } from '@owp/excel';
import { useFeedback } from '@owp/components/feedback';
import { useEffect, useRef, useState } from 'react';
import { OwpPageContent, OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreToggle } from '../runtime/Controls';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const { notify } = useFeedback();
  const [exportPending, setExportPending] = useState(false);
  const exportPendingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(true);
  const rows = exampleRows.map((row) => ({ name: t(row.name), status: t(row.status) }));

  useEffect(() => {
    onData({ loading, responsiveLayout: responsive, rows: exampleRows });
  }, [loading, responsive, onData]);

  async function exportRows() {
    if (exportPendingRef.current) return;
    exportPendingRef.current = true;
    setExportPending(true);
    try {
      const { buffer, exportName } = await createExportDataToExcelBuffer({
        data: rows,
        exportName: 'core-items',
        header: [
          { key: 'A1', value: t('항목명') },
          { key: 'B1', value: t('상태') },
        ],
        columnMappers: [{ key: 'name' }, { key: 'status' }],
      });
      exportExcelByBuffer(buffer, exportName);
    } catch (error) {
      notify(t('Message.엑셀 저장 중 오류가 발생했습니다.'), { variant: 'error' });
      onRecord('excel.download.error', error instanceof Error ? error.message : String(error));
    } finally {
      exportPendingRef.current = false;
      setExportPending(false);
    }
  }

  return (
    <CoreDemo
      controls={
        <>
          <CoreToggle label="헤더 로딩" value={loading} onChange={setLoading} />
          <CoreToggle label="반응형 레이아웃" value={responsive} onChange={setResponsive} />
        </>
      }
    >
      <DemoSection>
        <OwpPageContent
          title={t('항목 목록')}
          loading={loading}
          responsiveLayout={responsive}

          actions={
            <Button
              size="small"
              variant="outlined"
              disabled={loading}
              loading={exportPending}
              onClick={() => {
                onRecord('excel.download.request', 'core-items.xlsx');
                void exportRows();
              }}
            >
              {t('Excel 다운로드')}
            </Button>
          }
        >
          <OwpTable
            aria-label={t('항목 목록')}
            variant="mui"
            size="small"
            headers={{ name: t('항목명'), status: t('상태') }}
            rows={rows}
          />
        </OwpPageContent>
      </DemoSection>
    </CoreDemo>
  );
}
