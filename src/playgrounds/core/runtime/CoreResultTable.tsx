import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';

type ResultTableState = {
  readonly kind: 'idle' | 'loading' | 'error';
  readonly message: string;
};

export function CoreResultTable({
  headers,
  rows,
  state,
  variant = 'mui',
}: {
  readonly headers: Readonly<Record<string, string>>;
  readonly rows: Record<string, ReactNode>[];
  readonly state?: ResultTableState;
  readonly variant?: 'mui' | 'dataGrid';
}) {
  const { t } = useOwpTranslation();
  const showStatus = state !== undefined || rows.length === 0;
  return (
    <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <OwpTable
        aria-label={t('조회 결과')}
        aria-busy={state?.kind === 'loading'}
        headers={headers}
        rows={state ? [] : rows}
        variant={variant}
        size="small"
        sx={{ width: '100%' }}
      />
      {showStatus && (
        <Box
          role={state?.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          sx={{
            width: '100%',
            minHeight: 160,
            p: 2,
            display: 'grid',
            placeItems: 'center',
            color: 'text.secondary',
          }}
        >
          {state?.message ?? t('조회 결과가 없습니다.')}
        </Box>
      )}
    </Box>
  );
}
