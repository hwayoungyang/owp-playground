import { useOwpTranslation } from '@owp/components/hooks';
import { Button, Menu, MenuItem } from '@mui/material';
import { ArrowClockwiseIcon, CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { packageKnowledgeSchema } from '../api/model/schema';
import { createVersionUrl } from './model/navigation';
import { releaseIndexSchema, type ReleaseIndex, type ReleaseIndexEntry } from './model/schema';

type VersionState =
  | { readonly status: 'development' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly index: ReleaseIndex }
  | { readonly status: 'empty' }
  | { readonly status: 'failed' };

const sourceCatalogSchema = z.object({ samples: z.array(z.object({ id: z.string() })) });

export function VersionSelector({
  packageId,
  version,
  colorMode,
}: {
  readonly packageId: string;
  readonly version: string;
  readonly colorMode: 'light' | 'dark';
}) {
  const { t, i18n } = useOwpTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<VersionState>({
    status: import.meta.env.DEV ? 'development' : 'loading',
  });
  const [retry, setRetry] = useState(0);
  const [moving, setMoving] = useState(false);
  const [navigationFailed, setNavigationFailed] = useState(false);
  const open = Boolean(anchor);
  const currentRelease = typeof __OWP_RELEASE__ === 'undefined' ? null : __OWP_RELEASE__;

  useEffect(() => {
    if (!open || import.meta.env.DEV) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
    setState({ status: 'loading' });
    void (async () => {
      try {
        const response = await fetch('/versions/index.json', { signal, cache: 'no-store' });
        if (response.status === 404) {
          setState({ status: 'empty' });
          return;
        }
        if (!response.ok) throw new TypeError('Version index HTTP failure');
        const payload: unknown = await response.json();
        setState({ status: 'ready', index: releaseIndexSchema.parse(payload) });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof Error) setState({ status: 'failed' });
        else throw error;
      }
    })();
    return () => controller.abort();
  }, [open, retry]);

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
    });

  const navigate = async (release: ReleaseIndexEntry) => {
    setMoving(true);
    setNavigationFailed(false);
    try {
      const signal = AbortSignal.timeout(10_000);
      const [apiResponse, catalogResponse] = await Promise.all([
        fetch(`${release.basePath}api/${packageId}.json`, { signal }),
        fetch(`${release.basePath}catalogs/${packageId}.sources.json`, { signal }),
      ]);
      if (!apiResponse.ok || !catalogResponse.ok) throw new TypeError('Version data HTTP failure');
      const [apiPayload, catalogPayload]: readonly unknown[] = await Promise.all([
        apiResponse.json(),
        catalogResponse.json(),
      ]);
      const api = packageKnowledgeSchema.parse(apiPayload);
      const catalog = sourceCatalogSchema.parse(catalogPayload);
      if (
        api.id !== packageId ||
        !release.packages.some((entry) => entry.id === api.id && entry.version === api.version)
      )
        throw new TypeError('Version package mismatch');
      location.assign(
        destination(
          release,
          new Set([...api.records, ...api.referenceRecords].map((record) => record.id)),
          new Set(catalog.samples.map((sample) => sample.id)),
        ).href,
      );
    } catch (error) {
      if (error instanceof Error) setNavigationFailed(true);
      else throw error;
    } finally {
      setMoving(false);
    }
  };

  const entries =
    state.status === 'ready'
      ? [...state.index.releases]
          .reverse()
          .filter((entry) => entry.packages.some((item) => item.id === packageId))
      : [];
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
      <Button
        className="version-selector"
        aria-label={t('패키지 버전 선택')}
        aria-haspopup="menu"
        aria-expanded={open}
        endIcon={<CaretDownIcon size={12} />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        v{version}
        {currentRelease?.channel === 'draft' && currentRelease.releaseId ? (
          <span className="version-release-state"> · {t('개발본')}</span>
        ) : null}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
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
          const selected = entry.releaseId === currentRelease?.releaseId;
          const entryVersion = entry.packages.find((item) => item.id === packageId)?.version;
          return (
            <MenuItem
              key={entry.releaseId}
              component="a"
              href={destination(entry).href}
              selected={selected}
              disabled={moving}
              aria-current={selected ? 'page' : undefined}
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
                if (selected) setAnchor(null);
                else void navigate(entry);
              }}
            >
              <span className="version-menu-entry">
                <span>
                  v{entryVersion}
                  {entry.channel === 'draft' ? ` · ${t('개발본')}` : ''}
                </span>
                <span className="version-menu-date">
                  {new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'ko-KR', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    timeZone: 'Asia/Seoul',
                  }).format(new Date(entry.createdAt))}
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
