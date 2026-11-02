import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../code/CodeSnippet';
import { CodeViewer } from '../code/CodeViewer';
import type { PublicApiEntry, PublicApiExample } from './types';

export function PublicApiCode({
  entry,
  example,
}: {
  readonly entry: PublicApiEntry;
  readonly example?: PublicApiExample;
}) {
  const { t } = useOwpTranslation();
  return example ? (
    <CodeViewer
      key={`${example.packageId}/${example.id}`}
      example={{
        ...example,
        package: `@owp/${example.packageId}`,
        category: 'reference',
        description: '',
        api: [entry.name],
      }}
    />
  ) : (
    <CodeSnippet label={t('사용 예제')} code={entry.usage} language="typescript" />
  );
}
