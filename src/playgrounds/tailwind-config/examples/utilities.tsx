import { useEffect, useState } from 'react';
import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const columnLabels = ['col1', 'col2', 'col3'] as const;

export function TailwindUtilitiesExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const [compact, setCompact] = useState(false);
  const [columns, setColumns] = useState(true);
  const gridClass = columns ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1';
  const gapClass = compact ? 'gap-field' : 'gap-control';
  useEffect(() => {
    onData({ compact, responsiveColumns: columns, className: `grid ${gridClass} ${gapClass}` });
  }, [compact, columns, gridClass, gapClass, onData]);
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={compact}
              onChange={(_, checked) => {
                setCompact(checked);
                onRecord('spacing', checked ? 'gap-field' : 'gap-control');
              }}
            />
          }
          label={t('간격 8px (기본 16px)')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={columns}
              onChange={(_, checked) => {
                setColumns(checked);
                onRecord('layout', checked ? 'md:grid-cols-3' : 'grid-cols-1');
              }}
            />
          }
          label={t('반응형 3열')}
        />
      </Stack>
      <div className={`grid ${gridClass} ${gapClass} font-ui text-pg-ink`} role="list">
        {columnLabels.map((column) => (
          <div
            key={column}
            role="listitem"
            className="flex min-w-0 flex-col gap-field rounded-panel border border-solid border-pg-line bg-pg-surface p-control dark:bg-pg-subtle"
          >
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
              {column}
            </Typography>
          </div>
        ))}
      </div>
      <DemoResultTable
        label={t('Tailwind 설정 결과')}
        rows={[
          { label: t('열 배치'), value: columns ? t('기본 1열 · 960px 이상 3열') : t('1열') },
          { label: t('간격'), value: compact ? '8px' : '16px' },
          { label: 'class', value: <code>{`grid ${gridClass} ${gapClass}`}</code> },
        ]}
      />
      <Typography variant="body2" color="text.secondary">
        {t(
          '화면 너비가 960px 이상이면 세 열로 표시합니다. 간격과 색상은 Playground 테마를 따릅니다.',
        )}
      </Typography>
    </Stack>
  );
}

export { TailwindUtilitiesExample as IntegrationExample };
