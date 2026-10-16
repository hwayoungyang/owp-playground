import {
  CaretDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react';
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlaygroundPackage } from '../../playgrounds/registry';
import type { SampleCategory, SampleInfo } from '../../shared/types/playground';

export function Sidebar({
  sample,
  onNavigate,
  searchRef,
  playground,
  samples,
  categories,
  exampleCount,
  getSampleUrl,
}: {
  readonly sample: SampleInfo;
  readonly onNavigate: (id: string) => void;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly playground: PlaygroundPackage;
  readonly samples: readonly SampleInfo[];
  readonly categories: readonly SampleCategory[];
  readonly exampleCount: number;
  readonly getSampleUrl: (id: string) => string;
}) {
  const { t } = useTranslation('app');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    setCollapsed((previous) => {
      if (!previous.has(sample.category)) return previous;
      const next = new Set(previous);
      next.delete(sample.category);
      return next;
    });
  }, [sample]);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reveal = () => {
      const active = list.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      if (
        !active ||
        new URL(active.href).searchParams.get('sample') !== sample.id ||
        list.clientHeight === 0
      )
        return;
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
  }, [sample.id]);
  const filtered = samples.filter((entry) =>
    `${t(entry.title)} ${t(entry.description)} ${entry.title} ${entry.api.join(' ')}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  return (
    <nav className="sidebar" aria-label={t('예제 탐색')}>
      <div className="sidebar-package">
        <SquaresFourIcon size={18} weight="bold" />
        <span>{playground.title}</span>
        <span className="version">{playground.version}</span>
      </div>
      <label className="sample-search">
        <MagnifyingGlassIcon size={16} />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('검색 …')}
          aria-label={t('예제 검색')}
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className="nav-list" ref={listRef}>
        {categories.map((category) => {
          const entries = filtered.filter((entry) => entry.category === category.id);
          if (entries.length === 0) return null;
          const expanded = query.length > 0 || !collapsed.has(category.id);
          return (
            <section className="nav-category" key={category.id}>
              <button
                type="button"
                className="category-label"
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
                <span>{t(category.label)}</span>
                <CaretDownIcon size={12} className={expanded ? '' : 'collapsed'} />
              </button>
              {expanded &&
                entries.map((entry) => (
                  <a
                    key={entry.id}
                    href={getSampleUrl(entry.id)}
                    aria-current={sample.id === entry.id ? 'page' : undefined}
                    className={`nav-item ${sample.id === entry.id ? 'active' : ''}`}
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
                      onNavigate(entry.id);
                    }}
                  >
                    <span>{t(entry.title)}</span>
                    {sample.id === entry.id && <CheckIcon size={13} />}
                  </a>
                ))}
            </section>
          );
        })}
        {filtered.length === 0 && (
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
            count: exampleCount,
          })}
        </span>
      </div>
    </nav>
  );
}
