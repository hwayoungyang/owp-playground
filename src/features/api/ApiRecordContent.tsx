import { useOwpTranslation } from '@owp/components/hooks';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import type { ApiDataset, ApiRecord } from './model/knowledge';
import { useApiKnowledge } from './ApiKnowledgeContext';
import { apiHref } from './model/links';
import { descriptionOrigins } from './model/presentation';
import { apiPackageIdFor, completedPlaygroundPackages } from '../../playgrounds/packages';

function recordPackageId(record: ApiRecord, dataset: ApiDataset): string {
  const own = completedPlaygroundPackages.find((entry) => entry.name === record.package);
  if (own) return own.id;
  if (dataset.recordsById.has(record.id)) return dataset.knowledge.id;
  const query = record.url.split('?')[1];
  const urlPackage = query ? new URLSearchParams(query).get('package') : null;
  if (urlPackage && completedPlaygroundPackages.some((entry) => entry.id === urlPackage)) {
    return urlPackage;
  }
  return apiPackageIdFor(record.package);
}

export function TypeExpression({
  text,
  record,
}: {
  readonly text: string;
  readonly record: ApiRecord;
}) {
  const { t } = useOwpTranslation();
  const dataset = useApiKnowledge();
  const { recordsById } = dataset;
  return (
    <code className="api-type-expression" title={t('Type')}>
      {text
        .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b[A-Za-z_$][\w$]*\b)/g)
        .map((part, index) => {
          const id = record.typeReferences?.[part];
          const target = id ? recordsById.get(id) : undefined;
          return target && target.id !== record.id ? (
            <PlaygroundLink
              key={`${index}-${part}`}
              href={apiHref(recordPackageId(target, dataset), target.id)}
            >
              {part}
            </PlaygroundLink>
          ) : (
            part
          );
        })}
    </code>
  );
}

export function RecordLink({
  record,
  qualified = false,
}: {
  readonly record: ApiRecord;
  readonly qualified?: boolean;
}) {
  const dataset = useApiKnowledge();
  const packageId = recordPackageId(record, dataset);
  const label = record.kind === 'guide' ? record.name : record.path || record.name;
  return (
    <PlaygroundLink href={apiHref(packageId, record.id)}>
      {qualified && record.path && record.kind !== 'guide' ? `${record.owner}.${label}` : label}
    </PlaygroundLink>
  );
}

export function ApiRequirement({ record }: { readonly record: ApiRecord }) {
  const { t } = useOwpTranslation();
  return (
    <span className="api-requirement" lang="en">
      {t(
        record.requirement === 'required'
          ? 'Required'
          : record.requirement === 'conditional'
            ? 'Conditional'
            : 'Optional',
      )}
    </span>
  );
}

export function ApiDescription({ record }: { readonly record: ApiRecord }) {
  const { t, i18n } = useOwpTranslation();
  const dataset = useApiKnowledge();
  const { recordsById } = dataset;
  if (!record.description) return null;
  const showSource =
    (i18n.resolvedLanguage ?? i18n.language).startsWith('ko') && record.locale.startsWith('en');
  const origins = showSource ? descriptionOrigins(record, recordsById) : [];
  return (
    <div className="api-description-block">
      <p className="api-description" lang={record.locale}>
        {record.description}
      </p>
      {showSource && (
        <div className="api-description-sources">
          {origins.length === 0 ? (
            <span className="api-description-source">{t('영문 원문')}</span>
          ) : (
            origins.map((origin) => (
              <PlaygroundLink
                key={origin.id}
                className="api-description-source"
                href={apiHref(recordPackageId(origin, dataset), origin.id)}
                title={t('설명 원문: {{source}}', { source: origin.id })}
              >
                {t('{{package}} 원문', {
                  package: origin.package === 'chart.js' ? 'Chart.js' : origin.package,
                })}
              </PlaygroundLink>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ApiMemberList({
  records,
  qualified = false,
}: {
  readonly records: readonly ApiRecord[];
  readonly qualified?: boolean;
}) {
  const { t } = useOwpTranslation();
  return (
    <div className="api-property-list">
      {records.map((record) => (
        <div className="api-property" key={record.id}>
          <div className="api-member-heading">
            <code className="api-member-name">
              <RecordLink record={record} qualified={qualified} />
            </code>
            <TypeExpression text={record.signature} record={record} />
            <ApiRequirement record={record} />
          </div>
          {Boolean(record.typeDetails?.values.length) && (
            <p>
              <span lang="en">
                {t(
                  record.typeDetails?.valueKind === 'constraint'
                    ? 'Type constraint values'
                    : 'Allowed values',
                )}
                :{' '}
              </span>
              <code>{record.typeDetails?.values.join(' | ')}</code>
            </p>
          )}
          {record.defaultDescription && (
            <p lang={record.locale}>
              <span lang="en">{t('Default')}: </span>
              <code>{record.defaultDescription}</code>
            </p>
          )}
          <ApiDescription record={record} />
        </div>
      ))}
    </div>
  );
}

export function ApiGuideBody({ record }: { readonly record: ApiRecord }) {
  const sections = record.sections?.filter((section) => section.body.trim());
  if (!record.body && !sections?.length) return null;
  return (
    <div className="api-guide-body" lang={record.locale}>
      {sections?.length
        ? sections.map((section, index) => (
            <details
              className="api-guide-section"
              key={`${index}-${section.title}`}
              open={index === 0}
            >
              <summary>{section.title}</summary>
              <div>
                {section.body.split('\n\n').map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))
        : record.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}
