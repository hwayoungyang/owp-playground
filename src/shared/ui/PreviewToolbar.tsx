import type { ReactNode } from 'react';
import { PreviewActionsHost } from './PreviewActions';
import { ResetButton } from './ResetButton';

export function PreviewToolbar({
  onReset,
  status,
  startActions,
  children,
  divider = false,
}: {
  readonly onReset: () => void;
  readonly status?: ReactNode;
  readonly startActions?: ReactNode;
  readonly children?: ReactNode;
  readonly divider?: boolean;
}) {
  return (
    <div className="preview-toolbar" data-divider={divider || undefined}>
      <PreviewActionsHost>{startActions}</PreviewActionsHost>
      {status && <div className="preview-toolbar-status">{status}</div>}
      <div className="preview-actions">
        <ResetButton onReset={onReset} />
        <PreviewActionsHost position="end" />
        {children}
      </div>
    </div>
  );
}
