import type { ReactNode } from 'react';
import { useOwpTranslation } from '@owp/components/hooks';
import { PreviewActions } from '../../../shared/ui/PreviewActions';

export function CoreDemo({
  controls,
  children,
}: {
  readonly controls?: ReactNode;
  readonly children: ReactNode;
}) {
  const { t } = useOwpTranslation();
  return (
    <div className="core-demo">
      {controls && (
        <PreviewActions>
          <div className="core-controls" role="group" aria-label={t('예제 설정')}>
            {controls}
          </div>
        </PreviewActions>
      )}
      <div className="core-specimens">{children}</div>
    </div>
  );
}

export function DemoSection({
  title,
  description,
  children,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  const { t } = useOwpTranslation();
  return (
    <section className="core-section">
      {(title || description) && (
        <div className="core-section-heading">
          {title && <h2>{t(title)}</h2>}
          {description && <p>{t(description)}</p>}
        </div>
      )}
      <div className="core-section-content">{children}</div>
    </section>
  );
}
