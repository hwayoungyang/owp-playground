import type { ReactNode } from 'react';
import { useOwpTranslation } from '@owp/components/hooks';
import { Trans } from '@owp/core/i18n';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { GettingStartedHeader } from '../../../shared/ui/GettingStartedHeader';
import type { CoreCatalogEntry } from '../catalog';
import './guide.css';

interface CoreGuideSection {
  readonly id: string;
  readonly title: string;
  readonly level?: 2 | 3;
}

interface CoreGuideLayoutProps {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
  readonly introduction?: string;
  readonly sections: readonly CoreGuideSection[];
  readonly children: ReactNode;
  readonly related?: ReactNode;
}

function CoreGuideLinks({ sections }: { readonly sections: readonly CoreGuideSection[] }) {
  const { t } = useOwpTranslation();
  const groups: { readonly section: CoreGuideSection; readonly children: CoreGuideSection[] }[] =
    [];
  for (const section of sections) {
    const parent = groups.at(-1);
    if (section.level === 3 && parent) parent.children.push(section);
    else groups.push({ section, children: [] });
  }
  return (
    <ol>
      {groups.map(({ section, children }) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>{t(section.title)}</a>
          {children.length > 0 && (
            <ol>
              {children.map((child) => (
                <li key={child.id}>
                  <a href={`#${child.id}`}>{t(child.title)}</a>
                </li>
              ))}
            </ol>
          )}
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
    <section
      className="workspace getting-started core-guide"
      data-guide={example.id}
      aria-label={t(example.title)}
    >
      {example.id === 'getting-started' ? (
        <GettingStartedHeader example={example} packageId="core" />
      ) : (
        <WorkspaceHeading example={example} packageTitle="owp/core" categoryLabel="문서" />
      )}
      <div className="core-guide-layout">
        <details className="core-guide-outline-mobile">
          <summary>{t('목차')}</summary>
          <nav aria-label={t('목차')}>
            <CoreGuideLinks sections={sections} />
          </nav>
        </details>
        <article className="core-guide-body">
          <div className="guide-sections">
            {introduction && example.id !== 'getting-started' && (
              <p className="guide-introduction">
                <Trans t={t} i18nKey={introduction} components={{ strong: <strong /> }} />
              </p>
            )}
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
