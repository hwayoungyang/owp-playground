import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useRef } from 'react';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { CodeSnippet } from '../code/CodeSnippet';
import {
  ApiDescription,
  ApiGuideBody,
  ApiMemberList,
  ApiRequirement,
  RecordLink,
  TypeExpression,
} from './ApiRecordContent';
import { ApiRelatedRecords } from './ApiRelatedRecords';
import { ApiTypeDetails } from './ApiTypeDetails';
import { type ApiRecord, knowledge, recordsById } from './model/knowledge';
import { apiHref } from './model/links';
import { compareApiMembers } from './model/presentation';

export { RecordLink } from './ApiRecordContent';

export function ApiDetail({
  record,
  focus,
}: {
  readonly record: ApiRecord;
  readonly focus: boolean;
}) {
  const { t } = useOwpTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focus) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'nearest' });
  }, [record.id, focus]);
  const owner = recordsById.get(`${record.package}:${record.owner}`);
  const properties = record.path
    ? []
    : knowledge.records
        .filter(
          (entry) =>
            entry.package === record.package &&
            entry.owner === record.owner &&
            entry.path &&
            !entry.path.includes('.'),
        )
        .sort(compareApiMembers);
  const linked = [...new Set([...record.guideIds, ...record.related])].flatMap((id) => {
    const related = recordsById.get(id);
    return related ? [related] : [];
  });
  const variants = (record.inheritedFrom ?? []).flatMap((id) => {
    const source = recordsById.get(id);
    return source ? [source] : [];
  });
  return (
    <article className="api-detail" aria-labelledby="api-detail-title">
      {record.path && owner && (
        <div className="api-detail-meta">
          <RecordLink record={owner} />
        </div>
      )}
      <div className="api-detail-heading">
        <h2 id="api-detail-title" ref={heading} tabIndex={-1}>
          {record.kind === 'guide' ? record.name : record.path || record.name}
        </h2>
        {record.path && record.kind !== 'guide' && (
          <>
            <TypeExpression text={record.signature} record={record} />
            <ApiRequirement record={record} />
          </>
        )}
      </div>
      {record.description ? (
        <ApiDescription record={record} />
      ) : (
        <p className="api-description">{t('타입 정의·관련 예제 참고.')}</p>
      )}
      {record.declaredIn && variants.length < 2 && recordsById.get(record.declaredIn) && (
        <p className="api-inherited">
          {t('Inherited from')}:{' '}
          <PlaygroundLink
            href={apiHref(
              record.package === '@owp/datagrid' ? 'datagrid' : 'charts',
              record.declaredIn,
            )}
          >
            {record.declaredIn}
          </PlaygroundLink>
        </p>
      )}
      {record.usageNote && <p className="api-description">{t(record.usageNote)}</p>}
      {variants.length > 1 && (
        <section aria-label={t('Inherited declarations')}>
          <h3>
            {t(record.inheritanceKind === 'union' ? 'Type variants' : 'Inherited declarations')}
          </h3>
          <p className="api-description">
            {t(
              record.inheritanceKind === 'union'
                ? '타입별 허용 값·필수 여부·기본값은 각 분기 참고.'
                : '각 타입의 조건을 모두 충족해야 함. 세부 제약은 원본 정의 참고.',
            )}
          </p>
          <ApiMemberList records={variants} qualified />
        </section>
      )}
      <ApiGuideBody record={record} />
      <ApiTypeDetails record={record} />
      {properties.length > 0 && (
        <section aria-labelledby="api-properties-heading">
          <h3 id="api-properties-heading">{t('Properties & methods')}</h3>
          <ApiMemberList records={properties} />
        </section>
      )}
      {record.imports[0] && !record.path && record.package.startsWith('@owp/') && (
        <CodeSnippet
          label="Import"
          code={`import ${record.kind === 'type' ? 'type ' : ''}{ ${record.name} } from '${record.imports[0]}';`}
          language="typescript"
        />
      )}
      {linked.length > 0 && <ApiRelatedRecords key={record.id} records={linked} />}
      {record.examples.length > 0 && (
        <section aria-labelledby="api-examples-heading">
          <h3 id="api-examples-heading">{t('실행 예제')}</h3>
          <div className="api-example-links">
            {record.examples.map((reference) => {
              const example = knowledge.examples.find(
                (entry) => entry.id === reference.id && entry.packageId === reference.packageId,
              );
              return example ? (
                <PlaygroundLink
                  key={`${reference.packageId}/${reference.id}`}
                  href={reference.codeUrl}
                >
                  {t(example.title)}
                  <code>
                    {reference.location
                      ? `${reference.location.file}:${reference.location.line}`
                      : example.source}
                  </code>
                </PlaygroundLink>
              ) : null;
            })}
          </div>
        </section>
      )}
      {record.signature && !record.path && (
        <details className="api-source-details">
          <summary>{t('Type declaration')}</summary>
          <CodeSnippet label={record.owner} code={record.signature} language="typescript" />
        </details>
      )}
    </article>
  );
}
