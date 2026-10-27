import { Button } from '@mui/material';
import { createExportDataToExcelBuffer, exportExcelByBuffer } from '@owp/excel';
import { useFeedback } from '@owp/components/feedback';
import { useEffect, useRef, useState } from 'react';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const { notify } = useFeedback();
  const [exportPending, setExportPending] = useState(false);
  const exportPendingRef = useRef(false);
  const [downloadRequests, setDownloadRequests] = useState(0);
  const rows = exampleRows.map((row) => ({ name: t(row.name), status: t(row.status) }));
  const header = [
    { key: 'A1', value: t('항목명') },
    { key: 'B1', value: t('상태') },
  ];
  const columnMappers = [{ key: 'name' }, { key: 'status' }];

  useEffect(() => {
    onData({ rows: exampleRows, downloadRequests, exportName: 'core-items' });
  }, [downloadRequests, onData]);

  async function exportRows() {
    if (exportPendingRef.current) return;
    exportPendingRef.current = true;
    setExportPending(true);
    try {
      const { buffer, exportName } = await createExportDataToExcelBuffer({
        data: rows,
        exportName: 'core-items',
        header,
        columnMappers,
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
    <CoreDemo>
      <DemoSection>
        <div>
          <Button
            size="small"
            variant="outlined"
            loading={exportPending}
            onClick={() => {
              setDownloadRequests((count) => count + 1);
              onRecord('excel.download.request', 'core-items.xlsx');
              void exportRows();
            }}
          >
            {t('Excel 다운로드')}
          </Button>
        </div>
        <OwpTable
          size="small"
          aria-label={t('내보낼 항목')}
          headers={{ name: t('항목명'), status: t('상태') }}
          rows={rows}
        />
      </DemoSection>
    </CoreDemo>
  );
}
