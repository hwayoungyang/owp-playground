import { useEffect, useMemo, useState } from 'react';
import { TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import publicApiIndex from 'virtual:public-api/index';
import { publicApiNavigationGroup } from '../../../features/public-api/grouping';
import { publicApiSampleId } from '../../../features/public-api/types';
import { PublicApiIcon } from '../../../features/public-api/PublicApiIcon';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import type { ComponentsExampleProps } from '../model/types';
import './icons.css';

const components = publicApiIndex.find((entry) => entry.id === 'components');
const core = publicApiIndex.find((entry) => entry.id === 'core');
const entries =
  components?.entries.filter((entry) => publicApiNavigationGroup(entry) === 'component-icons') ??
  [];

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        entry.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [query],
  );
  useEffect(
    () => onData({ query, count: filtered.length, icons: filtered.map((entry) => entry.name) }),
    [query, filtered, onData],
  );
  return (
    <section className="components-icon-gallery" aria-label={t('아이콘 목록')}>
      <div className="components-icon-info">
        <p className="components-icon-library">
          <strong>Heroicons</strong>
          <span>v2.2.0 · 24px Outline / Solid</span>
        </p>
        <p>
          {t(
            '기본 아이콘은 Heroicons Outline·Solid를 사용하며, OWP에 추가된 아이콘도 함께 제공합니다.',
          )}
        </p>
        <p>
          <a href="https://heroicons.com/" target="_blank" rel="noreferrer">
            {t('Heroicons에서 아이콘 찾기')}
          </a>
        </p>
        <details>
          <summary>{t('아이콘 버전과 패키지 역할')}</summary>
          <dl>
            <div>
              <dt>{t('아이콘 컴포넌트')}</dt>
              <dd>@owp/components {components?.version}</dd>
            </div>
            <div>
              <dt>{t('추가 SVG sprite')}</dt>
              <dd>@owp/core {core?.version} · assets/icons</dd>
            </div>
          </dl>
          <p>
            {t(
              '기본 아이콘은 Components 번들에 포함되므로 Core 없이 사용할 수 있습니다. 내장 목록 밖의 SVG sprite를 사용할 때는 Core의 assets/icons를 배포하거나 앱에서 직접 제공해야 합니다.',
            )}
          </p>
        </details>
        <p>{t('아래 목록에는 OWP에서 제공하는 아이콘 컴포넌트만 표시합니다.')}</p>
      </div>
      <div className="components-icon-search">
        <TextField
          label={t('아이콘 이름 검색')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onRecord('icons.search', event.target.value);
          }}
          size="small"
          fullWidth
        />
        <p role="status">{t('아이콘 {{count}}개', { count: filtered.length })}</p>
      </div>
      <ul className="components-icon-grid">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <PlaygroundLink
              className="components-icon-link"
              title={entry.name}
              href={`?${new URLSearchParams({ package: 'components', sample: publicApiSampleId(entry.id), lang: i18n.language })}`}
            >
              <span className="components-icon-tile">
                <PublicApiIcon name={entry.name} size={32} />
              </span>
              <span className="components-icon-name">{entry.name}</span>
            </PlaygroundLink>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p role="status">{t('검색 결과가 없습니다.')}</p>}
    </section>
  );
}
