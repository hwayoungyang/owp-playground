import { useOwpTranslation } from '@owp/components/hooks';
import { Tooltip } from '@mui/material';
import { MagnifyingGlassIcon, SquaresFourIcon, StarIcon } from '@phosphor-icons/react';
import { type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PlaygroundPackage } from '../../playgrounds/registry';
import type { NavigationViewModel } from './navigation';
import { NavigationGroups } from './NavigationGroups';
import { NavigationLink } from './NavigationLink';
import { NavigationSaved } from './NavigationSaved';
import { navigationResults, searchNavigation } from './navigation-search';
import { useNavigationPreferences } from './useNavigationPreferences';
import { favoriteLimit } from './navigation-preferences';

export function Sidebar({
  model,
  playground,
  searchRef,
  onNavigate,
}: {
  readonly model: NavigationViewModel;
  readonly playground: PlaygroundPackage;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly onNavigate: (id: string) => void;
}) {
  const { t } = useOwpTranslation();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const entries = useMemo(() => navigationResults(model), [model]);
  const availableIds = useMemo(() => new Set(entries.map(({ item }) => item.id)), [entries]);
  const current = entries.find(({ item }) => item.active)?.item;
  const saved = useNavigationPreferences(playground.id, availableIds, current?.id);
  const isFavorite = current !== undefined && saved.favorites.includes(current.id);
  const favoritesFull = saved.favorites.length >= favoriteLimit && !isFavorite;
  const normalizedQuery = query.trim();
  const results = useMemo(
    () => searchNavigation({ entries, query, translate: (value) => t(value) }),
    [entries, query, t],
  );
  const activeCategory = useMemo(
    () =>
      model.groups
        .flatMap((group) => (group.type === 'examples' ? group.categories : []))
        .find((category) => category.items.some((item) => item.active))?.id,
    [model],
  );

  useLayoutEffect(() => {
    if (!activeCategory) return;
    setCollapsed((previous) => {
      if (!previous.has(activeCategory)) return previous;
      const next = new Set(previous);
      next.delete(activeCategory);
      return next;
    });
  }, [activeCategory]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reveal = () => {
      const active = list.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      if (!active || list.clientHeight === 0) return;
      const viewport = list.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      if (item.top < viewport.top + 8) list.scrollTop += item.top - viewport.top - 8;
      else if (item.bottom > viewport.bottom - 8)
        list.scrollTop += item.bottom - viewport.bottom + 8;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    const mutations = new MutationObserver(reveal);
    mutations.observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    });
    const frame = requestAnimationFrame(reveal);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [model]);

  return (
    <nav className="sidebar" aria-label={t('문서·예제 탐색')}>
      <div className="sidebar-package">
        <SquaresFourIcon size={18} weight="bold" aria-hidden />
        <span>{playground.title}</span>
      </div>
      <label className="navigation-search">
        <MagnifyingGlassIcon size={16} aria-hidden />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && normalizedQuery) {
              event.preventDefault();
              listRef.current?.querySelector<HTMLAnchorElement>('.nav-item')?.focus();
            }
            if (event.key === 'Escape' && normalizedQuery) {
              event.preventDefault();
              event.stopPropagation();
              setQuery('');
            }
          }}
          placeholder={t('검색 …')}
          aria-label={t('문서·예제 검색')}
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className="navigation-scope">
        <span>{t('{{package}}에서 검색', { package: playground.title })}</span>
        {current && (
          <Tooltip
            title={t(
              favoritesFull
                ? '즐겨찾기는 최대 12개까지 저장할 수 있습니다.'
                : isFavorite
                  ? '즐겨찾기에서 제거'
                  : '현재 페이지를 즐겨찾기에 추가',
            )}
          >
            <button
              type="button"
              className="navigation-favorite"
              aria-label={t('{{name}} 즐겨찾기', { name: t(current.title) })}
              aria-pressed={isFavorite}
              aria-disabled={favoritesFull}
              onClick={() => {
                if (!favoritesFull) saved.toggleFavorite();
              }}
            >
              <StarIcon size={15} weight={isFavorite ? 'fill' : 'regular'} aria-hidden />
            </button>
          </Tooltip>
        )}
      </div>
      {saved.temporary && (
        <p className="navigation-storage-note">{t('즐겨찾기는 현재 탭에서만 유지됩니다.')}</p>
      )}
      <div className="nav-list" ref={listRef}>
        {normalizedQuery ? (
          <>
            <div className="nav-group-heading" role="status">
              {t('검색 결과 {{count}}개', { count: results.length })}
            </div>
            {results.map(({ item, kind, category }) => (
              <NavigationLink
                key={item.id}
                item={item}
                onNavigate={onNavigate}
                query={normalizedQuery}
                context={`${t(kind)} · ${t(category)}`}
              />
            ))}
            {results.length === 0 && (
              <div className="search-empty">
                {t('검색 결과가 없습니다.')}
                <button type="button" onClick={() => setQuery('')}>
                  {t('검색 지우기')}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <NavigationSaved
              entries={entries}
              favorites={saved.favorites}
              onNavigate={onNavigate}
            />
            <NavigationGroups
              model={model}
              collapsed={collapsed}
              onNavigate={onNavigate}
              onToggle={(id) =>
                setCollapsed((previous) => {
                  const next = new Set(previous);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
            />
          </>
        )}
      </div>
      <div className="sidebar-footer">
        <span className="availability-dot" />
        <span>{t('예제 {{count}}개', { count: model.exampleCount })}</span>
        {model.publicApiCount !== undefined && (
          <span>{t('공개 API {{count}}개', { count: model.publicApiCount })}</span>
        )}
      </div>
    </nav>
  );
}
