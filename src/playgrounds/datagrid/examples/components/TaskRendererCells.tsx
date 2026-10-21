import { Button, Chip, LinearProgress, Switch } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { CheckIcon } from '@phosphor-icons/react';
import type { Task } from '../../types';

export function RendererStatusCell({ row }: { readonly row: Task }) {
  const { t } = useOwpTranslation();
  return (
    <Chip
      label={t(row.status)}
      sx={{
        color: row.status === '검토 중' ? 'var(--pg-warning)' : 'var(--pg-success)',
        bgcolor: row.status === '검토 중' ? 'var(--pg-warning-wash)' : 'var(--pg-success-wash)',
        ...(row.status === '대기'
          ? { color: 'var(--pg-secondary)', bgcolor: 'var(--pg-subtle)' }
          : {}),
      }}
    />
  );
}

export function RendererProgressCell({
  row,
  value,
}: {
  readonly row: Task;
  readonly value: unknown;
}) {
  const { t } = useOwpTranslation();
  const percent = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="progress-cell">
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`${row.task} ${t('진행률')}`}
        sx={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          bgcolor: 'var(--pg-subtle)',
          '& .MuiLinearProgress-bar': { bgcolor: 'var(--pg-success)', transition: 'none' },
        }}
      />
      <span>{percent}%</span>
    </div>
  );
}

export function RendererNotificationCell({
  row,
  onToggle,
}: {
  readonly row: Task;
  readonly onToggle?: (row: Task, checked: boolean) => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <Switch
      size="small"
      checked={row.active}
      slotProps={{ input: { 'aria-label': t('{{task}} 알림', { task: row.task }) } }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(_, checked) => onToggle?.(row, checked)}
      disabled={!onToggle}
    />
  );
}

export function RendererActionCell({
  row,
  onComplete,
}: {
  readonly row: Task;
  readonly onComplete?: (row: Task) => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <Button
      variant="outlined"
      startIcon={<CheckIcon size={16} />}
      disabled={!onComplete || row.status === '완료'}
      aria-label={t('{{task}} 완료 처리', { task: row.task })}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onComplete?.(row);
      }}
    >
      {t(row.status === '완료' ? '완료됨' : '완료 처리')}
    </Button>
  );
}
