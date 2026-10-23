import { useEffect, useState } from 'react';
import { OwpExportDataToExcelButton, OwpPageContent, OwpTable } from '@owp/core';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreToggle } from '../runtime/Controls';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(true);
  const rows = exampleRows.map((row) => ({ name: t(row.name), status: t(row.status) }));

  useEffect(() => {
    onData({ loading, responsiveLayout: responsive, rows: exampleRows });
  }, [loading, responsive, onData]);

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
            <OwpExportDataToExcelButton
              size="small"
              variant="outlined"
              disabled={loading}
              header={[
                { key: 'A1', value: t('이름') },
                { key: 'B1', value: t('상태') },
              ]}
              columnMappers={[{ key: 'name' }, { key: 'status' }]}
              data={rows}
              exportName="core-items"
              onClick={() => onRecord('excel.download.request', 'core-items.xlsx')}
            >
              {t('Excel 다운로드')}
            </OwpExportDataToExcelButton>
          }
        >
          <OwpTable
            aria-label={t('항목 목록')}
            variant="mui"
            size="small"
            headers={{ name: t('이름'), status: t('상태') }}
            rows={rows}
          />
        </OwpPageContent>
      </DemoSection>
    </CoreDemo>
  );
}
