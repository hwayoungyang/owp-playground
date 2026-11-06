import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { useId } from 'react';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import type { ComponentsApiSignature } from './types';
import { parameterLabel } from './parameter-label';

function Signature({
  signature,
  number,
}: {
  readonly signature: ComponentsApiSignature;
  readonly number?: number;
}) {
  const { t } = useOwpTranslation();
  return (
    <section className="components-api-signature">
      {number && <h3>{t('호출 형식 {{number}}', { number })}</h3>}
      <CodeSnippet label="TypeScript" code={signature.declaration} language="typescript" />
      <h4>{t('매개변수')}</h4>
      {signature.parameters.length > 0 ? (
        <OwpTable
          containerProps={{
            className: 'components-api-table-scroll',
            role: 'region',
            'aria-label': t('매개변수 표'),
            tabIndex: 0,
          }}
          className="api-contract-table"
          size="small"
          aria-label={t('매개변수 표')}
          headers={{
            name: t('Name'),
            type: t('Type'),
            requirement: t('Requirement'),
            description: t('Description'),
          }}
          rows={signature.parameters.map((parameter) => ({
            name: (
              <>
                <code>
                  {parameter.rest ? '...' : ''}
                  {parameterLabel(parameter, (key) => t(key))}
                </code>
                {parameter.rest && (
                  <span className="components-api-tag">{t('나머지 매개변수')}</span>
                )}
              </>
            ),
            type: <code>{parameter.type}</code>,
            requirement: t(parameter.optional ? 'Optional' : 'Required'),
            description: (
              <span className="components-api-original">
                {formatApiDescription(parameter.description) || '—'}
              </span>
            ),
          }))}
        />
      ) : (
        <p>{t('매개변수가 없습니다.')}</p>
      )}
      <h4>{t('반환값')}</h4>
      <CodeSnippet label={t('반환 타입')} code={signature.returnType} language="typescript" />
      {signature.returnDescription && (
        <p className="components-api-original">
          {formatApiDescription(signature.returnDescription)}
        </p>
      )}
    </section>
  );
}

export function ApiSignatures({
  signatures,
}: {
  readonly signatures: readonly ComponentsApiSignature[];
}) {
  const { t } = useOwpTranslation();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t('호출 형식')}</h2>
      {signatures.map((signature, index) => (
        <Signature
          key={`${index}-${signature.declaration}`}
          signature={signature}
          number={signatures.length > 1 ? index + 1 : undefined}
        />
      ))}
    </section>
  );
}
