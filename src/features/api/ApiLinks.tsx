import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ExampleMetadata } from '../../shared/types/playground';
import { apiHref, exampleApiLinks } from './model/links';
import { apiPackageIdFor } from '../../playgrounds/packages';

export function ApiLinks({ example }: { readonly example: ExampleMetadata }) {
  const { t, i18n } = useOwpTranslation();
  const packageId = apiPackageIdFor(example.package);
  const references =
    packageId === 'components'
      ? example.api.map((name) => ({
          id: `${example.package}:${name}`,
          label: name,
          packageId,
        }))
      : exampleApiLinks(packageId, example.id);
  if (references.length === 0) return null;
  return (
    <nav className="workspace-api-reference" aria-label={t('관련 API')}>
      <span>{t('관련 API')}</span>
      <div>
        {references.map((reference) => (
          <PlaygroundLink
            key={`${reference.id}/${reference.label}`}
            href={`${apiHref(reference.packageId, reference.id)}&lang=${encodeURIComponent(i18n.language)}`}
            title={reference.id}
          >
            <code>{reference.label}</code>
          </PlaygroundLink>
        ))}
      </div>
    </nav>
  );
}
