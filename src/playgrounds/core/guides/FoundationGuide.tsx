import { useOwpTranslation } from '@owp/components/hooks';
import { ApiLinks } from '../../../features/api/ApiLinks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import type { CoreCatalogEntry } from '../catalog';
import { CoreGuideLayout } from './CoreGuideLayout';
import { coreFoundations } from './foundation-content';
import providers from './providers.tsx?raw';
import stateManagement from './state-management.tsx?raw';
import apiSetup from './api-setup.tsx?raw';
import themeSettings from './theme-settings.tsx?raw';

const sources = {
  providers,
  'state-management': stateManagement,
  'api-setup': apiSetup,
  'theme-settings': themeSettings,
} as const;

export function CoreFoundationGuide({
  example,
}: {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useOwpTranslation();
  const guide = coreFoundations.find((entry) => entry.id === example.id);
  if (!guide) throw new RangeError(`Unknown Core guide: ${example.id}`);
  return (
    <CoreGuideLayout
      example={example}
      introduction={guide.introduction}
      sections={guide.sections.map((section, index) => ({
        id: `${guide.id}-section-${index}`,
        title: section.title,
      }))}
      related={<ApiLinks example={example} />}
    >
      {guide.sections.map((section, index) => {
        const headingId = `${guide.id}-section-${index}`;
        return (
          <section
            key={section.title}
            aria-labelledby={headingId}
            className={section.title === '설정 후 기대효과' ? 'core-guide-outcome' : undefined}
          >
            <h2 id={headingId}>{t(section.title)}</h2>
            <p>{t(section.body)}</p>
            {'code' in section && (
              <CodeSnippet label={example.source} code={sources[guide.id]} language="typescript" />
            )}
          </section>
        );
      })}
    </CoreGuideLayout>
  );
}
