import { useOwpTranslation } from '@owp/components/hooks';
import { formatApiDescription } from '../../shared/i18n/reference-copy';
import { parameterLabel } from '../../playgrounds/components/api/parameter-label';
import type { PublicApiEntry, PublicApiSignature } from './types';

export function ParametersTable({
  signature,
  javascript,
}: {
  readonly signature: PublicApiSignature;
  readonly javascript: PublicApiEntry['javascript'];
}) {
  const { t } = useOwpTranslation();
  const hasDescription = signature.parameters.some((parameter) =>
    formatApiDescription(parameter.description).trim(),
  );
  return (
    <div
      className="components-api-table-scroll"
      role="region"
      aria-label={t('매개변수 표')}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 긴 타입을 키보드로 스크롤할 수 있어야 합니다.
      tabIndex={0}
    >
      <table className="api-contract-table">
        <thead>
          <tr>
            <th scope="col">{t('Name')}</th>
            <th scope="col">{t('Type')}</th>
            <th scope="col">{t('Requirement')}</th>
            {hasDescription && <th scope="col">{t('Description')}</th>}
          </tr>
        </thead>
        <tbody>
          {signature.parameters.map((parameter) => (
            <tr key={parameter.name}>
              <th scope="row">
                <code>
                  {parameter.rest ? '...' : ''}
                  {parameterLabel(parameter, (key) => t(key))}
                </code>
              </th>
              <td>
                <code>{parameter.type}</code>
              </td>
              <td className="api-requirement">
                <span data-required={!parameter.optional && !javascript}>
                  {t(parameter.optional ? 'Optional' : javascript ? 'Not specified' : 'Required')}
                </span>
              </td>
              {hasDescription && (
                <td className="components-api-original">
                  {formatApiDescription(parameter.description) || '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
