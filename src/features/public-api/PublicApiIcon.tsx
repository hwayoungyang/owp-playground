import * as icons from '@owp/components/icons';
import { OwpSvgIcon } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { createElement } from 'react';
import './icon-preview.css';

const iconComponents = new Map(Object.entries(icons));

export function PublicApiIcon({
  name,
  size = 24,
}: {
  readonly name: string;
  readonly size?: number;
}) {
  if (name === 'OwpSvgIcon')
    return (
      <OwpSvgIcon size={size} aria-hidden="true">
        heroicons-outline:arrow-down-tray
      </OwpSvgIcon>
    );
  const Icon = iconComponents.get(name);
  return Icon ? createElement(Icon, { size, 'aria-hidden': true }) : null;
}

export function PublicApiIconPreview({ name }: { readonly name: string }) {
  const { t } = useOwpTranslation();
  return (
    <section className="public-api-icon-preview" aria-label={t('아이콘 미리보기')}>
      <div className="public-api-icon-specimen">
        <PublicApiIcon name={name} size={48} />
      </div>
      <div className="public-api-icon-sizes">
        {[16, 24, 32].map((size) => (
          <figure key={size}>
            <PublicApiIcon name={name} size={size} />
            <figcaption>{size}px</figcaption>
          </figure>
        ))}
      </div>
      {name === 'OwpSvgIcon' && <p>{t('SVG sprite 예시: 다운로드 아이콘')}</p>}
    </section>
  );
}
