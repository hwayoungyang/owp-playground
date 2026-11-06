import { useOwpTranslation } from '@owp/components/hooks';
import { OwpTable } from '@owp/components';
import type { ReactNode } from 'react';

type DemoResultRow = {
  readonly label: string;
  readonly api?: string;
  readonly display?: ReactNode;
  readonly value: ReactNode;
};

export function DemoResultTable({
  rows,
  label,
}: {
  readonly rows: readonly DemoResultRow[];
  readonly label: string;
}) {
  const { t } = useOwpTranslation();
  const showApi = rows.some((row) => row.api);
  const showDisplay = rows.some((row) => row.display !== undefined);
  return (
    <div
      className="integration-result-table"
      data-api={showApi || undefined}
      data-display={showDisplay || undefined}
    >
      <OwpTable
        sx={{ '& th, & td': { textAlign: 'left' } }}
        size="small"
        aria-label={label}
        headers={{
          label: t('항목'),
          ...(showApi ? { api: t('컴포넌트 / API') } : {}),
          ...(showDisplay ? { display: t('표시 값') } : {}),
          value: t(showDisplay ? '반환값' : '현재 값'),
        }}
        rows={rows.map((row) => ({
          label: row.label,
          api: <code>{row.api ?? '—'}</code>,
          display: row.display ?? '—',
          value: row.value,
        }))}
      />
    </div>
  );
}
