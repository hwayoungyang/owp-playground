import { useTranslation } from 'react-i18next';
import type { GridController } from './useGridController';

export function GridStatusBar({ controller }: { readonly controller: GridController }) {
  const { t } = useTranslation('app');
  return (
    <div className="grid-status-bar" role="status">
      <span>
        <strong>{controller.rowCount.toLocaleString()}</strong>
        {t('행')}
        <span className="grid-status-divider">/</span>
        {t(
          controller.configuration.rowSelectionScope?.type === 'panelRowSpan'
            ? '선택 {{count}}그룹'
            : '선택 {{count}}',
          { count: controller.selected.length },
        )}
        <span className="grid-status-divider">/</span>
        {t('변경 {{count}}', { count: controller.changeCount })}
      </span>
    </div>
  );
}
