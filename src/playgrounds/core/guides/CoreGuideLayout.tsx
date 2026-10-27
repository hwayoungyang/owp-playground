import type { ReactNode } from 'react';
import { useOwpTranslation } from '@owp/components/hooks';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import type { CoreCatalogEntry } from '../catalog';
import './guide.css';

interface CoreGuideSection {
  readonly id: string;
  readonly title: string;
}

interface CoreGuideLayoutProps {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
  readonly introduction: string;
  readonly sections: readonly CoreGuideSection[];
  readonly children: ReactNode;
  readonly related?: ReactNode;
}

function CoreGuideLinks({ sections }: { readonly sections: readonly CoreGuideSection[] }) {
  const { t } = useOwpTranslation();
  return (
    <ol>
      {sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>{t(section.title)}</a>
        </li>
      ))}
    </ol>
  );
}

export function CoreGuideLayout({
  example,
  introduction,
  sections,
  children,
  related,
}: CoreGuideLayoutProps) {
  const { t } = useOwpTranslation();
  return (
    <section className="workspace getting-started core-guide" aria-label={t(example.title)}>
      <WorkspaceHeading example={example} packageTitle="owp/core" categoryLabel="문서" />
      <div className="core-guide-layout">
        <details className="core-guide-outline-mobile">
          <summary>{t('목차')}</summary>
          <nav aria-label={t('목차')}>
            <CoreGuideLinks sections={sections} />
          </nav>
        </details>
        <article className="core-guide-body">
          <div className="guide-sections">
            <p className="guide-introduction">{t(introduction)}</p>
            {children}
          </div>
          {related}
        </article>
        <aside className="core-guide-outline">
          <nav aria-label={t('목차')}>
            <p>{t('목차')}</p>
            <CoreGuideLinks sections={sections} />
          </nav>
        </aside>
      </div>
    </section>
  );
}
