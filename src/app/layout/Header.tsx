import { useOwpTranslation } from '@owp/components/hooks';
import { Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import {
  CaretDownIcon,
  CheckIcon,
  ListIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import {
  createPlaygroundUrl,
  dataGridPackage,
  getPlaygroundRoute,
  type PlaygroundPackage,
  packageCatalog,
} from '../../playgrounds/registry';
import type { ColorMode } from '../../shared/theme/tokens';
import type { ExampleMetadata } from '../../shared/types/playground';
import { VersionSelector } from '../../features/releases/VersionSelector';

export function Header({
  playground,
  example,
  categoryLabel,
  onPackageChange,
  mode,
  onModeChange,
  onMenuOpen,
  onThemeOpen,
}: {
  readonly playground: PlaygroundPackage;
  readonly example: ExampleMetadata | null;
  readonly categoryLabel: string;
  readonly onPackageChange: (playground: PlaygroundPackage) => void;
  readonly mode: ColorMode;
  readonly onModeChange: () => void;
  readonly onMenuOpen: () => void;
  readonly onThemeOpen?: () => void;
}) {
  const { t, i18n } = useOwpTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <header className="app-header">
      <div className="brand">
        <IconButton className="mobile-menu" aria-label={t('탐색 메뉴 열기')} onClick={onMenuOpen}>
          <ListIcon size={20} />
        </IconButton>
        <a
          href={createPlaygroundUrl(location.href, getPlaygroundRoute(dataGridPackage)).href}
          aria-label={t('OWP Playground 처음으로')}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            onPackageChange(dataGridPackage);
          }}
        >
          <img
            className="brand-symbol"
            src={`${import.meta.env.BASE_URL}brand/owp-symbol.svg`}
            alt=""
            width={24}
            height={24}
          />
          <span>
            OWP <b>Playground</b>
          </span>
        </a>
        <span className="brand-divider" />
        <nav className="header-breadcrumb" aria-label={t('현재 위치')}>
          <ol>
            <li>{playground.title}</li>
            {example && (
              <>
                <li>{t(categoryLabel)}</li>
                <li aria-current="page">{t(example.title)}</li>
              </>
            )}
            {!example && <li aria-current="page">{t('준비 중')}</li>}
          </ol>
        </nav>
      </div>
      <div className="header-actions">
        <Button
          className="package-selector"
          onClick={(event) => setAnchor(event.currentTarget)}
          endIcon={<CaretDownIcon size={12} />}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          aria-label={t('패키지 선택')}
        >
          {playground.title}
        </Button>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          slotProps={{ paper: { role: 'navigation', 'aria-label': t('패키지 선택') } }}
        >
          {packageCatalog.map((entry) => (
            <MenuItem
              key={entry.id}
              data-package={entry.id}
              aria-current={entry.id === playground.id ? 'true' : undefined}
              selected={entry.id === playground.id}
              disabled={entry.status === 'planned'}
              onClick={() => {
                if (entry.id !== playground.id) onPackageChange(entry);
                setAnchor(null);
              }}
            >
              <span className="package-menu-name">{entry.title}</span>
              {entry.status === 'planned' ? (
                <span className="package-menu-state">{t('준비 중')}</span>
              ) : entry.id === playground.id ? (
                <span className="package-menu-state">
                  <CheckIcon size={14} />
                  {t('선택됨')}
                </span>
              ) : null}
            </MenuItem>
          ))}
        </Menu>
        {playground.status === 'ready' && (
          <VersionSelector
            packageId={playground.id}
            version={playground.version}
            colorMode={mode}
          />
        )}
        <span className="header-separator" />
        <Button
          className="language-switch"
          aria-label={t(i18n.language === 'en' ? '한국어로 전환' : '영어로 전환')}
          onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ko' : 'en')}
        >
          {i18n.language === 'en' ? '한' : 'EN'}
        </Button>
        {onThemeOpen && (
          <Tooltip title={t('테마 편집')}>
            <IconButton aria-label={t('테마 편집')} onClick={onThemeOpen}>
              <PaletteIcon size={18} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={t(mode === 'light' ? '어두운 화면' : '밝은 화면')}>
          <IconButton
            onClick={onModeChange}
            aria-label={t(mode === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환')}
          >
            {mode === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}
