import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ExampleMetadata } from '../../shared/types/playground';
import { apiHref, exampleApiLinks } from './model/links';

export function ApiLinks({ example }: { readonly example: ExampleMetadata }) {
  const { t } = useOwpTranslation();
  const packageId = example.package === '@owp/datagrid' ? 'datagrid' : 'charts';
  const references = exampleApiLinks(packageId, example.id);
  if (references.length === 0) return null;
  return (
    <nav className="workspace-api-reference" aria-label={t('관련 API')}>
      <span>{t('관련 API')}</span>
      <div>
        {references.map((reference) => (
          <PlaygroundLink
            key={`${reference.id}/${reference.label}`}
            href={apiHref(reference.packageId, reference.id)}

            title={reference.id}
          >
            <code>{reference.label}</code>
          </PlaygroundLink>
        ))}
      </div>
    </nav>
  );
}
