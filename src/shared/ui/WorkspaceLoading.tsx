import { CircularProgress, LinearProgress } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import './workspace-loading.css';

export function WorkspaceLoading({
  label = '예제를 불러오는 중…',
  scope = 'panel',
}: {
  readonly label?: string;
  readonly scope?: 'page' | 'panel';
}) {
  const { t } = useOwpTranslation();
  return (
    <div className="workspace-loading" data-scope={scope} role="status" aria-live="polite">
      <div className="workspace-loading-content">
        <CircularProgress
          className="workspace-loading-circle"
          size={32}
          thickness={3.5}
          color="inherit"
          aria-hidden="true"
        />
        <span>{t(label)}</span>
        <LinearProgress className="workspace-loading-line" color="inherit" aria-hidden="true" />
      </div>
    </div>
  );
}
