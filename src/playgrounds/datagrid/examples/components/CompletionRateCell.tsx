import { LinearProgress } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import type { Task } from '../../types';

export function CompletionRateCell({
  row,
  value,
}: {
  readonly row: Task;
  readonly value: unknown;
}) {
  const { t } = useOwpTranslation();
  return typeof value === 'number' ? (
    <div className="progress-cell">
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value))}
        aria-label={t('{{task}} 완료율', { task: row.task })}
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 1,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { transition: 'none' },
        }}
      />
      <span>{Math.round(value * 10) / 10}%</span>
    </div>
  ) : null;
}
