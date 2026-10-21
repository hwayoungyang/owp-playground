import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../code/CodeSnippet';
import { TypeExpression } from './ApiRecordContent';
import type { ApiRecord } from './model/knowledge';

const tagLabels: Readonly<Record<string, string>> = {
  see: 'See also',
  since: 'Since',
  throws: 'Throws',
  param: 'Parameters',
  returns: 'Returns',
  todo: 'Notes',
  namespace: 'Namespace',
};

export function ApiTypeDetails({ record }: { readonly record: ApiRecord }) {
  const { t } = useOwpTranslation();
  const parameters = record.typeParameters ?? [];
  const tags =
    record.docTags?.filter((tag) => !['default', 'defaultValue'].includes(tag.name)) ?? [];
  return (
    <>
      {record.path && record.kind !== 'guide' && (
        <dl className="api-facts">
          <div>
            <dt lang="en">{t('Default')}</dt>
            <dd lang={record.defaultDescription ? record.locale : 'en'}>
              {record.defaultDescription ?? t('Not specified')}
              {record.defaultNote && (
                <small className="api-default-note">{record.defaultNote}</small>
              )}
            </dd>
          </div>
        </dl>
      )}
      {Boolean(record.typeDetails?.values.length) && (
        <section aria-labelledby="api-values-heading">
          <h3 id="api-values-heading">
            {t(
              record.typeDetails?.valueKind === 'constraint'
                ? 'Type constraint values'
                : 'Allowed values',
            )}
          </h3>
          <CodeSnippet
            label="TypeScript"
            code={record.typeDetails?.values.join(' | ') ?? ''}
            language="typescript"
          />
          {record.typeDetails?.valueKind === 'constraint' && (
            <p className="api-description">{t('타입 인자에 따라 허용 범위가 좁아질 수 있음.')}</p>
          )}
          {record.typeDetails?.extensible && (
            <p className="api-description">
              {t(
                '설치된 registry의 타입 목록. module augmentation으로 확장 가능. 사용 전 controller·plugin 등록 확인 필요.',
              )}
            </p>
          )}
        </section>
      )}
      {parameters.length > 0 && (
        <section aria-labelledby="api-generics-heading">
          <h3 id="api-generics-heading">{t('Type parameters')}</h3>
          <p className="api-description">{t('타입 인자 생략 시 적용할 기본 타입.')}</p>
          <div className="api-parameters">
            {parameters.map((parameter) => (
              <div key={parameter.name}>
                <code>{parameter.name}</code>
                <dl className="api-facts">
                  <div>
                    <dt>{t('Constraint')}</dt>
                    <dd>
                      <TypeExpression text={parameter.constraint ?? 'unknown'} record={record} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Type parameter default')}</dt>
                    <dd>
                      <TypeExpression
                        text={parameter.default ?? t('Not specified')}
                        record={record}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}
      {tags.length > 0 && (
        <section aria-label={t('Documentation notes')} className="api-doc-tags">
          {tags.map((tag, index) => (
            <div key={`${tag.name}-${index}`}>
              <h3>{t(tagLabels[tag.name] ?? tag.name)}</h3>
              <p className="api-description">
                {tag.name === 'see' && /^https?:\/\/\S+$/.test(tag.text) ? (
                  <a href={tag.text} target="_blank" rel="noreferrer">
                    {tag.text}
                  </a>
                ) : (
                  tag.text
                )}
              </p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
