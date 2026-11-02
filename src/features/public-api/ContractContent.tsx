import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../code/CodeSnippet';
import { ApiProps, PropsTable } from '../../playgrounds/components/api/ApiProps';
import { formatApiDescription } from '../../shared/i18n/reference-copy';
import { parameterLabel } from '../../playgrounds/components/api/parameter-label';
import type { PublicApiEntry } from './types';
import { ParametersTable } from './ParametersTable';

export type ContractTab = 'props' | 'params' | 'returns' | 'type';

export function contractTabs(
  entries: readonly Pick<PublicApiEntry, 'kind'>[],
): readonly ContractTab[] {
  return [
    ...(entries.some((entry) => entry.kind === 'component') ? ['props' as const] : []),
    ...(entries.some(
      (entry) => entry.kind === 'hook' || entry.kind === 'function' || entry.kind === 'class',
    )
      ? ['params' as const, 'returns' as const]
      : []),
    ...(entries.some(
      (entry) =>
        entry.kind === 'type' ||
        entry.kind === 'value' ||
        entry.kind === 'context' ||
        entry.kind === 'asset',
    )
      ? ['type' as const]
      : []),
  ];
}

export function ContractContent({
  entry,
  tab,
}: {
  readonly entry: PublicApiEntry;
  readonly tab: ContractTab;
}) {
  const { t } = useOwpTranslation();
  switch (tab) {
    case 'props':
      return (
        <ApiProps
          variants={entry.propsVariants}
          packageName={`@owp/${entry.packageId}`}
          preferApi
        />
      );
    case 'params':
      return (
        <>
          {entry.javascript && (
            <p>
              {t(
                '이 JavaScript 진입점은 TypeScript 선언을 제공하지 않습니다. unknown은 타입 정보가 없음을 뜻합니다.',
              )}
            </p>
          )}
          {entry.signatures.map((signature, index) => (
            <section key={`${index}-${signature.declaration}`}>
              <h3>
                {entry.signatures.length === 1
                  ? t('호출 형식')
                  : t('호출 형식 {{number}}', { number: index + 1 })}
              </h3>
              <CodeSnippet label="TypeScript" code={signature.declaration} language="typescript" />
              {signature.parameters.length ? (
                <ParametersTable signature={signature} javascript={entry.javascript} />
              ) : (
                <p>{t('매개변수가 없습니다.')}</p>
              )}
              {signature.parameterMembers
                .filter((parameter) => parameter.members.length)
                .map((parameter) => (
                  <details key={parameter.name}>
                    <summary>
                      {t('{{name}} 항목', {
                        name: parameterLabel(
                          {
                            name: parameter.name,
                            type:
                              signature.parameters.find(
                                (candidate) => candidate.name === parameter.name,
                              )?.type ?? '',
                          },
                          (key) => t(key),
                        ),
                      })}
                    </summary>
                    <PropsTable
                      members={parameter.members}
                      label="매개변수 표"
                      showSource={false}
                    />
                  </details>
                ))}
            </section>
          ))}
        </>
      );
    case 'returns':
      return (
        <>
          {entry.javascript && (
            <p>
              {t(
                '이 JavaScript 진입점은 TypeScript 선언을 제공하지 않습니다. unknown은 타입 정보가 없음을 뜻합니다.',
              )}
            </p>
          )}
          {entry.signatures.map((signature, index) => (
            <section key={`${index}-${signature.declaration}`}>
              <h3>
                {entry.signatures.length === 1
                  ? t('반환값')
                  : t('호출 형식 {{number}}의 반환값', { number: index + 1 })}
              </h3>
              <CodeSnippet label="TypeScript" code={signature.returnType} language="typescript" />
              {signature.returnDescription && (
                <p>{formatApiDescription(signature.returnDescription)}</p>
              )}
              {signature.returnMembers.length > 0 && (
                <>
                  <h4>{t('반환 객체')}</h4>
                  <PropsTable
                    members={signature.returnMembers}
                    label="반환값 표"
                    showSource={false}
                  />
                </>
              )}
            </section>
          ))}
        </>
      );
    case 'type':
      return (
        <CodeSnippet
          label="Type"
          code={
            entry.kind === 'type' || entry.kind === 'asset'
              ? entry.declaration
              : (entry.valueType ?? entry.declaration)
          }
          language={entry.kind === 'asset' ? 'json' : 'typescript'}
        />
      );
    default:
      return assertNever(tab);
  }
}

function assertNever(value: never): never {
  throw new RangeError(`Unknown contract tab: ${String(value)}`);
}
