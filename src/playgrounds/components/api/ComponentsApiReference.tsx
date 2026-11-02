import { useOwpTranslation } from '@owp/components/hooks';
import { componentsApiData } from 'virtual:components-api-data';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { componentsCatalog } from '../catalog';
import { ApiDeclaration } from './ApiDeclaration';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import { ApiProps } from './ApiProps';
import { ApiSignatures } from './ApiSignatures';
import { ComponentsApiIndex } from './ComponentsApiIndex';
import { componentsApiHref } from './navigation';
import type { ComponentsApiEntry, ComponentsApiSupportingType } from './types';
import './styles.css';

function EntryDefinition({ entry }: { readonly entry: ComponentsApiEntry }) {
  const { t } = useOwpTranslation();
  const signatures = <ApiSignatures signatures={entry.signatures} />;
  return {
    component: <ApiProps variants={entry.propsVariants} />,
    hook: signatures,
    function: signatures,
    value: (
      <section>
        <h2>{t('Type')}</h2>
        {entry.valueType !== null && (
          <CodeSnippet label={t('값의 타입')} code={entry.valueType} language="typescript" />
        )}
      </section>
    ),
  }[entry.kind];
}

function EntryConnections({ entry }: { readonly entry: ComponentsApiEntry }) {
  const { t, i18n } = useOwpTranslation();
  const relatedTypes = componentsApiData.supportingTypes.filter((type) =>
    entry.relatedTypeIds.includes(type.id),
  );
  const examples = componentsCatalog.filter((example) => entry.exampleIds.includes(example.id));
  return (
    <>
      {relatedTypes.length > 0 && (
        <section>
          <h2>{t('관련 타입')}</h2>
          <ul className="components-api-related">
            {relatedTypes.map((type) => (
              <li key={type.id}>
                <PlaygroundLink href={componentsApiHref(type.id, i18n.language)}>
                  <code>{type.name}</code>
                </PlaygroundLink>
              </li>
            ))}
          </ul>
        </section>
      )}
      {examples.length > 0 && (
        <section>
          <h2>{t('관련 실행 예제')}</h2>
          <ul className="components-api-related">
            {examples.map((example) => {
              const params = new URLSearchParams({
                package: 'components',
                sample: example.id,
                lang: i18n.language,
              });
              return (
                <li key={example.id}>
                  <PlaygroundLink href={`?${params}`}>{t(example.title)}</PlaygroundLink>
                  <PlaygroundLink
                    href={`?${params}&tab=code`}
                    aria-label={t('{{name}} 코드 보기', { name: t(example.title) })}
                  >
                    {t('코드 보기')}
                  </PlaygroundLink>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function SymbolArticle({
  entry,
}: {
  readonly entry: ComponentsApiEntry | ComponentsApiSupportingType;
}) {
  const { t } = useOwpTranslation();
  return (
    <article className="components-api-article">
      {entry.description && (
        <p className="components-api-original components-api-description">
          {formatApiDescription(entry.description)}
        </p>
      )}
      <section aria-label="Import">
        {entry.imports.length > 0 ? (
          <CodeSnippet label="Import" code={entry.imports.join('\n')} language="typescript" />
        ) : (
          <p>{t('이 항목의 import 예제가 없습니다.')}</p>
        )}
      </section>
      {'kind' in entry && <EntryDefinition entry={entry} />}
      <section>
        <h2>{t('선언')}</h2>
        <ApiDeclaration declaration={entry.declaration} />
      </section>
      {'kind' in entry && <EntryConnections entry={entry} />}
    </article>
  );
}

export function ComponentsApiReference({ symbol }: { readonly symbol: string | null }) {
  const { t, i18n } = useOwpTranslation();
  const entry =
    symbol === null
      ? undefined
      : (componentsApiData.entries.find((item) => item.id === symbol) ??
        componentsApiData.supportingTypes.find((item) => item.id === symbol));
  const title =
    symbol === null ? 'Components API' : entry ? `${entry.name} API` : 'API를 찾을 수 없습니다.';
  const heading = {
    id: 'components-api',
    title,
    package: '@owp/components',
    category: 'docs',
    description: '',
    api: [],
    source: '',
  };
  return (
    <section className="workspace components-api" aria-label={t('Components API 참조')}>
      {symbol !== null && (
        <PlaygroundLink
          className="components-api-back"
          href={componentsApiHref(null, i18n.language)}
        >
          {t('전체 API 목록')}
        </PlaygroundLink>
      )}
      <WorkspaceHeading example={heading} packageTitle="owp/components" categoryLabel="문서" />
      {symbol === null ? (
        <>
          <p className="components-api-description">
            {t('Components가 제공하는 컴포넌트·Hooks·Utils의 API를 검색하고 확인합니다.')}
          </p>
          <ComponentsApiIndex entries={componentsApiData.entries} />
        </>
      ) : entry ? (
        <SymbolArticle key={entry.id} entry={entry} />
      ) : (
        <p>{t('등록된 Components API에 {{symbol}} 항목이 없습니다.', { symbol })}</p>
      )}
    </section>
  );
}
