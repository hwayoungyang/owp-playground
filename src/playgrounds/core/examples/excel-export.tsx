import { useEffect, useState } from 'react';
import { OwpExportDataToExcelButton, OwpTable } from '@owp/core';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [downloadRequests, setDownloadRequests] = useState(0);
  const rows = exampleRows.map((row) => ({ name: t(row.name), status: t(row.status) }));
  const header = [
    { key: 'A1', value: t('이름') },
    { key: 'B1', value: t('상태') },
  ];
  const columnMappers = [{ key: 'name' }, { key: 'status' }];

  useEffect(() => {
    onData({ rows: exampleRows, downloadRequests, exportName: 'core-items' });
  }, [downloadRequests, onData]);

  return (
    <CoreDemo>
      <DemoSection>
        <div>
          <OwpExportDataToExcelButton
            size="small"
            variant="outlined"
            header={header}
            columnMappers={columnMappers}
            data={rows}
            exportName="core-items"
            onClick={() => {
              setDownloadRequests((count) => count + 1);
              onRecord('excel.download.request', 'core-items.xlsx');
            }}
          >
            {t('Excel 다운로드')}
          </OwpExportDataToExcelButton>
        </div>
        <OwpTable
          size="small"
          aria-label={t('내보낼 항목')}
          headers={{ name: t('이름'), status: t('상태') }}
          rows={rows}
        />
      </DemoSection>
    </CoreDemo>
  );
}
