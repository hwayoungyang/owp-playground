import { useTranslation } from 'react-i18next';
import type { Demo } from './useDemo';

export function PreviewStatus({ demo }: { readonly demo: Demo }) {
  const { t } = useTranslation('app');
  return (
    <div className="preview-status" role="status">
      <span>
        <strong>{demo.rowCount.toLocaleString()}</strong>
        {t('행')}
        <span className="status-divider">/</span>
        {t(
          demo.definition.rowSelectionScope?.type === 'panelRowSpan'
            ? '선택 {{count}}그룹'
            : '선택 {{count}}',
          { count: demo.selected.length },
        )}
        <span className="status-divider">/</span>
        {t('변경 {{count}}', { count: demo.changeCount })}
      </span>
    </div>
  );
}
