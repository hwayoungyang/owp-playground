import type { ReactNode } from 'react';
import { ResetButton } from './ResetButton';

export function PreviewToolbar({
  onReset,
  status,
  leadingActions,
  children,
  divider = false,
}: {
  readonly onReset: () => void;
  readonly status?: ReactNode;
  readonly leadingActions?: ReactNode;
  readonly children?: ReactNode;
  readonly divider?: boolean;
}) {
  return (
    <div className="preview-toolbar" data-divider={divider || undefined}>
      {status && <div className="preview-toolbar-status">{status}</div>}
      <div className="preview-actions">
        {leadingActions}
        <ResetButton onReset={onReset} />
        {children}
      </div>
    </div>
  );
}
