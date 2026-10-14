import { Button } from '@mui/material';
import { SquaresFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { PlaygroundPackage } from '../../playgrounds/registry';

export function PackageSidebar({ playground }: { readonly playground: PlaygroundPackage }) {
  const { t } = useTranslation('app');
  return (
    <nav className="sidebar" aria-label={t('샘플 탐색')}>
      <div className="sidebar-package">
        <SquaresFourIcon size={18} weight="bold" />
        <span>{playground.title}</span>
      </div>
      <div className="nav-list">
        <div className="search-empty">{t('샘플 준비 중')}</div>
      </div>
      <div className="sidebar-footer">{playground.name}</div>
    </nav>
  );
}

export function PackageNotice({ onDataGrid }: { readonly onDataGrid: () => void }) {
  const { t } = useTranslation('app');
  return (
    <section className="workspace" aria-label={t('샘플 준비 중')}>
      <div className="specimen-frame package-placeholder">
        <div className="sample-heading">
          <div>
            <h2>{t('샘플 준비 중')}</h2>
            <p>{t('지금은 OwpDataGrid 예제를 볼 수 있어요.')}</p>
          </div>
        </div>
        <Button variant="outlined" onClick={onDataGrid}>
          {t('OwpDataGrid 보기')}
        </Button>
      </div>
    </section>
  );
}
