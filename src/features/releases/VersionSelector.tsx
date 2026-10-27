import { useOwpTranslation } from '@owp/components/hooks';
import { Button, Menu, MenuItem } from '@mui/material';
import { ArrowClockwiseIcon, CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import { createVersionUrl } from './model/navigation';
import { loadNavigationMetadata } from './model/navigation-metadata';
import { formatReleaseDate, selectPackageVersionEntries } from './model/presentation';
import { releaseIndexSchema, type ReleaseIndex, type ReleaseIndexEntry } from './model/schema';

type VersionState =
  | { readonly status: 'development' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly index: ReleaseIndex }
  | { readonly status: 'empty' }
  | { readonly status: 'failed' };

export function VersionSelector({
  packageId,
  version,
  colorMode,
  external,
  displayedRelease = typeof __OWP_RELEASE__ === 'undefined' ? null : __OWP_RELEASE__,
  presentationId = typeof __OWP_VERSION_UI__ === 'undefined' ? undefined : __OWP_VERSION_UI__,
}: {
  readonly packageId: string;
  readonly version: string;
  readonly colorMode: 'light' | 'dark';
  readonly external?: {
    readonly anchor: HTMLElement;
    readonly onClose: () => void;
  };
  readonly displayedRelease?: {
    readonly releaseId: string | null;
    readonly channel: string;
  } | null;
  readonly presentationId?: string;
}) {
  const { t, i18n } = useOwpTranslation();
  const [internalAnchor, setAnchor] = useState<HTMLElement | null>(null);
  const anchor = external?.anchor ?? internalAnchor;
  const menuId = useId();
  const [state, setState] = useState<VersionState>({
    status: import.meta.env.DEV ? 'development' : 'loading',
  });
  const [retry, setRetry] = useState(0);
  const [moving, setMoving] = useState(false);
  const [navigationFailed, setNavigationFailed] = useState(false);
  const menuController = useRef<AbortController | null>(null);
  const open = Boolean(anchor);
  const currentRelease = displayedRelease;

  const closeMenu = () => {
    menuController.current?.abort();
    setAnchor(null);
    external?.onClose();
  };

  useEffect(() => {
    if (!external) return;
    external.anchor.setAttribute('aria-controls', menuId);
    external.anchor.setAttribute('aria-expanded', 'true');
    return () => {
      external.anchor.removeAttribute('aria-controls');
      external.anchor.setAttribute('aria-expanded', 'false');
      external.anchor.focus();
    };
  }, [external, menuId]);

  useEffect(() => {
    if (!open || import.meta.env.DEV) return;
    const controller = new AbortController();
    menuController.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
    setMoving(false);
    setState({ status: 'loading' });
    void (async () => {
      try {
        const response = await fetch('/versions/index.json', { signal, cache: 'no-store' });
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setState({ status: 'empty' });
          return;
        }
        if (!response.ok) throw new TypeError('Version index HTTP failure');
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return;
        setState({ status: 'ready', index: releaseIndexSchema.parse(payload) });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof Error) setState({ status: 'failed' });
        else throw error;
      }
    })();
    return () => controller.abort();
  }, [open, retry, packageId]);

  const destination = (
    release: ReleaseIndexEntry,
    apiIds?: ReadonlySet<string>,
    sampleIds?: ReadonlySet<string>,
  ) =>
    createVersionUrl({
      currentHref: location.href,
      release,
      packageId,
      apiIds,
      sampleIds,
      language: i18n.language,
      colorMode,
      presentationId,
    });

  const navigate = async (release: ReleaseIndexEntry) => {
    const signal = menuController.current?.signal;
    setMoving(true);
    setNavigationFailed(false);
    try {
      const { apiIds, sampleIds } = await loadNavigationMetadata({
        release,
        packageId,
        currentHref: location.href,
      });
      if (signal?.aborted) return;
      location.assign(destination(release, apiIds, sampleIds).href);
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof Error) setNavigationFailed(true);
      else throw error;
    } finally {
      if (!signal?.aborted) setMoving(false);
    }
  };

  const prefetch = (release: ReleaseIndexEntry) => {
    void loadNavigationMetadata({ release, packageId, currentHref: location.href }).catch(
      (error: unknown) => {
        if (!(error instanceof Error)) throw error;
      },
    );
  };

  const entries =
    state.status === 'ready' ? selectPackageVersionEntries(state.index.releases, packageId) : [];
  const currentReleaseId =
    currentRelease?.releaseId ??
    (state.status === 'ready' &&
    !location.pathname.startsWith('/versions/') &&
    state.index.releases.some(
      (entry) =>
        entry.releaseId === state.index.latestReleaseId &&
        entry.packages.some((item) => item.id === packageId && item.version === version),
    )
      ? state.index.latestReleaseId
      : null);
  const statusMessages = {
    development: {
      title: t('개발 중'),
      description: '',
    },
    loading: {
      title: t('버전 목록을 불러오는 중입니다.'),
      description: t('잠시만 기다려 주세요.'),
    },
    empty: {
      title: t('보관된 버전이 없습니다.'),
      description: t('현재 버전을 계속 사용할 수 있습니다.'),
    },
    failed: {
      title: t('버전 목록을 불러오지 못했습니다.'),
      description: t('잠시 후 다시 시도해 주세요.'),
    },
    ready: null,
  } satisfies Record<
    VersionState['status'],
    { readonly title: string; readonly description: string } | null
  >;
  const statusMessage =
    state.status === 'ready' && entries.length === 0
      ? statusMessages.empty
      : statusMessages[state.status];
  return (
    <>
      {!external && (
        <Button
          className="version-selector"
          aria-label={t('패키지 버전 선택')}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          endIcon={<CaretDownIcon size={12} />}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          v{version}
          {currentRelease?.channel === 'draft' && currentRelease.releaseId ? (
            <span className="version-release-state"> · {t('개발본')}</span>
          ) : null}
        </Button>
      )}
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={closeMenu}
        slotProps={{
          paper: {
            className:
              state.status === 'development'
                ? 'version-menu version-menu--development'
                : 'version-menu',
            'aria-label': t('패키지 버전 선택'),
          },
        }}
      >
        {statusMessage && (
          <li role="presentation">
            <div
              className={
                state.status === 'development'
                  ? 'version-menu-status version-menu-status--development'
                  : 'version-menu-status'
              }
              role="status"
            >
              {state.status === 'development' ? (
                <>
                  <span className="version-menu-status-title">v{version}</span>
                  <span className="version-menu-status-description">{statusMessage.title}</span>
                </>
              ) : (
                <>
                  <span className="version-menu-status-title">{statusMessage.title}</span>
                  <span className="version-menu-status-description">
                    {statusMessage.description}
                  </span>
                </>
              )}
            </div>
          </li>
        )}
        {state.status === 'failed' && (
          <MenuItem
            className="version-menu-retry"
            onClick={(event) => {
              event.currentTarget.closest<HTMLElement>('[role="menu"]')?.focus();
              setRetry((value) => value + 1);
            }}
          >
            <ArrowClockwiseIcon size={16} aria-hidden="true" />
            {t('다시 시도')}
          </MenuItem>
        )}
        {entries.map((entry) => {
          const selected = entry.releaseId === currentReleaseId;
          const entryVersion = entry.packages.find((item) => item.id === packageId)?.version;
          return (
            <MenuItem
              key={entry.releaseId}
              component="a"
              href={destination(entry).href}
              selected={selected}
              disabled={moving}
              aria-current={selected ? 'page' : undefined}
              onPointerEnter={() => {
                if (!selected) prefetch(entry);
              }}
              onFocus={() => {
                if (!selected) prefetch(entry);
              }}
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
                if (selected) closeMenu();
                else void navigate(entry);
              }}
            >
              <span className="version-menu-entry">
                <span>
                  v{entryVersion}
                  {entry.channel === 'draft' ? ` · ${t('개발본')}` : ''}
                </span>
                <span className="version-menu-date">
                  {formatReleaseDate(entry.createdAt, i18n.language)}
                </span>
              </span>
              {selected && <CheckIcon size={14} />}
            </MenuItem>
          );
        })}
        {navigationFailed && (
          <MenuItem disabled>{t('선택한 버전을 열지 못했습니다. 다시 선택해 주세요.')}</MenuItem>
        )}
      </Menu>
    </>
  );
}
