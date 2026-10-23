import { useOwpTranslation } from '@owp/components/hooks';
import { Button } from '@mui/material';
import { SquaresFourIcon } from '@phosphor-icons/react';
import type { PlaygroundPackage } from '../../playgrounds/registry';

export function PackageSidebar({ playground }: { readonly playground: PlaygroundPackage }) {
  const { t } = useOwpTranslation();
  return (
    <nav className="sidebar" aria-label={t('예제 탐색')}>
      <div className="sidebar-package">
        <SquaresFourIcon size={18} weight="bold" />
        <span>{playground.title}</span>
      </div>
      <div className="nav-list">
        <div className="search-empty">{t('예제 준비 중')}</div>
      </div>
      <div className="sidebar-footer">{playground.title}</div>
    </nav>
  );
}

export function PackageNotice({ onDataGrid }: { readonly onDataGrid: () => void }) {
  const { t } = useOwpTranslation();
  return (
    <section className="workspace" aria-label={t('예제 준비 중')}>
      <div className="workspace-frame package-placeholder">
        <div className="workspace-heading">
          <div>
            <h2>{t('예제 준비 중')}</h2>
            <p>{t('owp/datagrid 예제를 확인할 수 있습니다.')}</p>
          </div>
        </div>
        <Button variant="outlined" onClick={onDataGrid}>
          {t('owp/datagrid 보기')}
        </Button>
      </div>
    </section>
  );
}
