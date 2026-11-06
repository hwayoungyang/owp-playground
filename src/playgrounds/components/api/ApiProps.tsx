import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { useId } from 'react';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import type { ComponentsApiMember, ComponentsApiPropsVariant } from './types';

const requirementLabels = {
  required: 'Required',
  optional: 'Optional',
  conditional: 'Conditional',
  unavailable: 'Not available in this variant',
} as const;

export function PropsTable({
  members,
  label = 'Props 표',
  showSource = true,
}: {
  readonly members: readonly ComponentsApiMember[];
  readonly label?: string;
  readonly showSource?: boolean;
}) {
  const { t } = useOwpTranslation();
  const hasDefault = members.some(
    (member) => member.defaultValue !== null && member.defaultValue.trim() !== '',
  );
  const hasDescription = members.some((member) => formatApiDescription(member.description).trim());
  return (
    <OwpTable
      containerProps={{
        className: 'components-api-table-scroll',
        role: 'region',
        'aria-label': t(label),
        tabIndex: 0,
      }}
      className="api-contract-table"
      size="small"
      aria-label={t(label)}
      headers={{
        name: t('Name'),
        type: t('Type'),
        requirement: t('Requirement'),
        ...(hasDefault ? { defaultValue: t('Default') } : {}),
        ...(hasDescription ? { description: t('Description') } : {}),
      }}
      rows={members.map((member) => ({
        name: (
          <>
            <code>{member.name}</code>
            {member.isCallback && <span className="components-api-tag">{t('Callback')}</span>}
            {showSource && <span className="components-api-source">{member.source}</span>}
          </>
        ),
        type: <code>{member.type}</code>,
        requirement: (
          <span className="api-requirement">
            <span data-required={member.requirement === 'required'}>
              {t(requirementLabels[member.requirement])}
            </span>
          </span>
        ),
        defaultValue:
          member.defaultValue === null ? t('Not specified') : <code>{member.defaultValue}</code>,
        description: (
          <span className="components-api-original">
            {formatApiDescription(member.description) || '—'}
          </span>
        ),
      }))}
    />
  );
}

function PropsBranch({
  variant,
  packageName,
}: {
  readonly variant: ComponentsApiPropsVariant;
  readonly packageName: string;
}) {
  const { t } = useOwpTranslation();
  const isOwn = (member: ComponentsApiMember) =>
    member.source === packageName || member.source.startsWith(`${packageName} · `);
  const own = variant.props.filter(isOwn);
  const inherited = variant.props.filter((member) => !isOwn(member));
  return (
    <>
      {own.length > 0 && <PropsTable members={own} showSource={false} />}
      {inherited.length > 0 && (
        <details className="components-api-inherited">
          <summary>{t('상속된 Props ({{count}}개)', { count: inherited.length })}</summary>
          <p className="components-api-meta">{t('각 Prop에 원본 패키지 출처를 표시합니다.')}</p>
          <PropsTable members={inherited} />
        </details>
      )}
      {variant.props.length === 0 && <p>{t('이 선언에는 Props가 없습니다.')}</p>}
    </>
  );
}

export function ApiProps({
  variants,
  packageName = '@owp/components',
  preferApi = false,
}: {
  readonly variants: readonly ComponentsApiPropsVariant[];
  readonly packageName?: string;
  readonly preferApi?: boolean;
}) {
  const { t } = useOwpTranslation();
  const headingId = useId();
  const single = variants.length === 1 ? variants[0] : undefined;
  const preferred = preferApi
    ? variants.findIndex((variant) =>
        variant.props.some((member) => member.name === 'api' && member.requirement === 'required'),
      )
    : -1;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t('Props')}</h2>
      {variants.length === 0 && <p>{t('이 선언에는 Props가 없습니다.')}</p>}
      {single ? (
        <PropsBranch variant={single} packageName={packageName} />
      ) : (
        variants.map((variant, index) => (
          <details
            className="components-api-variant"
            key={`${index}-${variant.label}`}
            open={index === (preferred < 0 ? 0 : preferred)}
          >
            <summary>
              {variant.label ? t(variant.label) : t('Props 분기 {{number}}', { number: index + 1 })}
            </summary>
            <PropsBranch variant={variant} packageName={packageName} />
          </details>
        ))
      )}
    </section>
  );
}
