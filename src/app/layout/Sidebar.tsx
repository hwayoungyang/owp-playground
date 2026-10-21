import { useOwpTranslation } from '@owp/components/hooks';
import {
  CaretDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react';
import { type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PlaygroundPackage } from '../../playgrounds/registry';
import type { NavigationViewModel } from './navigation';

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
  const { t, i18n } = useOwpTranslation();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const activeSubcategoryId = useMemo(() => {
    for (const group of model.groups) {
      if (group.type === 'examples') {
        for (const category of group.categories) {
          if (category.items.some((item) => item.active)) {
            return category.id;
          }
        }
      }
    }
    return null;
  }, [model]);

  useLayoutEffect(() => {
    if (activeSubcategoryId) {
      setCollapsed((previous) => {
        if (!previous.has(activeSubcategoryId)) return previous;
        const next = new Set(previous);
        next.delete(activeSubcategoryId);
        return next;
      });
    }
  }, [activeSubcategoryId]);

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

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return model.groups;
    const matches = (item: {
      readonly title: string;
      readonly description?: string;
      readonly api?: readonly string[];
    }) =>
      String(
        t(item.title) +
          ' ' +
          t(item.description ?? '') +
          ' ' +
          item.title +
          ' ' +
          (item.api ?? []).join(' '),
      )
        .toLocaleLowerCase()
        .includes(normalizedQuery);

    return model.groups
      .map((group) => {
        if (group.type === 'docs') {
          const items = group.items.filter(matches);
          return items.length > 0 ? { ...group, items } : null;
        }
        const categories = group.categories
          .map((cat) => {
            const items = cat.items.filter(matches);
            return items.length > 0 ? { ...cat, items } : null;
          })
          .filter((cat): cat is NonNullable<typeof cat> => cat !== null);
        return categories.length > 0 ? { ...group, categories } : null;
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
  }, [model.groups, normalizedQuery, t]);

  const hasResults = filteredGroups.length > 0;

  return (
    <nav className="sidebar" aria-label={t('문서·예제 탐색')}>
      <div className="sidebar-package">
        <SquaresFourIcon size={18} weight="bold" />
        <span>{playground.title}</span>
        <span className="version">{playground.version}</span>
      </div>
      <label className="navigation-search">
        <MagnifyingGlassIcon size={16} />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('검색 …')}
          aria-label={t('문서·예제 검색')}
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className="nav-list" ref={listRef}>
        {filteredGroups.map((group) => {
          if (group.type === 'docs') {
            return (
              <section className="nav-category" key={group.id}>
                <div className="nav-group-heading">
                  <span>{t(group.label)}</span>
                </div>
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    aria-current={item.active ? 'page' : undefined}
                    className={'nav-item' + (item.active ? ' active' : '')}
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
                      onNavigate(item.id);
                    }}
                  >
                    <span>{t(item.title)}</span>
                    {item.active && <CheckIcon size={13} />}
                  </a>
                ))}
              </section>
            );
          }

          return (
            <div className="nav-section-group" key={group.id}>
              <div className="nav-group-heading">
                <span>{t(group.label)}</span>
              </div>
              {group.categories.map((category) => {
                const expanded = normalizedQuery.length > 0 || !collapsed.has(category.id);
                const label = t(category.label);
                const bilingual = i18n.language.startsWith('ko')
                  ? label.match(/^(.+) \(([^)]+)\)$/u)
                  : null;
                return (
                  <section className="nav-category" key={category.id}>
                    <button
                      type="button"
                      className="category-label"
                      aria-label={label}
                      aria-expanded={expanded}
                      onClick={() =>
                        setCollapsed((previous) => {
                          const next = new Set(previous);
                          if (next.has(category.id)) next.delete(category.id);
                          else next.add(category.id);
                          return next;
                        })
                      }
                    >
                      <span className="category-copy">
                        <span>{bilingual?.[1] ?? label}</span>
                        {bilingual?.[2] && (
                          <span className="category-subtitle" lang="en">
                            {bilingual[2]}
                          </span>
                        )}
                      </span>
                      <CaretDownIcon size={12} className={expanded ? '' : 'collapsed'} />
                    </button>
                    {expanded &&
                      category.items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          aria-current={item.active ? 'page' : undefined}
                          className={'nav-item' + (item.active ? ' active' : '')}
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
                            onNavigate(item.id);
                          }}
                        >
                          <span>{t(item.title)}</span>
                          {item.active && <CheckIcon size={13} />}
                        </a>
                      ))}
                  </section>
                );
              })}
            </div>
          );
        })}
        {!hasResults && (
          <div className="search-empty">
            {t('검색 결과가 없습니다.')}
            <button type="button" onClick={() => setQuery('')}>
              {t('검색 지우기')}
            </button>
          </div>
        )}
      </div>
      <div className="sidebar-footer">
        <span className="availability-dot" />
        <span>
          {t('예제 {{count}}개', {
            count: model.exampleCount,
          })}
        </span>
      </div>
    </nav>
  );
}
