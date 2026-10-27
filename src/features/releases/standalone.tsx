import { createTheme, ThemeProvider } from '@mui/material';
import { createInstance } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod';
import { appEnglish } from '../../shared/i18n/app.en';
import { colors, fonts } from '../../shared/theme/tokens';
import { VersionSelector } from './VersionSelector';
import { releaseIndexEntrySchema, type ReleaseIndexEntry } from './model/schema';
import menuStyles from './version-menu.css?inline';

const configurationSchema = z.object({
  release: releaseIndexEntrySchema,
  runtimeFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
});

function readContext(release: ReleaseIndexEntry) {
  const requested = new URL(location.href).searchParams.get('package') ?? 'datagrid';
  const selected = release.packages.find((entry) => entry.id === requested);
  const mode = document.documentElement.dataset.colorMode;
  const computed = getComputedStyle(document.documentElement);
  const canvas = computed.getPropertyValue('--pg-canvas').trim();
  return {
    packageId: requested,
    version: selected?.version ?? '',
    language: document.documentElement.lang === 'en' ? 'en' : 'ko',
    colorMode:
      mode === 'dark' || (mode !== 'light' && canvas === colors.dark.canvas)
        ? ('dark' as const)
        : ('light' as const),
    href: location.href,
    htmlFontSize: Number.parseFloat(computed.fontSize),
  };
}

function StandaloneMenu({
  button,
  release,
  fingerprint,
  onClose,
}: {
  readonly button: HTMLElement;
  readonly release: ReleaseIndexEntry;
  readonly fingerprint: string;
  readonly onClose: () => void;
}) {
  const [context, setContext] = useState(() => readContext(release));
  const external = useMemo(() => ({ anchor: button, onClose }), [button, onClose]);
  const translations = useMemo(() => {
    const instance = createInstance();
    const korean = Object.fromEntries(Object.keys(appEnglish).map((key) => [key, key]));
    void instance.init({
      lng: context.language,
      fallbackLng: 'ko',
      defaultNS: 'app',
      ns: ['app', 'owp'],
      keySeparator: false,
      nsSeparator: false,
      initAsync: false,
      resources: { ko: { app: korean, owp: korean }, en: { app: appEnglish, owp: appEnglish } },
      interpolation: { escapeValue: false },
    });
    return instance;
  }, [context.language]);
  const theme = useMemo(() => {
    const palette = colors[context.colorMode];
    return createTheme({
      palette: {
        mode: context.colorMode,
        background: { paper: palette.canvas },
        text: { primary: palette.ink, secondary: palette.secondary },
      },
      shape: { borderRadius: 4 },
      typography: { htmlFontSize: context.htmlFontSize, fontFamily: fonts.ui, fontSize: 14 },
    });
  }, [context.colorMode, context.htmlFontSize]);
  useEffect(() => {
    const update = () => {
      const next = readContext(release);
      setContext((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'data-color-mode', 'style'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('popstate', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', update);
    };
  }, [release]);
  useEffect(() => {
    // 패키지·화면 경로가 바뀌면 진행 중이던 선택도 함께 취소합니다.
    if (!button.isConnected || !context.version) onClose();
  }, [button, context.version, context.href, onClose]);
  return (
    <I18nextProvider i18n={translations}>
      <ThemeProvider theme={theme}>
        <VersionSelector
          key={`${context.packageId}:${context.href}`}
          packageId={context.packageId}
          version={context.version}
          colorMode={context.colorMode}
          external={external}
          displayedRelease={release}
          presentationId={fingerprint}
        />
      </ThemeProvider>
    </I18nextProvider>
  );
}

export function openVersionMenu(button: HTMLElement, input: unknown, onClose: () => void) {
  const config = configurationSchema.parse(input);
  const mount = document.createElement('div');
  mount.dataset.versionUiRoot = config.runtimeFingerprint;
  const style = document.createElement('style');
  style.textContent = menuStyles;
  mount.appendChild(style);
  document.body.appendChild(mount);
  const content = document.createElement('div');
  mount.appendChild(content);
  const root = createRoot(content, { identifierPrefix: 'owp-version-ui-' });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    onClose();
    queueMicrotask(() => {
      root.unmount();
      mount.remove();
      button.focus();
    });
  };
  root.render(
    <StandaloneMenu
      button={button}
      release={config.release}
      fingerprint={config.runtimeFingerprint}
      onClose={close}
    />,
  );
  return close;
}
