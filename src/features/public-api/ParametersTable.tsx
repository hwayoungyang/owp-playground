import { OwpTable } from '@owp/components';
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
        ...(hasDescription ? { description: t('Description') } : {}),
      }}
      rows={signature.parameters.map((parameter) => ({
        name: (
          <code>
            {parameter.rest ? '...' : ''}
            {parameterLabel(parameter, (key) => t(key))}
          </code>
        ),
        type: <code>{parameter.type}</code>,
        requirement: (
          <span className="api-requirement">
            <span data-required={!parameter.optional && !javascript}>
              {t(parameter.optional ? 'Optional' : javascript ? 'Not specified' : 'Required')}
            </span>
          </span>
        ),
        description: (
          <span className="components-api-original">
            {formatApiDescription(parameter.description) || '—'}
          </span>
        ),
      }))}
    />
  );
}
