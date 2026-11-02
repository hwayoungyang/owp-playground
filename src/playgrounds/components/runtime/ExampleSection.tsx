import type { ReactNode } from 'react';
import { useId } from 'react';
import { useOwpTranslation } from '@owp/components/hooks';

export function ExampleSection({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  const { t } = useOwpTranslation();
  const headingId = useId();
  return (
    <section className="components-example-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{t(title)}</h2>
      {description && <p>{t(description)}</p>}
      <div className="components-example-content">{children}</div>
    </section>
  );
}
