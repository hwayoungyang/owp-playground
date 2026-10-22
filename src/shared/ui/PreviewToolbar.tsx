import type { ReactNode } from 'react';
import { PreviewActionsHost } from './PreviewActions';
import { ResetButton } from './ResetButton';

export function PreviewToolbar({
  onReset,
  status,
  startActions,
  children,
  divider = false,
  className,
}: {
  readonly onReset: () => void;
  readonly status?: ReactNode;
  readonly startActions?: ReactNode;
  readonly children?: ReactNode;
  readonly divider?: boolean;
  readonly className?: string;
}) {
  return (
    <div
      className={className ? `preview-toolbar ${className}` : 'preview-toolbar'}
      data-divider={divider || undefined}
    >
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
